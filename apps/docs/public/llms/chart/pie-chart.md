# PieChart

Pie or donut chart with hover segments and optional legend.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { PieChart } from '@cascivo/charts'
```

## Category

`chart`

## Variants

- `pie`
- `donut`

## Props

| Prop          | Type              | Required | Default | Description                                                                                                                               |
| ------------- | ----------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `PieChartDatum[]` | yes      | —       | Array of { id, label, value, color? } datums. Optional per-datum `color` (any CSS color) overrides the positional palette for that slice. |
| `title`       | `string`          | yes      | —       | —                                                                                                                                         |
| `description` | `string`          | no       | —       | —                                                                                                                                         |
| `donut`       | `boolean`         | no       | —       | Render as donut chart                                                                                                                     |
| `width`       | `number`          | no       | —       | —                                                                                                                                         |
| `height`      | `number`          | no       | `300`   | —                                                                                                                                         |
| `size`        | `number`          | no       | —       | Square shorthand: sets width === height. Explicit width/height win.                                                                       |
| `thickness`   | `number`          | no       | —       | Ring width in px (donut only); defaults to 0.4 × radius.                                                                                  |
| `innerRadius` | `number`          | no       | —       | Inner radius in px (donut only); takes precedence over thickness; clamped to [0, outerRadius).                                            |
| `centerValue` | `string`          | no       | —       | Center value text rendered in the donut hole (donut only).                                                                                |
| `centerLabel` | `string`          | no       | —       | Center label text rendered below the value (donut only).                                                                                  |
| `centerSlot`  | `ReactNode`       | no       | —       | Arbitrary content for the donut hole; takes precedence over centerValue/centerLabel.                                                      |
| `legend`      | `boolean`         | no       | —       | —                                                                                                                                         |
| `className`   | `string`          | no       | —       | —                                                                                                                                         |
| `plain`       | `boolean`         | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                     |

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

### Donut with center total and custom thickness

```tsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  donut
  size={220}
  thickness={28}
  centerValue="142"
  centerLabel="Total tasks"
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
    { id: 'wip', label: 'In progress', value: 34, color: 'var(--cascivo-color-warning)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
  ]}
  title="Task status"
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
