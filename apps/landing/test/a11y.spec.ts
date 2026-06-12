import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — ${theme}`, async ({ page }) => {
    // Pre-seed the desired theme in localStorage so the app hydrates into it
    // immediately, without the signal effect racing against our evaluate().
    await page.addInitScript((t) => {
      localStorage.setItem('cascade-landing-theme', JSON.stringify({ v: 1, value: t }))
    }, theme)
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
  // Pre-seed light theme so the app hydrates into it deterministically.
  await page.addInitScript(() => {
    localStorage.setItem('cascade-landing-theme', JSON.stringify({ v: 1, value: 'light' }))
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page
    .getByRole('region', { name: 'Deploys' })
    .getByRole('button', { name: 'New deploy' })
    .click()
  // Wait for the modal to be fully visible before scanning.
  await page.locator('[role="dialog"]').waitFor({ state: 'visible' })
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(scan.violations).toEqual([])
})

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — /accessibility — ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('cascade-landing-theme', JSON.stringify({ v: 1, value: t }))
    }, theme)
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
    await page.addInitScript((t) => {
      localStorage.setItem('cascade-landing-theme', JSON.stringify({ v: 1, value: t }))
    }, theme)
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
