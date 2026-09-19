import { defineConfig } from '@playwright/test'

/**
 * Baselines are captured against the **built** `@cascivo/email`, not its source.
 *
 * Not a preference — a constraint. Playwright installs its own JSX runtime for the
 * TypeScript it compiles, so any package source it resolves itself produces Playwright
 * locator descriptors instead of React elements ("Objects are not valid as a React child").
 * The built package has React's `jsx()` calls already baked in and is immune.
 *
 * That makes a stale `dist/` able to poison the baselines silently, which it once did:
 * twelve PNGs recorded a corrupted font stack as expected, because `dist/` was one build
 * behind a fix to the client simulator. So the build is not left to memory — `pnpm
 * email:visual` builds the package first, and that is the only supported way to run this
 * suite.
 */
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
