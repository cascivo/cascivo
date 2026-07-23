# Radar

Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Radar } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                                                | Required | Default | Description                                                           |
| ------------- | --------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `axes`        | `string[]`                                          | yes      | —       | Axis labels (one per dimension)                                       |
| `series`      | `{ id: string; label: string; values: number[] }[]` | yes      | —       | One value per axis per series                                         |
| `max`         | `number`                                            | no       | —       | Maximum value (defaults to data max)                                  |
| `title`       | `string`                                            | yes      | —       | Title text for the component.                                         |
| `description` | `string`                                            | no       | —       | Supporting description text.                                          |
| `width`       | `number`                                            | no       | —       | Width of the component.                                               |
| `height`      | `number`                                            | no       | `320`   | Height of the component.                                              |
| `className`   | `string`                                            | no       | —       | Additional CSS class names merged onto the root element.              |
| `plain`       | `boolean`                                           | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

## Examples

### Basic radar chart

```tsx
import { Radar } from '@cascivo/charts'

const axes = ['Speed','Power','Range','Efficiency','Cost']
const series = [{ id:'a', label:'Model A', values:[80,70,60,90,50] }]
<Radar axes={axes} series={series} title="Model comparison" />
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

chart, radar, spider, polar, data-viz

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
