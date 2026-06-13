# StatsBand

KPI strip — horizontal band of stats with optional delta and inline sparkline trend. Wraps via AutoGrid on narrow containers. No visible heading; provide aria-label for accessibility.

## Install

```bash
npx cascivo add section/stats-band
```

## Category

`layout`

## Props

| Prop         | Type         | Required | Default         | Description                                                                                            |
| ------------ | ------------ | -------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `stats`      | `StatItem[]` | yes      | —               | Array of stat items: label, value, optional delta (e.g. "+3.2%"), optional trend numbers for sparkline |
| `aria-label` | `string`     | no       | `"Key metrics"` | Accessible label for the stats region                                                                  |

## Examples

### KPI band with trends

Four KPI cells — three with sparkline trends and signed deltas

```tsx
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

## Design tokens

- `--cascivo-text-2xl`
- `--cascivo-text-sm`
- `--cascivo-font-bold`
- `--cascivo-font-mono`
- `--cascivo-text-secondary`
- `--cascivo-color-border`
- `--cascivo-surface-subtle`
- `--cascivo-space-*`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `region`

## Dependencies

- `@cascivo/core`
- `@cascivo/charts`

## Tags

section, stats, kpi, charts
