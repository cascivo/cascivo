# Link

Styled anchor for navigation, standalone or inline within prose

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add link
```

Or use it from the prebuilt package without copying:

```tsx
import { Link } from '@cascivo/react'
```

## Category

`navigation`

## Variants

- `standalone`
- `inline`

## Sizes

- `sm`
- `md`
- `lg`

## Props

| Prop       | Type                       | Required | Default      | Description                                                                  |
| ---------- | -------------------------- | -------- | ------------ | ---------------------------------------------------------------------------- |
| `variant`  | `'standalone' \| 'inline'` | no       | `standalone` | Selects the visual style variant.                                            |
| `size`     | `'sm' \| 'md' \| 'lg'`     | no       | `md`         | Visual size of the component (e.g. 'sm', 'md', 'lg').                        |
| `external` | `boolean`                  | no       | `false`      | When true, treats the link as external (opens in a new tab with rel safety). |
| `href`     | `string`                   | no       | —            | The destination URL.                                                         |

## Examples

### Standalone

```tsx
<Link href="/docs">View documentation</Link>
```

### Inline

Inline links inherit the surrounding font size and stay underlined.

```tsx
<p>
  Read the{' '}
  <Link variant="inline" href="/guide">
    guide
  </Link>{' '}
  first.
</p>
```

### External

Opens in a new tab with rel="noreferrer" and a visual indicator.

```tsx
<Link external href="https://example.com">
  Example
</Link>
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-accent-hover`
- `--cascivo-color-accent-active`
- `--cascivo-radius-sm`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `link`
- **Keyboard:** Enter

## Dependencies

- `@cascivo/core`

## Tags

link, anchor, navigation

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
