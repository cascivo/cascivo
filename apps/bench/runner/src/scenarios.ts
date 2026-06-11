import type { Page } from 'playwright'
import type { ScenarioId } from './types.ts'

export type Scenario = {
  id: ScenarioId
  route: '/table' | '/form' | '/dialog'
  /** trace event the measurement anchors on */
  dispatch: 'click' | 'keydown'
  /** brought the page into the state the op acts on; awaited fully before any measurement */
  setup?: (page: Page) => Promise<void>
  /** one warmup iteration; run WARMUPS times for warm ops; omit for cold ops */
  warmup?: (page: Page) => Promise<void>
  /** the measured operation — must trigger exactly one matching dispatch + paint */
  op: (page: Page) => Promise<void>
}

async function clickAndSettle(page: Page, sel: string, expectRows?: number) {
  await page.click(sel)
  if (expectRows !== undefined) {
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-bench-root="table"] tbody tr').length === n,
      expectRows,
      { timeout: 60_000 },
    )
  }
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'create-1k',
    route: '/table',
    dispatch: 'click',
    op: async (page) => clickAndSettle(page, '[data-bench="create-1k"]', 1000),
  },
  {
    id: 'create-10k',
    route: '/table',
    dispatch: 'click',
    op: async (page) => clickAndSettle(page, '[data-bench="create-10k"]', 10_000),
  },
  {
    id: 'update-every-10th',
    route: '/table',
    dispatch: 'click',
    setup: async (page) => clickAndSettle(page, '[data-bench="create-10k"]', 10_000),
    warmup: async (page) => {
      await page.click('[data-bench="update-every-10th"]')
      await page.waitForTimeout(50)
    },
    op: async (page) => {
      await page.click('[data-bench="update-every-10th"]')
      await page.waitForTimeout(50)
    },
  },
  {
    id: 'select-row',
    route: '/table',
    dispatch: 'click',
    setup: async (page) => clickAndSettle(page, '[data-bench="create-1k"]', 1000),
    op: async (page) => {
      await page.click('[data-bench="select-row"]')
      await page.waitForTimeout(50)
    },
  },
  {
    id: 'clear',
    route: '/table',
    dispatch: 'click',
    setup: async (page) => clickAndSettle(page, '[data-bench="create-10k"]', 10_000),
    op: async (page) => clickAndSettle(page, '[data-bench="clear"]', 0),
  },
  {
    id: 'open-dialog',
    route: '/dialog',
    dispatch: 'click',
    warmup: async (page) => {
      await page.click('[data-bench="open-dialog"]')
      await page.waitForSelector('[role="dialog"]')
      await page.click('[data-bench="close-dialog"]')
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' })
    },
    op: async (page) => {
      await page.click('[data-bench="open-dialog"]')
      await page.waitForSelector('[role="dialog"]')
    },
  },
  {
    id: 'type-20-chars',
    route: '/form',
    dispatch: 'keydown',
    warmup: async (page) => {
      await page.locator('[data-bench-input="search"]').pressSequentially('warm5')
    },
    op: async (page) => {
      await page.locator('[data-bench-input="search"]').pressSequentially('abcdefghijklmnopqrst')
      await page.waitForTimeout(50)
    },
  },
  {
    id: 'toggle-50-checkboxes',
    route: '/form',
    dispatch: 'click',
    warmup: async (page) => {
      await page.click('[data-bench="toggle-all"]')
      await page.waitForTimeout(50)
    },
    op: async (page) => {
      await page.click('[data-bench="toggle-all"]')
      await page.waitForTimeout(50)
    },
  },
]
