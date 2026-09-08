# Calendar

An accessible standalone month-grid date picker.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add calendar
```

Or use it from the prebuilt package without copying:

```tsx
import { Calendar } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `default`
- `selected`
- `today`
- `disabled`

## Props

| Prop              | Type                                              | Required | Default | Description                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isInRange`       | `(date: Date) => boolean`                         | no       | —       | Highlight predicate for range previews (used by DateRangePicker).                                                                                                                                                                              |
| `isRangeStart`    | `(date: Date) => boolean`                         | no       | —       | Predicate marking the range's start date for styling.                                                                                                                                                                                          |
| `isRangeEnd`      | `(date: Date) => boolean`                         | no       | —       | Predicate marking the range's end date for styling.                                                                                                                                                                                            |
| `onDayHover`      | `(date: Date \| null) => void`                    | no       | —       | Called with the hovered day (or null on leave) to drive range previews.                                                                                                                                                                        |
| `value`           | `Date \| null`                                    | no       | —       | Controlled selected date                                                                                                                                                                                                                       |
| `defaultValue`    | `Date`                                            | no       | —       | Uncontrolled initial selected date                                                                                                                                                                                                             |
| `onValueChange`   | `(date: Date) => void`                            | no       | —       | Called when a day is selected                                                                                                                                                                                                                  |
| `min`             | `Date`                                            | no       | —       | Earliest selectable date                                                                                                                                                                                                                       |
| `max`             | `Date`                                            | no       | —       | Latest selectable date                                                                                                                                                                                                                         |
| `disabled`        | `(date: Date) => boolean`                         | no       | —       | Predicate to disable individual days                                                                                                                                                                                                           |
| `locale`          | `string`                                          | no       | —       | BCP-47 locale; defaults to the current i18n locale                                                                                                                                                                                             |
| `size`            | `'sm' \| 'md' \| 'lg'`                            | no       | `md`    | Grid cell size                                                                                                                                                                                                                                 |
| `labels`          | `CalendarLabels`                                  | no       | —       | i18n label overrides for the nav buttons                                                                                                                                                                                                       |
| `month`           | `number`                                          | no       | —       | Controlled view month (0-11)                                                                                                                                                                                                                   |
| `year`            | `number`                                          | no       | —       | Controlled view year                                                                                                                                                                                                                           |
| `onViewChange`    | `(view: { month: number; year: number }) => void` | no       | —       | Called when the visible month changes                                                                                                                                                                                                          |
| `hideNav`         | `boolean`                                         | no       | `false` | Hides the prev/next nav so a parent can drive navigation                                                                                                                                                                                       |
| `showToday`       | `boolean`                                         | no       | `false` | When true, shows a button that jumps the view to the current month and focuses today.                                                                                                                                                          |
| `showWeekNumbers` | `boolean`                                         | no       | `false` | When true, prefixes each row with its ISO-8601 week number.                                                                                                                                                                                    |
| `ariaLabel`       | `string`                                          | no       | —       | Accessible name for the grid. Defaults to the visible month label. Calendar has no visible label slot — the month heading is its own — so `label` and `ariaLabel` are aliases for the same invisible name. Not rendered — screen readers only. |
| `label`           | `string`                                          | no       | —       | Alias for `ariaLabel`; both set the grid’s invisible accessible name. Not rendered — screen readers only.                                                                                                                                      |

## Examples

### Basic

Uncontrolled calendar

```tsx
<Calendar defaultValue={new Date(Date.UTC(2024, 5, 15))} />
```

### Constrained

Limits the selectable range

```tsx
<Calendar min={new Date(Date.UTC(2024, 5, 1))} max={new Date(Date.UTC(2024, 5, 30))} />
```

### Disabled weekends

Predicate disables individual days

```tsx
<Calendar disabled={(d) => [0, 6].includes(d.getUTCDay())} />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-accent-text`
- `--cascivo-calendar-bg`
- `--cascivo-calendar-radius`
- `--cascivo-calendar-cell-size`
- `--cascivo-calendar-day-selected-bg`
- `--cascivo-calendar-day-selected-fg`
- `--cascivo-calendar-day-today-color`
- `--cascivo-calendar-range-bg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `grid`
- **Keyboard:** ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End, PageUp, PageDown, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

calendar, date, month, grid, picker, input

---

_Generated from registry v1.2.0 on 2026-09-08. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
