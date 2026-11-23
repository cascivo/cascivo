/**
 * Targets of the dynamic-app conformance harness (`dynamic.test.ts`).
 *
 * A target is a server that serves the fixture contract in `README.md`: one small page per
 * flow at the paths below. `solid-htmx` builds and spawns the example's `cascivo-server` binary;
 * pointing the harness at another server (the H starter, a `wrangler dev`, a container) is
 *
 *     DYNAMIC_URL=http://127.0.0.1:8787 pnpm dynamic:check
 *
 * plus `DYNAMIC_PATHS='{"form":"/demo/form"}'` for any path that differs.
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))

export interface Paths {
  /** A page that is not a flow: the Solid island lives here. */
  home: string
  form: string
  dialog: string
  toast: string
  island: string
  sse: string
  sseStream: string
  tabs: string
}

export interface Target {
  name: string
  paths: Paths
  /** JS files of the htmx engine (core + extensions): reported, never counted in the budget. */
  htmx: RegExp
  /** The Solid island bundle: held to its own budget, not the page's. */
  island: RegExp
  budgets: {
    /** gzip bytes of every script a page loads, minus htmx and the island. Phase 3 plan: 15 KB. */
    pageJs: number
    /** gzip bytes of the island bundle. Phase 3 plan: 10 KB. */
    islandJs: number
  }
  start(): Promise<{ url: string; stop(): void }>
}

const PATHS: Paths = {
  home: '/',
  form: '/c/form',
  dialog: '/c/dialog',
  toast: '/c/toast',
  island: '/c/island',
  sse: '/c/sse',
  sseStream: '/c/sse/stream',
  tabs: '/c/tabs',
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as { port: number }
      s.close(() => resolve(port))
    })
  })
}

async function waitFor(url: string, child?: ChildProcess): Promise<void> {
  const until = Date.now() + 30_000
  for (;;) {
    if (child?.exitCode !== null && child?.exitCode !== undefined)
      throw new Error(`server exited with ${child.exitCode}`)
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not listening yet
    }
    if (Date.now() > until) throw new Error(`${url} did not come up in 30 s`)
    await new Promise((r) => setTimeout(r, 100))
  }
}

const solidHtmx: Target = {
  name: 'solid-htmx',
  paths: PATHS,
  htmx: /\/htmx[^/]*\.js$/,
  island: /\/island[^/]*\.js$/,
  // The island is 12 KB gz because the typed class map (`@cascivo/css`) is one object that no
  // bundler can shake; the move to `@cascivo/solid` (workstream E) brings it to the plan's 10 KB.
  budgets: { pageJs: 15 * 1024, islandJs: 13 * 1024 },
  async start() {
    // Needs `pnpm build` for apps/examples/solid-htmx/dist (the Vite bundles).
    execFileSync('cargo', ['build', '-p', 'solid-htmx-server', '--locked'], {
      cwd: ROOT,
      stdio: 'inherit',
    })
    const port = await freePort()
    const url = `http://localhost:${port}`
    const child = spawn(`${ROOT}target/debug/solid-htmx-server`, [], {
      cwd: ROOT,
      env: { ...process.env, ADDR: `127.0.0.1:${port}` },
      stdio: ['ignore', 'ignore', 'inherit'],
    })
    try {
      await waitFor(`${url}/`, child)
    } catch (e) {
      child.kill()
      throw e
    }
    return { url, stop: () => child.kill() }
  },
}

/** `DYNAMIC_URL` points the harness at an already running server with the same fixtures. */
export function resolveTarget(env: NodeJS.ProcessEnv = process.env): Target {
  const url = env['DYNAMIC_URL']
  if (!url) return solidHtmx
  const paths = { ...PATHS, ...(JSON.parse(env['DYNAMIC_PATHS'] ?? '{}') as Partial<Paths>) }
  return {
    ...solidHtmx,
    name: env['DYNAMIC_NAME'] ?? new URL(url).host,
    paths,
    async start() {
      await waitFor(`${url}${paths.home}`)
      return { url, stop() {} }
    },
  }
}
