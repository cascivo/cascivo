import { test } from '@playwright/test'

test('generate og image @og', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.goto('http://localhost:4180/og')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'public/og.png' })
})
