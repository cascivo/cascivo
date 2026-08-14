# Heatmap

Two-dimensional heatmap with band scales and color-mix cell interpolation.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { Heatmap } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // bundler: automatic. Needed only for no-bundler / SSR-externalised builds, where skipping it renders the screen-reader data-table fallback visibly
```

## Category

`chart`

## Props

| Prop          | Type                                          | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `{ x: string; y: string; value: number }[]`   | yes      | —       | Array of x/y/value triples                                                                                                                                                                                                                                                                                                                                                                    |
| `title`       | `string`                                      | yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `description` | `string`                                      | no       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                      | no       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | no       | `320`   | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `className`   | `string`                                      | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | no       | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |
| `visualMap`   | `VisualMapOptions`                            | no       | —       | Map cell value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range.                                                                                                                                                                                                                                                                     |
| `toolbox`     | `boolean \| ToolboxOptions`                   | no       | —       | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset the visualMap filter).                                                                                                                                                                                                                                                                     |
| `format`      | `(value: number \| string \| Date) => string` | no       | —       | Format each category/x-axis tick label.                                                                                                                                                                                                                                                                                                                                                       |

## Object types

### `HeatmapDatum`

Shape of the `data` prop.

| Field   | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| `x`     | `string` | yes      | —           |
| `y`     | `string` | yes      | —           |
| `value` | `number` | yes      | —           |

### `VisualMapOptions`

Shape of the `visualMap` prop.

| Field       | Type               | Required | Description                                                            |
| ----------- | ------------------ | -------- | ---------------------------------------------------------------------- |
| `min`       | `number`           | yes      | Domain minimum (value mapped to ramp t=0).                             |
| `max`       | `number`           | yes      | Domain maximum (value mapped to ramp t=1).                             |
| `mode`      | `VisualMode`       | no       | `continuous` ramp (default) or `piecewise` buckets.                    |
| `channel`   | `VisualChannel`    | no       | Which visual channel(s) the value drives.                              |
| `ramp`      | `RampKind`         | no       | Ramp family — CVD-safe `sequential` (default) or `diverging`.          |
| `pieces`    | `number`           | no       | Bucket count for `piecewise` (default 5).                              |
| `sizeRange` | `[number, number]` | no       | [min, max] mark radius in px for the `size` channel (default [3, 14]). |

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
- `--cascivo-gray-100`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`

## Dependencies

- `@cascivo/charts`

## Tags

chart, heatmap, matrix, data-viz

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
