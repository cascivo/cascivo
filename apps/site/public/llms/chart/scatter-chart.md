# ScatterChart

Scatter plot with variable point radius, multi-series, and hover tooltip.

## Install

Charts ship in the `@cascivo/charts` package:

```sh
pnpm add @cascivo/charts
```

```tsx
import { ScatterChart } from '@cascivo/charts'
```

## Category

`chart`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `ScatterChartSeries[]` | yes | — | The data series to plot. |
| `title` | `string` | yes | — | Title text for the component. |
| `description` | `string` | no | — | Supporting description text. |
| `r` | `number \| ((d: ScatterDatum) => number)` | no | `4` | Point radius or accessor |
| `width` | `number` | no | — | Width of the component. |
| `height` | `number` | no | `300` | Height of the component. |
| `xTicks` | `number` | no | `5` | Approximate number of ticks on the x-axis. |
| `yTicks` | `number` | no | `5` | Approximate number of ticks on the y-axis. |
| `legend` | `boolean` | no | — | Whether to show the legend. |
| `tooltip` | `boolean` | no | — | Enable hover/keyboard tooltip |
| `className` | `string` | no | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | no | `false` | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `annotations` | `Annotation[]` | no | — | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |
| `onSelect` | `(point: ChartPoint) => void` | no | — | Fired when a point is clicked or activated (Enter/Space) — for drill-down. |
| `glyph` | `GlyphShape \| ((d, seriesId) => GlyphShape)` | no | — | Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape. |
| `renderer` | `'svg' \| 'canvas' \| 'auto'` | no | `svg` | Renderer — svg (default), canvas (force), or auto (canvas past ~2000 points). Canvas keeps the full a11y fallback table + keyboard layer. |
| `visualMap` | `VisualMapOptions` | no | — | Map each point’s y → CVD-safe colour and/or size via a keyboard-operable legend that filters the visible range. |
| `toolbox` | `boolean \| ToolboxOptions` | no | — | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset the visualMap filter). |

## Examples

### Basic scatter chart

```tsx
import { ScatterChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />
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

chart, scatter, plot, data-viz
