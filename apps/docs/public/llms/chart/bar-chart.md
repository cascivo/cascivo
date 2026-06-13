# BarChart

Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

## Install

```bash
npx cascade add chart/bar-chart
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
import { BarChart } from '@cascade-ui/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />
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

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, bar, data-viz
