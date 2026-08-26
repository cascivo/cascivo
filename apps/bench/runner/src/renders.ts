import { chromium } from 'playwright'
import type { Page } from 'playwright'
import type { BenchApp } from './apps.ts'
import { SCENARIOS } from './scenarios.ts'
import { serveDev } from './server.ts'
import type { Results, ScenarioId } from './types.ts'

const SETTLE_MS = 250
const SETTLE_TIMEOUT_MS = 10_000

/**
 * Read the counter once it stops moving, not at a fixed instant after the op.
 * A flat wait publishes whichever commits happened to have landed by then:
 * carbon's 20-keystroke scenario measured 33 on one run and 34 on the next,
 * against a gate (`ci-compare.ts`) that demands the committed integer exactly.
 */
async function settledCommits(page: Page): Promise<number> {
  let previous = -1
  const deadline = Date.now() + SETTLE_TIMEOUT_MS
  while (Date.now() < deadline) {
    await page.waitForTimeout(SETTLE_MS)
    const current = await page.evaluate(() => (window as { __commits?: number }).__commits ?? 0)
    if (current === previous) return current
    previous = current
  }
  throw new Error(`window.__commits never settled within ${SETTLE_TIMEOUT_MS}ms`)
}

export async function runRenderSuite(apps: BenchApp[]): Promise<Results['renders']> {
  const browser = await chromium.launch()
  const renders = {} as NonNullable<Results['renders']>

  for (const app of apps) {
    const stop = await serveDev(app)
    let commitsSeen = 0
    try {
      for (const scenario of SCENARIOS) {
        const context = await browser.newContext()
        const page = await context.newPage()
        await page.goto(`http://localhost:${app.port}${scenario.route}`)
        await page.waitForSelector('body[data-bench-ready="1"]')
        await scenario.setup?.(page)

        const before = await settledCommits(page)
        await scenario.op(page)
        const after = await settledCommits(page)

        renders[scenario.id as ScenarioId] = {
          ...renders[scenario.id as ScenarioId],
          [app.id]: after - before,
        }
        commitsSeen += after - before
        console.log(`${app.id} ${scenario.id}: ${after - before} root commits`)
        await context.close()
      }
    } finally {
      stop()
    }

    // Every scenario mutates state the root renders, so a whole app scoring zero
    // is the harness being unplugged, not a library that never re-renders. Say so
    // here rather than publishing a table of zeros — which is what BENCHMARKS.md
    // carried until 2026-08-26. The counter is dev-only (React compiles
    // `<Profiler>` out of production builds), so this suite, on `serveDev`, is
    // the only place the claim can be checked at all.
    if (commitsSeen === 0) {
      throw new Error(
        `${app.id}: window.__commits never moved across ${SCENARIOS.length} scenarios — ` +
          'the Profiler harness is not wired (see apps/bench/PROTOCOL.md), or the app is ' +
          'being served from a production build',
      )
    }
  }
  await browser.close()
  return renders
}
