# Calendar

**Category:** chart  
**Description:** Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).

## When to use

- Showing a daily value over weeks/months (activity, contributions)
- Spotting weekly/seasonal patterns at a glance

## When NOT to use

- Precise daily values — use a LineChart
- Non-date categories — use Heatmap

## Related components

- **Heatmap** (alternative): Use for arbitrary x/y category grids

## Accessibility rationale

Renders role="img" with a title and a fallback day/value table.

## Props

| Name          | Type               | Required | Default | Description                                                                                                              |
| ------------- | ------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `data`        | `CalendarDatum[]`  | Yes      | —       | Days: { day: string \| Date, value }.                                                                                    |
| `title`       | `string`           | Yes      | —       | Title text for the component.                                                                                            |
| `description` | `string`           | No       | —       | Supporting description text.                                                                                             |
| `from`        | `string \| Date`   | No       | —       | Range start (defaults to min day).                                                                                       |
| `to`          | `string \| Date`   | No       | —       | Range end (defaults to max day).                                                                                         |
| `width`       | `number`           | No       | —       | Width of the component.                                                                                                  |
| `height`      | `number`           | No       | 160     | Height of the component.                                                                                                 |
| `tooltip`     | `boolean`          | No       | —       | Whether to show tooltips on hover.                                                                                       |
| `className`   | `string`           | No       | —       | Additional CSS class names merged onto the root element.                                                                 |
| `plain`       | `boolean`          | No       | false   | When true, renders a minimal variant without chart chrome.                                                               |
| `visualMap`   | `VisualMapOptions` | No       | —       | Map day value → CVD-safe colour (continuous or piecewise) via a keyboard-operable legend that filters the visible range. |

## Tokens

- `--cascivo-chart-2`

## Examples

### Contribution calendar

```jsx
import { Calendar } from '@cascivo/charts'
;<Calendar
  title="Activity"
  data={[
    { day: '2026-01-01', value: 3 },
    { day: '2026-01-02', value: 7 },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Calendar component (chart). Calendar heatmap — a week-column grid of day cells colored by value (GitHub-style).

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Calendar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-2

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart)/ArrowLeft/ArrowRight (navigate days)/Escape (clear focus). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
