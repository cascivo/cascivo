# BubbleChart

**Category:** chart  
**Description:** Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.

## When to use

- Plotting three dimensions at once — x, y, and a size-encoded magnitude
- Comparing entities where relative scale matters alongside position

## When NOT to use

- Showing only a 2D correlation — use ScatterChart
- Comparing many small magnitudes where size differences are unreadable

## Related components

- **ScatterChart** (alternative): Use when there is no third size dimension to encode

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `series` | `{ name: string; data: { x: number; y: number; size: number }[] }[]` | Yes | — | The data series to plot. |
| `title` | `string` | Yes | — | Title text for the component. |
| `description` | `string` | No | — | Supporting description text. |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 320 | Height of the component. |
| `tooltip` | `boolean` | No | — | Enable hover/keyboard tooltip |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no axes, grid lines, or legend. For micro/inline charts. |
| `glyph` | `GlyphShape \| ((d, seriesId) => GlyphShape)` | No | — | Point glyph shape (circle/square/diamond/triangle/cross/star) — a fixed shape or a function to encode a category by shape. |

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

### Basic bubble chart

```jsx
import { BubbleChart } from '@cascivo/charts'

const series = [{ name: 'Group A', data: [{x:1,y:2,size:10},{x:3,y:4,size:30}] }]
<BubbleChart series={series} title="Bubble" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo BubbleChart component (chart). Bubble chart mapping x, y, and size dimensions; radius is area-proportional via sqrt scale.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

BubbleChart is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate points)/Home/End (first/last point)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
