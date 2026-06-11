import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('reduced motion: theme switch works instantly, no autonomous animation', async ({ page }) => {
  await page.goto('/')
  await page.click('.header-theme-dot[data-theme-name="dark"]')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  // Two screenshots 1.5s apart should be identical (no looping animation)
  const a = await page.locator('.console-frame').screenshot()
  await page.waitForTimeout(1500)
  const b = await page.locator('.console-frame').screenshot()
  expect(Buffer.compare(a, b)).toBe(0)
})
