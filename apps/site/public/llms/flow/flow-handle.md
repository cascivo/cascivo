# FlowHandle

A connection port on a node edge — where edges attach and interactive connect starts.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add flow/flow-handle
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Variants

- `source`
- `target`

## States

- `default`
- `hover`
- `focus`

## Props

| Prop            | Type      | Required  | Default  | Description                                              |
| --------------- | --------- | --------- | -------- | -------------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| `type`          | `'source' | 'target'` | yes      | —                                                        | Whether the handle is a connection source or target ('source' | 'target'). |
| `position`      | `'top'    | 'right'   | 'bottom' | 'left'`                                                  | no                                                            | —          | Edge of the node (defaults: source→right, target→left). |
| `id`            | `string`  | no        | —        | Handle id for multi-handle nodes.                        |
| `isConnectable` | `boolean` | no        | `true`   | Whether new connections can start or end at this handle. |
| `className`     | `string`  | no        | —        | Additional CSS class names merged onto the root element. |

## Examples

### Source and target ports

```tsx
;() => (
  <div style={{ position: 'relative', height: 160 }}>
    <FlowNode id="api" defaultPosition={{ x: 70, y: 55 }}>
      API
      <FlowHandle type="target" position="left" />
      <FlowHandle type="source" position="right" />
    </FlowNode>
  </div>
)
```

## Design tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `button`
- **Keyboard:** Tab (focus the port)

## Dependencies

- `@cascivo/core`

## Tags

flow, handle, port, connect
