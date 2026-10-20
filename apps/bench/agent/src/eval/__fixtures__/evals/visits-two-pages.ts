import type { Page } from '@playwright/test'

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  await page.getByRole('heading', { name: 'Hello eval' }).waitFor({ timeout: 5000 })
  await page.getByRole('link', { name: 'About' }).click()
  await page.getByRole('heading', { name: 'About us' }).waitFor({ timeout: 5000 })
}
