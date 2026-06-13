# PieChart

Pie or donut chart with hover segments and optional legend.

## Install

```bash
npx cascade add chart/pie-chart
```

## Category

`chart`

## Variants

- `pie`
- `donut`

## Props

| Prop          | Type              | Required | Default | Description                                                           |
| ------------- | ----------------- | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `PieChartDatum[]` | yes      | —       | Array of { label, value } datums                                      |
| `title`       | `string`          | yes      | —       | —                                                                     |
| `description` | `string`          | no       | —       | —                                                                     |
| `donut`       | `boolean`         | no       | —       | Render as donut chart                                                 |
| `width`       | `number`          | no       | —       | —                                                                     |
| `height`      | `number`          | no       | `300`   | —                                                                     |
| `legend`      | `boolean`         | no       | —       | —                                                                     |
| `className`   | `string`          | no       | —       | —                                                                     |
| `plain`       | `boolean`         | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic pie chart

```tsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  data={[
    { label: 'A', value: 60 },
    { label: 'B', value: 40 },
  ]}
  title="Market share"
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

## Dependencies

- `@cascivo/charts`

## Tags

chart, pie, donut, data-viz
