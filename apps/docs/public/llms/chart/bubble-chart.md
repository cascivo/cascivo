# BubbleChart

Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.

## Install

```bash
npx cascade add chart/bubble-chart
```

## Category

`chart`

## Props

| Prop          | Type                                                                 | Required | Default | Description                                                           |
| ------------- | -------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `series`      | `{ name: string; data: { x: number; y: number; size: number }[] }[]` | yes      | —       | —                                                                     |
| `title`       | `string`                                                             | yes      | —       | —                                                                     |
| `description` | `string`                                                             | no       | —       | —                                                                     |
| `width`       | `number`                                                             | no       | —       | —                                                                     |
| `height`      | `number`                                                             | no       | `320`   | —                                                                     |
| `tooltip`     | `boolean`                                                            | no       | —       | Enable hover/keyboard tooltip                                         |
| `className`   | `string`                                                             | no       | —       | —                                                                     |
| `plain`       | `boolean`                                                            | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic bubble chart

```tsx
import { BubbleChart } from '@cascade-ui/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />
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
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascade-ui/charts`

## Tags

chart, bubble, scatter, three-dimensional, data-viz
