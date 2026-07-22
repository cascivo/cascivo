# OverflowMenu

Kebab icon button revealing a menu of row-level actions

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add overflow-menu
```

Or use it from the prebuilt package without copying:

```tsx
import { OverflowMenu } from '@cascivo/react'
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

| Prop        | Type                                                                                              | Required | Default        | Description                                                        |
| ----------- | ------------------------------------------------------------------------------------------------- | -------- | -------------- | ------------------------------------------------------------------ |
| `items`     | `{ label: string; value: string; icon?: ReactNode; disabled?: boolean; destructive?: boolean }[]` | yes      | —              | The items to render.                                               |
| `onSelect`  | `(value: string) => void`                                                                         | no       | —              | Called with the selected value.                                    |
| `placement` | `'bottom-start' \| 'bottom-end'`                                                                  | no       | `bottom-end`   | Placement relative to the trigger.                                 |
| `ariaLabel` | `string`                                                                                          | no       | `More actions` | Accessible label for the component.                                |
| `size`      | `'sm' \| 'md'`                                                                                    | no       | `md`           | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `disabled`  | `boolean`                                                                                         | no       | `false`        | When true, disables the control and removes it from the tab order. |
| `className` | `string`                                                                                          | no       | —              | Additional CSS class names merged onto the root element.           |

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

- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-destructive`
- `--cascivo-color-destructive-subtle`
- `--cascivo-radius-button`
- `--cascivo-focus-ring`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `menu`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, Enter, Space, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

overlay, menu, actions, kebab, table

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
