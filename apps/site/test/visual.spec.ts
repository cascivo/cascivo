import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'

const registry = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'registry.json'), 'utf8'),
) as { components: { name: string }[] }

const THEMES = ['light', 'dark', 'warm'] as const

for (const { name } of registry.components) {
  for (const theme of THEMES) {
    test(`${name} renders in ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('cascade-theme', t), theme)
      await page.goto(`/docs/components/${name}`)
      const preview = page.locator('.preview')
      await expect(preview).toBeVisible()
      await expect(preview).toHaveScreenshot(`${name}-${theme}.png`)
    })
  }
}
