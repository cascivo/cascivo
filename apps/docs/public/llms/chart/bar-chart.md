# BarChart

Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

## Install

```bash
npx cascivo add chart/bar-chart
```

## Category

`chart`

## Variants

- `grouped`
- `stacked`

## Props

| Prop          | Type                      | Required      | Default | Description                                                           |
| ------------- | ------------------------- | ------------- | ------- | --------------------------------------------------------------------- | --- |
| `series`      | `BarChartSeries<Datum>[]` | yes           | —       | —                                                                     |
| `x`           | `(d: Datum) => string`    | yes           | —       | —                                                                     |
| `y`           | `(d: Datum) => number`    | yes           | —       | —                                                                     |
| `title`       | `string`                  | yes           | —       | —                                                                     |
| `description` | `string`                  | no            | —       | —                                                                     |
| `orientation` | `'vertical'               | 'horizontal'` | no      | `vertical`                                                            | —   |
| `mode`        | `'grouped'                | 'stacked'`    | no      | `grouped`                                                             | —   |
| `width`       | `number`                  | no            | —       | —                                                                     |
| `height`      | `number`                  | no            | `300`   | —                                                                     |
| `xTicks`      | `number`                  | no            | —       | —                                                                     |
| `yTicks`      | `number`                  | no            | `5`     | —                                                                     |
| `legend`      | `boolean`                 | no            | —       | —                                                                     |
| `className`   | `string`                  | no            | —       | —                                                                     |
| `plain`       | `boolean`                 | no            | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic bar chart

```tsx
import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />
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
