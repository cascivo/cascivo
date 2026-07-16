# DashboardCharts

**Category:** display  
**Description:** Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.

## When to use

- A prebuilt dashboard with KPI tiles, line, bar, and pie charts
- Quickly demonstrating or scaffolding an analytics overview

## When NOT to use

- You only need the layout frame — use DashboardLayout
- A single metric display — use a Kpi card

## Related components

- **DashboardLayout** (contained-by): Composes the dashboard layout frame
- **StatsCards** (alternative): Use when you only need the KPI tile row

## Accessibility rationale

Charts within render with role="img" and titled labels for screen readers.

## Props

| Name        | Type     | Required | Default | Description                                                              |
| ----------- | -------- | -------- | ------- | ------------------------------------------------------------------------ |
| `className` | `string` | No       | —       | Additional CSS class names merged onto the root DashboardLayout element. |

## Examples

### Default

Charts dashboard demo

```jsx
<DashboardCharts />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DashboardCharts component (display). Dashboard layout with KPI tiles, line chart, bar chart, and pie chart.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DashboardCharts is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
