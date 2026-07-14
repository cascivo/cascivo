# Taming third-party CSS

You want to drop a legacy library into a cascivo app — a heavy charting widget, a
drag-and-drop kanban board, a rich-text editor — and it ships its own global
stylesheet. This page is the one-recipe answer.

## The problem

cascivo ships every rule inside a [cascade layer](./CSS-LAYERS-PITFALL.md). The whole
point of layers is that layer order beats selector specificity: a rule in
`cascivo.component` never fights a rule in `cascivo.theme` on specificity — the layer
order decides.

**Unlayered author CSS beats every layered rule, regardless of specificity.** A
third-party stylesheet is unlayered author CSS. So the moment you load
`some-widget/dist/styles.css`, its `.btn { … }` and even its bare `div { … }` rules
win over your carefully-layered cascivo components. Buttons restyle themselves,
spacing collapses, your theme stops applying.

## The recipe

Assign the vendor CSS to a layer **you** declare, ordered **below** the cascivo
layers so it can never beat them. This is native CSS — no PostCSS, no build plugin,
no wrapper component.

```css
/* app.css — loaded before anything else */

/* 1. Declare the order. `vendor` is first = lowest priority. */
@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
  cascivo.theme, cascivo.blocks, cascivo.override;

/* 2. Import the vendor stylesheet INTO the vendor layer. */
@import url('some-widget/dist/styles.css') layer(vendor);
```

That's it. The `layer(vendor)` keyword on `@import` drops the entire imported
stylesheet into the `vendor` layer, which you ordered dead last, so every cascivo
layer — and your own app CSS — now wins over it. You can still opt individual
overrides back in with `cascivo.override`.

> The scaffold from `cascivo create` already includes the `vendor` slot in its layer
> statement (only the example `@import` is commented), so new apps only need step 2.

## The one caveat: CSS imported from JavaScript can't be layered

`@import … layer()` only works from **CSS**. If you import a stylesheet from
JavaScript:

```ts
import 'some-widget/dist/styles.css' // ⚠️ lands unlayered — beats cascivo
```

…there is no place to attach `layer()`, so the CSS loads unlayered and wins. You have
two fixes:

**Option A — route it through a CSS file** (no tooling):

```ts
import './vendor.css' // vendor.css contains: @import url('some-widget/...') layer(vendor);
```

**Option B — `@cascivo/vite-plugin`** (keep the JS import as-is). The plugin wraps the
configured node_modules stylesheet in `@layer` at build time:

```ts
// vite.config.ts
import { cascivoLayers } from '@cascivo/vite-plugin'

export default defineConfig({
  plugins: [cascivoLayers({ imports: { 'some-widget/dist/styles.css': 'vendor' } })],
})
```

Your app CSS must still declare the `vendor` layer first (the two-line order statement
above). The plugin is Vite-only and, like the native recipe, can't fix runtime-injected
`<style>` tags or inline `style=""` — see below.

`cascivo audit` flags bare `*.css` imports from `node_modules` (`vendor-css-import`)
for exactly this reason.

### What the recipe can't fix

Some libraries don't ship a stylesheet at all — they inject `<style>` tags at runtime
or set inline `style=""` attributes on their own elements. Those bypass the cascade
layer system entirely (runtime-injected `<style>` is unlayered; inline styles beat all
layers by construction). The only levers there are the library's own theming API and,
for structural isolation, a Shadow DOM boundary. Reach for that only when a real
integration demands it — the `layer(vendor)` recipe covers the common case of a
library that ships a global `.css` file.

## See also

- [CSS-LAYERS-PITFALL.md](./CSS-LAYERS-PITFALL.md) — the canonical layer order and the
  `cascivo.override` escape hatch.
- [USING-WITH-TAILWIND.md](./USING-WITH-TAILWIND.md) — the same layering technique
  applied to Tailwind's utilities.
- [CHART-LIBRARIES.md](./CHART-LIBRARIES.md) — if you adopt Chart.js or ECharts anyway,
  tame their CSS with the recipe above.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — symptom → cause → fix for unstyled UI.
