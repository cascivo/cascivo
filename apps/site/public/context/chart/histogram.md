# Histogram

**Category:** chart  
**Description:** Frequency histogram using Freedman–Diaconis binning with hover tooltips.

## When to use

- Showing the frequency distribution of a single continuous variable
- Revealing the shape, spread, and skew of binned numeric data

## When NOT to use

- Comparing discrete labelled categories — use BarChart
- Comparing distribution summaries across groups — use Boxplot

## Related components

- **BarChart** (alternative): Use for discrete categorical values, not binned ranges
- **Boxplot** (alternative): Use to compare distribution summaries across multiple groups

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name          | Type                                          | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `number[]`                                    | Yes      | —       | Array of numeric values to bin                                                                                                                                                                                                                                                                                                                                                                |
| `bins`        | `number`                                      | No       | —       | Explicit bin count (defaults to Freedman–Diaconis)                                                                                                                                                                                                                                                                                                                                            |
| `title`       | `string`                                      | Yes      | —       | Title text for the component.                                                                                                                                                                                                                                                                                                                                                                 |
| `label`       | `string`                                      | Yes      | —       | X-axis label                                                                                                                                                                                                                                                                                                                                                                                  |
| `description` | `string`                                      | No       | —       | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                  |
| `width`       | `number`                                      | No       | —       | Fixed SVG width in px. ⚠ **Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver; there is no correct pixel number in a responsive grid. A fixed width is clamped to the container (max-inline-size: 100%) so it can never overflow its card, but it also stops the chart growing. `useChartSize` is NOT needed for this — charts call it internally. |
| `height`      | `number`                                      | No       | 300     | SVG height in px. Unlike `width`, height does NOT track the container — this is the knob you set to change the chart's aspect.                                                                                                                                                                                                                                                                |
| `className`   | `string`                                      | No       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                      |
| `plain`       | `boolean`                                     | No       | false   | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                                                                                                                                                                                                                                                                                         |
| `format`      | `(value: number \| string \| Date) => string` | No       | —       | Format each X-axis tick label.                                                                                                                                                                                                                                                                                                                                                                |

## Tokens

- `--cascivo-chart-1`

## Examples

### Basic histogram

```jsx
import { Histogram } from '@cascivo/charts'

const data = Array.from({length:100}, () => Math.random() * 100)
<Histogram data={data} title="Distribution" label="Value" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Histogram component (chart). Frequency histogram using Freedman–Diaconis binning with hover tooltips.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Histogram is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
