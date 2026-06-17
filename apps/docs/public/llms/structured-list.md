# StructuredList

Tabular row list for scannable data, optionally single-selectable

## Install

```bash
npx cascivo add structured-list
```

## Category

`display`

## Variants

- `static`
- `selectable`

## States

- `default`
- `selected`

## Props

| Prop           | Type                                                       | Required | Default | Description |
| -------------- | ---------------------------------------------------------- | -------- | ------- | ----------- |
| `items`        | `{ id: string; cells: ReactNode[]; selected?: boolean }[]` | yes      | —       | —           |
| `headers`      | `ReactNode[]`                                              | no       | —       | —           |
| `selectable`   | `boolean`                                                  | no       | `false` | —           |
| `value`        | `string`                                                   | no       | —       | —           |
| `defaultValue` | `string`                                                   | no       | —       | —           |
| `onSelect`     | `(id: string) => void`                                     | no       | —       | —           |

## Examples

### Static

```tsx
<StructuredList headers={['Name', 'Role']} items={[{ id: 'a', cells: ['Ada', 'Engineer'] }]} />
```

### Selectable

```tsx
<StructuredList
  selectable
  defaultValue="a"
  items={[
    { id: 'a', cells: ['Ada'] },
    { id: 'b', cells: ['Grace'] },
  ]}
  onSelect={(id) => set(id)}
/>
```

## Design tokens

- `--cascivo-color-border`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-text`
- `--cascivo-color-text-subtle`
- `--cascivo-color-primary`
- `--cascivo-color-surface`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `table`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space

## Dependencies

- `@cascivo/core`

## Tags

display, list, table, data
