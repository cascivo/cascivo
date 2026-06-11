import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    __commits: number
  }
}

test.describe('bench protocol conformance', () => {
  test('table route implements all operations', async ({ page }) => {
    await page.goto('/table')
    await page.waitForSelector('body[data-bench-ready="1"]')

    for (const op of ['create-1k', 'create-10k', 'update-every-10th', 'select-row', 'clear']) {
      await expect(page.locator(`[data-bench="${op}"]`)).toBeVisible()
    }

    await page.click('[data-bench="create-1k"]')
    await expect(page.locator('[data-bench-root="table"] tbody tr')).toHaveCount(1000)

    await page.click('[data-bench="update-every-10th"]')
    await expect(page.locator('[data-bench-root="table"] tbody tr').first()).toContainText('!!!')

    await page.click('[data-bench="clear"]')
    await expect(page.locator('[data-bench-root="table"] tbody tr')).toHaveCount(0)

    await page.click('[data-bench="create-10k"]')
    await expect(page.locator('[data-bench-root="table"] tbody tr')).toHaveCount(10000, {
      timeout: 30_000,
    })
  })

  test('form route echoes typing and toggles checkboxes', async ({ page }) => {
    await page.goto('/form')
    await page.waitForSelector('body[data-bench-ready="1"]')

    await page.locator('[data-bench-input="search"]').pressSequentially('hello')
    await expect(page.locator('[data-bench-echo="search"]')).toHaveText('hello')

    const boxes = page.locator(
      '[data-bench-root="form"] [role="checkbox"], [data-bench-root="form"] input[type="checkbox"]',
    )
    await expect(boxes).toHaveCount(50)
    await page.click('[data-bench="toggle-all"]')
    await expect(boxes.first()).toBeChecked()
  })

  test('dialog route opens and closes a real dialog', async ({ page }) => {
    await page.goto('/dialog')
    await page.waitForSelector('body[data-bench-ready="1"]')

    await page.click('[data-bench="open-dialog"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.click('[data-bench="close-dialog"]')
    await expect(page.locator('[role="dialog"]')).toBeHidden()
  })

  test('commit counter is wired', async ({ page }) => {
    await page.goto('/table')
    await page.waitForSelector('body[data-bench-ready="1"]')
    const before = await page.evaluate(() => window.__commits)
    await page.click('[data-bench="create-1k"]')
    await page.waitForTimeout(100)
    const after = await page.evaluate(() => window.__commits)
    expect(after).toBeGreaterThan(before)
  })
})
