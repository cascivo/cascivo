# ScatterChart

Scatter plot with variable point radius, multi-series, and hover tooltip.

## Install

```bash
npx cascade add chart/scatter-chart
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `ScatterChartSeries[]` | yes | — | — |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `r` | `number | ((d: ScatterDatum) => number)` | no | `4` | Point radius or accessor |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `300` | — |
| `xTicks` | `number` | no | `5` | — |
| `yTicks` | `number` | no | `5` | — |
| `legend` | `boolean` | no | — | — |
| `className` | `string` | no | — | — |

## Examples

### Basic scatter chart

```tsx
import { ScatterChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />
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

chart, scatter, plot, data-viz
