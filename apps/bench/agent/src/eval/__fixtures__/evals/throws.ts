import type { Page } from '@playwright/test'

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  throw new Error('the settings page has no Save button')
}
