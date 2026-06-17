# AreaChart

Area chart with optional stacking, multi-series support, and hover tooltip.

## Install

```bash
npx cascivo add chart/area-chart
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
| `tooltip` | `boolean` | no | — | Enable hover/keyboard tooltip |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic area chart

```tsx
import { AreaChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
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

chart, area, data-viz
