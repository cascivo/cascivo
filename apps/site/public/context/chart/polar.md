# Polar

**Category:** chart  
**Description:** A polar coordinate plot — categories around the circle, value as radius. Bars (a rose), or a polar line/area.

## When to use

- Cyclical/directional categories where the circle is meaningful (wind, hours, months)
- A rose chart comparing a value across directions

## When NOT to use

- Precise magnitude comparison — use BarChart
- Multi-metric profiles on shared axes — use Radar

## Related components

- **Radar** (alternative): Use to compare several series across the same axes
- **RadialBar** (alternative): Use concentric rings for progress-to-goal

## Accessibility rationale

Renders with role="img"; values are in the fallback table.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `PolarDatum[]` | Yes | — | One entry per category: { label, value, color? }. |
| `title` | `string` | Yes | — | Chart title (also aria-label). |
| `description` | `string` | No | — | Supporting description text. |
| `mode` | `'bar' \| 'line' \| 'area'` | No | bar | Bars (rose), a polar line, or a filled polar area. |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 320 | Height of the component. |
| `rings` | `number` | No | 4 | Radial ring count. |
| `max` | `number` | No | — | Domain top (full radius). Defaults to the largest value. |
| `tooltip` | `boolean` | No | — | Enable hover tooltip. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no rings or labels. For micro/inline charts. |

## Tokens

- `--cascivo-chart-1`
- `--cascivo-chart-2`
- `--cascivo-chart-3`
- `--cascivo-chart-4`
- `--cascivo-chart-5`
- `--cascivo-chart-6`
- `--cascivo-chart-7`
- `--cascivo-chart-8`
- `--cascivo-chart-grid`

## Examples

### Wind rose

```jsx
import { Polar } from '@cascivo/charts'

<Polar
  title="Wind by direction"
  mode="bar"
  tooltip
  data={[
    { label: 'N', value: 12 },
    { label: 'E', value: 8 },
    { label: 'S', value: 5 },
    { label: 'W', value: 15 },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Polar component (chart). A polar coordinate plot — categories around the circle, value as radius. Bars (a rose), or a polar line/area.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Polar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8, --cascivo-chart-grid

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
