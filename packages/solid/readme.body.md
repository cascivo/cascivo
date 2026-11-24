## What

Solid islands for [cascivo-web](../../docs/USING-CASCIVO-WEB.md) / `cascivo-server` markup. Private workspace package.

```tsx
// src/cart.tsx — the island module the loader imports (`data-src`)
import { defineIsland } from '@cascivo/solid'
export default defineIsland((props: { items: number }) => <b>{props.items}</b>)
```

```ts
// vite.config.ts
import { cascivoSolid } from '@cascivo/solid/vite'
export default defineConfig({ plugins: [cascivoSolid({ islands: { cart: 'src/cart.tsx' } })] })
```

- `defineIsland(Component)` returns `(el, props) => void`, the island loader contract. It replaces the server fallback markup, and disposes on `htmx:beforeCleanupElement`, so an island survives htmx swaps (a swapped-in `[data-island]` is mounted by the loader again).
- `@cascivo/solid/elements` augments `solid-js` `JSX.IntrinsicElements` with every `cv-*` element, generated from the Custom Elements Manifest (`pnpm --filter @cascivo/solid generate`; a test fails when stale). Events: `on:cv-value-change={(e) => e.detail.value}`.
- `cascivoSolid({ islands })` is vite-plugin-solid plus fixed output names (`<name>.js`, one stylesheet named after the first island) and a build step that inlines `c.unit.part` class names from `@cascivo/css`, so the island does not ship the whole class map (~6 KB gz).
- Budget: each island ≤ 10 KB gz with the Solid runtime; `src/vite.test.ts` builds `sample/counter.tsx` and enforces it.
