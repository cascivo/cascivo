# BarChart

Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { BarChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Variants

- `grouped`
- `stacked`
- `percent`

## Props

| Prop            | Type                                                               | Required | Default    | Description                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `series`        | `BarChartSeries<Datum>[]`                                          | yes      | —          | Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer.                                                                                   |
| `x`             | `(d: Datum) => string`                                             | yes      | —          | Accessor returning the category label for a datum.                                                                                                                                                                       |
| `y`             | `(d: Datum) => number`                                             | yes      | —          | Accessor returning the numeric value for a datum, applied to every series unless a series sets its own `y`. One category (x) domain per chart; give each series a `y` to plot different fields from one shared data row. |
| `title`         | `string`                                                           | yes      | —          | Title text for the component.                                                                                                                                                                                            |
| `description`   | `string`                                                           | no       | —          | Supporting description text.                                                                                                                                                                                             |
| `orientation`   | `'vertical' \| 'horizontal'`                                       | no       | `vertical` | Layout orientation of the component.                                                                                                                                                                                     |
| `mode`          | `'grouped' \| 'stacked' \| 'percent'`                              | no       | `grouped`  | 'percent' stacks each category and normalizes it to 100%.                                                                                                                                                                |
| `width`         | `number`                                                           | no       | —          | Width of the component.                                                                                                                                                                                                  |
| `height`        | `number`                                                           | no       | `300`      | Height of the component.                                                                                                                                                                                                 |
| `xTicks`        | `number`                                                           | no       | —          | Approximate number of ticks on the x-axis.                                                                                                                                                                               |
| `yTicks`        | `number`                                                           | no       | `5`        | Approximate number of ticks on the y-axis.                                                                                                                                                                               |
| `xLabelEvery`   | `number`                                                           | no       | —          | Show every Nth category label (always the last) to thin a crowded x-axis.                                                                                                                                                |
| `legend`        | `boolean`                                                          | no       | —          | Whether to show the legend.                                                                                                                                                                                              |
| `tooltip`       | `boolean`                                                          | no       | —          | Whether to show tooltips on hover.                                                                                                                                                                                       |
| `tooltipFormat` | `(p: ChartPoint) => string`                                        | no       | —          | Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.                                                                                                                  |
| `className`     | `string`                                                           | no       | —          | Additional CSS class names merged onto the root element.                                                                                                                                                                 |
| `plain`         | `boolean`                                                          | no       | `false`    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                    |
| `annotations`   | `Annotation[]`                                                     | no       | —          | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                                                                                                                           |
| `labels`        | `boolean \| { format?: (v: number) => string; position?: string }` | no       | —          | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                                                                                                       |
| `onSelect`      | `(point: ChartPoint) => void`                                      | no       | —          | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                                                                                                               |
| `fill`          | `'solid' \| 'gradient' \| 'pattern'`                               | no       | `solid`    | Bar fill style — solid, a gradient, or a pattern.                                                                                                                                                                        |
| `patternKind`   | `'dots' \| 'lines' \| 'cross'`                                     | no       | —          | Pattern motif when fill="pattern".                                                                                                                                                                                       |

## Object types

### `BarChartSeries<Datum>`

One series (a set of bars). Pass an array via the `series` prop.

| Field   | Type               | Required | Description                                                                                          |
| ------- | ------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `id`    | `string`           | yes      | Stable series identity.                                                                              |
| `label` | `string`           | yes      | Legend + tooltip label.                                                                              |
| `data`  | `readonly Datum[]` | yes      | Row data read by the `x`/`y` accessors.                                                              |
| `color` | `string`           | no       | Any CSS color overriding the positional palette (--cascivo-chart-N) for this series / stacked layer. |

### `StackedRow`

Row-oriented input to the `toStackedSeries(rows)` pivot helper.

| Field      | Type               | Required | Description                                                                       |
| ---------- | ------------------ | -------- | --------------------------------------------------------------------------------- |
| `label`    | `string`           | yes      | Category (one bar).                                                               |
| `segments` | `StackedSegment[]` | yes      | Per-layer values: { key, value, color? }. First non-undefined color per key wins. |

### `StackedSegment`

One layer of a stacked bar within a StackedRow.

| Field   | Type     | Required | Description                                            |
| ------- | -------- | -------- | ------------------------------------------------------ |
| `key`   | `string` | yes      | Layer key — becomes the series id/label (e.g. "Done"). |
| `value` | `number` | yes      | —                                                      |
| `color` | `string` | no       | Optional CSS color for this layer.                     |

### `ChartPoint`

Argument passed to the `tooltipFormat` callback.

| Field      | Type                                                          | Required | Description                                                                          |
| ---------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `label`    | `string`                                                      | yes      | Category label.                                                                      |
| `value`    | `number \| string`                                            | yes      | —                                                                                    |
| `color`    | `string`                                                      | no       | Resolved mark color (the default tooltip tints its text with this).                  |
| `segments` | `readonly { label: string; value: number; color?: string }[]` | no       | Per-layer breakdown for a stacked category; the default stacked tooltip lists these. |

## Examples

### Basic bar chart

```tsx
import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />
```

### Stacked bar from row-oriented data

```tsx
import { BarChart, toStackedSeries } from '@cascivo/charts'

// Pivot { label, segments[] } rows into series + x/y. Per-segment color is preserved.
const rows = [
  { label: 'Mon', segments: [
    { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
  ] },
  { label: 'Tue', segments: [
    { key: 'Done', value: 8, color: 'var(--cascivo-color-success)' },
    { key: 'Blocked', value: 1, color: 'var(--cascivo-color-destructive)' },
  ] },
]
// Tooltip shows "Mon · 7" then each non-zero layer in its color.
<BarChart mode="stacked" tooltip {...toStackedSeries(rows)} title="Throughput" />
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

chart, bar, data-viz

---

_Generated from registry v0.11.0 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
