# Gauge

**Category:** chart  
**Description:** A speedometer gauge — a value arc over a min–max sweep with threshold zones, ticks, and a needle.

## When to use

- A single value against a range with a needle and threshold zones
- Dashboard KPIs where a speedometer metaphor aids quick reading

## When NOT to use

- Several progress values — use RadialBar
- A simple bar against thresholds — use Meter

## Related components

- **Meter** (alternative): Use a linear bar for a single value against thresholds
- **RadialBar** (alternative): Use concentric rings for multiple progress values

## Accessibility rationale

Renders with role="img"; the value and range are in the fallback table.

## Props

| Name          | Type                                | Required | Default | Description                                                |
| ------------- | ----------------------------------- | -------- | ------- | ---------------------------------------------------------- |
| `value`       | `number`                            | Yes      | —       | The value the needle points to.                            |
| `min`         | `number`                            | No       | 0       | Minimum allowed value.                                     |
| `max`         | `number`                            | No       | 100     | Maximum allowed value.                                     |
| `thresholds`  | `{ upTo: number; color: string }[]` | No       | —       | Coloured zones from min upward; the last should reach max. |
| `unit`        | `string`                            | No       | —       | Suffix after the centre value.                             |
| `sweep`       | `number`                            | No       | 270     | Total sweep angle in degrees (270 = a speedometer arc).    |
| `ticks`       | `number`                            | No       | 5       | Major tick count.                                          |
| `title`       | `string`                            | Yes      | —       | Chart title (also aria-label).                             |
| `description` | `string`                            | No       | —       | Supporting description text.                               |
| `width`       | `number`                            | No       | —       | Width of the component.                                    |
| `height`      | `number`                            | No       | 240     | Height of the component.                                   |
| `className`   | `string`                            | No       | —       | Additional CSS class names merged onto the root element.   |
| `plain`       | `boolean`                           | No       | false   | Marks only — no ticks/labels. For micro/inline charts.     |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-foreground`
- `--cascivo-chart-grid`

## Examples

### Speedometer with zones

```jsx
import { Gauge } from '@cascivo/charts'
;<Gauge
  title="CPU load"
  value={72}
  unit="%"
  thresholds={[
    { upTo: 50, color: 'var(--cascivo-chart-2)' },
    { upTo: 80, color: 'var(--cascivo-chart-3)' },
    { upTo: 100, color: 'var(--cascivo-chart-4)' },
  ]}
/>
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Gauge component (chart). A speedometer gauge — a value arc over a min–max sweep with threshold zones, ticks, and a needle.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Gauge is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-foreground, --cascivo-chart-grid

Accessibility: role "img", WCAG 2.1-AA, keyboard: Tab (focus chart). Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
