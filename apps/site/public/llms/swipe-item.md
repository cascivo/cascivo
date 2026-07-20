# SwipeItem

List row whose leading/trailing actions are revealed by a horizontal swipe, with keyboard parity

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add swipe-item
```

Or use it from the prebuilt package without copying:

```tsx
import { SwipeItem } from '@cascivo/react'
```

## Category

`display`

## States

- `closed`
- `leading`
- `trailing`

## Props

| Prop              | Type              | Required | Default | Description                                                                |
| ----------------- | ----------------- | -------- | ------- | -------------------------------------------------------------------------- |
| `children`        | `React.ReactNode` | yes      | —       | The row content                                                            |
| `leadingActions`  | `SwipeAction[]`   | no       | —       | Actions revealed by dragging toward the end edge (shown on the start edge) |
| `trailingActions` | `SwipeAction[]`   | no       | —       | Actions revealed by dragging toward the start edge (shown on the end edge) |
| `className`       | `string`          | no       | —       | Additional CSS class names merged onto the root element.                   |

## Examples

### Trailing actions

```tsx
<SwipeItem
  trailingActions={[
    { label: 'Archive', onSelect: archive },
    { label: 'Delete', onSelect: remove, destructive: true },
  ]}
>
  <MessageRow message={message} />
</SwipeItem>
```

### Leading and trailing

```tsx
<SwipeItem
  leadingActions={[{ label: 'Pin', icon: <PinIcon />, onSelect: pin }]}
  trailingActions={[{ label: 'Delete', onSelect: remove, destructive: true }]}
>
  <TaskRow task={task} />
</SwipeItem>
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-accent`
- `--cascivo-color-accent-content`
- `--cascivo-color-destructive`
- `--cascivo-color-text-on-destructive`
- `--cascivo-target-min-coarse`
- `--cascivo-motion-enter`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `group`
- **Keyboard:** Tab, Enter, Space, Escape

## Dependencies

- `@cascivo/core`

## Tags

display, swipe, list, mobile, gesture, actions

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
