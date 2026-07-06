# RadialBar

**Category:** chart  
**Description:** Concentric radial bars (a circular gauge family) — each datum is a ring whose sweep is proportional to its value.

## When to use

- Showing a few progress-to-goal values in a compact circular form
- A dashboard KPI cluster where each metric is a ring toward its target

## When NOT to use

- Comparing many categories precisely — use BarChart
- Part-of-whole of a single total — use PieChart

## Related components

- **Meter** (alternative): Use for a single value against thresholds
- **PieChart** (alternative): Use for part-of-whole proportions of one total

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `RadialBarDatum[]` | Yes | — | One ring per datum: { id, label, value, color? }. |
| `title` | `string` | Yes | — | Chart title (also used as aria-label). |
| `description` | `string` | No | — | Subtitle below the title. |
| `size` | `number` | No | — | Square shorthand (width === height). Explicit width/height win. |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 300 | Height of the component. |
| `max` | `number` | No | — | Domain top — the value a full sweep represents. Defaults to the largest datum. |
| `sweep` | `number` | No | 270 | Sweep angle in degrees (270 = a gauge arc; 360 = a full ring). |
| `centerValue` | `string` | No | — | Text in the hole. |
| `centerLabel` | `string` | No | — | Caption below centerValue. |
| `centerSlot` | `ReactNode` | No | — | Arbitrary hole content; wins over centerValue/centerLabel. |
| `tooltip` | `boolean` | No | — | Enable hover tooltip. |
| `legend` | `boolean` | No | — | Show ring legend. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no legend. For micro/inline charts. |

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

### Goal progress rings

```jsx
import { RadialBar } from '@cascivo/charts'

<RadialBar
  title="Quarterly goals"
  max={100}
  centerValue="72%"
  centerLabel="On track"
  data={[
    { id: 'rev', label: 'Revenue', value: 84 },
    { id: 'nps', label: 'NPS', value: 61 },
    { id: 'ret', label: 'Retention', value: 72 },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo RadialBar component (chart). Concentric radial bars (a circular gauge family) — each datum is a ring whose sweep is proportional to its value.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

RadialBar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8, --cascivo-chart-grid

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate rings)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
