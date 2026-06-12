import { chromium, type Browser, type Page } from 'playwright'
import type { BenchApp, LibId } from './apps.ts'
import { SCENARIOS, type Scenario } from './scenarios.ts'
import { buildApp, servePreview } from './server.ts'
import { mannWhitneyU, summarize } from './stats.ts'
import { durationFromTrace } from './trace.ts'
import type { Results, ScenarioId, TimingStats } from './types.ts'

const SAMPLES = Number(process.env['BENCH_SAMPLES'] ?? 12)
const WARMUPS = Number(process.env['BENCH_WARMUPS'] ?? 5)
const THROTTLE = 4
const QUIET_MS = 300

async function freshPage(browser: Browser, port: number, route: string): Promise<Page> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`http://localhost:${port}${route}`)
  await page.waitForSelector('body[data-bench-ready="1"]')
  return page
}

async function sampleOnce(browser: Browser, app: BenchApp, scenario: Scenario): Promise<number> {
  const page = await freshPage(browser, app.port, scenario.route)
  try {
    await scenario.setup?.(page)
    for (let i = 0; i < (scenario.warmup ? WARMUPS : 0); i++) await scenario.warmup!(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })
    await browser.startTracing(page, {
      categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'],
    })
    await scenario.op(page)
    await page.waitForTimeout(QUIET_MS)
    const buffer = await browser.stopTracing()
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    return durationFromTrace(
      JSON.parse(buffer.toString()) as { traceEvents: never[] },
      scenario.dispatch,
    )
  } finally {
    await page.context().close()
  }
}

export async function runRuntimeSuite(apps: BenchApp[]): Promise<{
  runtime: Results['runtime']
  chrome: string
}> {
  const browser = await chromium.launch()
  const chrome = browser.version()
  const perScenario = new Map<ScenarioId, Partial<Record<LibId, TimingStats>>>()

  for (const app of apps) {
    buildApp(app)
    const stop = await servePreview(app)
    try {
      for (const scenario of SCENARIOS) {
        const samples: number[] = []
        for (let i = 0; i < SAMPLES; i++) {
          samples.push(await sampleOnce(browser, app, scenario))
        }
        const bucket = perScenario.get(scenario.id) ?? {}
        bucket[app.id] = summarize(samples)
        perScenario.set(scenario.id, bucket)
        console.log(`${app.id} ${scenario.id}: median ${bucket[app.id]!.median.toFixed(1)}ms`)
      }
    } finally {
      stop()
    }
  }
  await browser.close()

  const runtime = {} as NonNullable<Results['runtime']>
  for (const [id, bucket] of perScenario) {
    const cascade = bucket.cascade
    const pVsCascade: Partial<Record<LibId, number>> = {}
    if (cascade) {
      for (const lib of ['shadcn', 'carbon'] as const) {
        const other = bucket[lib]
        if (other) pVsCascade[lib] = mannWhitneyU(other.samples, cascade.samples).p
      }
    }
    runtime[id as ScenarioId] = { ...bucket, pVsCascade }
  }
  return { runtime, chrome }
}
