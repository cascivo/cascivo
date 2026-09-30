import type { StoredFile, UploadPolicy } from './uploads'

/**
 * `@cascivo/app/uploads-server` — the Worker side of `@cascivo/app/uploads`.
 *
 * `handleUploads(policy, env.FILES)` answers every request under `policy.path`: it stores
 * uploads in R2 (in parts, for big files), enforces the policy, and serves stored files back.
 * The bucket and the Images binding are typed by shape, so R2's and Images' own bindings fit
 * without this package depending on Cloudflare's types.
 */

interface StoredObject {
  readonly key: string
  readonly size: number
  readonly httpMetadata?: { contentType?: string | undefined } | undefined
  readonly customMetadata?: Record<string, string> | undefined
}

interface UploadedPart {
  partNumber: number
  etag: string
}

interface MultipartUpload {
  uploadPart(partNumber: number, value: ReadableStream): Promise<UploadedPart>
  complete(parts: UploadedPart[]): Promise<StoredObject>
  abort(): Promise<void>
}

/** What `handleUploads` needs of an R2 bucket binding. */
export interface UploadBucket {
  put(
    key: string,
    value: ReadableStream,
    options: {
      httpMetadata: { contentType: string }
      customMetadata: Record<string, string>
    },
  ): Promise<StoredObject | null>
  head(key: string): Promise<StoredObject | null>
  get(key: string): Promise<(StoredObject & { body: ReadableStream }) | null>
  delete(key: string): Promise<void>
  createMultipartUpload(
    key: string,
    options: {
      httpMetadata: { contentType: string }
      customMetadata: Record<string, string>
    },
  ): Promise<{ key: string; uploadId: string }>
  resumeMultipartUpload(key: string, uploadId: string): MultipartUpload
  list(options: {
    prefix: string
    limit: number
    include: ('httpMetadata' | 'customMetadata')[]
  }): Promise<{ objects: StoredObject[] }>
}

/** What resized previews need of an Images binding. */
export interface ImageResizer {
  input(stream: ReadableStream<Uint8Array>): {
    transform(transform: { width: number; fit: 'scale-down' }): {
      output(options: { format: 'image/webp' }): Promise<{ response(): Response }>
    }
  }
}

export interface UploadHandlerOptions {
  /** Where objects go in the bucket. Default `uploads/`. */
  prefix?: string
  /**
   * Cloudflare Images, for resized previews: `GET <path>/<key>?w=320` returns a WebP at most
   * 320px wide. Without it, `?w=` is ignored and the original is served.
   */
  images?: ImageResizer
}

const json = (body: unknown, status = 200) => Response.json(body, { status })
const refuse = (error: string, status: number) => json({ error }, status)

/** A file name safe to keep in a key and a header: letters, digits, `.`, `_`, `-`. */
function safeName(raw: string | null): string {
  let name = ''
  try {
    name = decodeURIComponent(raw ?? '')
  } catch {
    name = ''
  }
  const cleaned = name
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(-100)
  return cleaned || 'file'
}

function describe(object: StoredObject, prefix: string): StoredFile {
  return {
    key: object.key.slice(prefix.length),
    name: object.customMetadata?.['name'] ?? object.key.split('/').pop() ?? 'file',
    size: object.size,
    type: object.httpMetadata?.contentType ?? 'application/octet-stream',
  }
}

/**
 * Handles uploads for `policy` against `bucket`. Returns `null` for a request outside
 * `policy.path`, so it chains with your other routes:
 *
 * ```ts
 * const uploads = handleUploads(policy, env.FILES, { images: env.IMAGES })
 * return (await uploads(request)) ?? handleApi(request, env)
 * ```
 *
 * It does not authenticate: check who is asking before you call it.
 */
export function handleUploads(
  policy: UploadPolicy,
  bucket: UploadBucket,
  options: UploadHandlerOptions = {},
): (request: Request) => Promise<Response | null> {
  const prefix = options.prefix ?? 'uploads/'
  // `<uuid>/<name>`: the Worker picks every key; a client can only name one it was given.
  const KEY = /^[0-9a-f-]{36}\/[\w.-]{1,100}$/
  const maxParts = Math.ceil(policy.maxBytes / policy.partBytes)

  function metadata(request: Request) {
    const type = request.headers.get('content-type') ?? ''
    const name = safeName(request.headers.get('x-file-name'))
    return {
      type,
      name,
      key: `${prefix}${crypto.randomUUID()}/${name}`,
      options: { httpMetadata: { contentType: type }, customMetadata: { name } },
    }
  }

  async function serve(request: Request, key: string): Promise<Response> {
    if (!KEY.test(key)) return refuse('Not found', 404)
    const object = await bucket.get(prefix + key)
    if (!object) return refuse('Not found', 404)
    const stored = describe(object, prefix)
    // Only a type the policy accepts is served as itself; anything else is a download.
    const type = policy.types.includes(stored.type) ? stored.type : 'application/octet-stream'
    const headers = new Headers({
      'content-type': type,
      'x-content-type-options': 'nosniff',
      // An uploaded file never runs script from this origin, whatever it claims to be.
      'content-security-policy': "default-src 'none'; sandbox",
      'content-disposition': `inline; filename="${stored.name}"`,
      // Keys are unique per upload, so a stored file never changes.
      'cache-control': 'private, max-age=31536000, immutable',
    })
    const width = Number(new URL(request.url).searchParams.get('w'))
    if (options.images && type.startsWith('image/') && Number.isInteger(width) && width > 0) {
      const resized = await options.images
        .input(object.body)
        .transform({ width: Math.min(width, 2048), fit: 'scale-down' })
        .output({ format: 'image/webp' })
      const response = resized.response()
      const out = new Response(response.body, response)
      for (const name of ['x-content-type-options', 'content-security-policy', 'cache-control']) {
        out.headers.set(name, headers.get(name)!)
      }
      return out
    }
    return new Response(object.body, { headers })
  }

  return async (request) => {
    const url = new URL(request.url)
    if (url.pathname.startsWith(`${policy.path}/`) && request.method === 'GET') {
      return serve(request, decodeURIComponent(url.pathname.slice(policy.path.length + 1)))
    }
    if (url.pathname !== policy.path) return null

    const step = url.searchParams.get('multipart')
    if (request.method === 'PUT' && step === null) {
      const { type, key, options: meta } = metadata(request)
      if (!policy.types.includes(type)) return refuse(`${type || 'This type'} is not accepted`, 415)
      const length = Number(request.headers.get('content-length'))
      if (!(length > 0)) return refuse('Send the file with a Content-Length', 411)
      if (length > policy.maxBytes) return refuse('The file is too large', 413)
      if (!request.body) return refuse('No file', 400)
      const object = await bucket.put(key, request.body, meta)
      if (!object) return refuse('The file was not stored', 500)
      return json(describe(object, prefix), 201)
    }

    if (request.method === 'POST' && step === 'start') {
      const { type, key, options: meta } = metadata(request)
      if (!policy.types.includes(type)) return refuse(`${type || 'This type'} is not accepted`, 415)
      const size = Number(request.headers.get('x-file-size'))
      if (!(size > 0)) return refuse('Send x-file-size', 400)
      if (size > policy.maxBytes) return refuse('The file is too large', 413)
      const upload = await bucket.createMultipartUpload(key, meta)
      return json({ key: upload.key.slice(prefix.length), uploadId: upload.uploadId })
    }

    const key = url.searchParams.get('key') ?? ''
    const uploadId = url.searchParams.get('uploadId') ?? ''
    if ((step === 'part' || step === 'complete') && (!KEY.test(key) || uploadId === '')) {
      return refuse('Unknown upload', 400)
    }

    if (request.method === 'PUT' && step === 'part') {
      const part = Number(url.searchParams.get('part'))
      if (!Number.isInteger(part) || part < 1 || part > maxParts) {
        return refuse(`Parts are numbered 1 to ${maxParts}`, 400)
      }
      const length = Number(request.headers.get('content-length'))
      if (!(length > 0) || length > policy.partBytes) {
        return refuse(`A part is at most ${policy.partBytes} bytes`, 413)
      }
      if (!request.body) return refuse('No part', 400)
      const uploaded = await bucket
        .resumeMultipartUpload(prefix + key, uploadId)
        .uploadPart(part, request.body)
      return json({ partNumber: uploaded.partNumber, etag: uploaded.etag })
    }

    if (request.method === 'POST' && step === 'complete') {
      let parts: UploadedPart[]
      try {
        parts = parseParts(await request.json())
      } catch (error) {
        return refuse(error instanceof Error ? error.message : 'Malformed parts', 400)
      }
      const upload = bucket.resumeMultipartUpload(prefix + key, uploadId)
      const object = await upload.complete(parts)
      // Each part was size-checked; the whole is checked too, and removed if it is over.
      if (object.size > policy.maxBytes) {
        await bucket.delete(object.key)
        return refuse('The file is too large', 413)
      }
      return json(describe(object, prefix), 201)
    }

    return refuse('Unsupported upload request', 405)
  }
}

function parseParts(raw: unknown): UploadedPart[] {
  if (typeof raw === 'object' && raw !== null) {
    const { parts } = raw as Record<string, unknown>
    if (Array.isArray(parts) && parts.length > 0 && parts.length <= 10_000) {
      return parts.map((part: unknown) => {
        if (typeof part === 'object' && part !== null) {
          const { partNumber, etag } = part as Record<string, unknown>
          if (typeof partNumber === 'number' && typeof etag === 'string')
            return { partNumber, etag }
        }
        throw new Error('Each part is { partNumber, etag }')
      })
    }
  }
  throw new Error('Send { parts: [{ partNumber, etag }] }')
}

/**
 * Up to `limit` stored uploads (default 100), in R2's key order — which, with random keys, is
 * no particular order. For newest-first across many files, keep an index (D1) as you upload.
 */
export async function listUploads(
  bucket: UploadBucket,
  options: { prefix?: string; limit?: number } = {},
): Promise<StoredFile[]> {
  const prefix = options.prefix ?? 'uploads/'
  const listed = await bucket.list({
    prefix,
    limit: Math.min(options.limit ?? 100, 1000),
    include: ['httpMetadata', 'customMetadata'],
  })
  return listed.objects.map((object) => describe(object, prefix))
}
