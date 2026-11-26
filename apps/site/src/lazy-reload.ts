import { lazy } from 'react'

/** What the recovery needs from the browser; injectable so the test can drive it. */
export interface ReloadEnv {
  now(): number
  read(): string | null
  write(value: string): void
  reload(): void
}

const KEY = 'cascivo-chunk-reload'
// A second failure this soon after our own reload is a real outage, not a stale tab: surface it
// instead of reloading in a loop.
const LOOP_WINDOW_MS = 10_000

const browserEnv: ReloadEnv = {
  now: () => Date.now(),
  read() {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  write(value) {
    try {
      sessionStorage.setItem(KEY, value)
    } catch {
      // Without storage the loop guard is gone; reloading once is still better than a blank page.
    }
  },
  reload: () => location.reload(),
}

/**
 * Wrap a lazy chunk import so a failed load reloads the page once.
 *
 * Route chunks are content-hashed, so after a deploy an open tab's chunk URLs 404 (Pages answers
 * with the HTML shell) and a flaky network can drop one. `lazy` caches the rejection and the site
 * has no error boundary, so Preact unmounted the whole app: a blank page that clicking the link
 * again could not fix. A full load fetches the current HTML and its current chunk names.
 */
export function reloadOnChunkError<T>(
  load: () => Promise<T>,
  env: ReloadEnv = browserEnv,
): () => Promise<T> {
  return () =>
    load().catch((error: unknown) => {
      const last = Number(env.read())
      if (Number.isFinite(last) && env.now() - last < LOOP_WINDOW_MS) throw error
      env.write(String(env.now()))
      env.reload()
      // Keep the Suspense fallback up until the reload replaces the document.
      return new Promise<T>(() => {})
    })
}

/** `lazy` whose chunk failure reloads the page instead of unmounting the app. */
export const lazyReload: typeof lazy = (load) => lazy(reloadOnChunkError(load))
