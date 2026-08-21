One ESLint rule: **`cascivo/prop-vocabulary`**. It reports the prop names an adopter is likely to guess wrong, and answers with the prop that exists and why.

You probably do not need to install this directly — [`@cascivo/eslint-config`](../eslint-config) depends on it and enables the rule at `warn`.

## Why it exists

A 2026-08-21 adopter report put it precisely:

> A fresh adopter's success is currently load-bearing on the docs staying this good — the API itself still has the sharp edges. **The docs are doing work the API should eventually do itself.**

Most of that work moved into the type system: `label` and `ariaLabel` both compile now, `Switch` is exported, `Field` takes `hint`. What is left is the class TypeScript structurally cannot help with. `<Text tone="subtle">` is a correct type error whose message —

```
Property 'tone' does not exist on type 'TextProps'.
```

— names the mistake and teaches nothing, so you go looking for the docs anyway. That is the dependency the report flagged. TypeScript has no mechanism for a custom message on an unknown prop; a runtime warning cannot tell a typo from a legitimate DOM passthrough and arrives after the build you are fixing. A lint rule is the one layer that can carry the sentence:

```
`Text` has no `tone` prop — it is `muted`. `tone` is the catalog's SEVERITY vocabulary
(Status, Badge, Timeline, SideNav). Text emphasis is the boolean `muted`.
```

## What it catches

| You wrote                                      | It says                                                    | Autofix                     |
| ---------------------------------------------- | ---------------------------------------------------------- | --------------------------- |
| `<Text tone="subtle">`                         | the prop is `muted`; `tone` is the severity vocabulary     | —                           |
| `<Flex gap="4">`                               | `gap` takes a number                                       | ✅ → `gap={4}`              |
| `<Flex justify="between">` with no `direction` | `Flex` is vertical by default, unlike CSS/Chakra/MUI/Radix | —                           |
| `const { theme } = useTheme()`                 | it returns a tuple                                         | —                           |
| `import { Dialog } from '@cascivo/react'`      | `Dialog` is `Modal`                                        | ✅ (unaliased imports only) |
| `<DataTable items={…}>`                        | it takes `rows` — the one component that does              | —                           |

## Install

```sh
pnpm add -D @cascivo/eslint-config   # brings this plugin with it
```

```js
// eslint.config.js
import cascivo from '@cascivo/eslint-config'

export default [...yourConfig, ...cascivo] // spread LAST — flat config is last-wins
```

Or wire the rule up yourself:

```js
import cascivoPlugin from '@cascivo/eslint-plugin'

export default [
  {
    plugins: { cascivo: cascivoPlugin },
    rules: { 'cascivo/prop-vocabulary': 'warn' },
  },
]
```

## `warn`, not `error`

Deliberate. A lint rule that fails your build over a naming opinion gets the whole config deleted — and that takes `react-hooks/immutability` with it, which is what `@cascivo/eslint-config` exists for. Raise it to `error` yourself if you want it enforced.

## Adding a case

Every case lives in `near-misses.json`, from which `scripts/eslint-vocabulary/generate.ts` emits the data the rule reads. Each row is validated against `registry.json` at generation time: the prop it recommends must exist on that component, and the prop it warns about must not. A rename on either side fails `pnpm regen` rather than shipping a rule that teaches the wrong thing with the authority of a fix list.

So the next friction report costs a row in a JSON file, not a paragraph in a guide.
