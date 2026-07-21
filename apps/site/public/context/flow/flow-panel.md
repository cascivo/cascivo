# FlowPanel

**Category:** display  
**Description:** An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).

## When to use

- Overlaying custom UI (a legend, a toolbar) on a flow canvas

## When NOT to use

- For zoom/fit controls — use FlowControls

## Related components

- **FlowControls** (alternative): Purpose-built zoom/fit chrome.

## Accessibility rationale

A plain positioned container; semantics come from its children.

## Props

| Name        | Type                                                                                              | Required | Default   | Description                                              |
| ----------- | ------------------------------------------------------------------------------------------------- | -------- | --------- | -------------------------------------------------------- |
| `position`  | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | No       | top-right | Position of the component.                               |
| `children`  | `ReactNode`                                                                                       | No       | —         | Content rendered inside the component.                   |
| `className` | `string`                                                                                          | No       | —         | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-space-3`

## Examples

### A legend panel

```jsx
;() => (
  <div
    style={{ position: 'relative', height: 160, border: '1px solid var(--cascivo-color-border)' }}
  >
    <FlowPanel position="top-right">Legend</FlowPanel>
  </div>
)
```

## Boundaries

| Area     | Level    | Note                  |
| -------- | -------- | --------------------- |
| position | flexible | Six anchor positions. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowPanel component (display). An absolutely-positioned slot for custom flow-canvas UI (legend, toolbar).

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowPanel is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-space-3

Accessibility: role "group", WCAG 2.1-AA. Keep it AA.
Flexible: position.

Do not invent props, tokens, or global viewport media queries.
```
