# Boxplot

**Category:** chart  
**Description:** Box-and-whisker plot with five-number summary and outlier dots per series.

## When to use

- Comparing the distribution spread, median, and quartiles across groups
- Surfacing outliers and skew in statistical data

## When NOT to use

- Showing the full shape of a single distribution — use Histogram
- Comparing single aggregate values — use BarChart

## Related components

- **Histogram** (alternative): Use to show the full frequency shape of one distribution
- **BarChart** (alternative): Use when only aggregate values matter, not spread

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `{ id: string; label: string; values: number[] }[]` | Yes | — | Array of series each with raw numeric values |
| `title` | `string` | Yes | — | Title text for the component. |
| `description` | `string` | No | — | Supporting description text. |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 320 | Height of the component. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

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

### Basic boxplot

```jsx
import { Boxplot } from '@cascivo/charts'

const series = [
  { id: 'a', label: 'Group A', values: [1,2,3,4,5,6,7,8,9,10] },
  { id: 'b', label: 'Group B', values: [3,5,6,7,8,8,9,9,10,15] },
]
<Boxplot series={series} title="Comparison" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Boxplot component (chart). Box-and-whisker plot with five-number summary and outlier dots per series.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Boxplot is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
