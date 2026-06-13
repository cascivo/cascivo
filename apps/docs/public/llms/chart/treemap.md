# Treemap

Squarified treemap for visualizing part-to-whole hierarchical data.

## Install

```bash
npx cascivo add chart/treemap
```

## Category

`chart`

## Props

| Prop          | Type                                             | Required | Default | Description                                                           |
| ------------- | ------------------------------------------------ | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `{ id: string; label: string; value: number }[]` | yes      | —       | —                                                                     |
| `title`       | `string`                                         | yes      | —       | —                                                                     |
| `description` | `string`                                         | no       | —       | —                                                                     |
| `width`       | `number`                                         | no       | —       | —                                                                     |
| `height`      | `number`                                         | no       | `320`   | —                                                                     |
| `className`   | `string`                                         | no       | —       | —                                                                     |
| `plain`       | `boolean`                                        | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic treemap

```tsx
import { Treemap } from '@cascivo/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />
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

chart, treemap, hierarchy, part-to-whole, data-viz
