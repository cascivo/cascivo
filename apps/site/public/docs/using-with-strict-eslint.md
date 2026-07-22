<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-strict-eslint.md
  registry v0.9.0 · generated 2026-07-22
-->

# Using cascivo with a strict host ESLint config

**Short version: scope your host's stylistic rules off the directory cascivo
copies into.** When you `cascivo add` a component, you vendor its source into your
project (`src/components/ui/**` by default). That code is generated-style code you
own but did not write, and a strict host config — `@tanstack/eslint-config`,
`eslint-config-airbnb`, a bespoke typescript-eslint strict setup — will flag it
against **its** house style, not cascivo's. That is expected: cascivo's own lint
bar (Oxlint) is deliberately not every downstream config's bar, and chasing every
host's stylistic preferences inside vendored code is a losing game that
`cascivo update` would undo on the next re-copy anyway.

The fix is a one-time, durable ESLint override for your cascivo output directory.

---

## The recipe (flat config)

Add this block to `eslint.config.js` (adjust the glob to your `outputDir` from
`cascivo.config.ts` — the default is `src/components/ui/**`):

```js
// eslint.config.js
export default [
  // …your existing config…
  {
    // Vendored cascivo source — you own it, but it is generated-style code.
    // Scope host stylistic rules off it; keep correctness rules on.
    files: ['src/components/ui/**'],
    rules: {
      // Style: `T[]` vs `Array<T>`, import ordering, generic-param naming
      // (`Row` vs `TRow`), method-signature style — cascivo does not adopt these.
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/method-signature-style': 'off',
      'sort-imports': 'off',
      'import/order': 'off',
      // Opinionated / misfires on legitimate cascivo patterns:
      'react/no-array-index-key': 'off', // stable-content lists key by index intentionally
      'no-shadow': 'off', // false-positives on TS declaration-merging (compound components)
      'no-control-regex': 'off', // e.g. the log viewer strips ANSI escapes (\x1b) on purpose
    },
    linterOptions: {
      // cascivo's rule-scoped `eslint-disable` directives may target rule ids
      // your config doesn't define — don't report them as "unused".
      reportUnusedDisableDirectives: 'off',
    },
  },
]
```

cascivo enforces the objective classes below in its own linter (oxlint) via
`pnpm lint:host-strict`, so the copied source stays clean against a strict host
config for every rule outside the scope-off list above.

### `.eslintrc` (legacy) equivalent

```json
{
  "overrides": [
    {
      "files": ["src/components/ui/**"],
      "rules": {
        "@typescript-eslint/array-type": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/method-signature-style": "off",
        "sort-imports": "off",
        "import/order": "off",
        "react/no-array-index-key": "off",
        "no-shadow": "off",
        "no-control-regex": "off"
      },
      "linterOptions": { "reportUnusedDisableDirectives": false }
    }
  ]
}
```

## Why not just fix the source?

cascivo keeps the **objective** classes clean at the source — inline vs top-level
type specifiers, unnecessary type assertions, `prefer-const`, and stale
`eslint-disable` directives are treated as defects in the component library
itself; the syntactic ones are enforced in CI by `pnpm lint:host-strict` (which
runs oxlint, no ESLint dependency). What this page scopes off is the
**stylistic** layer that is one config's opinion:
generic-parameter naming (`Row` vs `TRow`), import ordering nuances, and unused-
directive reporting for rule ids your config doesn't share. Those are not worth
editing vendored files for, because:

- `cascivo update` re-copies the source, so any manual edit is lost on the next update.
- The readable single-letter-avoiding generic names (`Row`, `Column`) are part of
  the point of owning readable source; renaming them to `TRow` reduces readability
  to satisfy a naming convention cascivo intentionally does not adopt.

## See also

- [GETTING-STARTED.md](/docs/getting-started.md) — install + the files the CLI manages.
- [AI-RULES.md](/docs/ai-rules.md) — the contract for AI-authored cascivo code.
