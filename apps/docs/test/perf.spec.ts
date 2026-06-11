import { expect, test } from '@playwright/test'

// CI baseline budgets (ms). PERF_SCALE loosens them on slower machines (e.g. PERF_SCALE=2 locally).
const scale = Number(process.env.PERF_SCALE ?? 1)
const BUDGET = {
  initialRender: 3000 * scale,
  sort: 100 * scale,
  keystroke: 50 * scale,
}

test('10k-row DataTable stays within latency budgets', async ({ page }) => {
  const start = Date.now()
  await page.goto('/perf/data-table')
  await page.locator('tbody tr').first().waitFor()
  expect(Date.now() - start).toBeLessThan(BUDGET.initialRender)

  // Sort: click header, measure until the first row's text changes.
  const firstCell = page.locator('tbody tr').first().locator('td').nth(0)
  const before = await firstCell.textContent()
  const sortStart = Date.now()
  await page.getByRole('button', { name: /score/i }).click()
  await expect(firstCell).not.toHaveText(before ?? '')
  expect(Date.now() - sortStart).toBeLessThan(BUDGET.sort)

  // Keystroke feedback: typing must paint the character within budget.
  const search = page
    .getByRole('searchbox')
    .or(page.getByPlaceholder(/search/i))
    .first()
  const typeStart = Date.now()
  await search.pressSequentially('u')
  await expect(search).toHaveValue('u')
  expect(Date.now() - typeStart).toBeLessThan(BUDGET.keystroke)
})
