# ComboChart

Combination bar + line chart on shared or dual y-axes.

## Install

```bash
npx cascivo add chart/combo-chart
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `bars` | `{ label: string; value: number }[]` | yes | — | Bar series data |
| `line` | `{ x: number; y: number }[]` | yes | — | Line series data points |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `secondAxis` | `boolean` | no | — | Render line on a secondary right y-axis |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `320` | — |
| `tooltip` | `boolean` | no | — | Enable hover/keyboard tooltip |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic combo chart

```tsx
import { ComboChart } from '@cascivo/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, combo, bar, line, dual-axis, data-viz
