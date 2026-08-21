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

| Name                 | Type                                                               | Required | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------ | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `series`             | `BarChartSeries<Datum>[]`                                          | Yes      | —        | Series array. Each series accepts an optional `color` (any CSS color) overriding the positional palette for that series/stacked layer.                                                                                                                                                                                                                                                                                       |
| `x`                  | `(d: Datum) => string`                                             | Yes      | —        | Accessor returning the **category label** for a datum. BarChart uses a categorical **band** scale, so `x` returns a `string` — this differs from LineChart/AreaChart, whose `x` returns `number \| Date` for a continuous/time scale. For a time-based bar chart, format the date to a label in the accessor (e.g. `x={(d) => d.day.toLocaleDateString()}`). For continuous or time-series data, prefer LineChart/AreaChart. |
| `y`                  | `(d: Datum) => number`                                             | Yes      | —        | Accessor returning the numeric value for a datum, applied to every series unless a series sets its own `y`. One category (x) domain per chart; give each series a `y` to plot different fields from one shared data row.                                                                                                                                                                                                     |
| `title`              | `string`                                                           | Yes      | —        | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                                                |
| `description`        | `string`                                                           | No       | —        | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `orientation`        | `'vertical' \| 'horizontal'`                                       | No       | vertical | Direction the bars grow. `vertical` puts the categories on the x-axis and grows bars upward (columns); `horizontal` puts them on the y-axis and grows bars rightward — the better choice for long category names.                                                                                                                                                                                                            |
| `mode`               | `'grouped' \| 'stacked' \| 'percent'`                              | No       | grouped  | 'percent' stacks each category and normalizes it to 100%.                                                                                                                                                                                                                                                                                                                                                                    |
| `width`              | `number`                                                           | No       | —        | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally.                                |
| `height`             | `number`                                                           | No       | 300      | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                                               |
| `valueAxisTicks`     | `number`                                                           | No       | 5        | Approximate number of ticks on the VALUE axis, on both orientations. Prefer this over xTicks/yTicks, which are named for where the axis is drawn and therefore swap meaning when orientation="horizontal".                                                                                                                                                                                                                   |
| `categoryAxisTicks`  | `number`                                                           | No       | 5        | Approximate number of ticks on the CATEGORY axis, on both orientations. Role-named twin of valueAxisTicks.                                                                                                                                                                                                                                                                                                                   |
| `categoryLabelEvery` | `number`                                                           | No       | —        | Show every Nth category label (always the last) to thin a crowded axis. Role-named twin of xLabelEvery; always strides the category axis on both orientations.                                                                                                                                                                                                                                                               |
| `xTicks`             | `number`                                                           | No       | 5        | DEPRECATED (use valueAxisTicks/categoryAxisTicks). Ticks on the x-axis — follows SCREEN position, so it controls the category axis when vertical and the VALUE axis when horizontal.                                                                                                                                                                                                                                         |
| `yTicks`             | `number`                                                           | No       | 5        | DEPRECATED (use valueAxisTicks/categoryAxisTicks). Ticks on the y-axis — follows SCREEN position, so it controls the value axis when vertical and the CATEGORY axis when horizontal.                                                                                                                                                                                                                                         |
| `xLabelEvery`        | `number`                                                           | No       | —        | Show every Nth category label (always the last) to thin a crowded axis. Unlike xTicks/yTicks this does NOT swap with orientation — it always strides the category axis. categoryLabelEvery is the unambiguous name.                                                                                                                                                                                                          |
| `legend`             | `boolean`                                                          | No       | —        | Whether to show the legend.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `tooltip`            | `boolean`                                                          | No       | —        | Whether to show tooltips on hover.                                                                                                                                                                                                                                                                                                                                                                                           |
| `tooltipFormat`      | `(p: ChartPoint) => string`                                        | No       | —        | Custom tooltip formatter. The stacked default lists "label · total" + each non-zero layer in its color.                                                                                                                                                                                                                                                                                                                      |
| `className`          | `string`                                                           | No       | —        | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                                                     |
| `plain`              | `boolean`                                                          | No       | false    | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                                                        |
| `annotations`        | `Annotation[]`                                                     | No       | —        | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line).                                                                                                                                                                                                                                                                                                                               |
| `labels`             | `boolean \| { format?: (v: number) => string; position?: string }` | No       | —        | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                                                                                                                                                                                                                                                                                                           |
| `onSelect`           | `(point: ChartPoint) => void`                                      | No       | —        | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                                                                                                                                                                                                                                                                                                                   |
| `fill`               | `'solid' \| 'gradient' \| 'pattern'`                               | No       | solid    | Bar fill style — solid, a gradient, or a pattern.                                                                                                                                                                                                                                                                                                                                                                            |
| `patternKind`        | `'dots' \| 'lines' \| 'cross'`                                     | No       | —        | Pattern motif when fill="pattern".                                                                                                                                                                                                                                                                                                                                                                                           |
| `format`             | `(value: number \| string \| Date) => string`                      | No       | —        | Format each category/x-axis tick label.                                                                                                                                                                                                                                                                                                                                                                                      |

## Object types

### `BarChartSeries<Datum>`

One series (a set of bars). Pass an array via the `series` prop.

| Field   | Type                                                  | Required | Description                                                                                                                                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`    | `string`                                              | Yes      | Stable series identity.                                                                                                                                                                                                                                                                                                                        |
| `label` | `string`                                              | Yes      | Legend + tooltip label.                                                                                                                                                                                                                                                                                                                        |
| `data`  | `readonly Datum[]`                                    | Yes      | Row data read by the `x`/`y` accessors.                                                                                                                                                                                                                                                                                                        |
| `color` | `string \| ((datum: Datum, index: number) => string)` | No       | Any CSS color overriding the positional palette (--cascivo-chart-N) for this series / stacked layer. Pass a FUNCTION to color each bar from its own datum — the single-series categorical case (incidents by severity, where SEV1 reads as danger regardless of which bar is tallest). Each bar is also stamped with data-x for CSS targeting. |

### `StackedRow`

Row-oriented input to the `toStackedSeries(rows)` pivot helper.

| Field      | Type               | Required | Description                                                                       |
| ---------- | ------------------ | -------- | --------------------------------------------------------------------------------- |
| `label`    | `string`           | Yes      | Category (one bar).                                                               |
| `segments` | `StackedSegment[]` | Yes      | Per-layer values: { key, value, color? }. First non-undefined color per key wins. |

### `StackedSegment`

One layer of a stacked bar within a StackedRow.

| Field   | Type     | Required | Description                                            |
| ------- | -------- | -------- | ------------------------------------------------------ |
| `key`   | `string` | Yes      | Layer key — becomes the series id/label (e.g. "Done"). |
| `value` | `number` | Yes      | —                                                      |
| `color` | `string` | No       | Optional CSS color for this layer.                     |

### `ChartPoint`

Argument passed to the `tooltipFormat` callback.

| Field      | Type                                                          | Required | Description                                                                          |
| ---------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `label`    | `string`                                                      | Yes      | Category label.                                                                      |
| `value`    | `number \| string`                                            | Yes      | —                                                                                    |
| `color`    | `string`                                                      | No       | Resolved mark color (the default tooltip tints its text with this).                  |
| `segments` | `readonly { label: string; value: number; color?: string }[]` | No       | Per-layer breakdown for a stacked category; the default stacked tooltip lists these. |

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

### Date-based categories (format the Date in the accessor)

BarChart's x is a category string, not a Date. When your data is date-keyed, format the Date to a label string inside the x accessor — do NOT return the Date itself (that is a type error; only LineChart/AreaChart take a Date x).

```jsx
import { BarChart } from '@cascivo/charts'

const series = [{ id: 'signups', label: 'Signups', data: [
  { day: new Date('2026-07-01'), count: 12 },
  { day: new Date('2026-07-02'), count: 18 },
] }]
<BarChart
  series={series}
  x={(d) => d.day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
  y={(d) => d.count}
  xLabelEvery={2}
  title="Daily signups"
/>
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
