# Using cascivo with a strict host ESLint config

**Short version:**

```sh
pnpm add -D @cascivo/eslint-config
```

```js
// eslint.config.js
import cascivo from '@cascivo/eslint-config'

export default [
  // …your existing config…
  ...cascivo, // spread LAST — flat config is last-wins
]
```

That covers both problems on this page. Read on for what it does and why.

### If your `outputDir` is not `src/components/ui`

`...cascivo` scopes its vendored-source rules to `src/components/ui/**`. If `cascivo add`
writes somewhere else, pass your `outputDir` — **with the default glob, every rule the
fragment scopes off silently stays on**, and you get the full error list back:

```js
import { cascivoSignals, cascivoVendoredSource } from '@cascivo/eslint-config'

export default [
  // …your existing config…
  cascivoSignals,
  cascivoVendoredSource('app/ui/**'), // ← your outputDir, as a glob
]
```

### The exact config cascivo tests against

This is not an illustration. The block below is
[`scripts/checks/host-lint/eslint/eslint.config.js`](../scripts/checks/host-lint/eslint/eslint.config.js),
copied here by a test that fails if the two drift — and CI runs real ESLint with it over
every file `cascivo add` copies, asserting zero errors. It is a TanStack Start scaffold's
config with `@cascivo/eslint-config` added:

<!-- host-lint:eslint-config -->

```js
import { tanstackConfig } from '@tanstack/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'
import {
  cascivoPropVocabulary,
  cascivoSignals,
  cascivoVendoredSource,
} from '@cascivo/eslint-config'

export default [
  ...tanstackConfig,
  // NOTE the `.flat` — `reactHooks.configs['recommended-latest']` is the legacy
  // eslintrc shape and does nothing in a flat config.
  reactHooks.configs.flat['recommended-latest'],
  // Spread LAST — flat config is last-wins.
  cascivoSignals,
  // Reports the prop names adopters guess wrong, with the prop that exists. `warn`, so it
  // never fails a build; the fixture prints warnings and gates only on errors.
  cascivoPropVocabulary,
  // Pass YOUR `outputDir` from cascivo.config.ts. The no-argument default is
  // 'src/components/ui/**'; if your outputDir differs and you rely on the default,
  // every rule this fragment scopes off silently stays on.
  cascivoVendoredSource('packages/components/src/**'),
]
```

⚠ **`reactHooks.configs.flat['recommended-latest']`, not
`reactHooks.configs['recommended-latest']`.** The plugin exports both; the second is the
legacy eslintrc shape and applies nothing in a flat config, with no error to tell you.

### What `cascivoPropVocabulary` adds

It enables one rule, `cascivo/prop-vocabulary`, at **`warn`**. The rule answers a wrong prop
guess with the prop that exists:

```
`Text` has no `tone` prop — it is `muted`. `tone` is the catalog's SEVERITY vocabulary
(Status, Badge, Timeline, SideNav). Text emphasis is the boolean `muted`.
```

TypeScript already rejects `<Text tone="subtle">`; its message ("Property 'tone' does not
exist on type 'TextProps'") names the mistake and does not say what to write instead, so you
go looking for the docs. The rule also autofixes `gap="4"` → `gap={4}` and flags
`const { theme } = useTheme()` (it returns a tuple) and `<Flex justify=…>` with no
`direction` (`Flex` is vertical by default).

It is `warn` on purpose — a lint error over a naming opinion is a reason to delete the whole
config, which would take `react-hooks/immutability` with it. Raise it yourself if you want it
enforced. Full list: [`@cascivo/eslint-plugin`](../packages/eslint-plugin/README.md).

### Formatting: exclude vendored source from your formatter

Owning the code means your formatter will reformat it, and `cascivo update` will then
report drift on files you never edited. Add your `outputDir` to `.prettierignore` (or
`.oxfmtignore`):

```
src/components/ui/
```

`cascivo init` writes this for you when it finds a formatter config, and `cascivo doctor`
reports it as a finding if it is missing.

---

## 1. `react-hooks/immutability` errors on every signal write

**This affects every cascivo app, on both install paths.** It is not a
strict-config problem — `eslint-plugin-react-hooks@7` with `recommended-latest`
is what a stock 2026 React app gets.

The error looks like this, and you will get one for every piece of state you
wrote:

```
error  Error: This value cannot be modified
Modifying a value returned from a hook is not allowed.
  onValueChange={(v) => (env.value = v)}
                         ^^^ `env` cannot be modified
```

Your code is fine. cascivo's reactivity contract mandates `useSignal` over
`useState` ([AI-RULES.md](./AI-RULES.md)), and writing a signal means assigning
to `.value` — the rule fires on the exact idiom the docs tell you to use. The
canonical example in [HEADLESS.md](./HEADLESS.md),
`onClick={() => (open.value = !open.value)}`, is a reported error under this rule.

**Fix:** install `@cascivo/eslint-config` as above, or set the rule yourself:

```js
{ rules: { 'react-hooks/immutability': 'off' } }
```

**Why it can't be narrowed.** The rule cannot distinguish a deliberate signal
write from an accidental mutation of `useState` output, and it offers no
hook-name allowlist. Turning it off is the only mechanism available.

**What that costs.** You lose the rule's protection against genuinely mutating
React state elsewhere in your files. That is a real loss. If you would rather
keep it, skip the `cascivoSignals` fragment and put a
`// eslint-disable-next-line react-hooks/immutability` above each signal
assignment instead.

**Note the scope.** The directory-scoped recipe in §2 does **not** help here:
signal writes live in your own page and component code, and on the prebuilt path
(`@cascivo/react`) the `src/components/ui/**` directory does not exist at all.

### React Compiler

The React Compiler ecosystem is tightening around mutation analysis, and
`react-hooks/immutability` is the leading edge of it. cascivo's position: signals
are a deliberate escape from the compiler's memoization model — a signal cell is
*meant* to be mutated, and its reads are tracked at runtime rather than inferred
at compile time. We expect to keep this rule off for the foreseeable future
rather than reshape the reactivity contract around it. If you enable the React
Compiler itself, cascivo components are unaffected (they ship `'use client'` and
do not rely on compiler memoization), but your own signal-writing components
should be excluded from compilation or written with the disable directive above.

---

## 2. Host stylistic rules flag vendored source

**Copy-paste path only.** When you `cascivo add` a component, you vendor its source into your
project (`src/components/ui/**` by default). That code is generated-style code you
own but did not write, and a strict host config — `@tanstack/eslint-config`,
`eslint-config-airbnb`, a bespoke typescript-eslint strict setup — will flag it
against **its** house style, not cascivo's. That is expected: cascivo's own lint
bar (Oxlint) is deliberately not every downstream config's bar, and chasing every
host's stylistic preferences inside vendored code is a losing game that
`cascivo update` would undo on the next re-copy anyway.

The fix is a one-time, durable ESLint override for your cascivo output directory —
`@cascivo/eslint-config`'s `cascivoVendoredSource()` fragment is exactly the block
below, or write it by hand:

### The recipe (flat config)

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

## Why not just fix the vendored source?

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

- [GETTING-STARTED.md](./GETTING-STARTED.md) — install + the files the CLI manages.
- [AI-RULES.md](./AI-RULES.md) — the reactivity contract that makes §1's rule fire.
- [HEADLESS.md](./HEADLESS.md) — the signal primitives, and the `open.value = !open.value`
  example the rule reports.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — keyed on the literal error text.
