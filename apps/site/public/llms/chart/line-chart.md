# LineChart

Time-series or numeric line chart with multi-series support, hover tooltip, and legend.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { LineChart } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop            | Type                                                       | Required                                               | Default | Description                                                                                    |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- | ------- | ---------- | ------------- | --- | ---------- | ------------------------ |
| `series`        | `LineChartSeries<Datum>[]`                                 | yes                                                    | —       | Array of data series                                                                           |
| `x`             | `(d: Datum) => number                                      | Date`                                                  | yes     | —                                                                                              | X-value accessor                                                                   |
| `y`             | `(d: Datum) => number`                                     | yes                                                    | —       | Y-value accessor                                                                               |
| `title`         | `string`                                                   | yes                                                    | —       | Chart title (also used as aria-label)                                                          |
| `description`   | `string`                                                   | no                                                     | —       | Subtitle shown below title                                                                     |
| `curve`         | `'linear'                                                  | 'monotone'                                             | 'step'  | 'stepBefore'                                                                                   | 'stepAfter'                                                                        | 'natural' | 'basis' | 'cardinal' | 'catmullRom'` | no  | `monotone` | Line interpolation curve |
| `width`         | `number`                                                   | no                                                     | —       | Fixed SVG width (defaults to container width)                                                  |
| `height`        | `number`                                                   | no                                                     | `300`   | SVG height in px                                                                               |
| `xTicks`        | `number`                                                   | no                                                     | `5`     | Approximate number of X-axis ticks                                                             |
| `yTicks`        | `number`                                                   | no                                                     | `5`     | Approximate number of Y-axis ticks                                                             |
| `legend`        | `boolean`                                                  | no                                                     | —       | Show series legend                                                                             |
| `tooltip`       | `boolean`                                                  | no                                                     | —       | Enable hover tooltip                                                                           |
| `formatTooltip` | `(datum: Datum, series: LineChartSeries<Datum>) => string` | no                                                     | —       | Custom tooltip formatter                                                                       |
| `className`     | `string`                                                   | no                                                     | —       | —                                                                                              |
| `plain`         | `boolean`                                                  | no                                                     | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                          |
| `annotations`   | `Annotation[]`                                             | no                                                     | —       | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |
| `labels`        | `boolean                                                   | { format?: (v: number) => string; position?: string }` | no      | —                                                                                              | Print each value as a label on the mark (collision-aware, decorative/aria-hidden). |
| `connectNulls`  | `boolean`                                                  | no                                                     | `false` | Bridge non-finite y gaps instead of breaking the line at them.                                 |
| `onSelect`      | `(point: ChartPoint) => void`                              | no                                                     | —       | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                     |

## Examples

### Basic line chart

```tsx
import { LineChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

### With an SLO target line

```tsx
<LineChart
  series={series}
  x={(d) => d.x}
  y={(d) => d.y}
  title="Latency"
  annotations={[{ kind: 'line', axis: 'y', value: 200, label: 'SLO' }]}
/>
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, line, time-series, data-viz
