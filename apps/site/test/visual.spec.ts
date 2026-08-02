import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'

const registry = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'registry.json'), 'utf8'),
) as { components: { name: string }[] }

const THEMES = ['light', 'dark', 'warm'] as const

// Pixel snapshots need deterministic rendering. Skip categories that draw to
// <canvas> or animate on mount: flow diagrams (a positioned canvas graph) and
// charts (ECharts enter animations) capture a different frame every run and
// would flake perpetually. Their behaviour is covered by unit/story checks.
const UNSTABLE_PREFIXES = ['chart/', 'flow/']

// Demos that read the wall clock (Calendar renders the current month and marks
// `data-today`) drift out of their baseline on their own — a day at a time, then
// wholesale at every month boundary, which is what turned this suite red on
// 2026-08-01. Pin the clock so "now" is the same instant on every run. Paired
// with `timezoneId: 'UTC'` in playwright.config.ts so the frozen instant lands
// on the same calendar day on a dev box as it does on the runner.
const FROZEN_NOW = new Date('2026-01-15T12:00:00Z')

for (const { name } of registry.components) {
  if (UNSTABLE_PREFIXES.some((prefix) => name.startsWith(prefix))) continue
  for (const theme of THEMES) {
    test(`${name} renders in ${theme}`, async ({ page }) => {
      await page.clock.setFixedTime(FROZEN_NOW)
      await page.addInitScript((t) => localStorage.setItem('cascade-theme', t), theme)
      await page.goto(`/docs/components/${name}`)
      const preview = page.locator('.preview')
      await expect(preview).toBeVisible()
      await expect(preview).toHaveScreenshot(`${name}-${theme}.png`)
    })
  }
}
