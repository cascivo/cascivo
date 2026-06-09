import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    cache: true,
  },
  lint: {
    ignorePatterns: ['dist/**', 'node_modules/**', '*.d.ts', 'pnpm-lock.yaml'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
})
