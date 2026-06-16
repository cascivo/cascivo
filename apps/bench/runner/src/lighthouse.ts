import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import type { BenchApp, LibId } from './apps.ts'
import { buildApp, servePreview } from './server.ts'
import type { Results } from './types.ts'

const RUNS = Number(process.env['BENCH_LH_RUNS'] ?? 5)

type LhMetrics = { fcpMs: number; lcpMs: number; tbtMs: number; transferKb: number; runs: number }

function collectOne(app: BenchApp, workDir: string): LhMetrics {
  rmSync(workDir, { recursive: true, force: true })
  const result = spawnSync(
    'pnpm',
    [
      '--filter',
      'bench-runner',
      'exec',
      'lhci',
      'collect',
      `--url=http://localhost:${app.port}/table`,
      `--numberOfRuns=${RUNS}`,
      '--settings.preset=desktop',
      '--settings.disableStorageReset=true',
    ],
    {
      stdio: 'inherit',
      cwd: join(workDir, '..'),
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    },
  )
  if (result.status !== 0) throw new Error(`lhci collect failed for ${app.id}`)

  // lhci 0.15+ no longer writes manifest.json; read LHR files directly
  const lhrFiles = readdirSync(workDir)
    .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
    .map((f) => join(workDir, f))
  if (lhrFiles.length === 0) throw new Error(`No LHR files in ${workDir}`)

  type LhrReport = { audits: Record<string, { numericValue?: number }> }
  const reports = lhrFiles.map((p) => JSON.parse(readFileSync(p, 'utf8')) as LhrReport)
  // Pick the run with median LCP as the representative run
  reports.sort(
    (a, b) =>
      (a.audits['largest-contentful-paint']?.numericValue ?? 0) -
      (b.audits['largest-contentful-paint']?.numericValue ?? 0),
  )
  const rep = reports[Math.floor(reports.length / 2)]!
  const audit = (id: string) => rep.audits[id]?.numericValue ?? -1
  return {
    fcpMs: Math.round(audit('first-contentful-paint')),
    lcpMs: Math.round(audit('largest-contentful-paint')),
    tbtMs: Math.round(audit('total-blocking-time')),
    transferKb: Math.round(audit('total-byte-weight') / 1024),
    runs: RUNS,
  }
}

export async function runLighthouseSuite(
  repoRoot: string,
  apps: BenchApp[],
): Promise<Results['lighthouse']> {
  const out = {} as Record<LibId, LhMetrics>
  for (const app of apps) {
    buildApp(app)
    const stop = await servePreview(app)
    try {
      out[app.id] = collectOne(app, join(repoRoot, 'apps/bench/runner', '.lighthouseci'))
      console.log(`${app.id}: FCP ${out[app.id].fcpMs}ms TBT ${out[app.id].tbtMs}ms`)
    } finally {
      stop()
    }
  }
  return out
}
