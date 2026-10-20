import type { Page } from '@playwright/test'
import { anyVisible, eventually, expectVisible, goTo } from '../_lib.ts'

/** One amount: `1,284`, `$48.2k`, `98.5%`, `+12`, `3.4 s`, `312 users`. */
const AMOUNT = String.raw`[+\-−]?\s*[$€£¥]?\s*\d[\d,.\s]*(?:\s*[%a-z/]{1,12})?`
/** A duration in parts (`3m 24s`, `1h 12m`, `12d 4h`) or on a clock (`2:34`, `1:02:09`). */
const DURATION = String.raw`\d+\s*[a-z]{1,3}(?:\s+\d+\s*[a-z]{1,3}){1,3}|\d{1,2}(?::\d{2}){1,2}`
/**
 * A change printed after the value in the same text: `+4.2%`, `−3%`, `(-0.4%)`. Signed, with the
 * sign against its number and a space before it, so a range like `10-20` or `2024 - 2026` is not
 * one.
 */
const DELTA = String.raw`\(?[+\-−][$€£¥]?\d[\d,.]*\s*(?:%|[a-z]{1,3})?\)?`
/**
 * A KPI figure as it is usually printed: an amount or a duration, optionally followed by its
 * delta (`$48,210 +4.2%`, the common value-and-change markup in one element). Anchored, so it
 * matches an element that holds the figure, not a sentence that mentions one.
 */
const FIGURE = new RegExp(String.raw`^\s*(?:${DURATION}|${AMOUNT})(?:\s+${DELTA})?\s*$`, 'i')

/** Where an agent may put the users table: on the overview, or behind a nav item of its own. */
const USERS_NAV = /users|people|members|accounts|customers/i
const OVERVIEW_NAV = /overview|dashboard|home/i

/** Agents use `<table>` or an ARIA grid (a data table with keyboard navigation) for the same thing. */
const tables = (page: Page) => page.getByRole('table').or(page.getByRole('grid'))

/**
 * A KPI is on screen: a heading that carries a number, a named region that does, or an element
 * whose whole text is a figure. Table cells are left out, so a numeric column is not a KPI.
 */
async function kpiVisible(page: Page): Promise<boolean> {
  const heading = page.getByRole('heading', { name: /\d/ })
  const region = page.getByRole('region').filter({ hasText: /\d/ })
  if ((await anyVisible(heading)) || (await anyVisible(region))) return true
  return page
    .getByText(FIGURE)
    .evaluateAll((els) =>
      els.some(
        (el) =>
          el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
          el.closest('table, [role="table"], [role="grid"], [role="row"]') === null,
      ),
    )
}

/** A table with a column header and at least one row of data cells. */
async function usersTable(page: Page): Promise<boolean> {
  for (const table of await tables(page).all()) {
    if (!(await table.isVisible())) continue
    const headers = table.getByRole('columnheader')
    const dataRows = table
      .getByRole('row')
      .filter({ has: page.getByRole('cell').or(page.getByRole('gridcell')) })
    if ((await headers.count()) > 0 && (await dataRows.count()) > 0) return true
  }
  return false
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  if (!(await eventually(() => kpiVisible(page)))) {
    // The prompt asks for an overview page, not for it to be `/`: it may be a nav item of its own.
    await goTo(page, baseUrl, OVERVIEW_NAV, { preferNav: true }).catch(() => {})
    if (!(await eventually(() => kpiVisible(page))))
      throw new Error(
        'overview: no KPI figure (a number in a heading, region or stat) on / or behind an overview/dashboard/home link',
      )
  }

  if (!(await eventually(() => usersTable(page), 2000))) {
    await goTo(page, baseUrl, USERS_NAV, { preferNav: true })
    if (!(await eventually(() => usersTable(page))))
      throw new Error('users: no table with a column header and a data row')
  }

  await page.goto(baseUrl)
  // The side navigation's pages: a header account button of the same name is not one.
  await goTo(page, baseUrl, /settings/i, { preferNav: true })
  await expectVisible(page, 'heading', /settings/i)

  await goTo(page, baseUrl, OVERVIEW_NAV, { preferNav: true })
  if (!(await eventually(() => kpiVisible(page))))
    throw new Error('navigating back from settings to the overview did not show its KPIs again')
}
