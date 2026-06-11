import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import type { BenchApp, LibId } from './apps.ts'
import { buildApp } from './server.ts'

const kb = (bytes: number) => Math.round((bytes / 1024) * 100) / 100
const gz = (file: string) => gzipSync(readFileSync(file), { level: 6 }).length

export type DistMeasure = {
  jsGzKb: number
  cssGzKb: number
  totalGzKb: number
  jsRawKb: number
  cssRawKb: number
}

export function measureDist(dir: string): DistMeasure {
  let jsGz = 0
  let cssGz = 0
  let jsRaw = 0
  let cssRaw = 0
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.js')) {
        jsGz += gz(full)
        jsRaw += readFileSync(full).length
      } else if (entry.name.endsWith('.css')) {
        cssGz += gz(full)
        cssRaw += readFileSync(full).length
      }
    }
  }
  walk(dir)
  return {
    jsGzKb: kb(jsGz),
    cssGzKb: kb(cssGz),
    totalGzKb: kb(jsGz + cssGz),
    jsRawKb: kb(jsRaw),
    cssRawKb: kb(cssRaw),
  }
}

export const MATRIX_COMPONENTS = [
  'button',
  'input',
  'checkbox',
  'select',
  'dialog',
  'table',
  'badge',
  'tabs',
] as const

export function measureApps(repoRoot: string, apps: BenchApp[]) {
  const result = {
    apps: {} as Record<LibId, DistMeasure>,
    matrix: {} as Record<LibId, Record<string, { totalGzKb: number; incrementalGzKb: number }>>,
  }
  for (const app of apps) {
    buildApp(app)
    result.apps[app.id] = measureDist(join(repoRoot, app.dir, 'dist'))

    const buildMatrix = (entry: string) => {
      rmSync(join(repoRoot, app.dir, 'dist-matrix', entry), { recursive: true, force: true })
      const r = spawnSync('pnpm', ['--filter', app.pkg, 'build:matrix'], {
        stdio: 'inherit',
        env: { ...process.env, MATRIX_ENTRY: entry, NODE_ENV: 'production' },
      })
      if (r.status !== 0) throw new Error(`matrix build failed: ${app.pkg}/${entry}`)
      return measureDist(join(repoRoot, app.dir, 'dist-matrix', entry)).totalGzKb
    }

    const baseline = buildMatrix('baseline')
    result.matrix[app.id] = {}
    for (const comp of MATRIX_COMPONENTS) {
      const total = buildMatrix(comp)
      result.matrix[app.id][comp] = {
        totalGzKb: total,
        incrementalGzKb: Math.round((total - baseline) * 100) / 100,
      }
    }
  }
  return result
}
