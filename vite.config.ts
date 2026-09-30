import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    cache: true,
  },
  lint: {
    // starters/ is generated adopter code (scripts/starters), linted by the adopter's config.
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      '*.d.ts',
      'pnpm-lock.yaml',
      'docs/**',
      'starters/**',
    ],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    // Generated route tables (@cascivo/app/vite) are rewritten on every route change;
    // formatting them would make the generator and the formatter fight.
    ignorePatterns: ['docs/**', '**/routes.gen.ts', 'starters/**'],
  },
  staged: {
    '*': 'vp check --fix',
  },
})
