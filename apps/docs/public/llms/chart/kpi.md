# Kpi

KPI card showing a primary metric with optional delta indicator, icon, and sparkline.

## Install

```bash
npx cascade add chart/kpi
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string | number` | yes | — | Primary metric value |
| `label` | `string` | yes | — | Metric label |
| `delta` | `number` | no | — | Change value (positive = up, negative = down) |
| `deltaLabel` | `string` | no | — | Delta context label (e.g. "vs last week") |
| `icon` | `ReactNode` | no | — | — |
| `sparkline` | `number[]` | no | — | Trend data for embedded sparkline |
| `className` | `string` | no | — | — |

## Examples

### Basic KPI card

```tsx
import { Kpi } from '@cascade-ui/charts'

<Kpi value="$12,400" label="Monthly revenue" delta={8.2} deltaLabel="vs last month" />
```

## Design tokens

- `--cascade-chart-1`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `figure`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, kpi, metric, dashboard, data-viz
