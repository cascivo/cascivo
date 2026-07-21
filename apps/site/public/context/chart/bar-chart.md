# BarChart

**Category:** chart  
**Description:** Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

## When to use

- Comparing discrete categorical values across groups
- Showing grouped or stacked multi-series data per category

## When NOT to use

- Showing trends over continuous time — use LineChart
- Part-of-whole proportions — use PieChart for ≤5 categories

## Related components

- **LineChart** (alternative): Use for trends over continuous time
- **Histogram** (alternative): Use to show the distribution of a continuous variable

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name            | Type                                                               | Required | Default  | Description                                                                                                                            |
| --------------- | ------------------------------------------------------------------ | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `series`        | `BarChartSeries<Datum>[]`                                          | Yes      | —        | Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer. |
| `x`             | `(d: Datum) => string`                                             | Yes      | —        | Accessor returning the category label for a datum.                                                                                     |
| `y`             | `(d: Datum) => number`                                             | Yes      | —        | Accessor returning the numeric value for a datum.                                                                                      |
| `title`         | `string`                                                           | Yes      | —        | Title text for the component.                                                                                                          |
| `description`   | `string`                                                           | No       | —        | Supporting description text.                                                                                                           |
| `orientation`   | `'vertical' \| 'horizontal'`                                       | No       | vertical | Layout orientation of the component.                                                                                                   |
| `mode`          | `'grouped' \| 'stacked' \| 'percent'`                              | No       | grouped  | 'percent' stacks each category and normalizes it to 100%.                                                                              |
| `width`         | `number`                                                           | No       | —        | Width of the component.                                                                                                                |
| `height`        | `number`                                                           | No       | 300      | Height of the component.                                                                                                               |
| `xTicks`        | `number`                                                           | No       | —        | Approximate number of ticks on the x-axis.                                                                                             |
| `yTicks`        | `number`                                                           | No       | 5        | Approximate number of ticks on the y-axis.                                                                                             |
| `xLabelEvery`   | `number`                                                           | No       | —        | Show every Nth category label (always the last) to thin a crowded x-axis.                                                              |
| `legend`        | `boolean`                                                          | No       | —        | Whether to show the legend.                                                                                                            |
| `tooltip`       | `boolean`                                                          | No       | —        | Whether to show tooltips on hover.                                                                                                     |
| `tooltipFormat` | `(p: ChartPoint) => string`                                        | No       | —        | Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.                                |
| `className`     | `string`                                                           | No       | —        | Additional CSS class names merged onto the root element.                                                                               |
| `plain`         | `boolean`                                                          | No       | false    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                  |
| `annotations`   | `Annotation[]`                                                     | No       | —        | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                                         |
| `labels`        | `boolean \| { format?: (v: number) => string; position?: string }` | No       | —        | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                     |
| `onSelect`      | `(point: ChartPoint) => void`                                      | No       | —        | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                             |
| `fill`          | `'solid' \| 'gradient' \| 'pattern'`                               | No       | solid    | Bar fill style — solid, a gradient, or a pattern.                                                                                      |
| `patternKind`   | `'dots' \| 'lines' \| 'cross'`                                     | No       | —        | Pattern motif when fill="pattern".                                                                                                     |

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

### Basic bar chart

```jsx
import { BarChart } from '@cascivo/charts'

const series = [{ id: 'a', label: 'Sales', data: [{x:'Jan',y:100},{x:'Feb',y:150}] }]
<BarChart series={series} x={d => d.x} y={d => d.y} title="Sales" />
```

### Stacked bar from row-oriented data

```jsx
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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo BarChart component (chart). Bar chart with vertical/horizontal orientation, grouped or stacked modes, and multi-series support.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

BarChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
