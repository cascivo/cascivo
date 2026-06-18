# CSS `@layer` Pitfall in Example Apps

> **Renamed from `cascade.*` in v37.** All shipped layers are now under the
> `cascivo.*` namespace (`cascivo.base`, `cascivo.theme`, `cascivo.component`, …).
> Any consumer that referenced the old `@layer cascade.*` names in their own
> `@layer` ordering **must update them to `cascivo.*`**. This was a deliberate
> breaking change (the brand is `cascivo`, not `cascade`) — see the package
> CHANGELOGs.

## Recommended layer ordering

cascivo ships three layers, ordered lowest-priority → highest:

```
cascivo.base   < cascivo.theme   < cascivo.component
```

- `cascivo.base` — the base reset (`font-family`, `line-height`, `color` on
  `html`/`body`), shipped by `@cascivo/themes`.
- `cascivo.theme` — semantic token values per `[data-theme]`.
- `cascivo.component` — component styles.

**Unlayered** author CSS beats **all** cascivo layers regardless of specificity,
so a consumer's plain (unlayered) stylesheet always wins. To override cascivo
from *within* a layer, declare a layer ordered after `cascivo.component`.

## The Problem

Components define all their padding, spacing, and sizing inside `@layer cascivo.component`. A global reset like `* { padding: 0; margin: 0 }` written **outside** any layer is **unlayered author CSS**, which beats ALL layered styles regardless of specificity or source order.

Result: every component's padding is zeroed out. Buttons render at 14px height with no padding.

## The Fix

Declare the layer order **before any CSS loads** and wrap the reset inside the lowest-priority layer.

```html
<!-- index.html -->
<style>
  @layer cascivo.reset, cascivo.tokens, cascivo.base, cascivo.component, cascivo.example, cascivo.theme;
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
