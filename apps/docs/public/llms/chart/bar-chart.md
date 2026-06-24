# BarChart

Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { BarChart } from '@cascivo/charts'
```

## Category

`chart`

## Variants

- `grouped`
- `stacked`

## Props

| Prop            | Type                        | Required      | Default | Description                                                                                                                            |
| --------------- | --------------------------- | ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `series`        | `BarChartSeries<Datum>[]`   | yes           | —       | Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer. |
| `x`             | `(d: Datum) => string`      | yes           | —       | —                                                                                                                                      |
| `y`             | `(d: Datum) => number`      | yes           | —       | —                                                                                                                                      |
| `title`         | `string`                    | yes           | —       | —                                                                                                                                      |
| `description`   | `string`                    | no            | —       | —                                                                                                                                      |
| `orientation`   | `'vertical'                 | 'horizontal'` | no      | `vertical`                                                                                                                             | —   |
| `mode`          | `'grouped'                  | 'stacked'`    | no      | `grouped`                                                                                                                              | —   |
| `width`         | `number`                    | no            | —       | —                                                                                                                                      |
| `height`        | `number`                    | no            | `300`   | —                                                                                                                                      |
| `xTicks`        | `number`                    | no            | —       | —                                                                                                                                      |
| `yTicks`        | `number`                    | no            | `5`     | —                                                                                                                                      |
| `xLabelEvery`   | `number`                    | no            | —       | Show every Nth category label (always the last) to thin a crowded x-axis.                                                              |
| `legend`        | `boolean`                   | no            | —       | —                                                                                                                                      |
| `tooltip`       | `boolean`                   | no            | —       | —                                                                                                                                      |
| `tooltipFormat` | `(p: ChartPoint) => string` | no            | —       | Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.                                |
| `className`     | `string`                    | no            | —       | —                                                                                                                                      |
| `plain`         | `boolean`                   | no            | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                  |

## Examples

### Basic bar chart

```tsx
import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />
```

### Stacked bar from row-oriented data

```tsx
import { BarChart, toStackedSeries } from '@cascivo/charts'

// Pivot { label, segments[] } rows into series + x/y. Per-segment color is preserved.
const rows = [
  { label: 'Mon', segments: [
    { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done', value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 1, color: 'var(--cascivo-color-destructive)' },
  ] },
]
// Tooltip shows "Mon · 7" then each non-zero layer in its color.
<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />
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

## Dependencies

- `@cascivo/charts`

## Tags

chart, bar, data-viz
