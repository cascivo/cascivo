# Polar

A polar coordinate plot — categories around the circle, value as radius. Bars (a rose), or a polar line/area.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { Polar } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `PolarDatum[]` | yes | — | One entry per category: { label, value, color? }. |
| `title` | `string` | yes | — | Chart title (also aria-label). |
| `description` | `string` | no | — | Supporting description text. |
| `mode` | `'bar' \| 'line' \| 'area'` | no | `bar` | Bars (rose), a polar line, or a filled polar area. |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `320` | Height of the component. |
| `rings` | `number` | no | `4` | Radial ring count. |
| `max` | `number` | no | — | Domain top (full radius). Defaults to the largest value. |
| `tooltip` | `boolean` | no | — | Enable hover tooltip. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no rings or labels. For micro/inline charts. |

## Examples

### Wind rose

```tsx
import { Polar } from '@cascivo/charts'

<Polar
  title="Wind by direction"
  mode="bar"
  tooltip
  data={[
    { label: 'N', value: 12 },
    { label: 'E', value: 8 },
    { label: 'S', value: 5 },
    { label: 'W', value: 15 },
  ]}
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
- `--cascivo-chart-grid`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, polar, rose, radial, data-viz
