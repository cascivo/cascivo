# AreaChart

Area chart with optional stacking, multi-series support, and hover tooltip.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { AreaChart } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop          | Type                          | Required                                               | Default    | Description                                                                                                                |
| ------------- | ----------------------------- | ------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------- | ---------- | ------------- | --- | ---------- | ------------------------------ |
| `series`      | `AreaChartSeries<Datum>[]`    | yes                                                    | —          | Array of data series                                                                                                       |
| `x`           | `(d: Datum) => number`        | yes                                                    | —          | X-value accessor                                                                                                           |
| `y`           | `(d: Datum) => number`        | yes                                                    | —          | Y-value accessor                                                                                                           |
| `title`       | `string`                      | yes                                                    | —          | —                                                                                                                          |
| `description` | `string`                      | no                                                     | —          | —                                                                                                                          |
| `stacked`     | `boolean`                     | no                                                     | —          | Stack series areas                                                                                                         |
| `curve`       | `'linear'                     | 'monotone'                                             | 'step'     | 'stepBefore'                                                                                                               | 'stepAfter'                                                                        | 'natural'                                                     | 'basis' | 'cardinal' | 'catmullRom'` | no  | `monotone` | Line/area interpolation curve. |
| `fill`        | `'solid'                      | 'gradient'                                             | 'pattern'` | no                                                                                                                         | `solid`                                                                            | Area fill style — solid, a top→bottom gradient, or a pattern. |
| `patternKind` | `'dots'                       | 'lines'                                                | 'cross'`   | no                                                                                                                         | —                                                                                  | Pattern motif when fill="pattern".                            |
| `width`       | `number`                      | no                                                     | —          | —                                                                                                                          |
| `height`      | `number`                      | no                                                     | `300`      | —                                                                                                                          |
| `xTicks`      | `number`                      | no                                                     | `5`        | —                                                                                                                          |
| `yTicks`      | `number`                      | no                                                     | `5`        | —                                                                                                                          |
| `legend`      | `boolean`                     | no                                                     | —          | —                                                                                                                          |
| `tooltip`     | `boolean`                     | no                                                     | —          | Enable hover/keyboard tooltip                                                                                              |
| `className`   | `string`                      | no                                                     | —          | —                                                                                                                          |
| `plain`       | `boolean`                     | no                                                     | `false`    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                      |
| `annotations` | `Annotation[]`                | no                                                     | —          | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                             |
| `labels`      | `boolean                      | { format?: (v: number) => string; position?: string }` | no         | —                                                                                                                          | Print each value as a label on the mark (collision-aware, decorative/aria-hidden). |
| `onSelect`    | `(point: ChartPoint) => void` | no                                                     | —          | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                 |
| `brush`       | `boolean`                     | no                                                     | `false`    | Show a keyboard-operable Brush below the plot to subset the series to a window.                                            |
| `dataZoom`    | `boolean`                     | no                                                     | `false`    | Show a DataZoom slider below the plot — a Brush whose body also pans the window.                                           |
| `zoom`        | `boolean`                     | no                                                     | `false`    | Enable in-plot wheel/drag/keyboard zoom-pan (+/-/0) over the series index window, with a reset control and re-ticked axes. |
| `syncId`      | `string`                      | no                                                     | —          | Connect this chart to others sharing the same id — they mirror the zoom window and hovered x.                              |

## Examples

### Basic area chart

```tsx
import { AreaChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Revenue', data: [{x:1,y:10},{x:2,y:20}] }]
<AreaChart series={series} x={d => d.x} y={d => d.y} title="Revenue" />
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
