import { expect, test } from '@playwright/test'

const WIDTHS = [320, 375, 390, 414]

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/components/button', name: 'button' },
  { path: '/charts', name: 'charts' },
  { path: '/benchmarks', name: 'benchmarks' },
]

for (const width of WIDTHS) {
  for (const { path, name } of PAGES) {
    test(`docs ${path}: zero horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 })
      await page.goto(path)

      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) > window.innerWidth,
      )

      expect(overflow).toBe(false)
    })
  }
}

test('docs mobile nav: opens via hamburger at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  // The AppShell hamburger button is inside ShellHeader and calls shell.toggleSideNav
  const hamburger = page.getByRole('button', { name: /menu|navigation/i }).first()
  await hamburger.click()

  // After click, data-drawer='open' should be set on the shell root
  await expect(page.locator('[data-drawer="open"]')).toBeVisible()
})

test('docs mobile nav: closes via Escape at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const hamburger = page.getByRole('button', { name: /menu|navigation/i }).first()
  await hamburger.click()

  await expect(page.locator('[data-drawer="open"]')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.locator('[data-drawer="open"]')).not.toBeVisible()
})

test('docs mobile nav: closes via scrim click at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const hamburger = page.getByRole('button', { name: /menu|navigation/i }).first()
  await hamburger.click()

  await expect(page.locator('[data-drawer="open"]')).toBeVisible()

  await page.locator('[data-testid="cascade-shell-scrim"]').click()
  await expect(page.locator('[data-drawer="open"]')).not.toBeVisible()
})
