# Heatmap

Two-dimensional heatmap with band scales and color-mix cell interpolation.

## Install

```bash
npx cascade add chart/heatmap
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `{ x: string; y: string; value: number }[]` | yes | — | Array of x/y/value triples |
| `title` | `string` | yes | — | — |
| `description` | `string` | no | — | — |
| `width` | `number` | no | — | — |
| `height` | `number` | no | `320` | — |
| `className` | `string` | no | — | — |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic heatmap

```tsx
import { Heatmap } from '@cascade-ui/charts'

const data = [
  {x:'Mon',y:'AM',value:10},{x:'Mon',y:'PM',value:20},
  {x:'Tue',y:'AM',value:15},{x:'Tue',y:'PM',value:5},
]
<Heatmap data={data} title="Activity" />
```

## Design tokens

- `--cascade-chart-1`
- `--cascade-color-neutral-100`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, heatmap, matrix, data-viz
