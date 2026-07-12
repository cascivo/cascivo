# LineChart

**Category:** chart  
**Description:** Time-series or numeric line chart with multi-series support, hover tooltip, and legend.

## When to use

- Showing trends and precise values over continuous time or a numeric range
- Comparing the trajectory of multiple series on a shared scale

## When NOT to use

- Comparing discrete categories — use BarChart
- Emphasising cumulative volume — use AreaChart

## Related components

- **AreaChart** (alternative): Use when filled cumulative volume matters more than precise values
- **BarChart** (alternative): Use for discrete categorical comparison

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `LineChartSeries<Datum>[]` | Yes | — | Array of data series |
| `x` | `(d: Datum) => number \| Date` | Yes | — | X-value accessor |
| `y` | `(d: Datum) => number` | Yes | — | Y-value accessor |
| `title` | `string` | Yes | — | Chart title (also used as aria-label) |
| `description` | `string` | No | — | Subtitle shown below title |
| `curve` | `'linear' \| 'monotone' \| 'step' \| 'stepBefore' \| 'stepAfter' \| 'natural' \| 'basis' \| 'cardinal' \| 'catmullRom'` | No | monotone | Line interpolation curve |
| `width` | `number` | No | — | Fixed SVG width (defaults to container width) |
| `height` | `number` | No | 300 | SVG height in px |
| `xTicks` | `number` | No | 5 | Approximate number of X-axis ticks |
| `yTicks` | `number` | No | 5 | Approximate number of Y-axis ticks |
| `legend` | `boolean` | No | — | Show series legend |
| `tooltip` | `boolean` | No | — | Enable hover tooltip |
| `formatTooltip` | `(datum: Datum, series: LineChartSeries<Datum>) => string` | No | — | Custom tooltip formatter |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `annotations` | `Annotation[]` | No | — | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |
| `labels` | `boolean \| { format?: (v: number) => string; position?: string }` | No | — | Print each value as a label on the mark (collision-aware, decorative/aria-hidden). |
| `connectNulls` | `boolean` | No | false | Bridge non-finite y gaps instead of breaking the line at them. |
| `onSelect` | `(point: ChartPoint) => void` | No | — | Fired when a point is clicked or activated (Enter/Space) — for drill-down. |
| `brush` | `boolean` | No | false | Show a keyboard-operable Brush below the plot to subset (zoom) the series to a window. |
| `dataZoom` | `boolean` | No | false | Show a DataZoom slider below the plot — a Brush whose body also pans the window. |
| `zoom` | `boolean` | No | false | Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes. |
| `syncId` | `string` | No | — | Connect this chart to others sharing the same id — they mirror the zoom window and hovered x. |
| `tooltipMode` | `'item' \| 'axis'` | No | item | Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing every series at the hovered x). |
| `decimate` | `boolean \| { method?: 'lttb' \| 'minmax'; threshold?: number }` | No | — | Downsample dense series before drawing (LTTB or min-max). Visual only — the fallback table keeps the full data. |
| `toolbox` | `boolean \| ToolboxOptions` | No | — | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset zoom). |
| `transition` | `boolean \| { duration?: number; easing?: string; properties?: string[] }` | No | — | Tune the reduced-motion-gated enter/update transitions (false disables). Always suppressed under prefers-reduced-motion. |
| `onBeforeDraw` | `(ctx: { width: number; height: number }) => ReactNode` | No | — | Render custom SVG behind the marks (watermark/region) — a lightweight extension seam. |
| `onAfterDraw` | `(ctx: { width: number; height: number }) => ReactNode` | No | — | Render custom SVG over the marks (overlay/extra series) — a lightweight extension seam. |

## Tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`

## Examples

### Basic line chart

```jsx
import { LineChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20},{x:3,y:15}] }]
<LineChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

### With an SLO target line

```jsx
<LineChart
  series={series}
  x={d => d.x}
  y={d => d.y}
  title="Latency"
  annotations={[{ kind: 'line', axis: 'y', value: 200, label: 'SLO' }]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo LineChart component (chart). Time-series or numeric line chart with multi-series support, hover tooltip, and legend.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

LineChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate points)/Home/End (first/last point)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
