// Config for `pnpm lint:host-strict`.
//
// Runs @tanstack/eslint-config (a popular strict host config) over the component
// source that `cascivo add` copies into adopter projects, so a fresh adopter
// never inherits objective lint failures in code they did not write — the
// TanStack Start experience report's #7. It guards the objective classes that
// are cleanly, universally enforceable; the rest is documented in
// docs/USING-WITH-STRICT-ESLINT.md as "scope these off your components dir".
//
// Design notes:
//   * Type-aware rules are turned OFF (`disableTypeChecked`) and `project` is
//     unset, so the check is fast, deterministic, and never emits `project: true`
//     parse errors for files a package tsconfig doesn't include. The type-aware
//     objective classes (unnecessary assertions/conditions) were cleaned once at
//     the source; they are not part of the ongoing guard.
//   * Stylistic rules are OFF (see STYLISTIC_RULES_OFF) — one config's house
//     style, tracked in the guide, not a cascivo correctness concern.
//   * A few "objective-looking" rules are NOT enforced because they misfire on
//     legitimate patterns: core `no-shadow` false-positives on TS
//     declaration-merging (compound components), and `no-control-regex` flags an
//     intentional ANSI-escape strip in log-viewer. Both are in the guide.
import { tanstackConfig } from '@tanstack/eslint-config'
import tseslint from 'typescript-eslint'

/** Stylistic rules cascivo does not adopt in vendored source. Keep in sync with
 * the recipe block in docs/USING-WITH-STRICT-ESLINT.md. */
export const STYLISTIC_RULES_OFF = {
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/method-signature-style': 'off',
  'sort-imports': 'off',
  'import/order': 'off',
  'react/no-array-index-key': 'off',
  // Misfire on legitimate patterns (documented in the guide), not enforced:
  'no-shadow': 'off',
  'no-control-regex': 'off',
}

export default [
  {
    // Only copied source is in scope. Tests, stories, generated metas, and dist
    // are never vendored into an adopter project.
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.contract.test.tsx',
      '**/*.stories.tsx',
      '**/test-utils/**',
      '**/dist/**',
      '**/_all-metas.ts',
    ],
  },
  ...tanstackConfig,
  tseslint.configs.disableTypeChecked,
  {
    name: 'cascivo/host-strict',
    languageOptions: { parserOptions: { project: false, projectService: false } },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: STYLISTIC_RULES_OFF,
  },
]
