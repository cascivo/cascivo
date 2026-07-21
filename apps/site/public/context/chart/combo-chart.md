# ComboChart

**Category:** chart  
**Description:** Combination bar + line chart on shared or dual y-axes.

## When to use

- Overlaying two related metrics with different scales (e.g. volume bars + rate line)
- Pairing categorical totals with a continuous trend on a dual y-axis

## When NOT to use

- Both metrics share a scale and type — use BarChart or LineChart
- More than two series of differing types — clarity breaks down

## Related components

- **BarChart** (alternative): Use when all series are categorical comparisons
- **LineChart** (alternative): Use when all series are trends on one scale

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `bars` | `{ label: string; value: number }[]` | Yes | — | Bar series data |
| `line` | `{ x: number; y: number }[]` | Yes | — | Line series data points |
| `title` | `string` | Yes | — | Title text for the component. |
| `description` | `string` | No | — | Supporting description text. |
| `secondAxis` | `boolean` | No | — | Render line on a secondary right y-axis |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 320 | Height of the component. |
| `tooltip` | `boolean` | No | — | Enable hover/keyboard tooltip |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `annotations` | `Annotation[]` | No | — | Reference lines, shaded bands, and markers drawn over the plot (e.g. a target/threshold line). |

## Tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`

## Examples

### Basic combo chart

```jsx
import { ComboChart } from '@cascivo/charts'

const bars = [{label:'Jan',value:100},{label:'Feb',value:120},{label:'Mar',value:90}]
const line = [{x:0,y:50},{x:1,y:70},{x:2,y:60}]
<ComboChart bars={bars} line={line} title="Sales vs Target" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo ComboChart component (chart). Combination bar + line chart on shared or dual y-axes.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

ComboChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate points)/Home/End (first/last point)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
