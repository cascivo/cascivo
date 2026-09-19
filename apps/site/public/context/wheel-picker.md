# WheelPicker

**Category:** inputs  
**Description:** iOS-style drum picker — a column of options that scrolls and snaps to a selection

## When to use

- Touch surfaces picking one value from a short, ordered, homogeneous range — an hour, a minute, a unit
- Mobile forms following the platform convention of a drum rather than a dropdown
- Inside a BottomSheet or ActionSheet, where a native select would open a competing overlay

## When NOT to use

- Long or unordered option lists, where scrolling to a value is slower than typing — use Combobox
- Desktop, pointer-first forms — use Select or NativeSelect
- Dates, which have their own affordances — use DatePicker or Calendar

## Anti-patterns

### The component is controlled; without a `value` it cannot scroll to the current selection or reflect an external change

**Bad:** `Rendering it uncontrolled and reading the value from the DOM`  
**Good:** `Pass `value` and `onValueChange``  
**Why:** The component is controlled; without a `value` it cannot scroll to the current selection or reflect an external change

### A listbox with no accessible name is announced only as a list, so the user cannot tell which field they are in

**Bad:** `Leaving `ariaLabel` off a wheel with no visible label`  
**Good:** `Label every column — "Hour", "Minute"`  
**Why:** A listbox with no accessible name is announced only as a list, so the user cannot tell which field they are in

## Related components

- **Select** (alternative): Pointer-first single selection on desktop
- **TimePicker** (alternative): Purpose-built time entry rather than a generic wheel
- **BottomSheet** (pairs-with): The usual host for a wheel on a phone screen

## Accessibility rationale

The column is a role="listbox" with role="option" rows, is focusable, and points aria-activedescendant at the selected row, so assistive technology tracks the selection without moving DOM focus per row. Selection follows focus — ArrowUp/ArrowDown, Home/End and PageUp/PageDown move the selection and scroll to match — which is the APG single-select listbox variant that needs no explicit commit; the pattern is deliberately not declared as `apgPattern: listbox` because that guard requires an Enter key this variant has nothing to bind. The wheel itself is CSS scroll-snap, so touch momentum and rubber-banding are the platform's own and remain correct under assistive gestures. Smooth scrolling is applied only under prefers-reduced-motion: no-preference. The selection band is decorative and aria-hidden.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `options` | `WheelPickerOption[]` | Yes | — | The rows of the wheel, in order |
| `value` | `string` | Yes | — | The selected option value; the component is controlled |
| `onValueChange` | `(value: string) => void` | Yes | — | Called with the new value when the wheel settles or a key moves the selection |
| `visibleCount` | `number` | No | 5 | How many rows are visible. Odd numbers keep the selection centred. |
| `itemHeight` | `number` | No | 36 | Row height in px. |
| `label` | `string` | No | — | Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated. Not rendered — screen readers only. |
| `ariaLabel` | `string` | No | — | Accessible label for the wheel — required when it has no visible label. Not rendered — screen readers only. |
| `className` | `string` | No | — | Additional CSS class names merged onto the root element. |

## Object types

### `WheelPickerOption`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | `string` | Yes | Value reported on change |
| `label` | `string` | Yes | Visible row text |

## Tokens

- `--cascivo-color-foreground`
- `--cascivo-color-text-muted`
- `--cascivo-border-subtle`
- `--cascivo-text-ui`
- `--cascivo-font-semibold`
- `--cascivo-radius-md`
- `--cascivo-ring-width`
- `--cascivo-ring-color`

## Examples

### Basic

Controlled — the caller owns the value.

```jsx
<WheelPicker
  ariaLabel="Hour"
  value={hour}
  onValueChange={setHour}
  options={[
    { value: '09', label: '09' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
  ]}
/>
```

### Taller wheel

Shows more rows around the selection.

```jsx
<WheelPicker ariaLabel="Minute" value={minute} onValueChange={setMinute} options={minutes} visibleCount={7} />
```

### Several columns

Compose one wheel per field; each column is independently operable.

```jsx
<Flex gap="0">
  <WheelPicker ariaLabel="Hour" value={hour} onValueChange={setHour} options={hours} />
  <WheelPicker ariaLabel="Minute" value={minute} onValueChange={setMinute} options={minutes} />
</Flex>
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| visibleCount / itemHeight | flexible | Wheel geometry is caller-controlled (defaults 5 rows of 36px) |
| value / onValueChange | strict | Always controlled — the component never holds the value itself |
| wheel mechanism | strict | Always CSS scroll-snap; there is no JavaScript-driven transform mode |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo WheelPicker component (inputs). iOS-style drum picker — a column of options that scrolls and snaps to a selection

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

WheelPicker is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-foreground, --cascivo-color-text-muted, --cascivo-border-subtle, --cascivo-text-ui, --cascivo-font-semibold, --cascivo-radius-md, --cascivo-ring-width, --cascivo-ring-color

Accessibility: role "listbox", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/Home/End/PageUp/PageDown/Tab. Keep it AA.

Do not change (strict): value / onValueChange — Always controlled — the component never holds the value itself; wheel mechanism — Always CSS scroll-snap; there is no JavaScript-driven transform mode
Flexible: visibleCount / itemHeight.

Do not invent props, tokens, or global viewport media queries.
```
