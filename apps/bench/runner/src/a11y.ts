import { AxeBuilder } from '@axe-core/playwright'
import { chromium, type Page } from 'playwright'
import type { BenchApp, LibId } from './apps.ts'
import { buildApp, servePreview } from './server.ts'
import type { Results } from './types.ts'

type A11yState = { route: string; prepare?: (page: Page) => Promise<void> }

const STATES: A11yState[] = [
  { route: '/table' },
  {
    route: '/table',
    prepare: async (page) => {
      await page.click('[data-bench="create-1k"]')
      await page.waitForFunction(
        () => document.querySelectorAll('[data-bench-root="table"] tbody tr').length === 1000,
      )
    },
  },
  { route: '/form' },
  {
    route: '/dialog',
    prepare: async (page) => {
      await page.click('[data-bench="open-dialog"]')
      await page.waitForSelector('[role="dialog"]')
    },
  },
]

export async function runA11ySuite(apps: BenchApp[]): Promise<Results['a11y']> {
  const browser = await chromium.launch()
  const out = {} as Record<LibId, { violations: number; rules: string[] }>

  for (const app of apps) {
    buildApp(app)
    const stop = await servePreview(app)
    const rules = new Set<string>()
    let violations = 0
    try {
      for (const state of STATES) {
        const context = await browser.newContext()
        const page = await context.newPage()
        await page.goto(`http://localhost:${app.port}${state.route}`)
        await page.waitForSelector('body[data-bench-ready="1"]')
        await state.prepare?.(page)
        const scan = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        violations += scan.violations.length
        for (const v of scan.violations) rules.add(v.id)
        await context.close()
      }
    } finally {
      stop()
    }
    out[app.id] = { violations, rules: [...rules].sort() }
    console.log(`${app.id}: ${violations} violations [${[...rules].join(', ')}]`)
  }
  await browser.close()
  return out
}
