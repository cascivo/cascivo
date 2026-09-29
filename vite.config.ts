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
    // Generated route tables (@cascivo/app/vite) are rewritten on every route change;
    // formatting them would make the generator and the formatter fight.
    ignorePatterns: ['docs/**', '**/routes.gen.ts'],
  },
  staged: {
    '*': 'vp check --fix',
  },
})
