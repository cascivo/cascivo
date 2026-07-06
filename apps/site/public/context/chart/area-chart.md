# AreaChart

**Category:** chart  
**Description:** Area chart with optional stacking, multi-series support, and hover tooltip.

## When to use

- Showing cumulative volume or magnitude of a trend over continuous time
- Emphasising the total of stacked multi-series values across a range

## When NOT to use

- Reading precise individual values — use LineChart
- Comparing discrete categories — use BarChart

## Related components

- **LineChart** (alternative): Use when precise values matter more than filled volume
- **BarChart** (alternative): Use for discrete categorical comparison

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name          | Type                                                                                                                    | Required | Default  | Description                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `AreaChartSeries<Datum>[]`                                                                                              | Yes      | —        | Array of data series                                                                                                        |
| `x`           | `(d: Datum) => number`                                                                                                  | Yes      | —        | X-value accessor                                                                                                            |
| `y`           | `(d: Datum) => number`                                                                                                  | Yes      | —        | Y-value accessor                                                                                                            |
| `title`       | `string`                                                                                                                | Yes      | —        | Title text for the component.                                                                                               |
| `description` | `string`                                                                                                                | No       | —        | Supporting description text.                                                                                                |
| `stacked`     | `boolean`                                                                                                               | No       | —        | Stack series areas                                                                                                          |
| `curve`       | `'linear' \| 'monotone' \| 'step' \| 'stepBefore' \| 'stepAfter' \| 'natural' \| 'basis' \| 'cardinal' \| 'catmullRom'` | No       | monotone | Line/area interpolation curve.                                                                                              |
| `fill`        | `'solid' \| 'gradient' \| 'pattern'`                                                                                    | No       | solid    | Area fill style — solid, a top→bottom gradient, or a pattern.                                                               |
| `patternKind` | `'dots' \| 'lines' \| 'cross'`                                                                                          | No       | —        | Pattern motif when fill="pattern".                                                                                          |
| `width`       | `number`                                                                                                                | No       | —        | Width of the component.                                                                                                     |
| `height`      | `number`                                                                                                                | No       | 300      | Height of the component.                                                                                                    |
| `xTicks`      | `number`                                                                                                                | No       | 5        | Approximate number of ticks on the x-axis.                                                                                  |
| `yTicks`      | `number`                                                                                                                | No       | 5        | Approximate number of ticks on the y-axis.                                                                                  |
| `legend`      | `boolean`                                                                                                               | No       | —        | Whether to show the legend.                                                                                                 |
| `tooltip`     | `boolean`                                                                                                               | No       | —        | Enable hover/keyboard tooltip                                                                                               |
| `className`   | `string`                                                                                                                | No       | —        | Additional CSS class names merged onto the root element.                                                                    |
| `plain`       | `boolean`                                                                                                               | No       | false    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                       |
| `annotations` | `Annotation[]`                                                                                                          | No       | —        | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                              |
| `labels`      | `boolean \| { format?: (v: number) => string; position?: string }`                                                      | No       | —        | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                          |
| `onSelect`    | `(point: ChartPoint) => void`                                                                                           | No       | —        | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                  |
| `brush`       | `boolean`                                                                                                               | No       | false    | Show a keyboard-operable Brush below the plot to subset the series to a window.                                             |
| `dataZoom`    | `boolean`                                                                                                               | No       | false    | Show a DataZoom slider below the plot — a Brush whose body also pans the window.                                            |
| `zoom`        | `boolean`                                                                                                               | No       | false    | Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes.  |
| `syncId`      | `string`                                                                                                                | No       | —        | Connect this chart to others sharing the same id — they mirror the zoom window and hovered x.                               |
| `tooltipMode` | `'item' \| 'axis'`                                                                                                      | No       | item     | Tooltip trigger — item (nearest point) or axis (a crosshair + a shared tooltip listing every series at the hovered x).      |
| `decimate`    | `boolean \| { method?: 'lttb' \| 'minmax'; threshold?: number }`                                                        | No       | —        | Downsample dense non-stacked series before drawing (LTTB or min-max). Visual only — the fallback table keeps the full data. |
| `toolbox`     | `boolean \| ToolboxOptions`                                                                                             | No       | —        | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset zoom).                   |

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

### Basic area chart

```jsx
import { AreaChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo AreaChart component (chart). Area chart with optional stacking, multi-series support, and hover tooltip.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

AreaChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate points)/Home/End (first/last point)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
