import { expect, test } from '@playwright/test'

test('reduced motion: theme switch works instantly, no autonomous animation', async ({ page }) => {
  // test.use({ reducedMotion }) doesn't affect window.matchMedia on Linux Chromium;
  // page.emulateMedia() uses the DevTools Protocol directly and works correctly.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.click('.header-theme-dot[data-theme-name="dark"]')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  // Discard the first screenshot — Chromium's compositor needs one frame to settle
  // its tile cache after a theme switch; subsequent screenshots are deterministic.
  await page.locator('.console-frame').screenshot()
  const a = await page.locator('.console-frame').screenshot()
  await page.waitForTimeout(1500)
  const b = await page.locator('.console-frame').screenshot()
  expect(Buffer.compare(a, b)).toBe(0)
})
