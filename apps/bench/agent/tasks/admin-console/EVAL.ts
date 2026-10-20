import type { Page } from '@playwright/test'
import { anyVisible, eventually, expectVisible, goTo } from '../_lib.ts'

/**
 * A KPI figure as it is usually printed: `1,284`, `$48.2k`, `98.5%`, `+12`, `3.4 s`, `312 users`.
 * Anchored, so it matches an element that holds the figure, not a sentence that mentions one.
 */
const FIGURE = /^\s*[+\-−]?\s*[$€£¥]?\s*\d[\d,.\s]*(?:\s*[%a-z/]{1,12})?\s*$/i

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
  if (!(await eventually(() => kpiVisible(page))))
    throw new Error('overview: no KPI figure (a number in a heading, region or stat) on /')

  if (!(await eventually(() => usersTable(page), 2000))) {
    await goTo(page, baseUrl, USERS_NAV)
    if (!(await eventually(() => usersTable(page))))
      throw new Error('users: no table with a column header and a data row')
  }

  await page.goto(baseUrl)
  await goTo(page, baseUrl, /settings/i)
  await expectVisible(page, 'heading', /settings/i)

  await goTo(page, baseUrl, OVERVIEW_NAV)
  if (!(await eventually(() => kpiVisible(page))))
    throw new Error('navigating back from settings to the overview did not show its KPIs again')
}
