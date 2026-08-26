import { spawn, spawnSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import type { BenchApp } from './apps.ts'

export function buildApp(app: BenchApp, mode: 'production' | 'development' = 'production') {
  const result = spawnSync('pnpm', ['--filter', app.pkg, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: mode },
  })
  if (result.status !== 0) throw new Error(`build failed for ${app.pkg}`)
}

export async function servePreview(app: BenchApp): Promise<() => void> {
  const child = spawnServer(app, 'preview')
  await waitForServer(child, app, 30_000)
  return () => stopTree(child)
}

export async function serveDev(app: BenchApp): Promise<() => void> {
  const child = spawnServer(app, 'dev')
  await waitForServer(child, app, 60_000)
  return () => stopTree(child)
}

/**
 * `pnpm … preview` is a wrapper: the vite server is its GRANDCHILD, and piped
 * stdio hands that grandchild the parent's pipe. SIGTERM to the pnpm pid alone
 * left the server running, holding both the port and a pipe handle that keeps
 * this process's event loop alive — so `bench runtime` printed its last median
 * and then sat idle until the 6-hour job limit killed it (2026-08-17 and
 * 2026-08-24, both bench runs in the window). `detached` gives the wrapper its
 * own process group so one signal takes the whole tree, and nothing here reads
 * the server's output anyway.
 */
function spawnServer(app: BenchApp, script: 'dev' | 'preview'): ChildProcess {
  return spawn('pnpm', ['--filter', app.pkg, script], { stdio: 'ignore', detached: true })
}

function stopTree(child: ChildProcess) {
  if (child.pid === undefined) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    /* the group is already gone */
  }
}

/**
 * The apps pin `strictPort`, so a server that finds its port taken exits instead
 * of moving. Polling the URL alone cannot tell that apart from success: whatever
 * already holds the port answers, and the suite measures a stranger — a leaked
 * preview answering `serveDev` is how the render counts read a flat 0 while
 * every app looked healthy. Watch the child too.
 */
async function waitForServer(child: ChildProcess, app: BenchApp, timeoutMs: number) {
  const url = `http://localhost:${app.port}/table`
  let exited = false
  child.once('exit', () => {
    exited = true
  })

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`${app.pkg} server exited before serving ${url} — is port ${app.port} taken?`)
    }
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`timed out waiting for ${url}`)
}
