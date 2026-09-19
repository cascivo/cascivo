# Calendar

**Category:** inputs  
**Description:** An accessible standalone month-grid date picker.

## When to use

- Showing an always-visible month grid for picking a single date (inline, not a popover)
- As the building block inside a date-picker or date-range-picker popover

## When NOT to use

- A compact form field where an inline grid wastes space — use DatePicker (trigger + popover)
- Selecting a contiguous date range — use DateRangePicker, which composes two calendars

## Anti-patterns

### Local-time construction can land a midnight date on the previous day in negative-offset zones, breaking selection and range math

**Bad:** `Comparing dates with local-time getters (getHours/getDate) after constructing them with new Date(y, m, d)`  
**Good:** `All arithmetic and comparisons use UTC getters/Date.UTC so DST and timezone offsets never shift a day`  
**Why:** Local-time construction can land a midnight date on the previous day in negative-offset zones, breaking selection and range math

## Related components

- **DatePicker** (alternative): Use the popover-based picker when an inline grid is too heavy for the layout
- **DateRangePicker** (contained-by): The range picker renders two Calendar instances side-by-side

## Accessibility rationale

A role="grid" table with role="row"/role="gridcell" and a roving tabindex keeping exactly one day focusable. Navigation moves _real DOM focus_, not just the tabindex: the previous build only rotated the index, so focus stayed on the old button and the moment an arrow crossed a month boundary that button unmounted and focus fell to <body>, ejecting the user from the widget mid-navigation. React reuses the day buttons positionally across months, so the focus move is deferred a task and re-queried by date — landing on the reused node would silently focus whatever date now occupies that grid slot. Arrows move a day or a week, Home/End reach the week edges, PageUp/PageDown change month (Shift for year), and every move is clamped to min/max and skips predicate-disabled days rather than parking the cursor where Enter does nothing; the prev/next buttons disable at the bounds for the same reason. aria-selected sits on the button that takes focus, not the enclosing <td>, and is omitted rather than serialised as "false" on the other thirty cells. Today is computed from the _local_ calendar rather than the UTC instant, so aria-current="date" no longer lands a day early east of UTC+12. The month is announced through a separate visually-hidden status region: the visible label is also the grid's accessible name, so announcing there would mutate the name of the container focus sits inside.

## Props

| Name              | Type                                              | Required | Default | Description                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isInRange`       | `(date: Date) => boolean`                         | No       | —       | Highlight predicate for range previews (used by DateRangePicker).                                                                                                                                                                              |
| `isRangeStart`    | `(date: Date) => boolean`                         | No       | —       | Predicate marking the range's start date for styling.                                                                                                                                                                                          |
| `isRangeEnd`      | `(date: Date) => boolean`                         | No       | —       | Predicate marking the range's end date for styling.                                                                                                                                                                                            |
| `onDayHover`      | `(date: Date \| null) => void`                    | No       | —       | Called with the hovered day (or null on leave) to drive range previews.                                                                                                                                                                        |
| `value`           | `Date \| null`                                    | No       | —       | Controlled selected date                                                                                                                                                                                                                       |
| `defaultValue`    | `Date`                                            | No       | —       | Uncontrolled initial selected date                                                                                                                                                                                                             |
| `onValueChange`   | `(date: Date) => void`                            | No       | —       | Called when a day is selected                                                                                                                                                                                                                  |
| `min`             | `Date`                                            | No       | —       | Earliest selectable date                                                                                                                                                                                                                       |
| `max`             | `Date`                                            | No       | —       | Latest selectable date                                                                                                                                                                                                                         |
| `disabled`        | `(date: Date) => boolean`                         | No       | —       | Predicate to disable individual days                                                                                                                                                                                                           |
| `locale`          | `string`                                          | No       | —       | BCP-47 locale; defaults to the current i18n locale                                                                                                                                                                                             |
| `size`            | `'sm' \| 'md' \| 'lg'`                            | No       | md      | Grid cell size                                                                                                                                                                                                                                 |
| `labels`          | `CalendarLabels`                                  | No       | —       | i18n label overrides for the nav buttons                                                                                                                                                                                                       |
| `month`           | `number`                                          | No       | —       | Controlled view month (0-11)                                                                                                                                                                                                                   |
| `year`            | `number`                                          | No       | —       | Controlled view year                                                                                                                                                                                                                           |
| `onViewChange`    | `(view: { month: number; year: number }) => void` | No       | —       | Called when the visible month changes                                                                                                                                                                                                          |
| `hideNav`         | `boolean`                                         | No       | false   | Hides the prev/next nav so a parent can drive navigation                                                                                                                                                                                       |
| `showToday`       | `boolean`                                         | No       | false   | When true, shows a button that jumps the view to the current month and focuses today.                                                                                                                                                          |
| `showWeekNumbers` | `boolean`                                         | No       | false   | When true, prefixes each row with its ISO-8601 week number.                                                                                                                                                                                    |
| `ariaLabel`       | `string`                                          | No       | —       | Accessible name for the grid. Defaults to the visible month label. Calendar has no visible label slot — the month heading is its own — so `label` and `ariaLabel` are aliases for the same invisible name. Not rendered — screen readers only. |
| `label`           | `string`                                          | No       | —       | Alias for `ariaLabel`; both set the grid’s invisible accessible name. Not rendered — screen readers only.                                                                                                                                      |

## Tokens

- `--cascivo-color-accent-text`
- `--cascivo-calendar-bg`
- `--cascivo-calendar-radius`
- `--cascivo-calendar-cell-size`
- `--cascivo-calendar-day-selected-bg`
- `--cascivo-calendar-day-selected-fg`
- `--cascivo-calendar-day-today-color`
- `--cascivo-calendar-range-bg`

## Examples

### Basic

Uncontrolled calendar

```jsx
<Calendar defaultValue={new Date(Date.UTC(2024, 5, 15))} />
```

### Constrained

Limits the selectable range

```jsx
<Calendar min={new Date(Date.UTC(2024, 5, 1))} max={new Date(Date.UTC(2024, 5, 30))} />
```

### Disabled weekends

Predicate disables individual days

```jsx
<Calendar disabled={(d) => [0, 6].includes(d.getUTCDay())} />
```

## Boundaries

| Area         | Level    | Note                                                                                                      |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| date type    | strict   | All date props are native Date objects compared in UTC                                                    |
| locale       | flexible | Weekday labels, month label, and first-day-of-week derive from the locale via Intl (with Monday fallback) |
| view control | flexible | month/year/onViewChange/hideNav let a parent drive navigation (used by DateRangePicker)                   |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Calendar component (inputs). An accessible standalone month-grid date picker.

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Calendar is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent-text, --cascivo-calendar-bg, --cascivo-calendar-radius, --cascivo-calendar-cell-size, --cascivo-calendar-day-selected-bg, --cascivo-calendar-day-selected-fg, --cascivo-calendar-day-today-color, --cascivo-calendar-range-bg

Accessibility: role "grid", WCAG 2.2-AA, keyboard: ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End/PageUp/PageDown/Enter/Space. Keep it AA.

Do not change (strict): date type — All date props are native Date objects compared in UTC
Flexible: locale, view control.

Do not invent props, tokens, or global viewport media queries.
```
