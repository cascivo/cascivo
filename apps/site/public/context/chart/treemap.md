# Treemap

**Category:** chart  
**Description:** Squarified treemap for visualizing part-to-whole hierarchical data.

## When to use

- Showing part-to-whole proportions across many segments in a compact area
- Visualising hierarchical magnitude where slice size encodes value

## When NOT to use

- Few segments where a simple split reads better — use PieChart for ≤5
- Precise value comparison — area encoding is approximate

## Related components

- **PieChart** (alternative): Use for part-of-whole with five or fewer flat segments
- **Heatmap** (alternative): Use for magnitude across a two-dimensional grid

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name          | Type                                             | Required | Default | Description                                                           |
| ------------- | ------------------------------------------------ | -------- | ------- | --------------------------------------------------------------------- |
| `data`        | `{ id: string; label: string; value: number }[]` | Yes      | —       | The hierarchical data to render as nested rectangles.                 |
| `title`       | `string`                                         | Yes      | —       | Title text for the component.                                         |
| `description` | `string`                                         | No       | —       | Supporting description text.                                          |
| `width`       | `number`                                         | No       | —       | Width of the component.                                               |
| `height`      | `number`                                         | No       | 320     | Height of the component.                                              |
| `className`   | `string`                                         | No       | —       | Additional CSS class names merged onto the root element.              |
| `plain`       | `boolean`                                        | No       | false   | Marks only — no axes, grid lines, or legend. For micro/inline charts. |

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

### Basic treemap

```jsx
import { Treemap } from '@cascivo/charts'

const data = [
  {id:'a',label:'Alpha',value:40},
  {id:'b',label:'Beta',value:25},
  {id:'c',label:'Gamma',value:20},
  {id:'d',label:'Delta',value:15},
]
<Treemap data={data} title="Market share" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Treemap component (chart). Squarified treemap for visualizing part-to-whole hierarchical data.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Treemap is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
