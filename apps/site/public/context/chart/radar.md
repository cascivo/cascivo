# Radar

**Category:** chart  
**Description:** Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.

## When to use

- Comparing several entities across the same set of quantitative dimensions
- Showing a multi-attribute profile or balance at a glance

## When NOT to use

- Precise value reading — polar axes distort comparison
- More than a few series — overlapping polygons become unreadable

## Related components

- **BarChart** (alternative): Use when precise per-dimension comparison matters

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `axes` | `string[]` | Yes | — | Axis labels (one per dimension) |
| `series` | `{ id: string; label: string; values: number[] }[]` | Yes | — | One value per axis per series |
| `max` | `number` | No | — | Maximum value (defaults to data max) |
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

### Basic radar chart

```jsx
import { Radar } from '@cascivo/charts'

const axes = ['Speed','Power','Range','Efficiency','Cost']
const series = [{ id:'a', label:'Model A', values:[80,70,60,90,50] }]
<Radar axes={axes} series={series} title="Model comparison" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Radar component (chart). Radar / spider chart with polar grid rings, spokes, and multi-series polygon overlays.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Radar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
