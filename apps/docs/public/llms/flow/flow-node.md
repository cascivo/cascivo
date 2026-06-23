# FlowNode

An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-node
```

_Copy-paste only — this block/layout is not published as an importable package._

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
| `selected`         | `boolean`                        | no       | `false` | —                                                                           |
| `draggable`        | `boolean`                        | no       | `true`  | —                                                                           |
| `interactive`      | `boolean`                        | no       | `true`  | When false, the node is view-only: not draggable, selectable, or focusable. |
| `onSelect`         | `(id: string) => void`           | no       | —       | —                                                                           |
| `children`         | `ReactNode`                      | no       | —       | Any cascivo content.                                                        |
| `className`        | `string`                         | no       | —       | —                                                                           |

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
