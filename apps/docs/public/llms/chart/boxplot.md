# Boxplot

Box-and-whisker plot with five-number summary and outlier dots per series.

## Install

```bash
npx cascade add chart/boxplot
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `{ id: string; label: string; values: number[] }[]` | yes | — | Array of series each with raw numeric values |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `320` | — |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic boxplot

```tsx
import { Boxplot } from '@cascade-ui/charts'

const series = [
  { id: 'a', label: 'Group A', values: [1,2,3,4,5,6,7,8,9,10] },
  { id: 'b', label: 'Group B', values: [3,5,6,7,8,8,9,9,10,15] },
]
<Boxplot series={series} title="Comparison" />
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

chart, boxplot, box-whisker, statistics, data-viz
