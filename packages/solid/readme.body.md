## What

Solid islands for [cascivo-web](../../docs/USING-CASCIVO-WEB.md) / `cascivo-server` markup.

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

## Components and helpers

Typed wrappers over the `cv-*` contract (`Button`, `Badge`, `Card`, `Alert`, `Field`, `Input`, `Textarea`, `Select`) write the same classes and `data-*` values as the server markup. Helpers, all Solid-only (no React):

- `createForm(submit)`: `<form onSubmit={form.onSubmit}>`, one submit in flight, `submit` returns field errors (a 422 body) shown by `<Input error={form.errors().email}>`.
- `createI18n({ en: {...}, de: {...} })`: reactive `t(key, {name})`, locale from `<html lang>`. Not a wrapper over `@cascivo/i18n` (built on `@preact/signals-react`).
- `createTheme(['light', 'dark'])`: sets `data-theme` on `<html>`, persists to `localStorage`; `toggle()` cycles.
- `fromSignal(sig)`: Solid accessor over a `@cascivo/core` (Preact) signal, unsubscribes with the owner.

## Testing islands

`@cascivo/solid/testing` has `mountIsland(island, props?, fallbackHtml?)` → `{ el, unmount }`; `unmount()` fires `htmx:beforeCleanupElement` like a real swap. Run vitest with `vite-plugin-solid` (`solid({ ssr: false })`), `environment: 'jsdom'`, `resolve.conditions: ['browser']` and `server.deps.inline: [/solid-js/]` (see `vite.config.ts`).

```tsx
const { el, unmount } = mountIsland(Cart, { items: 2 })
el.querySelector('button')!.click()
expect(el.textContent).toBe('3')
unmount() // component onCleanup ran
```

For the swap lifecycle use the real `htmx.org` (`src/htmx-lifecycle.test.tsx`): `htmx.swap(target, html, { swapStyle: 'innerHTML' })` fires cleanup of the old island; mount the new one on `htmx:afterSettle`. jsdom's `XPathExpression.evaluate` needs a default result type; the test shows the one-line patch.

## Follow-ups

- Solid SSR (`renderToString` + `hydrate`) is not implemented: islands mount client-side over the server fallback (plan F12).
