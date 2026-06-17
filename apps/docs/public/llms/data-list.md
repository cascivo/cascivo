# DataList

Key-value pairs rendered as a description list

## Install

```bash
npx cascivo add data-list
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
| `items` | `{ id?: string; label: ReactNode; value: ReactNode }[]` | yes | — | — |
| `orientation` | `'horizontal' | 'vertical'` | no | `horizontal` | — |
| `dividers` | `boolean` | no | `false` | — |
| `size` | `'sm' | 'md'` | no | `md` | — |

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
<DataList
  orientation="vertical"
  dividers
  items={[{ label: 'Email', value: 'ada@example.com' }]}
/>
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
