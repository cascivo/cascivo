# FlowNode

**Category:** display  
**Description:** An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.

## When to use

- Representing a unit in a graph that holds arbitrary themed content
- When you hand-compose a flow and need draggable, selectable boxes

## When NOT to use

- For the common case — the declarative <Flow> renders nodes for you

## Anti-patterns

### HTML nodes inherit the data-theme scope and can contain any cascivo component.

**Bad:** `Rendering node content into an SVG`  
**Good:** `HTML node boxes`  
**Why:** HTML nodes inherit the data-theme scope and can contain any cascivo component.

## Related components

- **FlowHandle** (contains): Connection ports live inside a node.
- **FlowEdge** (pairs-with): Edges route between nodes.

## Accessibility rationale

Focusable group; Enter/Space select. Visual states (hover/focus/selected) are CSS.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | — | Stable node id. |
| `position` | `{ x: number; y: number }` | No | — | Position in flow coords (controllable). |
| `onPositionChange` | `(position: XYPosition) => void` | No | — | Fired while dragging. |
| `zoom` | `number` | No | 1 | Current zoom (drag deltas are divided by it). |
| `selected` | `boolean` | No | false | Whether the node is rendered as selected. |
| `draggable` | `boolean` | No | true | Whether the node can be dragged. |
| `interactive` | `boolean` | No | true | When false, the node is view-only: not draggable, selectable, or focusable. |
| `onSelect` | `(id: string) => void` | No | — | Called with the selected value. |
| `children` | `ReactNode` | No | — | Any cascivo content. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-radius-md`
- `--cascivo-shadow-sm`

## Examples

### A draggable node

```jsx
() => (
  <div style={{ position: 'relative', height: 160 }}>
    <FlowNode id="a" defaultPosition={{ x: 40, y: 50 }}>Service A</FlowNode>
  </div>
)
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| content | flexible | Renders any children. |
| position | flexible | Controllable; draggable toggleable. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowNode component (display). An HTML node box positioned in the viewport pane — draggable, selectable, with arbitrary children.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowNode is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-radius-md, --cascivo-shadow-sm

Accessibility: role "group", WCAG 2.1-AA, keyboard: Tab (focus)/Enter/Space (select). Keep it AA.
Flexible: content, position.

Do not invent props, tokens, or global viewport media queries.
```
