import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// ── Smoke ─────────────────────────────────────────────────────────────────────

test('layouts page renders group headings', async ({ page }) => {
  await page.goto('/layouts')
  await expect(page.getByRole('heading', { name: 'Primitives' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sections' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Blocks' })).toBeVisible()
})

test('layouts page has copy buttons for all entries (≥ 9)', async ({ page }) => {
  await page.goto('/layouts')
  // Each entry renders a CopyButton with "npx cascivo add …"
  const copyButtons = page.locator('button code').filter({ hasText: 'npx cascivo add' })
  const count = await copyButtons.count()
  // 3 primitives (auto-grid, masonry, section) + 6 sections + blocks
  expect(count).toBeGreaterThanOrEqual(9)
})

test('layouts page has npx cascivo add hero copy button', async ({ page }) => {
  await page.goto('/layouts')
  await expect(
    page.locator('button code').filter({ hasText: 'npx cascivo add hero' }),
  ).toBeVisible()
})

test('masonry preview contains child tiles', async ({ page }) => {
  await page.goto('/layouts')
  // The masonry preview renders tile divs inside a Masonry wrapper
  const masonryPreview = page
    .locator('h3 code', { hasText: 'layout/masonry' })
    .locator('..') // h3
    .locator('..') // entry header div
    .locator('..') // entry div
  await expect(masonryPreview).toBeVisible()
  // Preview container should have children (tiles rendered inside Masonry)
  const tiles = masonryPreview.locator('div[style*="block-size"]')
  expect(await tiles.count()).toBeGreaterThanOrEqual(1)
})

test('charts page plain chart in table cell has no legend', async ({ page }) => {
  await page.goto('/charts')
  // Scroll to Micro charts section
  await page.getByRole('heading', { name: 'Micro charts' }).scrollIntoViewIfNeeded()
  // Find the table with plain charts
  const table = page.locator('table').first()
  await expect(table).toBeVisible()
  // Every chart frame inside the table should have data-plain attribute
  const frames = table.locator('[data-plain]')
  expect(await frames.count()).toBeGreaterThanOrEqual(1)
  // No legend should appear inside the plain-chart table cells
  const legends = table.locator('[aria-label="Chart legend"]')
  expect(await legends.count()).toBe(0)
})

// ── Axe accessibility ─────────────────────────────────────────────────────────

for (const theme of ['light', 'dark'] as const) {
  test(`layouts page passes axe in ${theme} theme`, async ({ page }) => {
    await page.addInitScript(({ key, val }) => localStorage.setItem(key, val), {
      key: 'cascade-theme',
      val: JSON.stringify({ v: 1, value: theme }),
    })
    await page.goto('/layouts')
    await expect(page.getByRole('heading', { name: 'Primitives' })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}

// ── RTL overflow check ────────────────────────────────────────────────────────

test('hero and page-footer previews have no horizontal overflow under RTL', async ({ page }) => {
  await page.goto('/layouts')

  // Inject RTL on document
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl')
  })

  // Hero entry preview container
  const heroEntry = page.locator('h3 code', { hasText: 'section/hero' }).locator('../../../..')
  const heroOverflow = await heroEntry.evaluate((el: HTMLElement) => {
    const preview = el.querySelector('div[style*="overflow"]') as HTMLElement | null
    if (!preview) return false
    return preview.scrollWidth > preview.clientWidth
  })
  expect(heroOverflow).toBe(false)

  // PageFooter entry preview container
  const footerEntry = page
    .locator('h3 code', { hasText: 'section/page-footer' })
    .locator('../../../..')
  const footerOverflow = await footerEntry.evaluate((el: HTMLElement) => {
    const preview = el.querySelector('div[style*="overflow"]') as HTMLElement | null
    if (!preview) return false
    return preview.scrollWidth > preview.clientWidth
  })
  expect(footerOverflow).toBe(false)
})
