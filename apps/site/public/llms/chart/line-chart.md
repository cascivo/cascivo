# LineChart

Time-series or numeric line chart with multi-series support, hover tooltip, and legend.

## Install

Ships in the `@cascivo/charts` package — install it (no copy-paste):

```sh
pnpm add @cascivo/charts
```

```tsx
import { LineChart } from '@cascivo/charts'
import '@cascivo/charts/styles.css' // required — without it the screen-reader data-table fallback renders visibly
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `LineChartSeries<Datum>[]` | yes | — | Array of data series |
| `x` | `(d: Datum) => number \| Date` | yes | — | X-value accessor |
| `y` | `(d: Datum) => number` | yes | — | Y-value accessor |
| `title` | `string` | yes | — | Chart title (also used as aria-label) |
| `description` | `string` | no | — | Subtitle shown below title |
| `curve` | `'linear' \| 'monotone' \| 'step' \| 'stepBefore' \| 'stepAfter' \| 'natural' \| 'basis' \| 'cardinal' \| 'catmullRom'` | no | `monotone` | Line interpolation curve |
| `width` | `number` | no | — | Fixed SVG width (defaults to container width) |
| `height` | `number` | no | `300` | SVG height in px |
| `xTicks` | `number` | no | `5` | Approximate number of X-axis ticks |
| `yTicks` | `number` | no | `5` | Approximate number of Y-axis ticks |
| `legend` | `boolean` | no | — | Show series legend |
| `tooltip` | `boolean` | no | — | Enable hover tooltip |
| `formatTooltip` | `(datum: Datum, series: LineChartSeries<Datum>) => string` | no | — | Custom tooltip formatter |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `annotations` | `Annotation[]` | no | — | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |
| `labels` | `boolean \| { format?: (v: number) => string; position?: string }` | no | — | Print each value as a label on the mark (collision-aware, decorative/aria-hidden). |
| `connectNulls` | `boolean` | no | `false` | Bridge non-finite y gaps instead of breaking the line at them. |
| `onSelect` | `(point: ChartPoint) => void` | no | — | Fired when a point is clicked or activated (Enter/Space) — for drill-down. |
| `brush` | `boolean` | no | `false` | Show a keyboard-operable Brush below the plot to subset (zoom) the series to a window. |
| `dataZoom` | `boolean` | no | `false` | Show a DataZoom slider below the plot — a Brush whose body also pans the window. |
| `zoom` | `boolean` | no | `false` | Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes. |
| `syncId` | `string` | no | — | Connect this chart to others sharing the same id — they mirror the zoom window and hovered x. |
| `tooltipMode` | `'item' \| 'axis'` | no | `item` | Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing every series at the hovered x). |
| `decimate` | `boolean \| { method?: 'lttb' \| 'minmax'; threshold?: number }` | no | — | Downsample dense series before drawing (LTTB or min-max). Visual only — the fallback table keeps the full data. |
| `toolbox` | `boolean \| ToolboxOptions` | no | — | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset zoom). |
| `transition` | `boolean \| { duration?: number; easing?: string; properties?: string[] }` | no | — | Tune the reduced-motion-gated enter/update transitions (false disables). Always suppressed under prefers-reduced-motion. |
| `onBeforeDraw` | `(ctx: { width: number; height: number }) => ReactNode` | no | — | Render custom SVG behind the marks (watermark/region) — a lightweight extension seam. |
| `onAfterDraw` | `(ctx: { width: number; height: number }) => ReactNode` | no | — | Render custom SVG over the marks (overlay/extra series) — a lightweight extension seam. |

## Examples

### Basic line chart

```tsx
import { LineChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

### With an SLO target line

```tsx
<LineChart
  series={series}
  x={d => d.x}
  y={d => d.y}
  title="Latency"
  annotations={[{ kind: 'line', axis: 'y', value: 200, label: 'SLO' }]}
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

chart, line, time-series, data-viz

---

_Generated from registry v0.8.0 on 2026-07-21. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
