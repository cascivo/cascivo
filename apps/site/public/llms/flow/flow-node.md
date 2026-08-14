# FlowNode

An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.

## Install

Ships in the `@cascivo/flow` package — install it (no copy-paste):

```sh
pnpm add @cascivo/flow
```

```tsx
import { FlowNode } from '@cascivo/flow'
import '@cascivo/flow/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds
```

## Category

`display`

## States

- `default`
- `dragging`
- `selected`
- `focus`

## Props

| Prop               | Type                             | Required | Default | Description                                                                                                                              |
| ------------------ | -------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                         | yes      | —       | Stable node id.                                                                                                                          |
| `position`         | `{ x: number; y: number }`       | no       | —       | Position in flow coords (controllable).                                                                                                  |
| `defaultPosition`  | `XYPosition`                     | no       | —       | Initial position for an uncontrolled node — the node then owns its own position as it is dragged. Pass `position` instead to control it. |
| `onPositionChange` | `(position: XYPosition) => void` | no       | —       | Fired while dragging.                                                                                                                    |
| `zoom`             | `number`                         | no       | `1`     | Current zoom (drag deltas are divided by it).                                                                                            |
| `selected`         | `boolean`                        | no       | `false` | Whether the node is rendered as selected.                                                                                                |
| `draggable`        | `boolean`                        | no       | `true`  | Whether the node can be dragged.                                                                                                         |
| `interactive`      | `boolean`                        | no       | `true`  | When false, the node is view-only: not draggable, selectable, or focusable.                                                              |
| `onSelect`         | `(id: string) => void`           | no       | —       | Called with the selected value.                                                                                                          |
| `children`         | `ReactNode`                      | no       | —       | Any cascivo content.                                                                                                                     |
| `className`        | `string`                         | no       | —       | Additional CSS class names merged onto the root element.                                                                                 |
| `onMeasure`        | `(size: NodeSize) => void`       | no       | —       | Reports the rendered box size so edges can anchor to the real node bounds.                                                               |

## Object types

### `XYPosition`

Shared geometry + graph types for the flow engine.

| Field | Type     | Required | Description |
| ----- | -------- | -------- | ----------- |
| `x`   | `number` | yes      | —           |
| `y`   | `number` | yes      | —           |

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

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
