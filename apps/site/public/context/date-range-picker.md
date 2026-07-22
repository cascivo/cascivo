# DateRangePicker

**Category:** inputs  
**Description:** A dual-calendar picker for selecting a contiguous date range.

## When to use

- Selecting a contiguous start–end date range (reporting windows, bookings, filters)
- When two months visible at once and hover-preview of the in-between span aid selection

## When NOT to use

- Picking a single date — use DatePicker or Calendar
- Selecting many non-contiguous dates — a range picker only models one continuous span

## Anti-patterns

### Consumers expect range.start <= range.end; an unsorted range breaks downstream comparisons and queries

**Bad:** `Emitting the range in click order, so onValueChange can fire with end before start`  
**Good:** `The two clicked dates are sorted before emitting, so start is always <= end`  
**Why:** Consumers expect range.start <= range.end; an unsorted range breaks downstream comparisons and queries

## Related components

- **Calendar** (contains): Renders two Calendar instances side-by-side with synced navigation
- **DatePicker** (alternative): Use the single-date picker when only one date is needed

## Accessibility rationale

The trigger is role="combobox" with aria-haspopup="dialog"/aria-expanded; the popover is a role="dialog" containing two Calendar grids, each an APG role="grid" with roving tabindex; selection is two clicks (first sets the pending start, second emits the sorted range; clicking the same day twice clears), and the hover/keyboard preview marks in-between cells with data-in-range; Escape and outside-click close the panel

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `{ start: Date; end: Date } \| null` | No | — | Controlled selected range |
| `defaultValue` | `{ start: Date; end: Date }` | No | — | Uncontrolled initial range |
| `onValueChange` | `(range: { start: Date; end: Date }) => void` | No | — | Called when a complete range is selected |
| `min` | `Date` | No | — | Earliest selectable date |
| `max` | `Date` | No | — | Latest selectable date |
| `disabled` | `(date: Date) => boolean` | No | — | Predicate to disable individual days |
| `presets` | `{ label: string; range: { start: Date; end: Date } }[]` | No | — | Quick-select preset ranges shown in a side column |
| `locale` | `string` | No | — | BCP-47 locale; defaults to the current i18n locale |
| `placeholder` | `string` | No | — | Empty-state trigger text |
| `size` | `'sm' \| 'md' \| 'lg'` | No | — | Field/grid size |
| `labels` | `DateRangePickerLabels` | No | — | i18n label overrides |

## Tokens

- `--cascivo-calendar-bg`
- `--cascivo-calendar-day-selected-bg`
- `--cascivo-calendar-day-selected-fg`
- `--cascivo-calendar-range-bg`

## Examples

### Basic

Uncontrolled dual-calendar range picker

```jsx
<DateRangePicker />
```

### With presets

Quick-select common ranges

```jsx
<DateRangePicker presets={[{ label: "Last 7 days", range: last7 }]} />
```

### Constrained

Limits the selectable dates

```jsx
<DateRangePicker min={new Date(Date.UTC(2024, 0, 1))} max={new Date(Date.UTC(2024, 11, 31))} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| range type | strict | value/defaultValue are { start: Date; end: Date } with native Date objects compared in UTC |
| presets | flexible | Optional preset ranges render as quick-select buttons in a side column |
| locale | flexible | Display, weekday labels, and week start derive from the locale via Intl |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DateRangePicker component (inputs). A dual-calendar picker for selecting a contiguous date range.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DateRangePicker is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-calendar-bg, --cascivo-calendar-day-selected-bg, --cascivo-calendar-day-selected-fg, --cascivo-calendar-range-bg

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: Enter/Space/Escape/ArrowUp/ArrowDown/ArrowLeft/ArrowRight/Home/End/PageUp/PageDown. Keep it AA.

Do not change (strict): range type — value/defaultValue are { start: Date; end: Date } with native Date objects compared in UTC
Flexible: presets, locale.

Do not invent props, tokens, or global viewport media queries.
```
