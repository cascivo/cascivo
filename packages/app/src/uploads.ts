import { signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'

/**
 * `@cascivo/app/uploads` — files from the browser into R2, through your Worker, with progress.
 *
 * One policy is shared by both sides, like `defineApi`: the page checks a file against it
 * before sending (so the user hears "too large" at once), and the Worker enforces it (so a
 * page that skipped the check still cannot store what the policy forbids). The Worker
 * chooses every object key; the browser never names where a file lands.
 *
 * ```ts
 * // shared
 * export const uploads = defineUploads({ path: '/api/uploads', maxBytes: 20e6, types: ['image/png', 'image/jpeg'] })
 * // browser
 * const upload = startUpload(uploads, file)
 * upload.progress.value // 0–1
 * upload.status.value   // 'uploading' | 'done' | 'error'
 * upload.result.value   // { key, name, size, type } once done
 * ```
 */

export interface UploadPolicy {
  /** Where the Worker handles uploads (`handleUploads`) — also where files are served. */
  readonly path: string
  /** Largest file accepted, in bytes. */
  readonly maxBytes: number
  /** Accepted MIME types, exactly. */
  readonly types: readonly string[]
  /** Files above this size go up in parts (R2 multipart). Default 16 MiB; minimum 5 MiB. */
  readonly partBytes: number
}

/**
 * Types that run script when a browser opens them from your origin. A policy may not accept
 * them: served back from the same origin, an uploaded SVG or HTML file is stored XSS.
 */
const ACTIVE_TYPES = [
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'text/xml',
  'application/xml',
]

const MIN_PART = 5 * 1024 * 1024

export function defineUploads(policy: {
  path: string
  maxBytes: number
  types: readonly string[]
  partBytes?: number
}): UploadPolicy {
  if (!/^\/[\w/-]*[\w-]$/.test(policy.path)) throw new Error(`Invalid upload path "${policy.path}"`)
  if (!(policy.maxBytes > 0)) throw new Error('maxBytes must be positive')
  if (policy.types.length === 0) throw new Error('List the MIME types to accept')
  const active = policy.types.filter((t) => ACTIVE_TYPES.includes(t.toLowerCase()))
  if (active.length > 0) {
    throw new Error(`${active.join(', ')} can run script from your origin; do not accept them`)
  }
  const partBytes = policy.partBytes ?? 16 * 1024 * 1024
  if (partBytes < MIN_PART) throw new Error('partBytes is at least 5 MiB (the R2 minimum)')
  return { path: policy.path, maxBytes: policy.maxBytes, types: [...policy.types], partBytes }
}

/** Why a file is refused before it is sent, or `null` when the policy accepts it. */
export function checkFile(
  policy: UploadPolicy,
  file: { size: number; type: string },
): string | null {
  if (!policy.types.includes(file.type)) return `${file.type || 'This type'} is not accepted`
  if (file.size > policy.maxBytes) return `Larger than ${formatBytes(policy.maxBytes)}`
  if (file.size === 0) return 'The file is empty'
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

/** A stored file, as the Worker describes it. */
export interface StoredFile {
  key: string
  name: string
  size: number
  type: string
}

/** Checks a stored-file description that crossed the network. */
export function parseStoredFile(raw: unknown): StoredFile {
  if (typeof raw === 'object' && raw !== null) {
    const { key, name, size, type } = raw as Record<string, unknown>
    if (
      typeof key === 'string' &&
      typeof name === 'string' &&
      typeof size === 'number' &&
      typeof type === 'string'
    ) {
      return { key, name, size, type }
    }
  }
  throw new Error('Malformed stored file')
}

export type UploadStatus = 'uploading' | 'done' | 'error'

export interface Upload {
  /** Stable id for lists, e.g. `FileUploader`'s `files[].id`. */
  readonly id: string
  readonly name: string
  readonly size: number
  /** 0–1. */
  readonly progress: ReadonlySignal<number>
  readonly status: ReadonlySignal<UploadStatus>
  readonly error: ReadonlySignal<string | null>
  /** The stored file, once `status` is `done`. */
  readonly result: ReadonlySignal<StoredFile | null>
  abort(): void
}

/** One HTTP request with upload progress. The default uses XMLHttpRequest; tests swap it. */
export type UploadTransport = (request: {
  method: 'PUT' | 'POST'
  url: string
  body: Blob | string | null
  headers: Record<string, string>
  onProgress: (sentBytes: number) => void
  signal: AbortSignal
}) => Promise<{ status: number; body: string }>

/** `fetch` cannot report upload progress; XMLHttpRequest can. */
export const xhrTransport: UploadTransport = ({ method, url, body, headers, onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (event) => onProgress(event.loaded)
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText })
    xhr.onerror = () => reject(new Error('The upload failed: network error'))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    signal.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(body)
  })

function errorOf(response: { status: number; body: string }): string {
  try {
    const parsed: unknown = JSON.parse(response.body)
    if (typeof parsed === 'object' && parsed !== null) {
      const { error } = parsed as Record<string, unknown>
      if (typeof error === 'string') return error
    }
  } catch {
    // not JSON: fall through
  }
  return `The upload failed (${response.status})`
}

function parseJson<T>(response: { status: number; body: string }, parse: (raw: unknown) => T): T {
  if (response.status < 200 || response.status >= 300) throw new Error(errorOf(response))
  return parse(JSON.parse(response.body))
}

function parseStarted(raw: unknown): { key: string; uploadId: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { key, uploadId } = raw as Record<string, unknown>
    if (typeof key === 'string' && typeof uploadId === 'string') return { key, uploadId }
  }
  throw new Error('Malformed multipart start')
}

function parsePart(raw: unknown): { partNumber: number; etag: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { partNumber, etag } = raw as Record<string, unknown>
    if (typeof partNumber === 'number' && typeof etag === 'string') return { partNumber, etag }
  }
  throw new Error('Malformed part')
}

let uploadCounter = 0

/**
 * Starts uploading one file. It is checked against the policy first; a refused file becomes an
 * upload in `error` at once, so a list can show it with its reason.
 */
export function startUpload(
  policy: UploadPolicy,
  file: File,
  options: { transport?: UploadTransport } = {},
): Upload {
  const transport = options.transport ?? xhrTransport
  const progress = signal(0)
  const status = signal<UploadStatus>('uploading')
  const error = signal<string | null>(null)
  const result = signal<StoredFile | null>(null)
  const controller = new AbortController()
  const base = policy.path
  const headers = {
    'content-type': file.type,
    'x-file-name': encodeURIComponent(file.name),
  }

  async function run(): Promise<StoredFile> {
    if (file.size <= policy.partBytes) {
      const response = await transport({
        method: 'PUT',
        url: base,
        body: file,
        headers,
        signal: controller.signal,
        onProgress: (sent) => (progress.value = Math.min(1, sent / file.size)),
      })
      return parseJson(response, parseStoredFile)
    }
    // Multipart: start, send each part (progress sums across them), complete.
    const started = parseJson(
      await transport({
        method: 'POST',
        url: `${base}?multipart=start`,
        body: null,
        headers: { ...headers, 'x-file-size': String(file.size) },
        signal: controller.signal,
        onProgress: () => {},
      }),
      parseStarted,
    )
    const query = `key=${encodeURIComponent(started.key)}&uploadId=${encodeURIComponent(started.uploadId)}`
    const parts: { partNumber: number; etag: string }[] = []
    for (let offset = 0, n = 1; offset < file.size; offset += policy.partBytes, n++) {
      const chunk = file.slice(offset, offset + policy.partBytes)
      const done = offset
      parts.push(
        parseJson(
          await transport({
            method: 'PUT',
            url: `${base}?multipart=part&part=${n}&${query}`,
            body: chunk,
            headers: {},
            signal: controller.signal,
            onProgress: (sent) => (progress.value = Math.min(1, (done + sent) / file.size)),
          }),
          parsePart,
        ),
      )
    }
    return parseJson(
      await transport({
        method: 'POST',
        url: `${base}?multipart=complete&${query}`,
        body: JSON.stringify({ parts }),
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        onProgress: () => {},
      }),
      parseStoredFile,
    )
  }

  const refusal = checkFile(policy, file)
  if (refusal) {
    status.value = 'error'
    error.value = refusal
  } else {
    run().then(
      (stored) => {
        result.value = stored
        progress.value = 1
        status.value = 'done'
      },
      (reason: unknown) => {
        status.value = 'error'
        // By name, not `instanceof DOMException`: the abort error's class depends on the realm.
        const aborted =
          typeof reason === 'object' &&
          reason !== null &&
          'name' in reason &&
          reason.name === 'AbortError'
        error.value = aborted
          ? 'Cancelled'
          : reason instanceof Error
            ? reason.message
            : 'The upload failed'
      },
    )
  }

  return {
    id: `upload-${++uploadCounter}`,
    name: file.name,
    size: file.size,
    progress,
    status,
    error,
    result,
    abort: () => controller.abort(),
  }
}
