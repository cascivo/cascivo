import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — ${theme}`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
      // Reveal all scroll-animated sections and disable transitions so they
      // are fully visible (opacity:1) when axe scans — not mid-animation.
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        ;(el as HTMLElement).style.transition = 'none'
        el.setAttribute('data-revealed', '')
      })
    }, theme)
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(scan.violations).toEqual([])
  })
}

test('axe sweep — modal open', async ({ page }) => {
  // Remove persisted theme before page load so the app hydrates into light mode.
  // Previous tests may have written 'dark' to localStorage in the same context.
  await page.addInitScript(() => {
    localStorage.removeItem('cascade-landing-theme')
  })
  await page.goto('/')
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light'
  })
  await page
    .getByRole('region', { name: 'Deploys' })
    .getByRole('button', { name: 'New deploy' })
    .click()
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(scan.violations).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — /accessibility — ${theme}`, async ({ page }) => {
    await page.goto('/accessibility')
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
    }, theme)
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(scan.violations).toEqual([])
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — /performance — ${theme}`, async ({ page }) => {
    await page.goto('/performance')
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
      // Reveal all scroll-animated sections and disable transitions so they
      // are fully visible (opacity:1) when axe scans — not mid-animation.
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        ;(el as HTMLElement).style.transition = 'none'
        el.setAttribute('data-revealed', '')
      })
    }, theme)
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(scan.violations).toEqual([])
  })
}
