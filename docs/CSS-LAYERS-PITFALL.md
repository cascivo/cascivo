# CSS `@layer` Pitfall in Example Apps

> **Renamed from `cascade.*` in v37.** All shipped layers are now under the
> `cascivo.*` namespace (`cascivo.base`, `cascivo.theme`, `cascivo.component`, …).
> Any consumer that referenced the old `@layer cascade.*` names in their own
> `@layer` ordering **must update them to `cascivo.*`**. This was a deliberate
> breaking change (the brand is `cascivo`, not `cascade`) — see the package
> CHANGELOGs.

## Canonical layer ordering

cascivo ships one authoritative layer order, declared in
[`@cascivo/tokens/layers.css`](../packages/tokens/src/layers.css) and emitted
first by every entry path. Ordered lowest-priority → highest:

```
cascivo.reset < cascivo.base < cascivo.tokens < cascivo.component < cascivo.theme < cascivo.blocks < cascivo.override
```

- `cascivo.reset` — consumer reset (`box-sizing`, margin/padding zeroing).
- `cascivo.base` — the base reset (`font-family`, `line-height`, `color` on
  `html`), shipped by `@cascivo/themes`.
- `cascivo.tokens` — primitive design tokens (and `@function` helpers), shipped by
  `@cascivo/tokens`.
- `cascivo.component` — component + layout styles.
- `cascivo.theme` — semantic token values per `[data-theme]`. Ordered **above**
  `cascivo.component` so a theme always wins over component defaults.
- `cascivo.blocks` — shipped composite blocks (`packages/components/src/blocks/*`,
  copied by `cascivo add <block>`). Each block declares its own
  `@layer cascivo.blocks.<name> { … }` sublayer of this slot, ordered above
  `cascivo.theme` so a block can re-tune a component-tier token in its own subtree.
- `cascivo.override` — the consumer escape hatch (see below). Beats blocks too.

**Unlayered** author CSS beats **all** cascivo layers regardless of specificity,
so a consumer's plain (unlayered) stylesheet always wins. To override cascivo
from *within* a layer, use `cascivo.override`.

### `cascivo.override` — the escape hatch

`cascivo.override` is the highest cascivo layer. Put brand or one-off overrides
there and they beat tokens, components, **and** themes — with no
`:root:not([data-theme])` specificity fight (see [`THEMING.md`](./THEMING.md#the-specificity-footgun-read-this-before-writing-a-brand-theme)):

```css
@layer cascivo.override {
  :root {
    --cascivo-color-accent: oklch(0.7 0.17 155); /* wins everywhere, no data-theme needed */
  }
}
```

`cascivo.blocks.*` sublayers **are** shipped (by the composite blocks under
`packages/components/src/blocks/`) and live inside the canonical `cascivo.blocks`
slot. App-local sublayers (`cascivo.example`) are not shipped by any package; insert
them between `cascivo.blocks` and `cascivo.override`.

## The Problem

Components define all their padding, spacing, and sizing inside `@layer cascivo.component`. A global reset like `* { padding: 0; margin: 0 }` written **outside** any layer is **unlayered author CSS**, which beats ALL layered styles regardless of specificity or source order.

Result: every component's padding is zeroed out. Buttons render at 14px height with no padding.

## The Fix

Declare the layer order **before any CSS loads** and wrap the reset inside the lowest-priority layer.

```html
<!-- index.html -->
<style>
  @layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.example, cascivo.theme,
    cascivo.blocks, cascivo.override;
  @layer cascivo.reset {
    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
  }
  html,
  body,
  #root {
    height: 100%;
  }
</style>
```

The layer order declaration must appear in a `<style>` tag in `index.html` before any `<link>` or `<script>` tags that load CSS. If it lives inside a JS bundle it loads too late.

## Related Layout Pitfalls

### Container query self-reference

An element with `container-type: inline-size` cannot query **itself** via `@container` — the query looks at the nearest ancestor container. Use `@media` for rules that target the container element's own layout:

```css
/* WRONG — .homeLayout queries its ancestor, not itself */
.homeLayout {
  container-type: inline-size;
}
@container (min-width: 64rem) {
  .homeLayout {
    flex-direction: row;
  }
}

/* CORRECT */
@media (min-width: 64rem) {
  .homeLayout {
    flex-direction: row;
  }
}
```

### `flex: 1` in a block parent

`flex: 1` only works when the parent is a flex container. When AppShell's `<main>` is `display: block`, child elements must use `min-block-size: 100%` to fill the available height:

```css
/* WRONG — flex: 1 has no effect in block parent */
.layout {
  flex: 1;
}

/* CORRECT */
.layout {
  min-block-size: 100%;
}
```

### `align-items: flex-start` prevents equal-height columns

The default `align-items: stretch` makes flex children fill the cross-axis. Setting `align-items: flex-start` gives each column its natural height, making columns unequal. Remove it to get equal-height columns:

```css
/* WRONG — columns stop at content height */
@media (min-width: 64rem) {
  .layout {
    flex-direction: row;
    align-items: flex-start;
  }
}

/* CORRECT — default stretch applies, columns match tallest */
@media (min-width: 64rem) {
  .layout {
    flex-direction: row;
  }
}
```

### `display: contents` for theme wrapper

When a wrapper element is needed purely for `data-theme` but must not affect grid or flex layout, use `display: contents`. CSS custom properties still inherit through it:

```tsx
<div style={{ display: 'contents' }} data-theme={theme.value}>
  <AppShell>...</AppShell>
</div>
```
