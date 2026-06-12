import { spawnSync } from 'node:child_process'
import { availableApps } from './apps.ts'
import { buildApp, servePreview } from './server.ts'

const repoRoot = new URL('../../../..', import.meta.url).pathname
const command = process.argv[2] ?? 'all'

const apps = availableApps(repoRoot)

switch (command) {
  case 'doctor': {
    for (const app of apps) {
      buildApp(app)
      const stop = await servePreview(app)
      const res = await fetch(`http://localhost:${app.port}/table`)
      stop()
      if (!res.ok) throw new Error(`${app.id}: preview not serving`)
      console.log(`✓ ${app.id} builds and serves on :${app.port}`)
    }
    break
  }

  case 'conformance': {
    for (const app of apps) {
      buildApp(app)
      const stop = await servePreview(app)
      const result = spawnSync('pnpm', ['--filter', 'bench-runner', 'test:protocol'], {
        stdio: 'inherit',
        env: { ...process.env, BENCH_URL: `http://localhost:${app.port}` },
      })
      stop()
      if (result.status !== 0) throw new Error(`protocol conformance failed for ${app.id}`)
    }
    break
  }

  case 'treeshake': {
    const { measureTreeshake } = await import('./treeshake.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const result = await measureTreeshake(repoRoot)
    console.log('bareImportGzBytes:', result.bareImportGzBytes)
    console.log('buttonOnlyGzKb:', result.buttonOnlyGzKb.toFixed(2))
    console.log('fullGzKb:', result.fullGzKb.toFixed(2))
    if (result.bareImportGzBytes > 1024) {
      throw new Error(`bare import not treeshaken: ${result.bareImportGzBytes}B gz (limit 1KB)`)
    }
    const BUTTON_RATIO_LIMIT = 0.6
    const ratio = result.buttonOnlyGzKb / result.fullGzKb
    if (ratio > BUTTON_RATIO_LIMIT) {
      throw new Error(
        `Button-only import is ${(ratio * 100).toFixed(0)}% of full bundle (limit ${BUTTON_RATIO_LIMIT * 100}%)`,
      )
    }
    const results = loadResults(repoRoot)
    if (!results.bundle) {
      results.bundle = { apps: {} as never, matrix: {} as never }
    }
    results.bundle.treeshake = result
    saveResults(repoRoot, results)
    break
  }

  case 'bundle': {
    const { measureApps } = await import('./bundle.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const results = loadResults(repoRoot)
    const measured = measureApps(repoRoot, apps)
    results.bundle = {
      apps: measured.apps,
      matrix: measured.matrix,
      treeshake: results.bundle?.treeshake,
    }
    saveResults(repoRoot, results)
    console.table(results.bundle?.apps)
    break
  }

  case 'runtime': {
    const { runRuntimeSuite } = await import('./runtime.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const results = loadResults(repoRoot)
    const { runtime, chrome } = await runRuntimeSuite(apps)
    if (runtime) results.runtime = runtime
    results.meta.chrome = chrome
    saveResults(repoRoot, results)
    break
  }

  case 'renders': {
    const { runRenderSuite } = await import('./renders.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const results = loadResults(repoRoot)
    const renders = await runRenderSuite(apps)
    if (renders) results.renders = renders
    saveResults(repoRoot, results)
    break
  }

  case 'lighthouse': {
    const { runLighthouseSuite } = await import('./lighthouse.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const results = loadResults(repoRoot)
    const lighthouse = await runLighthouseSuite(repoRoot, apps)
    if (lighthouse) results.lighthouse = lighthouse
    saveResults(repoRoot, results)
    break
  }

  case 'a11y': {
    const { runA11ySuite } = await import('./a11y.ts')
    const { loadResults, saveResults } = await import('./results-io.ts')
    const results = loadResults(repoRoot)
    const a11y = await runA11ySuite(apps)
    if (a11y) results.a11y = a11y
    saveResults(repoRoot, results)
    if (process.argv.includes('--gate') && (results.a11y?.cascade?.violations ?? 1) > 0) {
      throw new Error(
        `a11y gate: cascade has ${results.a11y!.cascade!.violations} axe violations: ${results.a11y!.cascade!.rules.join(', ')}`,
      )
    }
    break
  }

  case 'report': {
    const { writeFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { renderReport } = await import('./report.ts')
    const { loadResults } = await import('./results-io.ts')
    writeFileSync(join(repoRoot, 'BENCHMARKS.md'), renderReport(loadResults(repoRoot)))
    console.log('✓ BENCHMARKS.md written')
    break
  }

  case 'all': {
    const steps = ['bundle', 'treeshake', 'runtime', 'renders', 'lighthouse', 'a11y', 'report']
    for (const step of steps) {
      const r = spawnSync('node', ['src/cli.ts', step], {
        stdio: 'inherit',
        cwd: new URL('..', import.meta.url).pathname,
      })
      if (r.status !== 0) throw new Error(`bench ${step} failed`)
    }
    break
  }

  default:
    throw new Error(`unknown command: ${command}`)
}
