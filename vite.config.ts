import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    cache: true,
  },
  lint: {
    ignorePatterns: ['dist/**', 'node_modules/**', '*.d.ts', 'pnpm-lock.yaml', 'docs/**'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    ignorePatterns: ['docs/**'],
  },
  staged: {
    '*': 'vp check --fix',
  },
})
