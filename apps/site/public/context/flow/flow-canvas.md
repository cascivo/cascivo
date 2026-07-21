# FlowCanvas

**Category:** display  
**Description:** The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

## When to use

- Hosting a hand-composed flow from low-level FlowNode/FlowEdge primitives
- When you need direct control of the viewport, pan, and zoom

## When NOT to use

- For the common case — prefer the declarative <Flow nodes edges /> instead

## Related components

- **Flow** (alternative): The declarative data-driven wrapper.
- **FlowBackground** (contains): A common child.

## Accessibility rationale

role="application" — the pane is an interactive canvas with pointer gestures.

## Props

| Name               | Type                                     | Required | Default | Description                                              |
| ------------------ | ---------------------------------------- | -------- | ------- | -------------------------------------------------------- |
| `children`         | `ReactNode`                              | No       | —       | Background, nodes, edges.                                |
| `viewport`         | `{ x: number; y: number; zoom: number }` | No       | —       | Controlled viewport.                                     |
| `onViewportChange` | `(viewport: Viewport) => void`           | No       | —       | Viewport change callback.                                |
| `minZoom`          | `number`                                 | No       | 0.2     | Lower bound for the viewport zoom level.                 |
| `maxZoom`          | `number`                                 | No       | 2       | Upper bound for the viewport zoom level.                 |
| `panOnDrag`        | `boolean`                                | No       | true    | Drag the empty pane to pan the viewport.                 |
| `zoomOnScroll`     | `boolean`                                | No       | true    | Wheel or pinch to zoom the viewport.                     |
| `fitView`          | `boolean`                                | No       | false   | Frame the whole graph once on mount.                     |
| `className`        | `string`                                 | No       | —       | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-bg`
- `--cascivo-radius-surface`

## Examples

### Empty canvas with a background

```jsx
;() => (
  <FlowCanvas style={{ height: 240 }}>
    <FlowBackground />
  </FlowCanvas>
)
```

## Boundaries

| Area     | Level    | Note                               |
| -------- | -------- | ---------------------------------- |
| viewport | flexible | Controllable; pan/zoom toggleable. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowCanvas component (display). The pan/zoom canvas pane — a single CSS-transformed layer driven by the viewport signal.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowCanvas is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-bg, --cascivo-radius-surface

Accessibility: role "application", WCAG 2.1-AA, keyboard: Tab (focus)/Drag (pan)/Wheel (zoom). Keep it AA.
Flexible: viewport.

Do not invent props, tokens, or global viewport media queries.
```
