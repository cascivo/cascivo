# Boxplot

Box-and-whisker plot with five-number summary and outlier dots per series.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Boxplot } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `{ id: string; label: string; values: number[] }[]` | yes | — | Array of series each with raw numeric values |
| `title` | `string` | yes | — | Title text for the component. |
| `description` | `string` | no | — | Supporting description text. |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `320` | Height of the component. |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic boxplot

```tsx
import { Boxplot } from '@cascivo/charts'

const series = [
  { id: 'a', label: 'Group A', values: [1,2,3,4,5,6,7,8,9,10] },
  { id: 'b', label: 'Group B', values: [3,5,6,7,8,8,9,9,10,15] },
]
<Boxplot series={series} title="Comparison" />
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

chart, boxplot, box-whisker, statistics, data-viz

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
