# Radar

Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.

## Install

```bash
npx cascade add chart/radar
```

## Category

`chart`

## Props

| Prop          | Type                                                | Required | Default | Description                                                           |
| ------------- | --------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `axes`        | `string[]`                                          | yes      | —       | Axis labels (one per dimension)                                       |
| `series`      | `{ id: string; label: string; values: number[] }[]` | yes      | —       | One value per axis per series                                         |
| `max`         | `number`                                            | no       | —       | Maximum value (defaults to data max)                                  |
| `title`       | `string`                                            | yes      | —       | —                                                                     |
| `description` | `string`                                            | no       | —       | —                                                                     |
| `width`       | `number`                                            | no       | —       | —                                                                     |
| `height`      | `number`                                            | no       | `320`   | —                                                                     |
| `className`   | `string`                                            | no       | —       | —                                                                     |
| `plain`       | `boolean`                                           | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic radar chart

```tsx
import { Radar } from '@cascade-ui/charts'

const axes = ['Speed','Power','Range','Efficiency','Cost']
const series = [{ id:'a', label:'Model A', values:[80,70,60,90,50] }]
<Radar axes={axes} series={series} title="Model comparison" />
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

chart, radar, spider, polar, data-viz
