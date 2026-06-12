import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`axe sweep — ${theme}`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t
    }, theme)
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(scan.violations).toEqual([])
  })
}

test('axe sweep — modal open', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New deploy' }).click()
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
