# FlowControls

**Category:** display  
**Description:** Zoom in / out / fit-view controls for a flow canvas — real, i18n-labeled buttons.

## When to use

- Giving users explicit zoom/fit controls on a flow canvas

## When NOT to use

- When the canvas is static/non-interactive

## Related components

- **FlowCanvas** (pairs-with): Calls its viewport actions.
- **FlowMiniMap** (pairs-with): Complementary navigation chrome.

## Accessibility rationale

Real <button>s with i18n-defaulted aria-labels; ≥44px coarse targets.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | No | bottom-left | Position of the component. |
| `showZoom` | `boolean` | No | true | When true, shows the zoom-in/zoom-out buttons. |
| `showFitView` | `boolean` | No | true | When true, shows the fit-to-view button. |
| `onZoomIn` | `() => void` | No | — | Called when the zoom-in control is activated. |
| `onZoomOut` | `() => void` | No | — | Called when the zoom-out control is activated. |
| `onFitView` | `() => void` | No | — | Called when the fit-to-view control is activated. |
| `labels` | `FlowControlsLabels` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-target-min-coarse`

## Examples

### Canvas controls

```jsx
() => (
  <div style={{ position: 'relative', height: 200, border: '1px solid var(--cascivo-color-border)' }}>
    <FlowControls onZoomIn={() => {}} onZoomOut={() => {}} onFitView={() => {}} />
  </div>
)
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| position | flexible | Four corners. |
| buttons | flexible | Zoom / fit toggleable. |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo FlowControls component (display). Zoom in / out / fit-view controls for a flow canvas — real, i18n-labeled buttons.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

FlowControls is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-target-min-coarse

Accessibility: role "group", WCAG 2.1-AA, keyboard: Tab (focus)/Enter/Space (activate). Keep it AA.
Flexible: position, buttons.

Do not invent props, tokens, or global viewport media queries.
```
