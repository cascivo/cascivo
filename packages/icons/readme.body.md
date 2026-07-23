A set of **~440** React SVG icon components that inherit the cascivo token system — stroked 24×24 `currentColor` geometry, token-driven sizing, and tree-shakeable named exports.

Browse and search the full catalog — with click-to-copy imports and live size/color/theme previews — in the **[/icons gallery](https://cascivo.com/icons)**.

> **Docs offline?** The full cascivo reference ships as an npm package — `npx -y @cascivo/docs`, no website needed.

## Usage

```tsx
import { ChevronDown, Search, Check } from '@cascivo/icons'

export function Field() {
  return (
    <button>
      <Search />
      Search
    </button>
  )
}
```

Each icon is a plain `<svg>` that reads `1em` sizing and `currentColor`, so it scales with font size and adopts the surrounding text color automatically:

```css
button svg {
  inline-size: var(--cascivo-icon-size, 1.25em);
}
```

Import only the icons you use — named exports are individually tree-shakeable, so bundle cost scales with usage, not catalog size.

## Pure-CSS glyphs (experimental)

A small, opt-in set of UI glyphs rendered with **zero SVG** — a `background: currentColor` element clipped by `clip-path: shape()`. They inherit text color like the SVG icons, resize via one custom property, and can **morph between states with a CSS transition and no JavaScript**.

```tsx
import '@cascivo/icons/glyphs.css' // import once, anywhere in the app
import { Glyph } from '@cascivo/icons'

// static glyph
;<Glyph name="chevron-down" size={20} aria-label="Expand" />

// zero-JS morph: the shape animates when `open` flips
;<Glyph name="chevron-toggle" open={isOpen} />
```

Or use the class directly, without React:

```html
<span class="cascivo-glyph" data-glyph="check"></span>
```

Set size with `--cascivo-glyph-size` (default `1.5rem`); color follows `currentColor`.

v1 glyphs: `chevron-{down,up,left,right}`, `x`, `check`, `plus`, `minus`, `menu`, `arrow-{right,left,up,down}`, and the `chevron-toggle` morph. Geometry is authored in `packages/icons/src/glyphs/spec.ts` and expanded to outlines by `scripts/icons/generate-glyphs.mjs` (`pnpm glyphs:generate`).

**Support & caveats.** `clip-path: shape()` is [Baseline 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/basic-shape/shape) (Chrome/Edge 135+, Safari 18.4+, Firefox 148+); the stylesheet gates all painting behind `@supports`, so older browsers render nothing rather than a broken box — use the SVG icons where you need a wider floor. A `forced-colors` fallback keeps glyphs visible in Windows High Contrast. Because the paint is a background color, glyphs **do not print** by default (browsers strip backgrounds) — prefer the SVG icons in print-critical surfaces.

## Catalog & generation

The catalog combines the original hand-authored [Feather](https://github.com/feathericons/feather)-derived icons with the [chromicons](https://github.com/lifeomic/chromicons.com) set, both MIT-licensed (see [`NOTICE`](https://github.com/cascivo/cascivo/blob/main/NOTICE)). The chromicons are vendored as SVG source under `packages/icons/svg/` and transformed into `createIcon` exports by `scripts/icons/generate.mjs` (run via `pnpm icons:generate` / `pnpm regen`) — owned code, no runtime dependency. On a name collision the existing export always wins, so the surface is purely additive.

`icons.catalog.json` is the machine-readable manifest — one entry per icon (`name`, `pascalName`, `category`, `tags`, `keywords`, inner-SVG markup) — and feeds the docs gallery, the global search index, and `llms.txt`.
