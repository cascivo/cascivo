import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    cache: true,
  },
  lint: {
    // starters/ is generated adopter code (scripts/starters), and packages/cli/recipes/ is the
    // adopter code `cascivo create` writes; both are linted by the adopter's config.
    ignorePatterns: [
      'dist/**',
      'node_modules/**',
      '*.d.ts',
      'pnpm-lock.yaml',
      'docs/**',
      'starters/**',
      'packages/cli/recipes/**',
    ],
  },
  fmt: {
    semi: false,
    singleQuote: true,
    // Generated route tables (@cascivo/app/vite) are rewritten on every route change;
    // formatting them would make the generator and the formatter fight.
    // packages/cli/recipes/ must stay byte-identical to what `cascivo create` has always written.
    ignorePatterns: ['docs/**', '**/routes.gen.ts', 'starters/**', 'packages/cli/recipes/**'],
  },
  staged: {
    '*': 'vp check --fix',
  },
})
