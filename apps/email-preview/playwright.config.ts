import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  fullyParallel: true,
  use: {
    viewport: { width: 640, height: 900 },
    deviceScaleFactor: 1,
    // Baselines are captured on UTC runners; templates render no dates today, but pinning
    // costs nothing and stops the first date-aware template from silently rotting them.
    timezoneId: 'UTC',
  },
  expect: {
    toHaveScreenshot: {
      // Absorb antialiasing differences between environments, as apps/site does.
      maxDiffPixelRatio: 0.03,
      animations: 'disabled',
    },
  },
})
