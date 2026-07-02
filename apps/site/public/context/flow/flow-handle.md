# FlowHandle

**Category:** display  
**Description:** A connection port on a node edge — where edges attach and interactive connect starts.

## When to use

- Marking where edges connect to a node
- Enabling interactive connect (drag from a source to a target)

## When NOT to use

- On nodes that are never connected

## Related components

- **FlowNode** (contained-by): Ports live inside a node.
- **FlowEdge** (pairs-with): Edges anchor to handles.

## Accessibility rationale

Focusable with a ≥44px coarse-pointer hit area around the visible dot.

## Props

| Name            | Type      | Required  | Default  | Description                                              |
| --------------- | --------- | --------- | -------- | -------------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------------------------------------------- |
| `type`          | `'source' | 'target'` | Yes      | —                                                        | Whether the handle is a connection source or target ('source' | 'target'). |
| `position`      | `'top'    | 'right'   | 'bottom' | 'left'`                                                  | No                                                            | —          | Edge of the node (defaults: source→right, target→left). |
| `id`            | `string`  | No        | —        | Handle id for multi-handle nodes.                        |
| `isConnectable` | `boolean` | No        | true     | Whether new connections can start or end at this handle. |
| `className`     | `string`  | No        | —        | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-surface`
- `--cascivo-target-min-coarse`

## Examples

### Source and target ports

```jsx
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

## Boundaries

| Area     | Level    | Note |
| -------- | -------- | ---- | ----- | ------ | ----- |
| position | flexible | top  | right | bottom | left. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowHandle component (display). A connection port on a node edge — where edges attach and interactive connect starts.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowHandle is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-surface, --cascivo-target-min-coarse

Accessibility: role "button", WCAG 2.1-AA, keyboard: Tab (focus the port). Keep it AA.
Flexible: position.

Do not invent props, tokens, or global viewport media queries.
```
