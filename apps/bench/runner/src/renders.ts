import { chromium } from 'playwright'
import type { BenchApp } from './apps.ts'
import { SCENARIOS } from './scenarios.ts'
import { serveDev } from './server.ts'
import type { Results, ScenarioId } from './types.ts'

export async function runRenderSuite(apps: BenchApp[]): Promise<Results['renders']> {
  const browser = await chromium.launch()
  const renders = {} as NonNullable<Results['renders']>

  for (const app of apps) {
    const stop = await serveDev(app)
    try {
      for (const scenario of SCENARIOS) {
        const context = await browser.newContext()
        const page = await context.newPage()
        await page.goto(`http://localhost:${app.port}${scenario.route}`)
        await page.waitForSelector('body[data-bench-ready="1"]')
        await scenario.setup?.(page)
        await page.waitForTimeout(100)

        const before = await page.evaluate(() => (window as { __commits?: number }).__commits ?? 0)
        await scenario.op(page)
        await page.waitForTimeout(200)
        const after = await page.evaluate(() => (window as { __commits?: number }).__commits ?? 0)

        renders[scenario.id as ScenarioId] = {
          ...renders[scenario.id as ScenarioId],
          [app.id]: after - before,
        }
        console.log(`${app.id} ${scenario.id}: ${after - before} root commits`)
        await context.close()
      }
    } finally {
      stop()
    }
  }
  await browser.close()
  return renders
}
