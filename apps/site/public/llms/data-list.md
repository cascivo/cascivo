# DataList

Key-value pairs rendered as a description list

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add data-list
```

Or use it from the prebuilt package without copying:

```tsx
import { DataList } from '@cascivo/react'
```

## Category

`display`

## Variants

- `horizontal`
- `vertical`

## Sizes

- `sm`
- `md`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `items` | `{ id?: string; label: ReactNode; value: ReactNode }[]` | yes | — | The items to render. |
| `orientation` | `'horizontal' \| 'vertical'` | no | `horizontal` | Where each value sits relative to its own label: 'horizontal' beside it, 'vertical' underneath. Items are stacked vertically in both modes — this does not change the list's own axis. |
| `dividers` | `boolean` | no | `false` | When true, shows dividers between items. |
| `size` | `'sm' \| 'md'` | no | `md` | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

## Examples

### Horizontal data list

```tsx
<DataList
  items={[
    { label: 'Name', value: 'Ada Lovelace' },
    { label: 'Role', value: 'Mathematician' },
  ]}
/>
```

### Vertical — value under its label, not "items stacked vertically"

Both modes stack the items vertically. `orientation` moves the VALUE: beside its label (horizontal) or under it (vertical).

```tsx
<DataList
  orientation="vertical"
  items={[
    { label: 'Region', value: 'fra1' },
    { label: 'Branch', value: 'main' },
  ]}
/>
```

### Vertical with dividers

```tsx
<DataList
  orientation="vertical"
  dividers
  items={[{ label: 'Email', value: 'ada@example.com' }]}
/>
```

## Client JavaScript

None. Renders complete and correct with JavaScript disabled, and can be rendered directly from a React Server Component without hydrating.

## Design tokens

- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-border`
- `--cascivo-space-3`
- `--cascivo-space-4`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `none`

## Dependencies

- `@cascivo/core`

## Tags

key-value, description, metadata, details

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
