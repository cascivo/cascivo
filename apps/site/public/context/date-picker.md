# DatePicker

**Category:** inputs  
**Description:** An accessible date-picker with a calendar popover.

## When to use

- Picking a single calendar date in a form where a visual month grid helps (due dates, bookings)
- Date entry that benefits from min/max constraints and locale-aware formatting and week start

## When NOT to use

- Selecting a time of day — use TimePicker
- Free-form or approximate dates where a plain Input is faster, or a date already known by typing

## Anti-patterns

### The component parses and compares ISO dates; non-ISO values break selection, constraints, and onValueChange

**Bad:** `Passing a localized display string as value`  
**Good:** `value/defaultValue/min/max are ISO YYYY-MM-DD; display formatting is handled internally`  
**Why:** The component parses and compares ISO dates; non-ISO values break selection, constraints, and onValueChange

## Related components

- **TimePicker** (pairs-with): Combine when both a date and a time are needed
- **Input** (alternative): Use a plain input when a calendar grid is unnecessary
- **Form** (contained-by): Typically a field within a form with label/hint/error

## Accessibility rationale

The field is an <input role="combobox"> with aria-expanded, aria-controls and aria-haspopup="dialog" that accepts a typed date — the previous build had no text field at all, so a date already known could only be reached by paging a grid. ArrowDown and Alt+ArrowDown open the popup (the combobox pattern's required key, listed in the old manifest but never implemented), opening moves focus into the grid and Escape closes and returns it to the field; the old build did neither, leaving the grid unreachable on open and focus on <body> on close. The grid itself is a composed Calendar rather than a second hand-rolled copy, so its real-focus navigation, min/max clamping, disabled-day skipping, aria-selected placement and month announcements all apply here; the duplicate had none of them and its arrow keys did nothing at all until a value was set. Dismissal comes from the shared DismissableLayer instead of a raw document listener. Typed input is parsed at commit, not per keystroke, and rejected rather than coerced when unreadable or out of bounds.

## Props

| Name               | Type                                   | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                               | No       | —       | Base id for the input and its popover/aria wiring; auto-generated when omitted.                                                                                                                                                                                                                                                                                                                      |
| `value`            | `string`                               | No       | —       | Controlled ISO date value (YYYY-MM-DD)                                                                                                                                                                                                                                                                                                                                                               |
| `defaultValue`     | `string`                               | No       | —       | Uncontrolled default value                                                                                                                                                                                                                                                                                                                                                                           |
| `onValueChange`    | `(value: string \| undefined) => void` | No       | —       | Called with the selected ISO date string (or undefined when cleared)                                                                                                                                                                                                                                                                                                                                 |
| `min`              | `string`                               | No       | —       | Minimum ISO date                                                                                                                                                                                                                                                                                                                                                                                     |
| `max`              | `string`                               | No       | —       | Maximum ISO date                                                                                                                                                                                                                                                                                                                                                                                     |
| `clearable`        | `boolean`                              | No       | false   | Shows a clear button                                                                                                                                                                                                                                                                                                                                                                                 |
| `typeable`         | `boolean`                              | No       | true    | When true, the field accepts a typed date as well as one picked from the calendar.                                                                                                                                                                                                                                                                                                                   |
| `disabledDate`     | `(date: Date) => boolean`              | No       | —       | Rejects individual dates the bounds allow — holidays, weekends, taken slots.                                                                                                                                                                                                                                                                                                                         |
| `format`           | `Intl.DateTimeFormatOptions`           | No       | —       | Formatting options for the displayed date. Defaults to the locale's numeric form.                                                                                                                                                                                                                                                                                                                    |
| `showToday`        | `boolean`                              | No       | false   | When true, the calendar offers a button that jumps to the current month.                                                                                                                                                                                                                                                                                                                             |
| `name`             | `string`                               | No       | —       | Submitted with a surrounding form — a hidden input carrying the ISO value.                                                                                                                                                                                                                                                                                                                           |
| `required`         | `boolean`                              | No       | —       | Marks the control as required for assistive technology.                                                                                                                                                                                                                                                                                                                                              |
| `open`             | `boolean`                              | No       | —       | Controlled open state of the calendar popup.                                                                                                                                                                                                                                                                                                                                                         |
| `onOpenChange`     | `(open: boolean) => void`              | No       | —       | Called when the popup opens or closes.                                                                                                                                                                                                                                                                                                                                                               |
| `label`            | `string`                               | No       | —       | Visible field label rendered above the input; it also names the control. Rendered on screen.                                                                                                                                                                                                                                                                                                         |
| `hint`             | `string`                               | No       | —       | Hint text                                                                                                                                                                                                                                                                                                                                                                                            |
| `error`            | `string`                               | No       | —       | Error message                                                                                                                                                                                                                                                                                                                                                                                        |
| `size`             | `'sm' \| 'md' \| 'lg'`                 | No       | md      | Field size                                                                                                                                                                                                                                                                                                                                                                                           |
| `disabled`         | `boolean`                              | No       | false   | Disables the picker                                                                                                                                                                                                                                                                                                                                                                                  |
| `labels`           | `DatePickerLabels`                     | No       | —       | i18n label overrides                                                                                                                                                                                                                                                                                                                                                                                 |
| `aria-labelledby`  | `string`                               | No       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                                                                          |
| `aria-describedby` | `string`                               | No       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                                                                  |
| `aria-invalid`     | `boolean`                              | No       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                                                                              |
| `ariaLabel`        | `string`                               | No       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Tokens

- `--cascivo-color-accent-text`
- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text-on-accent`
- `--cascivo-date-picker-day-today-color`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-destructive`

## Examples

### Basic

Uncontrolled date picker

```jsx
<DatePicker label="Date" />
```

### Clearable

With clear button

```jsx
<DatePicker label="Date" clearable />
```

### With constraints

Date range constraint

```jsx
<DatePicker min="2024-01-01" max="2024-12-31" />
```

## Boundaries

| Area              | Level    | Note                                                                                 |
| ----------------- | -------- | ------------------------------------------------------------------------------------ |
| value format      | strict   | All date props are ISO YYYY-MM-DD strings                                            |
| locale formatting | flexible | Display, weekday labels, and week start derive from the current i18n locale via Intl |
| token names       | strict   | Styling resolves to --cascivo-date-picker-\* component tokens                        |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DatePicker component (inputs). An accessible date-picker with a calendar popover.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DatePicker is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent-text, --cascivo-color-surface, --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-text-on-accent, --cascivo-date-picker-day-today-color, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-color-bg-subtle, --cascivo-color-destructive

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/ArrowLeft/ArrowRight/Home/End/PageUp/PageDown/Enter/Space/Escape/Delete. Keep it AA.

Do not change (strict): value format — All date props are ISO YYYY-MM-DD strings; token names — Styling resolves to --cascivo-date-picker-* component tokens
Flexible: locale formatting.

Do not invent props, tokens, or global viewport media queries.
```
