# StatsBand

**Category:** layout  
**Description:** KPI strip — horizontal band of stats with optional delta and inline sparkline trend. Wraps via AutoGrid on narrow containers. No visible heading; provide aria-label for accessibility.

## When to use

- A horizontal KPI strip with optional deltas and inline sparkline trends
- A marketing or dashboard band summarising headline numbers

## When NOT to use

- A grid of full stat cards — use StatsCards
- A single metric — use a Kpi card

## Related components

- **StatsCards** (alternative): Use the card grid block for richer per-stat framing
- **Sparkline** (contains): Embeds inline sparkline trends per stat

## Accessibility rationale

Has no visible heading; consumers must supply an aria-label for the band.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `stats` | `StatItem[]` | Yes | — | Array of stat items: label, value, optional delta (e.g. "+3.2%"), optional trend numbers for sparkline |
| `aria-label` | `string` | No | "Key metrics" | Accessible label for the stats region |

## Tokens

- `--cascivo-text-2xl`
- `--cascivo-text-sm`
- `--cascivo-font-bold`
- `--cascivo-font-mono`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-surface-subtle`
- `--cascivo-space-*`

## Examples

### KPI band with trends

Four KPI cells — three with sparkline trends and signed deltas

```jsx
<StatsBand
  aria-label="Performance metrics"
  stats={[
    { label: 'p99 latency', value: '184 ms', delta: '-12 ms', trend: [210, 205, 198, 192, 184] },
    { label: 'Error rate', value: '0.12%', delta: '-0.03%', trend: [0.18, 0.16, 0.15, 0.14, 0.12] },
    { label: 'Uptime', value: '99.98%', trend: [99.95, 99.97, 99.98, 99.99, 99.98] },
    { label: 'Deploys today', value: '7' },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo StatsBand component (layout). KPI strip — horizontal band of stats with optional delta and inline sparkline trend. Wraps via AutoGrid on narrow containers. No visible heading; provide aria-label for accessibility.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

StatsBand is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-text-2xl, --cascivo-text-sm, --cascivo-font-bold, --cascivo-font-mono, --cascivo-text-secondary, --cascivo-color-border, --cascivo-surface-subtle, --cascivo-space-*

Accessibility: role "region", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
