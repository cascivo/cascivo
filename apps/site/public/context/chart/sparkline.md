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
| `label` | `string` | Yes | — | Accessible label |
| `width` | `number` | No | 80 | Width of the component. |
| `height` | `number` | No | 32 | Height of the component. |
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
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sparkline is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
