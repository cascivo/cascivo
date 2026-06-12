import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  timeout: 60_000,
  use: {
    baseURL: process.env.BENCH_URL ?? 'http://localhost:4181',
  },
})
