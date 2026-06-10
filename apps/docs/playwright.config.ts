import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  fullyParallel: true,
  use: {
    viewport: { width: 900, height: 700 },
    deviceScaleFactor: 1,
  },
  expect: {
    toHaveScreenshot: {
      // Absorb minor antialiasing differences between environments.
      maxDiffPixelRatio: 0.03,
      animations: 'disabled',
    },
  },
  webServer: {
    // Serves the already-built app — run `vp build` first (CI does).
    command: 'pnpm exec vp preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
