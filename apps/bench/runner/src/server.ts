import { spawn, spawnSync } from 'node:child_process'
import type { BenchApp } from './apps.ts'

export function buildApp(app: BenchApp, mode: 'production' | 'development' = 'production') {
  const result = spawnSync('pnpm', ['--filter', app.pkg, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: mode },
  })
  if (result.status !== 0) throw new Error(`build failed for ${app.pkg}`)
}

export async function servePreview(app: BenchApp): Promise<() => void> {
  const child = spawn('pnpm', ['--filter', app.pkg, 'preview'], { stdio: 'pipe' })
  await waitForHttp(`http://localhost:${app.port}/table`, 30_000)
  return () => child.kill('SIGTERM')
}

export async function serveDev(app: BenchApp): Promise<() => void> {
  const child = spawn('pnpm', ['--filter', app.pkg, 'dev'], { stdio: 'pipe' })
  await waitForHttp(`http://localhost:${app.port}/table`, 60_000)
  return () => child.kill('SIGTERM')
}

async function waitForHttp(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
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
