# AreaChart

Area chart with optional stacking, multi-series support, and hover tooltip.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { AreaChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop          | Type                                                                                                                    | Required | Default    | Description                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `AreaChartSeries<Datum>[]`                                                                                              | yes      | —          | Array of data series                                                                                                                                                                                      |
| `x`           | `(d: Datum) => number \| Date`                                                                                          | yes      | —          | X-value accessor. Return a number for a numeric axis or a Date for a time axis (ticks format as dates, parity with LineChart).                                                                            |
| `y`           | `(d: Datum) => number`                                                                                                  | yes      | —          | Y-value accessor, applied to every series unless a series sets its own `y`. One x-domain per chart, so `x` is chart-level only; give each series a `y` to plot different fields from one shared data row. |
| `title`       | `string`                                                                                                                | yes      | —          | Title text for the component.                                                                                                                                                                             |
| `description` | `string`                                                                                                                | no       | —          | Supporting description text.                                                                                                                                                                              |
| `stacked`     | `boolean`                                                                                                               | no       | —          | Stack series areas                                                                                                                                                                                        |
| `curve`       | `'linear' \| 'monotone' \| 'step' \| 'stepBefore' \| 'stepAfter' \| 'natural' \| 'basis' \| 'cardinal' \| 'catmullRom'` | no       | `monotone` | Line/area interpolation curve.                                                                                                                                                                            |
| `fill`        | `'solid' \| 'gradient' \| 'pattern'`                                                                                    | no       | `solid`    | Area fill style — solid, a top→bottom gradient, or a pattern.                                                                                                                                             |
| `patternKind` | `'dots' \| 'lines' \| 'cross'`                                                                                          | no       | —          | Pattern motif when fill="pattern".                                                                                                                                                                        |
| `width`       | `number`                                                                                                                | no       | —          | Width of the component.                                                                                                                                                                                   |
| `height`      | `number`                                                                                                                | no       | `300`      | Height of the component.                                                                                                                                                                                  |
| `xTicks`      | `number`                                                                                                                | no       | `5`        | Approximate number of ticks on the x-axis.                                                                                                                                                                |
| `yTicks`      | `number`                                                                                                                | no       | `5`        | Approximate number of ticks on the y-axis.                                                                                                                                                                |
| `legend`      | `boolean`                                                                                                               | no       | —          | Whether to show the legend.                                                                                                                                                                               |
| `tooltip`     | `boolean`                                                                                                               | no       | —          | Enable hover/keyboard tooltip                                                                                                                                                                             |
| `className`   | `string`                                                                                                                | no       | —          | Additional CSS class names merged onto the root element.                                                                                                                                                  |
| `plain`       | `boolean`                                                                                                               | no       | `false`    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                     |
| `annotations` | `Annotation[]`                                                                                                          | no       | —          | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                                                                                                            |
| `labels`      | `boolean \| { format?: (v: number) => string; position?: string }`                                                      | no       | —          | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                                                                                        |
| `onSelect`    | `(point: ChartPoint) => void`                                                                                           | no       | —          | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                                                                                                |
| `brush`       | `boolean`                                                                                                               | no       | `false`    | Show a keyboard-operable Brush below the plot to subset the series to a window.                                                                                                                           |
| `dataZoom`    | `boolean`                                                                                                               | no       | `false`    | Show a DataZoom slider below the plot — a Brush whose body also pans the window.                                                                                                                          |
| `zoom`        | `boolean`                                                                                                               | no       | `false`    | Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes.                                                                                |
| `syncId`      | `string`                                                                                                                | no       | —          | Connect this chart to others sharing the same id — they mirror the zoom window and hovered x.                                                                                                             |
| `tooltipMode` | `'item' \| 'axis'`                                                                                                      | no       | `item`     | Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing every series at the hovered x).                                                                                    |
| `decimate`    | `boolean \| { method?: 'lttb' \| 'minmax'; threshold?: number }`                                                        | no       | —          | Downsample dense non-stacked series before drawing (LTTB or min-max). Visual only — the fallback table keeps the full data.                                                                               |
| `toolbox`     | `boolean \| ToolboxOptions`                                                                                             | no       | —          | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset zoom).                                                                                                 |

## Examples

### Basic area chart

```tsx
import { AreaChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

### Multiple fields from one row (per-series y)

The chart-level x/y apply to every series. To plot two fields from the same rows, give each series its own y — no need to reshape the data into separate {x,y} arrays.

```tsx
import { AreaChart } from '@cascivo/charts'

const rows = [{ t: 0, requests: 100, errors: 5 }, { t: 1, requests: 120, errors: 9 }]
<AreaChart
  title="Traffic"
  series={[
    { id: 'req', label: 'Requests', data: rows, y: d => d.requests },
    { id: 'err', label: 'Errors', data: rows, y: d => d.errors },
  ]}
  x={d => d.t}
  y={d => d.requests}
/>
```

### Time axis (Date x)

Return a Date from x for a time axis — ticks render as dates (e.g. "Jul 10"), no need to encode day-of-month as an integer.

```tsx
import { AreaChart } from '@cascivo/charts'

const data = [
  { day: new Date('2026-07-10'), y: 120 },
  { day: new Date('2026-07-20'), y: 180 },
  { day: new Date('2026-07-30'), y: 150 },
]
<AreaChart
  title="Daily signups"
  series={[{ id: 's', label: 'Signups', data }]}
  x={d => d.day}
  y={d => d.y}
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

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `img`
- **Keyboard:** Tab (focus chart), ArrowLeft/ArrowRight (navigate points), Home/End (first/last point), Escape (clear focus)

## Dependencies

- `@cascivo/charts`

## Tags

chart, area, data-viz

---

_Generated from registry v0.10.1 on 2026-07-23. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
