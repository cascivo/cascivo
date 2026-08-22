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

### The component parses and compares ISO dates; non-ISO values break selection, constraints, and onChange

**Bad:** `Passing a localized display string as value`  
**Good:** `value/defaultValue/min/max are ISO YYYY-MM-DD; display formatting is handled internally`  
**Why:** The component parses and compares ISO dates; non-ISO values break selection, constraints, and onChange

## Related components

- **TimePicker** (pairs-with): Combine when both a date and a time are needed
- **Input** (alternative): Use a plain input when a calendar grid is unnecessary
- **Form** (contained-by): Typically a field within a form with label/hint/error

## Accessibility rationale

The trigger is role="combobox" with aria-haspopup="dialog"/aria-expanded; the calendar is a role="dialog" containing a role="grid" with roving tabindex so arrow keys move a single focusable day, days expose aria-pressed for selection, aria-current="date" for today, and aria-disabled past min/max, and errors are wired via aria-invalid + aria-describedby with role="alert"

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | No | — | Base id for the input and its popover/aria wiring; auto-generated when omitted. |
| `value` | `string` | No | — | Controlled ISO date value (YYYY-MM-DD) |
| `defaultValue` | `string` | No | — | Uncontrolled default value |
| `onValueChange` | `(value: string \| undefined) => void` | No | — | Called with the selected ISO date string (or undefined when cleared) |
| `onChange` | `(value: string \| undefined) => void` | No | — | Deprecated: use onValueChange (same ISO string \| undefined) |
| `min` | `string` | No | — | Minimum ISO date |
| `max` | `string` | No | — | Maximum ISO date |
| `clearable` | `boolean` | No | false | Shows a clear button |
| `label` | `string` | No | — | Visible field label rendered above the input; it also names the control. Rendered on screen. |
| `hint` | `string` | No | — | Hint text |
| `error` | `string` | No | — | Error message |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Field size |
| `disabled` | `boolean` | No | false | Disables the picker |
| `labels` | `DatePickerLabels` | No | — | i18n label overrides |
| `aria-labelledby` | `string` | No | — | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it. |
| `aria-describedby` | `string` | No | — | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced. |
| `aria-invalid` | `boolean` | No | — | Wired automatically by a wrapping `Field` when it is in an error state. |
| `ariaLabel` | `string` | No | — | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-text-on-accent`
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

| Area | Level | Note |
|------|-------|------|
| value format | strict | All date props are ISO YYYY-MM-DD strings |
| locale formatting | flexible | Display, weekday labels, and week start derive from the current i18n locale via Intl |
| token names | strict | Styling resolves to --cascivo-date-picker-* component tokens |

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
  --cascivo-color-surface, --cascivo-color-surface-overlay, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-text-on-accent, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-color-bg-subtle, --cascivo-color-destructive

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: Enter/Space/Escape/ArrowUp/ArrowDown/ArrowLeft/ArrowRight. Keep it AA.

Do not change (strict): value format — All date props are ISO YYYY-MM-DD strings; token names — Styling resolves to --cascivo-date-picker-* component tokens
Flexible: locale formatting.

Do not invent props, tokens, or global viewport media queries.
```
