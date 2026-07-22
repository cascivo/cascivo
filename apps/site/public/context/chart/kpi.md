# Kpi

**Category:** chart  
**Description:** KPI card showing a primary metric with optional delta indicator, icon, and sparkline.

## When to use

- Highlighting a single headline metric with an optional change delta
- Building dashboard summary tiles with an embedded sparkline trend

## When NOT to use

- Showing a value against a target or range — use Bullet or Meter
- Comparing multiple values — use a chart

## Related components

- **Sparkline** (contains): Embeds a micro-trend alongside the metric value
- **Bullet** (alternative): Use when the metric must be shown against a target

## Accessibility rationale

Renders with role="figure" and a labeled metric for screen reader context.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string \| number` | Yes | — | Primary metric value |
| `label` | `string` | Yes | — | Metric label |
| `delta` | `number` | No | — | Change value (positive = up, negative = down) |
| `deltaLabel` | `string` | No | — | Delta context label (e.g. "vs last week") |
| `icon` | `ReactNode` | No | — | Icon element rendered in the component. |
| `sparkline` | `number[]` | No | — | Trend data for embedded sparkline |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-chart-1`

## Examples

### Basic KPI card

```jsx
import { Kpi } from '@cascivo/charts'

<Kpi value="$12,400" label="Monthly revenue" delta={8.2} deltaLabel="vs last month" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Kpi component (chart). KPI card showing a primary metric with optional delta indicator, icon, and sparkline.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Kpi is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1

Accessibility: role "figure", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
