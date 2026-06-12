# OverflowMenu

Kebab icon button revealing a menu of row-level actions

## Install

```bash
npx cascade add overflow-menu
```

## Category

`overlay`

## Sizes

- `sm`
- `md`

## States

- `closed`
- `open`

## Props

| Prop        | Type                                                                                              | Required      | Default        | Description  |
| ----------- | ------------------------------------------------------------------------------------------------- | ------------- | -------------- | ------------ | --- |
| `items`     | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; destructive?: boolean }[]` | yes           | —              | —            |
| `onSelect`  | `(value: string) => void`                                                                         | no            | —              | —            |
| `placement` | `'bottom-start'                                                                                   | 'bottom-end'` | no             | `bottom-end` | —   |
| `ariaLabel` | `string`                                                                                          | no            | `More actions` | —            |
| `size`      | `'sm'                                                                                             | 'md'`         | no             | `md`         | —   |
| `disabled`  | `boolean`                                                                                         | no            | `false`        | —            |
| `className` | `string`                                                                                          | no            | —              | —            |

## Examples

### Row actions

```tsx
<OverflowMenu
  items={[
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete', destructive: true },
  ]}
  onSelect={handle}
/>
```

### Small, start-aligned

```tsx
<OverflowMenu size="sm" placement="bottom-start" items={items} />
```

## Design tokens

- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-bg-subtle`
- `--cascade-color-destructive`
- `--cascade-color-destructive-subtle`
- `--cascade-radius-button`
- `--cascade-focus-ring`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space, Escape

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

overlay, menu, actions, kebab, table
