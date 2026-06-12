import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  timeout: 30_000,
  // Serial execution: tests that set data-theme via evaluate() depend on
  // localStorage isolation; parallel workers can interleave and bleed state.
  workers: 1,
  use: { baseURL: 'http://localhost:4180', viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'vp preview --port 4180 --strictPort',
    port: 4180,
    reuseExistingServer: !process.env['CI'],
  },
  grep: /^(?!.*@og)/,
})
