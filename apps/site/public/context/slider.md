# Slider

**Category:** inputs  
**Description:** Range input for selecting a value within bounds

## When to use

- Selecting a value within a continuous or stepped numeric range where approximate adjustment is fine
- Settings like volume, brightness, or opacity where dragging gives instant feedback
- When the bounds (min/max) matter more than entering an exact figure

## When NOT to use

- A precise numeric value must be typed — use NumberInput
- Picking a discrete rating on a small scale where stars/icons read better — use RatingGroup

## Anti-patterns

### A huge range makes a single value impossible to hit by dragging; type the exact number instead

**Bad:** `<Slider label="Price" min={0} max={1000000} />`  
**Good:** `<NumberInput label="Price" />`  
**Why:** A huge range makes a single value impossible to hit by dragging; type the exact number instead

## Related components

- **NumberInput** (alternative): Use when an exact, typed numeric value is required
- **RatingGroup** (alternative): Use for small discrete rating scales rather than a continuous range

## Accessibility rationale

Renders a native <input type="range"> so the slider role, value announcements, and full arrow/Home/End keyboard support come from the platform without custom ARIA.

## Props

| Name           | Type      | Required | Default | Description                                                        |
| -------------- | --------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`        | `string`  | No       | —       | Text label for the control.                                        |
| `min`          | `number`  | No       | 0       | Minimum allowed value.                                             |
| `max`          | `number`  | No       | 100     | Maximum allowed value.                                             |
| `step`         | `number`  | No       | 1       | Increment between allowed values.                                  |
| `value`        | `number`  | No       | —       | The controlled value.                                              |
| `defaultValue` | `number`  | No       | —       | The initial value when uncontrolled.                               |
| `disabled`     | `boolean` | No       | false   | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-accent`
- `--cascivo-color-border-strong`
- `--cascivo-color-surface`
- `--cascivo-radius-full`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Slider label="Volume" defaultValue={50} />
```

### Stepped

```jsx
<Slider label="Rating" min={0} max={5} step={1} />
```

## Boundaries

| Area         | Level    | Note                                                                                   |
| ------------ | -------- | -------------------------------------------------------------------------------------- |
| token names  | strict   | Track and thumb colors must resolve to --cascivo-color-\* / radius / focus-ring tokens |
| min/max/step | flexible | Consumer-defined bounds and increment                                                  |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Slider component (inputs). Range input for selecting a value within bounds

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Slider is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent, --cascivo-color-border-strong, --cascivo-color-surface, --cascivo-radius-full, --cascivo-focus-ring

Accessibility: role "slider", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End. Keep it AA.

Do not change (strict): token names — Track and thumb colors must resolve to --cascivo-color-* / radius / focus-ring tokens
Flexible: min/max/step.

Do not invent props, tokens, or global viewport media queries.
```
