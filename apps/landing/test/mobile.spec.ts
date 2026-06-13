import { expect, test } from '@playwright/test'

const WIDTHS = [320, 375, 390, 414]

for (const width of WIDTHS) {
  test(`landing: zero horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')

    const overflow = await page.evaluate(
      () => (document.scrollingElement?.scrollWidth ?? 0) > window.innerWidth,
    )

    expect(overflow).toBe(false)
  })
}

for (const width of WIDTHS) {
  test(`charts section: no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')

    const charts = page.locator('#charts')
    await charts.scrollIntoViewIfNeeded()

    const overflow = await page.evaluate(() => {
      const el = document.querySelector('#charts')
      if (!el) return false
      return el.scrollWidth > window.innerWidth
    })

    expect(overflow).toBe(false)
  })
}

for (const width of WIDTHS) {
  test(`ecosystem section: no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')

    const ecosystem = page.locator('#ecosystem')
    await ecosystem.scrollIntoViewIfNeeded()

    const overflow = await page.evaluate(() => {
      const el = document.querySelector('#ecosystem')
      if (!el) return false
      return el.scrollWidth > window.innerWidth
    })

    expect(overflow).toBe(false)
  })
}

test('mobile nav: opens and closes via hamburger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const drawer = page.locator('#mobile-nav-drawer')

  // Drawer starts closed
  await expect(drawer).toHaveAttribute('aria-hidden', 'true')

  // Open via hamburger button (ShellHeader menuButton)
  await page.getByRole('button', { name: /open navigation/i }).click()
  await expect(drawer).toHaveAttribute('aria-hidden', 'false')

  // Close via Escape
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveAttribute('aria-hidden', 'true')
})

test('mobile nav: closes on scrim click', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const drawer = page.locator('#mobile-nav-drawer')

  await page.getByRole('button', { name: /open navigation/i }).click()
  await expect(drawer).toHaveAttribute('aria-hidden', 'false')

  // Click the scrim (the element behind the drawer)
  await page.locator('.nav-scrim').click()
  await expect(drawer).toHaveAttribute('aria-hidden', 'true')
})

test('mobile nav: link closes drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const drawer = page.locator('#mobile-nav-drawer')

  await page.getByRole('button', { name: /open navigation/i }).click()
  await expect(drawer).toHaveAttribute('aria-hidden', 'false')

  // Click a nav link inside the drawer
  await drawer.getByRole('link', { name: 'Components' }).click()
  await expect(drawer).toHaveAttribute('aria-hidden', 'true')
})
