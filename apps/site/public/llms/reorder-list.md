# ReorderList

List whose rows can be reordered by pointer drag or entirely by keyboard

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add reorder-list
```

Or use it from the prebuilt package without copying:

```tsx
import { ReorderList } from '@cascivo/react'
```

## Category

`inputs`

## States

- `idle`
- `grabbed`
- `disabled`

## Props

| Prop            | Type                                                                                          | Required | Default | Description                                                        |
| --------------- | --------------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `value`         | `ReorderItem[]`                                                                               | yes      | —       | The ordered items; the component is controlled                     |
| `onValueChange` | `(value: ReorderItem[]) => void`                                                              | yes      | —       | Called with the new order whenever a row moves                     |
| `disabled`      | `boolean`                                                                                     | no       | `false` | When true, disables the control and removes it from the tab order. |
| `labels`        | `{ handle?: string; grabbed?: string; moved?: string; dropped?: string; cancelled?: string }` | no       | —       | Overrides for the component’s user-visible strings (i18n).         |
| `className`     | `string`                                                                                      | no       | —       | Additional CSS class names merged onto the root element.           |

## Object types

### `ReorderItem`

| Field   | Type              | Required | Description                                                      |
| ------- | ----------------- | -------- | ---------------------------------------------------------------- |
| `id`    | `string`          | yes      | Stable identity for the row                                      |
| `label` | `React.ReactNode` | yes      | Row content                                                      |
| `name`  | `string`          | no       | Plain-text name used in announcements when label is not a string |

## Examples

### Basic

Controlled — the caller owns the order.

```tsx
<ReorderList value={items} onValueChange={setItems} />
```

### Locked

Handles are disabled and drop out of the tab order.

```tsx
<ReorderList value={items} onValueChange={setItems} disabled />
```

## Client JavaScript

Required. Without client JavaScript this renders nothing useful, or a shell whose content is unreachable.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-surface-2`
- `--cascivo-color-foreground`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-border-subtle`
- `--cascivo-radius-sm`
- `--cascivo-ring-width`
- `--cascivo-ring-color`
- `--cascivo-disabled-opacity`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Space, Enter, ArrowUp, ArrowDown, Escape, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

inputs, reorder, sortable, drag, list, mobile, keyboard

---

_Generated from registry v0.17.0 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
