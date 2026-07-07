# Sankey

**Category:** chart  
**Description:** Flow diagram — ranked nodes connected by throughput-sized link ribbons.

## When to use

- Showing flow/throughput between stages or categories
- Visualizing where volume splits and merges

## When NOT to use

- Strict ordered stages with one path — use Funnel
- Arbitrary node/edge graphs — use @cascivo/flow

## Related components

- **Funnel** (alternative): Use for a single decreasing path

## Accessibility rationale

Renders role="img" with a title and a fallback from/to/value table.

## Props

| Name          | Type           | Required | Default | Description                                                |
| ------------- | -------------- | -------- | ------- | ---------------------------------------------------------- |
| `nodes`       | `SankeyNode[]` | Yes      | —       | Nodes: { id, label, color? }.                              |
| `links`       | `SankeyLink[]` | Yes      | —       | Links: { source, target, value }.                          |
| `title`       | `string`       | Yes      | —       | Title text for the component.                              |
| `description` | `string`       | No       | —       | Supporting description text.                               |
| `width`       | `number`       | No       | —       | Width of the component.                                    |
| `height`      | `number`       | No       | 320     | Height of the component.                                   |
| `tooltip`     | `boolean`      | No       | —       | Whether to show tooltips on hover.                         |
| `className`   | `string`       | No       | —       | Additional CSS class names merged onto the root element.   |
| `plain`       | `boolean`      | No       | false   | When true, renders a minimal variant without chart chrome. |

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

### Sankey flow

```jsx
import { Sankey } from '@cascivo/charts'
;<Sankey
  title="Traffic flow"
  nodes={[
    { id: 'a', label: 'Search' },
    { id: 'b', label: 'Home' },
    { id: 'c', label: 'Signup' },
  ]}
  links={[
    { source: 'a', target: 'b', value: 30 },
    { source: 'b', target: 'c', value: 12 },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Sankey component (chart). Flow diagram — ranked nodes connected by throughput-sized link ribbons.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sankey is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate nodes)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
