# Treemap

Squarified treemap for visualizing part-to-whole hierarchical data.

## Install

```bash
npx cascade add chart/treemap
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
import { Treemap } from '@cascade-ui/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />
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

chart, treemap, hierarchy, part-to-whole, data-viz
