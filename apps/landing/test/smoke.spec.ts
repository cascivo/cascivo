import { expect, test } from '@playwright/test'

test('page skeleton renders in order', async ({ page }) => {
  await page.goto('/')
  for (const id of ['console', 'signals', 'agents', 'quickstart']) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }
  await expect(page.locator('h1')).toContainText('Native to the web')
})

test('theme switcher flips data-theme; scoped card stays warm', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  for (const theme of ['dark', 'warm', 'flat', 'minimal', 'light'] as const) {
    await page.click(`.header-theme-dot[data-theme-name="${theme}"]`)
    await expect(html).toHaveAttribute('data-theme', theme)
    await expect(page.locator('.oncall-card')).toHaveAttribute('data-theme', 'warm')
  }
})

test('copy button writes to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.locator('.copy-command button').first().click()
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toContain('npx cascade')
})

test('re-render counters move when typing', async ({ page }) => {
  await page.goto('/')
  await page.locator('[aria-label="useState form"] input').first().pressSequentially('hello')
  await expect
    .poll(async () => Number(await page.locator('.twin-count').nth(1).textContent()))
    .toBeGreaterThan(0)
})

test('new deploy modal opens and closes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New deploy' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})
