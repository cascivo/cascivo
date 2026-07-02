# Sunburst

**Category:** chart  
**Description:** Radial hierarchy — concentric rings where each node is an annular segment sized by value.

## When to use

- Showing a part-of-whole hierarchy across multiple levels
- A radial alternative to a Treemap for nested proportions

## When NOT to use

- A flat set of proportions — use PieChart
- Precise leaf comparison — use a Treemap or bars

## Related components

- **Treemap** (alternative): Use the rectilinear layout for dense leaves

## Accessibility rationale

Renders role="img" with a title and a fallback path/value table.

## Props

| Name          | Type       | Required | Default | Description                                                       |
| ------------- | ---------- | -------- | ------- | ----------------------------------------------------------------- |
| `data`        | `HierNode` | Yes      | —       | Root of the tree; leaves carry value, parents sum their children. |
| `title`       | `string`   | Yes      | —       | Title text for the component.                                     |
| `description` | `string`   | No       | —       | Supporting description text.                                      |
| `size`        | `number`   | No       | —       | Square shorthand (width === height).                              |
| `width`       | `number`   | No       | —       | Width of the component.                                           |
| `height`      | `number`   | No       | 300     | Height of the component.                                          |
| `tooltip`     | `boolean`  | No       | —       | Whether to show tooltips on hover.                                |
| `className`   | `string`   | No       | —       | Additional CSS class names merged onto the root element.          |
| `plain`       | `boolean`  | No       | false   | When true, renders a minimal variant without chart chrome.        |

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

### Sunburst

```jsx
import { Sunburst } from '@cascivo/charts'
;<Sunburst
  title="Disk usage"
  data={{
    label: 'root',
    children: [
      {
        label: 'src',
        children: [
          { label: 'app', value: 40 },
          { label: 'lib', value: 25 },
        ],
      },
      { label: 'docs', value: 15 },
    ],
  }}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Sunburst component (chart). Radial hierarchy — concentric rings where each node is an annular segment sized by value.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Sunburst is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate nodes)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
