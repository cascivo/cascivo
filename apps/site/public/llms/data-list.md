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

| Prop          | Type                                                    | Required | Default      | Description                                           |
| ------------- | ------------------------------------------------------- | -------- | ------------ | ----------------------------------------------------- |
| `items`       | `{ id?: string; label: ReactNode; value: ReactNode }[]` | yes      | —            | The items to render.                                  |
| `orientation` | `'horizontal' \| 'vertical'`                            | no       | `horizontal` | Layout orientation of the component.                  |
| `dividers`    | `boolean`                                               | no       | `false`      | When true, shows dividers between items.              |
| `size`        | `'sm' \| 'md'`                                          | no       | `md`         | Visual size of the component (e.g. 'sm', 'md', 'lg'). |

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

### Vertical with dividers

```tsx
<DataList orientation="vertical" dividers items={[{ label: 'Email', value: 'ada@example.com' }]} />
```

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

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
