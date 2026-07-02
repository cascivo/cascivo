# ScatterChart

**Category:** chart  
**Description:** Scatter plot with variable point radius, multi-series, and hover tooltip.

## When to use

- Revealing correlation or clustering between two numeric variables
- Plotting many individual observations across a 2D space

## When NOT to use

- Encoding a third magnitude dimension — use BubbleChart
- Showing a trend over ordered time — use LineChart

## Related components

- **BubbleChart** (alternative): Use when a third size dimension must be encoded
- **LineChart** (alternative): Use when points form an ordered trend over time

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name          | Type                          | Required                       | Default | Description                                                                                                     |
| ------------- | ----------------------------- | ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `series`      | `ScatterChartSeries[]`        | Yes                            | —       | The data series to plot.                                                                                        |
| `title`       | `string`                      | Yes                            | —       | Title text for the component.                                                                                   |
| `description` | `string`                      | No                             | —       | Supporting description text.                                                                                    |
| `r`           | `number                       | ((d: ScatterDatum) => number)` | No      | 4                                                                                                               | Point radius or accessor                                                                                                   |
| `width`       | `number`                      | No                             | —       | Width of the component.                                                                                         |
| `height`      | `number`                      | No                             | 300     | Height of the component.                                                                                        |
| `xTicks`      | `number`                      | No                             | 5       | Approximate number of ticks on the x-axis.                                                                      |
| `yTicks`      | `number`                      | No                             | 5       | Approximate number of ticks on the y-axis.                                                                      |
| `legend`      | `boolean`                     | No                             | —       | Whether to show the legend.                                                                                     |
| `tooltip`     | `boolean`                     | No                             | —       | Enable hover/keyboard tooltip                                                                                   |
| `className`   | `string`                      | No                             | —       | Additional CSS class names merged onto the root element.                                                        |
| `plain`       | `boolean`                     | No                             | false   | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                           |
| `annotations` | `Annotation[]`                | No                             | —       | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                  |
| `onSelect`    | `(point: ChartPoint) => void` | No                             | —       | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                      |
| `glyph`       | `GlyphShape                   | ((d, seriesId) => GlyphShape)` | No      | —                                                                                                               | Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape. |
| `renderer`    | `'svg'                        | 'canvas'                       | 'auto'` | No                                                                                                              | svg                                                                                                                        | Renderer — svg (default), canvas (force), or auto (canvas past ~2000 points). Canvas keeps the full a11y fallback table + keyboard layer. |
| `visualMap`   | `VisualMapOptions`            | No                             | —       | Map each point’s y → CVD-safe colour and/or size via a keyboard-operable legend that filters the visible range. |
| `toolbox`     | `boolean                      | ToolboxOptions`                | No      | —                                                                                                               | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset the visualMap filter).  |

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

### Basic scatter chart

```jsx
import { ScatterChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Group A', data: [{x:1,y:2},{x:3,y:4}] }]
<ScatterChart series={series} title="Scatter" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ScatterChart component (chart). Scatter plot with variable point radius, multi-series, and hover tooltip.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ScatterChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate points)/Home/End (first/last point)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
