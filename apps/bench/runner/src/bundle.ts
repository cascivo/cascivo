import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import type { BenchApp, LibId } from './apps.ts'
import type { MatrixCell } from './types.ts'
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
    matrix: {} as Record<LibId, Record<string, MatrixCell>>,
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

    // First pass: collect raw totals per component.
    const rawTotals: Record<string, number> = {}
    for (const comp of MATRIX_COMPONENTS) {
      rawTotals[comp] = buildMatrix(comp)
    }

    // Compute amortized cost: sum(all incrementals) / N.
    // Answers "if you use all N components, what is the average marginal cost each?"
    const incrementals = MATRIX_COMPONENTS.map(
      (comp) => Math.round((rawTotals[comp]! - baseline) * 100) / 100,
    )
    const sumIncremental = incrementals.reduce((acc, v) => acc + v, 0)
    const amortizedGzKb = Math.round((sumIncremental / MATRIX_COMPONENTS.length) * 100) / 100

    result.matrix[app.id] = {}
    for (let i = 0; i < MATRIX_COMPONENTS.length; i++) {
      const comp = MATRIX_COMPONENTS[i]!
      const total = rawTotals[comp]!
      const standaloneGzKb = total // standalone IS the isolated build total
      const incrementalGzKb = incrementals[i]!

      let note: string | undefined
      if (Math.abs(incrementalGzKb) < 0.05) {
        if (standaloneGzKb > 0) {
          note = `Standalone cost is ${standaloneGzKb} KB but marginal over runtime-preloaded baseline is ~0`
        } else {
          note = 'Shared runtime already in baseline; marginal cost is ~0'
        }
      }

      result.matrix[app.id][comp] = {
        totalGzKb: total,
        incrementalGzKb,
        standaloneGzKb,
        amortizedGzKb,
        ...(note !== undefined ? { note } : {}),
      }
    }
  }
  return result
}
