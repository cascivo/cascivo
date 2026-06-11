# LineChart

Time-series or numeric line chart with multi-series support, hover tooltip, and legend.

## Install

```bash
npx cascade add chart/line-chart
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `LineChartSeries<Datum>[]` | yes | — | Array of data series |
| `x` | `(d: Datum) => number | Date` | yes | — | X-value accessor |
| `y` | `(d: Datum) => number` | yes | — | Y-value accessor |
| `title` | `string` | yes | — | Chart title (also used as aria-label) |
| `description` | `string` | no | — | Subtitle shown below title |
| `curve` | `'linear' | 'monotone'` | no | `monotone` | Line interpolation curve |
| `width` | `number` | no | — | Fixed SVG width (defaults to container width) |
| `height` | `number` | no | `300` | SVG height in px |
| `xTicks` | `number` | no | `5` | Approximate number of X-axis ticks |
| `yTicks` | `number` | no | `5` | Approximate number of Y-axis ticks |
| `legend` | `boolean` | no | — | Show series legend |
| `tooltip` | `boolean` | no | — | Enable hover tooltip |
| `formatTooltip` | `(datum: Datum, series: LineChartSeries<Datum>) => string` | no | — | Custom tooltip formatter |
| `className` | `string` | no | — | — |

## Examples

### Basic line chart

```tsx
import { LineChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
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

chart, line, time-series, data-viz
