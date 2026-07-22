# FlowNode

An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowNode } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // required stylesheet
```

## Category

`display`

## States

- `default`
- `dragging`
- `selected`
- `focus`

## Props

| Prop               | Type                             | Required | Default | Description                                                                 |
| ------------------ | -------------------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `id`               | `string`                         | yes      | —       | Stable node id.                                                             |
| `position`         | `{ x: number; y: number }`       | no       | —       | Position in flow coords (controllable).                                     |
| `onPositionChange` | `(position: XYPosition) => void` | no       | —       | Fired while dragging.                                                       |
| `zoom`             | `number`                         | no       | `1`     | Current zoom (drag deltas are divided by it).                               |
| `selected`         | `boolean`                        | no       | `false` | Whether the node is rendered as selected.                                   |
| `draggable`        | `boolean`                        | no       | `true`  | Whether the node can be dragged.                                            |
| `interactive`      | `boolean`                        | no       | `true`  | When false, the node is view-only: not draggable, selectable, or focusable. |
| `onSelect`         | `(id: string) => void`           | no       | —       | Called with the selected value.                                             |
| `children`         | `ReactNode`                      | no       | —       | Any cascivo content.                                                        |
| `className`        | `string`                         | no       | —       | Additional CSS class names merged onto the root element.                    |

## Examples

### A draggable node

```tsx
;() => (
  <div style={{ position: 'relative', height: 160 }}>
    <FlowNode id="a" defaultPosition={{ x: 40, y: 50 }}>
      Service A
    </FlowNode>
  </div>
)
```

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-radius-md`
- `--cascivo-shadow-sm`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `group`
- **Keyboard:** Tab (focus), Enter/Space (select)

## Dependencies

- `@cascivo/core`

## Tags

flow, node, draggable, graph

---

_Generated from registry v0.10.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
