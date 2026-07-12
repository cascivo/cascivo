# StatsCards

**Category:** display  
**Description:** Grid of KPI stat cards with trend badges.

## When to use

- A grid of KPI stat cards with trend badges
- Summarising headline metrics at the top of a dashboard

## When NOT to use

- A full charts dashboard — use DashboardCharts
- A single metric — use a Kpi card

## Related components

- **Kpi** (contains): Each card displays a KPI metric with a delta
- **DashboardLayout** (contained-by): Commonly fills the dashboard stats strip

## Accessibility rationale

Each stat card is a labeled figure for screen reader context.

## Props

| Name    | Type     | Required | Default | Description   |
| ------- | -------- | -------- | ------- | ------------- |
| `stats` | `Stat[]` | No       | —       | KPI stat data |

## Examples

### Default

Demo KPI stats

```jsx
<StatsCards />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo StatsCards component (display). Grid of KPI stat cards with trend badges.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

StatsCards is strictly bound to these tokens — use only these, do not invent token names:
  none declared

Accessibility: role "generic", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
