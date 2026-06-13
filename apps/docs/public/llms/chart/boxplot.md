# Boxplot

Box-and-whisker plot with five-number summary and outlier dots per series.

## Install

```bash
npx cascade add chart/boxplot
```

## Category

`chart`

## Props

| Prop          | Type                                                | Required | Default | Description                                                           |
| ------------- | --------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `series`      | `{ id: string; label: string; values: number[] }[]` | yes      | —       | Array of series each with raw numeric values                          |
| `title`       | `string`                                            | yes      | —       | —                                                                     |
| `description` | `string`                                            | no       | —       | —                                                                     |
| `width`       | `number`                                            | no       | —       | —                                                                     |
| `height`      | `number`                                            | no       | `320`   | —                                                                     |
| `className`   | `string`                                            | no       | —       | —                                                                     |
| `plain`       | `boolean`                                           | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

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

- `@cascade-ui/charts`

## Tags

chart, boxplot, box-whisker, statistics, data-viz
