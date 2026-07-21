# PieChart

**Category:** chart  
**Description:** Pie or donut chart with hover segments and optional legend.

## When to use

- Showing part-of-whole proportions with five or fewer slices
- A single composition at one point in time

## When NOT to use

- Comparing precise values or many categories — use BarChart
- Showing change over time — use LineChart or AreaChart

## Related components

- **BarChart** (alternative): Use when comparing more than five categories or precise values
- **Treemap** (alternative): Use for part-to-whole with many or hierarchical segments

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name            | Type                                                               | Required | Default | Description                                                                                                                               |
| --------------- | ------------------------------------------------------------------ | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `data`          | `PieChartDatum[]`                                                  | Yes      | —       | Array of { id, label, value, color? } datums. Optional per-datum `color` (any CSS color) overrides the positional palette for that slice. |
| `title`         | `string`                                                           | Yes      | —       | Title text for the component.                                                                                                             |
| `description`   | `string`                                                           | No       | —       | Supporting description text.                                                                                                              |
| `donut`         | `boolean`                                                          | No       | —       | Render as donut chart                                                                                                                     |
| `width`         | `number`                                                           | No       | —       | Width of the component.                                                                                                                   |
| `height`        | `number`                                                           | No       | 300     | Height of the component.                                                                                                                  |
| `size`          | `number`                                                           | No       | —       | Square shorthand: sets width === height. Explicit width/height win.                                                                       |
| `thickness`     | `number`                                                           | No       | —       | Ring width in px (donut only); defaults to 0.4 × radius.                                                                                  |
| `innerRadius`   | `number`                                                           | No       | —       | Inner radius in px (donut only); takes precedence over thickness; clamped to [0, outerRadius).                                            |
| `centerValue`   | `string`                                                           | No       | —       | Center value text rendered in the donut hole (donut only).                                                                                |
| `centerLabel`   | `string`                                                           | No       | —       | Center label text rendered below the value (donut only).                                                                                  |
| `centerSlot`    | `ReactNode`                                                        | No       | —       | Arbitrary content for the donut hole; takes precedence over centerValue/centerLabel.                                                      |
| `emptyLabel`    | `string`                                                           | No       | —       | Visible placeholder text when data is empty. Defaults to the i18n "No data".                                                              |
| `tooltipFormat` | `(p: ChartPoint) => string`                                        | No       | —       | Custom tooltip formatter. Defaults to "value (pct%)" in the slice color.                                                                  |
| `legend`        | `boolean`                                                          | No       | —       | Whether to show the legend.                                                                                                               |
| `className`     | `string`                                                           | No       | —       | Additional CSS class names merged onto the root element.                                                                                  |
| `plain`         | `boolean`                                                          | No       | false   | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                     |
| `labels`        | `boolean \| { format?: (v: number) => string; position?: string }` | No       | —       | Print each value as a label on the mark (collision-aware, decorative/aria-hidden).                                                        |
| `onSelect`      | `(point: ChartPoint) => void`                                      | No       | —       | Fired when a point is clicked or activated (Enter/Space) — for drill-down.                                                                |

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

### Basic pie chart

```jsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  data={[
    { label: 'A', value: 60 },
    { label: 'B', value: 40 },
  ]}
  title="Market share"
/>
```

### Donut with center total and custom thickness

```jsx
import { PieChart } from '@cascivo/charts'
;<PieChart
  donut
  size={220}
  thickness={28}
  centerValue="142"
  centerLabel="Total tasks"
  data={[
    { id: 'done', label: 'Done', value: 92, color: 'var(--cascivo-color-success)' },
    { id: 'wip', label: 'In progress', value: 34, color: 'var(--cascivo-color-warning)' },
    { id: 'blocked', label: 'Blocked', value: 16, color: 'var(--cascivo-color-destructive)' },
  ]}
  title="Task status"
/>
```

### Percentage tooltip + empty state

```jsx
import { PieChart } from '@cascivo/charts'

// Default tooltip shows "value (pct%)" in the slice color; pass tooltipFormat to override.
<PieChart data={[{id:'a',label:'A',value:60},{id:'b',label:'B',value:40}]} title="Share" />

// Empty data renders a visible "No data" placeholder (override via emptyLabel).
<PieChart data={[]} title="Share" emptyLabel="Nothing tracked yet" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PieChart component (chart). Pie or donut chart with hover segments and optional legend.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PieChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
