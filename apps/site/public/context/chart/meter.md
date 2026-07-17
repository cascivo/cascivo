# Meter

**Category:** chart  
**Description:** Progress meter in bar or gauge variant with threshold coloring.

## When to use

- Showing a rated or gauged value within a known min/max range
- Surfacing threshold-based status (e.g. CPU, disk, score) as a bar or gauge

## When NOT to use

- Showing task completion progress — use a ProgressBar
- Comparing a value against a target with range bands — use Bullet

## Related components

- **Bullet** (alternative): Use when a target marker and qualitative bands are needed
- **Kpi** (alternative): Use for a headline metric without a bounded range

## Accessibility rationale

Renders with role="meter" exposing min, max, and current value to assistive tech.

## Props

| Name         | Type               | Required | Default | Description                       |
| ------------ | ------------------ | -------- | ------- | --------------------------------- |
| `value`      | `number`           | Yes      | —       | Current value                     |
| `label`      | `string`           | Yes      | —       | Text label for the control.       |
| `min`        | `number`           | No       | 0       | Minimum allowed value.            |
| `max`        | `number`           | No       | 100     | Maximum allowed value.            |
| `variant`    | `'bar' \| 'gauge'` | No       | bar     | Selects the visual style variant. |
| `thresholds` | `MeterThresholds`  | No       | —       | Color breakpoints                 |
| `width`      | `number`           | No       | —       | Width of the component.           |
| `height`     | `number`           | No       | —       | Height of the component.          |

## Tokens

- `--cascivo-chart-1`

## Examples

### Basic meter

```jsx
import { Meter } from '@cascivo/charts'
;<Meter value={72} label="CPU usage" />
```

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Meter component (chart). Progress meter in bar or gauge variant with threshold coloring.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Meter is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-chart-1

Accessibility: role "meter", WCAG 2.1-AA. Keep it AA.

Do not invent props, tokens, or global viewport media queries.
```
