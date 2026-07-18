# Bullet

**Category:** chart  
**Description:** Bullet chart with background range bands, measure bar, and target tick.

## When to use

- Showing a single measure against a target with qualitative range bands
- Compact dashboard KPIs where space for a full gauge is limited

## When NOT to use

- Displaying a metric without a target or comparative range — use Kpi
- Showing a simple completion or rated value — use Meter

## Related components

- **Meter** (alternative): Use for a rated value within a range without a target marker
- **Kpi** (alternative): Use for a single headline metric with a delta

## Accessibility rationale

Renders with role="img" and requires a label prop for screen reader labeling.

## Props

| Name        | Type       | Required | Default | Description                                              |
| ----------- | ---------- | -------- | ------- | -------------------------------------------------------- |
| `value`     | `number`   | Yes      | —       | Current measure value                                    |
| `target`    | `number`   | Yes      | —       | Target marker value                                      |
| `ranges`    | `number[]` | Yes      | —       | Qualitative range breakpoints (sorted ascending)         |
| `label`     | `string`   | Yes      | —       | Text label for the control.                              |
| `min`       | `number`   | No       | 0       | Minimum allowed value.                                   |
| `max`       | `number`   | No       | —       | Domain maximum (defaults to last range)                  |
| `width`     | `number`   | No       | 300     | Width of the component.                                  |
| `height`    | `number`   | No       | 40      | Height of the component.                                 |
| `className` | `string`   | No       | —       | Additional CSS class names merged onto the root element. |

## Tokens

- `--cascivo-chart-1`
- `--cascivo-color-neutral-200`
- `--cascivo-color-neutral-300`
- `--cascivo-color-neutral-400`

## Examples

### Basic bullet chart

```jsx
import { Bullet } from '@cascivo/charts'
;<Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Bullet component (chart). Bullet chart with background range bands, measure bar, and target tick.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Bullet is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1, --cascivo-color-neutral-200, --cascivo-color-neutral-300, --cascivo-color-neutral-400

Accessibility: role "img", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
