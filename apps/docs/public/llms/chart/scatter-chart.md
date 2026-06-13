# ScatterChart

Scatter plot with variable point radius, multi-series, and hover tooltip.

## Install

```bash
npx cascade add chart/scatter-chart
```

## Category

`chart`

## Props

| Prop          | Type                   | Required                       | Default | Description                                                           |
| ------------- | ---------------------- | ------------------------------ | ------- | --------------------------------------------------------------------- | ------------------------ |
| `series`      | `ScatterChartSeries[]` | yes                            | —       | —                                                                     |
| `title`       | `string`               | yes                            | —       | —                                                                     |
| `description` | `string`               | no                             | —       | —                                                                     |
| `r`           | `number                | ((d: ScatterDatum) => number)` | no      | `4`                                                                   | Point radius or accessor |
| `width`       | `number`               | no                             | —       | —                                                                     |
| `height`      | `number`               | no                             | `300`   | —                                                                     |
| `xTicks`      | `number`               | no                             | `5`     | —                                                                     |
| `yTicks`      | `number`               | no                             | `5`     | —                                                                     |
| `legend`      | `boolean`              | no                             | —       | —                                                                     |
| `tooltip`     | `boolean`              | no                             | —       | Enable hover/keyboard tooltip                                         |
| `className`   | `string`               | no                             | —       | —                                                                     |
| `plain`       | `boolean`              | no                             | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic scatter chart

```tsx
import { ScatterChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />
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

chart, scatter, plot, data-viz
