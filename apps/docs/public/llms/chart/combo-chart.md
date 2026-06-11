# ComboChart

Combination bar + line chart on shared or dual y-axes.

## Install

```bash
npx cascade add chart/combo-chart
```

## Category

`chart`

## Props

| Prop          | Type                                 | Required | Default | Description                             |
| ------------- | ------------------------------------ | -------- | ------- | --------------------------------------- |
| `bars`        | `{ label: string; value: number }[]` | yes      | —       | Bar series data                         |
| `line`        | `{ x: number; y: number }[]`         | yes      | —       | Line series data points                 |
| `title`       | `string`                             | yes      | —       | —                                       |
| `description` | `string`                             | no       | —       | —                                       |
| `secondAxis`  | `boolean`                            | no       | —       | Render line on a secondary right y-axis |
| `width`       | `number`                             | no       | —       | —                                       |
| `height`      | `number`                             | no       | `320`   | —                                       |
| `className`   | `string`                             | no       | —       | —                                       |

## Examples

### Basic combo chart

```tsx
import { ComboChart } from '@cascade-ui/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />
```

## Design tokens

- `--cascade-chart-1`
- `--cascade-chart-2`

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, combo, bar, line, dual-axis, data-viz
