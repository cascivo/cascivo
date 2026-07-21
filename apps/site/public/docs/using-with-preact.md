<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-preact.md
  registry v0.9.0 · generated 2026-07-21
-->

# Using cascivo with Preact

**Short version: it works.** `@cascivo/react` runs inside a Preact app via the
standard `react → preact/compat` alias — components render, signals update,
interactions fire, with zero runtime errors. Two production migrations (a Vite +
Tailwind v4 studio and a Preact 10 PWA) verified this firsthand. cascivo's bundle
is ~75 KB JS under compat with no JS warnings; the signals runtime does not fight
Preact.

This page documents the setup so you don't have to discover it by trial.

---

## 1. Alias `react`/`react-dom` to `preact/compat` (build)

Use `@preact/preset-vite`, which wires the alias for you:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
})
```

If you alias manually instead, map all four entry points:

```ts
resolve: {
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime',
    'react-dom/test-utils': 'preact/test-utils',
  },
}
```

## 2. Map the same aliases in `tsconfig` (typecheck)

cascivo's `.d.ts` files import from `"react"`. For the type-checker to resolve
those to Preact, add `paths`:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "react": ["./node_modules/preact/compat"],
      "react-dom": ["./node_modules/preact/compat"],
    },
  },
}
```

Both migrations were strict-mode clean (including
`exactOptionalPropertyTypes: true`) with no `any` needed once small wrappers were
in place.

## 3. Satisfy the React peer dependency

`@cascivo/react` (and `@cascivo/core`) declare `react`/`react-dom >= 18` as peer
dependencies. Under compat the alias means React is never actually bundled, but
the peer still has to resolve. Install React purely to satisfy it:

```sh
pnpm add -D react react-dom
```

These are dev-only here — the alias replaces them at build time. (We're tracking
a `peerDependenciesMeta` change to make this explicit; for now, install them.)

## 4. Signals package

`@cascivo/core` peer-deps `@preact/signals-react`. Under `preact/compat` you might
expect to need `@preact/signals` — but **`@preact/signals-react@3` works fine
under compat**, and it's the package cascivo expects. Install it:

```sh
pnpm add @preact/signals-react
```

You do not need to add the Babel signals transform: cascivo components that read
`signal.value` during render call `useSignals()` internally, so reactivity works
without app-level transform configuration.

---

## Minimal working setup

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
pnpm add -D react react-dom
```

```ts
// entry
import '@cascivo/react/styles.css'
import '@cascivo/themes/all'
```

```tsx
import { Button, Card } from '@cascivo/react'

export function App() {
  return (
    <Card>
      <Button>It works under Preact</Button>
    </Card>
  )
}
```

That's the whole story. If something renders but never updates on a signal
write, the cause is almost always a missing alias (so two different React copies
are loaded) — re-check steps 1 and 2.
