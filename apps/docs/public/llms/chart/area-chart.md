# AreaChart

Area chart with optional stacking, multi-series support, and hover tooltip.

## Install

```bash
npx cascade add chart/area-chart
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `AreaChartSeries<Datum>[]` | yes | — | Array of data series |
| `x` | `(d: Datum) => number` | yes | — | X-value accessor |
| `y` | `(d: Datum) => number` | yes | — | Y-value accessor |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `stacked` | `boolean` | no | — | Stack series areas |
| `curve` | `'linear' | 'monotone'` | no | `monotone` | — |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `300` | — |
| `xTicks` | `number` | no | `5` | — |
| `yTicks` | `number` | no | `5` | — |
| `legend` | `boolean` | no | — | — |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic area chart

```tsx
import { AreaChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

## Design tokens

- `--cascade-chart-1`
- `--cascade-chart-2`
- `--cascade-chart-3`
- `--cascade-chart-4`
- `--cascade-chart-5`
- `--cascade-chart-6`
- `--cascade-chart-7`
- `--cascade-chart-8`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, area, data-viz
