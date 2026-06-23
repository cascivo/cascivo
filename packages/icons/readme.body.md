A set of **~440** React SVG icon components that inherit the cascivo token system — stroked 24×24 `currentColor` geometry, token-driven sizing, and tree-shakeable named exports.

Browse and search the full catalog — with click-to-copy imports and live size/color/theme previews — in the **[/icons gallery](https://docs.cascivo.com/icons)**.

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

## Catalog & generation

The catalog combines the original hand-authored [Feather](https://github.com/feathericons/feather)-derived icons with the [chromicons](https://github.com/lifeomic/chromicons.com) set, both MIT-licensed (see [`NOTICE`](https://github.com/cascivo/cascivo/blob/main/NOTICE)). The chromicons are vendored as SVG source under `packages/icons/svg/` and transformed into `createIcon` exports by `scripts/icons/generate.mjs` (run via `pnpm icons:generate` / `pnpm regen`) — owned code, no runtime dependency. On a name collision the existing export always wins, so the surface is purely additive.

`icons.catalog.json` is the machine-readable manifest — one entry per icon (`name`, `pascalName`, `category`, `tags`, `keywords`, inner-SVG markup) — and feeds the docs gallery, the global search index, and `llms.txt`.
