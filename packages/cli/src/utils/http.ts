import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CACHE_DIR = join(homedir(), '.cascivo', 'cache')
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const TIMEOUT_MS = 15_000
const MAX_RETRIES = 4

export type FetchFn = (url: string, opts?: RequestInit) => Promise<Response>

let _fetchFn: FetchFn | null = null

export function setFetch(fn: FetchFn): void {
  _fetchFn = fn
}

export function resetFetch(): void {
  _fetchFn = null
}

// Resolved lazily so test stubs of globalThis.fetch (vi.stubGlobal) are seen
// even when they are installed after this module loads.
function currentFetch(): FetchFn {
  return _fetchFn ?? (globalThis.fetch as FetchFn)
}

function cacheKey(url: string): string {
  return createHash('sha256').update(url).digest('hex')
}

async function getCached(url: string): Promise<unknown | null> {
  try {
    const file = join(CACHE_DIR, cacheKey(url))
    const data = await readFile(file, 'utf8')
    return JSON.parse(data) as unknown
  } catch {
    return null
  }
}

async function setCached(url: string, data: unknown): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(join(CACHE_DIR, cacheKey(url)), JSON.stringify(data))
  } catch {
    // cache write failure is non-fatal
  }
}

export async function fetchJson(
  url: string,
  opts: { headers?: Record<string, string>; params?: Record<string, string>; cache?: boolean } = {},
): Promise<unknown> {
  const fullUrl = opts.params ? `${url}?${new URLSearchParams(opts.params).toString()}` : url

  if (opts.cache !== false) {
    const cached = await getCached(fullUrl)
    if (cached !== null) return cached
  }

  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
    }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      let res: Response
      try {
        res = await currentFetch()(fullUrl, {
          headers: { Accept: 'application/json', ...opts.headers },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      if (res.status === 401 || res.status === 403 || res.status === 429) {
        let msg = `HTTP ${res.status}`
        try {
          const body = (await res.json()) as Record<string, unknown>
          if (typeof body['message'] === 'string') msg += `: ${body['message']}`
        } catch {
          // ignore parse failure
        }
        throw new Error(msg)
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${fullUrl}`)

      const len = Number(res.headers.get('content-length') ?? 0)
      if (len > MAX_SIZE) throw new Error(`Response too large (${len} bytes) from ${fullUrl}`)

      const text = await res.text()
      if (text.length > MAX_SIZE) throw new Error(`Response too large from ${fullUrl}`)

      const json = JSON.parse(text) as unknown

      if (opts.cache !== false) await setCached(fullUrl, json)
      return json
    } catch (e) {
      lastError = e
      // Don't retry auth/logic errors
      if (e instanceof Error && /HTTP 4\d\d/.test(e.message)) break
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(
    `Network error fetching ${fullUrl}: ${msg}\n(Check your internet connection or registry URL)`,
  )
}

/**
 * Fetch text with the same retry/backoff/timeout/size handling as fetchJson,
 * but no cache — used for component file payloads, which must be fresh and
 * whose failures must fail the install (never silently truncate).
 */
export async function fetchTextRetry(url: string): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
    }
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      let res: Response
      try {
        res = await currentFetch()(url, { signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
      const text = await res.text()
      if (text.length > MAX_SIZE) throw new Error(`Response too large from ${url}`)
      return text
    } catch (e) {
      lastError = e
      // Don't retry client errors
      if (e instanceof Error && /HTTP 4\d\d/.test(e.message)) break
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(
    `Network error fetching ${url}: ${msg}\n(Check your internet connection or registry URL)`,
  )
}

/**
 * Network-first JSON fetch with an offline fallback to the last cached copy.
 * Used for the registry index: a fresh copy when reachable, the cached one
 * (with a notice) when not.
 */
export async function fetchJsonFresh(url: string): Promise<unknown> {
  try {
    const json = JSON.parse(await fetchTextRetry(url)) as unknown
    await setCached(url, json)
    return json
  } catch (e) {
    const cached = await getCached(url)
    if (cached !== null) {
      console.warn(`Could not reach ${url} — using the last cached copy.`)
      return cached
    }
    throw e
  }
}

export { existsSync }
