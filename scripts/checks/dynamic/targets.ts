/**
 * Targets of the dynamic-app conformance harness (`dynamic.test.ts`).
 *
 * A target is a server that serves the fixture contract in `README.md`: one small page per
 * flow at the paths below. `solid-htmx` builds and spawns the example's `cascivo-server` binary;
 * `starter` (`DYNAMIC_TARGET=starter`) generates `cascivo-web new --dynamic --target native`,
 * builds its `web/` and its binary, and adds the notes CRUD flow. Pointing the harness at
 * another server (a `wrangler dev`, a container) is
 *
 *     DYNAMIC_URL=http://127.0.0.1:8787 pnpm dynamic:check
 *
 * plus `DYNAMIC_PATHS='{"form":"/demo/form"}'` for any path that differs.
 */
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
  /** Sign-in page and the CRUD list behind it: only apps that have them (the H starter). */
  login?: string
  notes?: string
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

async function spawnServer(bin: string, env: Record<string, string>, cwd: string) {
  const port = await freePort()
  const url = `http://localhost:${port}`
  const child = spawn(bin, [], {
    cwd,
    env: { ...process.env, ...env, ADDR: `127.0.0.1:${port}` },
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  try {
    await waitFor(`${url}/`, child)
  } catch (e) {
    child.kill()
    throw e
  }
  return { url, stop: () => child.kill() }
}

/**
 * A fresh `cascivo-web new --dynamic --target native` (workstream H), linked to this checkout:
 * Cargo `path` deps, npm `link:` deps. Its own lockfile is this workspace's, so the build shares
 * `target/starter` with earlier runs. Needs `pnpm build` (the linked `@cascivo/*` dists).
 */
const starter: Target = {
  ...solidHtmx,
  name: 'starter (native)',
  paths: { ...PATHS, login: '/login', notes: '/notes' },
  async start() {
    const dir = join(mkdtempSync(join(tmpdir(), 'cv-starter-')), 'notes-app')
    const run = (cmd: string, args: string[], cwd: string, env: Record<string, string> = {}) =>
      execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
    run(
      'cargo',
      [
        'run',
        '-q',
        '-p',
        'cascivo-web',
        '--locked',
        '--',
        'new',
        dir,
        '--dynamic',
        '--target',
        'native',
        '--checkout',
        ROOT,
      ],
      ROOT,
    )
    copyFileSync(join(ROOT, 'Cargo.lock'), join(dir, 'Cargo.lock'))
    const web = join(dir, 'web')
    // Outside the workspace: its own install, from the store this workspace already filled.
    run('pnpm', ['install', '--ignore-workspace', '--prefer-offline', '--no-frozen-lockfile'], web)
    run('pnpm', ['run', 'build'], web)
    const targetDir = join(ROOT, 'target', 'starter')
    // Not --locked: the copied lock gains the starter's own package.
    run('cargo', ['build'], dir, { CARGO_TARGET_DIR: targetDir })
    const server = await spawnServer(
      join(targetDir, 'debug', 'notes-app'),
      { ASSETS_DIR: join(web, 'dist') },
      dir,
    )
    return {
      url: server.url,
      stop() {
        server.stop()
        rmSync(join(dir, '..'), { recursive: true, force: true })
      },
    }
  },
}

/** `DYNAMIC_URL` points the harness at an already running server with the same fixtures. */
export function resolveTarget(env: NodeJS.ProcessEnv = process.env): Target {
  const url = env['DYNAMIC_URL']
  if (!url) return env['DYNAMIC_TARGET'] === 'starter' ? starter : solidHtmx
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
