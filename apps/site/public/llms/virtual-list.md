# VirtualList

Renders only the rows inside the viewport, so list length costs no extra DOM

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add virtual-list
```

Or use it from the prebuilt package without copying:

```tsx
import { VirtualList } from '@cascivo/react'
```

## Category

`display`

## States

- `default`

## Props

| Prop         | Type                                             | Required | Default | Description                                                                                                   |
| ------------ | ------------------------------------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `items`      | `Item[]`                                         | yes      | —       | The full collection; only the visible window is rendered                                                      |
| `itemHeight` | `number`                                         | yes      | —       | Fixed row height in px — every row must be this tall                                                          |
| `height`     | `number`                                         | yes      | —       | Height of the scrolling viewport, in px — not a CSS length, because the visible row count is computed from it |
| `renderItem` | `(item: Item, index: number) => React.ReactNode` | yes      | —       | Renders one row                                                                                               |
| `overscan`   | `number`                                         | no       | `3`     | Extra rows rendered above and below the visible window, to cover fast scrolling.                              |
| `ariaLabel`  | `string`                                         | no       | —       | Accessible label for the list; label it when the list stands alone                                            |
| `className`  | `string`                                         | no       | —       | Additional CSS class names merged onto the root element.                                                      |

## Examples

### Basic

Ten thousand rows cost the same DOM as ten.

```tsx
<VirtualList
  items={Array.from({ length: 10000 }, (_, i) => i)}
  itemHeight={40}
  height={320}
  ariaLabel="Results"
  renderItem={(n) => <span>Row {n + 1}</span>}
/>
```

### Smoother fast scrolling

A larger overscan trades DOM nodes for fewer blank frames when flinging.

```tsx
<VirtualList items={rows} itemHeight={40} height={320} overscan={10} renderItem={renderRow} />
```

## Client JavaScript

Required. Without client JavaScript this renders nothing useful, or a shell whose content is unreachable.

## Design tokens

- `--cascivo-color-accent`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `list`
- **Keyboard:** Tab, ArrowUp, ArrowDown, PageUp, PageDown, Home, End

## Dependencies

- `@cascivo/core`

## Tags

display, virtual, virtualization, list, performance, scroll

---

_Generated from registry v0.16.1 on 2026-08-09. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
