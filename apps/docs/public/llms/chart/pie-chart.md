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

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `PieChartDatum[]` | yes | — | Array of { label, value } datums |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `donut` | `boolean` | no | — | Render as donut chart |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `300` | — |
| `legend` | `boolean` | no | — | — |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic pie chart

```tsx
import { PieChart } from '@cascade-ui/charts'

<PieChart data={[{label:'A',value:60},{label:'B',value:40}]} title="Market share" />
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

chart, pie, donut, data-viz
