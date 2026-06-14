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
      // The ThemeDemo gallery deliberately renders the same card in all 10
      // themes (data-theme panes). It's a swatch showcase, not the page's
      // operative UI — auditing non-active themes for AA on the live page is a
      // false positive. The page's own (active) theme is audited everywhere else.
      .exclude('.theme-demo-grid')
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
  await page.goto('/')
  // Reveal all scroll-animated sections before the modal scan: axe walks DOM ancestors
  // to compute composite opacity, and [data-reveal] sections start at opacity:0.
  // An opacity-0 ancestor causes axe to compute a false low-contrast color blend.
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      ;(el as HTMLElement).style.transition = 'none'
      el.setAttribute('data-revealed', '')
    })
  })
  await page
    .getByRole('region', { name: 'Deploys' })
    .getByRole('button', { name: 'New deploy' })
    .click()
  // <dialog> has implicit dialog role — getByRole is the right locator, not [role="dialog"]
  await expect(page.getByRole('dialog')).toBeVisible()
  const scan = await new AxeBuilder({ page })
    .exclude('.theme-demo-grid')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
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

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — /guides — ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('cascade-landing-theme', JSON.stringify({ v: 1, value: t }))
    }, theme)
    await page.goto('/guides')
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
