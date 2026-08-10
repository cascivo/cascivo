# Sparkline

**Category:** chart  
**Description:** Compact inline sparkline for embedding trend data in dashboards or KPI cards.

## When to use

- Embedding a compact micro-trend inline in text, tables, or KPI cards
- Conveying direction at a glance where a full chart would be too large

## When NOT to use

- Reading precise values or axes are needed — use LineChart
- As a standalone primary chart with its own panel

## Related components

- **LineChart** (alternative): Use as a full chart when axes and tooltips are needed
- **Kpi** (contained-by): Commonly embedded inside a KPI card as a trend indicator

## Accessibility rationale

Renders with role="img" and requires a label prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `number[]` | Yes | — | Array of numeric values |
| `label` | `string` | No | — | Accessible name for the chart (invisible — rendered as the SVG `<title>`). |
| `ariaLabel` | `string` | No | — | Alias for `label` (the catalog convention for an invisible accessible name). Both work; pass exactly one. |
| `width` | `number` | No | 80 | SVG width in px. **This chart is fixed-width by default** — it is a compact, inline chart meant to sit in a table cell or beside a label, so omitting `width` gives you 120px rather than a container-filling chart. Pass a number to change it. The catalogue-wide "omit for a responsive chart" note does not apply to this chart. |
| `height` | `number` | No | 32 | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect. |
| `color` | `string` | No | — | Stroke color (CSS value) |
| `endDot` | `boolean` | No | — | Show dot at last data point |

## Tokens

- `--cascivo-chart-1`

## Examples

### Inline sparkline

```jsx
import { Sparkline } from '@cascivo/charts'

<Sparkline data={[10, 20, 15, 30, 25]} label="Trend" endDot />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Sparkline component (chart). Compact inline sparkline for embedding trend data in dashboards or KPI cards.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sparkline is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
