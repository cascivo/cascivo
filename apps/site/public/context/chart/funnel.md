# Funnel

**Category:** chart  
**Description:** Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.

## When to use

- Showing drop-off across the ordered stages of a process (signup, checkout)
- Communicating stage-to-stage conversion at a glance

## When NOT to use

- Stages are not strictly decreasing — use BarChart
- Showing a trend over time — use LineChart

## Related components

- **BarChart** (alternative): Use when stages aren’t monotonically decreasing

## Accessibility rationale

Renders with role="img" and requires a title prop for screen reader labeling.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `FunnelStage[]` | Yes | — | Ordered stages (descending): { id, label, value, color? }. |
| `title` | `string` | Yes | — | Chart title (also used as aria-label). |
| `description` | `string` | No | — | Subtitle below the title. |
| `width` | `number` | No | — | Width of the component. |
| `height` | `number` | No | 320 | Height of the component. |
| `showConversion` | `boolean` | No | false | Append each stage’s % of the first stage to its label. |
| `tooltip` | `boolean` | No | — | Enable hover tooltip. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |
| `plain` | `boolean` | No | false | Marks only — no labels. For micro/inline charts. |

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

### Signup conversion funnel

```jsx
import { Funnel } from '@cascivo/charts'

<Funnel
  title="Signup funnel"
  showConversion
  data={[
    { id: 'visit', label: 'Visited', value: 8200 },
    { id: 'signup', label: 'Signed up', value: 3100 },
    { id: 'active', label: 'Activated', value: 1400 },
    { id: 'paid', label: 'Paid', value: 520 },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Funnel component (chart). Vertical conversion funnel — each stage is a trapezoid narrowing toward the next, with optional conversion labels.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Funnel is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-chart-2, --cascivo-chart-3, --cascivo-chart-4, --cascivo-chart-5, --cascivo-chart-6, --cascivo-chart-7, --cascivo-chart-8

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate stages)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
