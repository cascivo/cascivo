# Heatmap

**Category:** chart  
**Description:** Two-dimensional heatmap with band scales and color-mix cell interpolation.

## When to use

- Showing magnitude across two categorical dimensions as a color-coded matrix
- Spotting patterns, clusters, or hotspots in dense grid data

## When NOT to use

- Reading precise values — color encoding is approximate
- A single-dimension comparison — use BarChart

## Related components

- **Treemap** (alternative): Use for part-to-whole hierarchical magnitude rather than a grid

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name          | Type                                        | Required | Default | Description                                                                                                               |
| ------------- | ------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `data`        | `{ x: string; y: string; value: number }[]` | Yes      | —       | Array of x/y/value triples                                                                                                |
| `title`       | `string`                                    | Yes      | —       | Title text for the component.                                                                                             |
| `description` | `string`                                    | No       | —       | Supporting description text.                                                                                              |
| `width`       | `number`                                    | No       | —       | Width of the component.                                                                                                   |
| `height`      | `number`                                    | No       | 320     | Height of the component.                                                                                                  |
| `className`   | `string`                                    | No       | —       | Additional CSS class names merged onto the root element.                                                                  |
| `plain`       | `boolean`                                   | No       | false   | Marks only — no axes, grid lines, or legend. For micro/inline charts.                                                     |
| `visualMap`   | `VisualMapOptions`                          | No       | —       | Map cell value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range. |
| `toolbox`     | `boolean \| ToolboxOptions`                 | No       | —       | Render a keyboard-reachable toolbox — PNG/SVG export, a data-view table toggle, and restore (reset the visualMap filter). |

## Tokens

- `--cascivo-chart-1`
- `--cascivo-color-neutral-100`

## Examples

### Basic heatmap

```jsx
import { Heatmap } from '@cascivo/charts'

const data = [
  {x:'Mon',y:'AM',value:10},{x:'Mon',y:'PM',value:20},
  {x:'Tue',y:'AM',value:15},{x:'Tue',y:'PM',value:5},
]
<Heatmap data={data} title="Activity" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Heatmap component (chart). Two-dimensional heatmap with band scales and color-mix cell interpolation.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Heatmap is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-color-neutral-100

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
