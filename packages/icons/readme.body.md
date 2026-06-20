A curated set of React SVG icon components that inherit the cascivo token system — `currentColor` fills, token-driven sizing, and tree-shakeable named exports.

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
