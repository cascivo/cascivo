# Stream

**Category:** chart  
**Description:** Streamgraph — stacked areas on a centered (silhouette) flowing baseline.

## When to use

- Showing how several series ebb and flow over time as proportions of a whole
- An organic, aesthetic alternative to a stacked area chart

## When NOT to use

- Reading precise values — use LineChart or AreaChart
- Few categories with exact comparison — use BarChart

## Related components

- **AreaChart** (alternative): Use a zero-baseline stacked area for precise reading

## Accessibility rationale

Renders role="img" with a title and a fallback data table.

## Props

| Name          | Type                     | Required | Default    | Description                                                           |
| ------------- | ------------------------ | -------- | ---------- | --------------------------------------------------------------------- |
| `series`      | `StreamSeries[]`         | Yes      | —          | Series, each with values[] aligned to categories.                     |
| `categories`  | `(string \| number)[]`   | Yes      | —          | X-axis labels aligned with each series values.                        |
| `title`       | `string`                 | Yes      | —          | Title text for the component.                                         |
| `description` | `string`                 | No       | —          | Supporting description text.                                          |
| `offset`      | `'silhouette' \| 'zero'` | No       | silhouette | silhouette centers the stack (streamgraph); zero is a baseline stack. |
| `curve`       | `Curve`                  | No       | basis      | Interpolation curve.                                                  |
| `width`       | `number`                 | No       | —          | Width of the component.                                               |
| `height`      | `number`                 | No       | 300        | Height of the component.                                              |
| `legend`      | `boolean`                | No       | —          | Whether to show the legend.                                           |
| `tooltip`     | `boolean`                | No       | —          | Whether to show tooltips on hover.                                    |
| `className`   | `string`                 | No       | —          | Additional CSS class names merged onto the root element.              |
| `plain`       | `boolean`                | No       | false      | When true, renders a minimal variant without chart chrome.            |

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

### Streamgraph

```jsx
import { Stream } from '@cascivo/charts'
;<Stream
  title="Topics over time"
  categories={['Jan', 'Feb', 'Mar', 'Apr']}
  series={[
    { id: 'a', label: 'A', values: [4, 6, 5, 8] },
    { id: 'b', label: 'B', values: [2, 3, 7, 4] },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Stream component (chart). Streamgraph — stacked areas on a centered (silhouette) flowing baseline.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Stream is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
