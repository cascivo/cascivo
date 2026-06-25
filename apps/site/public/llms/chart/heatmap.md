# Heatmap

Two-dimensional heatmap with band scales and color-mix cell interpolation.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { Heatmap } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop          | Type                                        | Required | Default | Description                                                           |
| ------------- | ------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `{ x: string; y: string; value: number }[]` | yes      | —       | Array of x/y/value triples                                            |
| `title`       | `string`                                    | yes      | —       | —                                                                     |
| `description` | `string`                                    | no       | —       | —                                                                     |
| `width`       | `number`                                    | no       | —       | —                                                                     |
| `height`      | `number`                                    | no       | `320`   | —                                                                     |
| `className`   | `string`                                    | no       | —       | —                                                                     |
| `plain`       | `boolean`                                   | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic heatmap

```tsx
import { Heatmap } from '@cascivo/charts'

const data = [
  {x:'Mon',y:'AM',value:10},{x:'Mon',y:'PM',value:20},
  {x:'Tue',y:'AM',value:15},{x:'Tue',y:'PM',value:5},
]
<Heatmap data={data} title="Activity" />
```

## Design tokens

- `--cascivo-chart-1`
- `--cascivo-color-neutral-100`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, heatmap, matrix, data-viz
