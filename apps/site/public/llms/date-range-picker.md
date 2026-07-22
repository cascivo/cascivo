# DateRangePicker

A dual-calendar picker for selecting a contiguous date range.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add date-range-picker
```

Or use it from the prebuilt package without copying:

```tsx
import { DateRangePicker } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `default`
- `open`
- `selecting`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `{ start: Date; end: Date } \| null` | no | — | Controlled selected range |
| `defaultValue` | `{ start: Date; end: Date }` | no | — | Uncontrolled initial range |
| `onValueChange` | `(range: { start: Date; end: Date }) => void` | no | — | Called when a complete range is selected |
| `min` | `Date` | no | — | Earliest selectable date |
| `max` | `Date` | no | — | Latest selectable date |
| `disabled` | `(date: Date) => boolean` | no | — | Predicate to disable individual days |
| `presets` | `{ label: string; range: { start: Date; end: Date } }[]` | no | — | Quick-select preset ranges shown in a side column |
| `locale` | `string` | no | — | BCP-47 locale; defaults to the current i18n locale |
| `placeholder` | `string` | no | — | Empty-state trigger text |
| `size` | `'sm' \| 'md' \| 'lg'` | no | — | Field/grid size |
| `labels` | `DateRangePickerLabels` | no | — | i18n label overrides |

## Examples

### Basic

Uncontrolled dual-calendar range picker

```tsx
<DateRangePicker />
```

### With presets

Quick-select common ranges

```tsx
<DateRangePicker presets={[{ label: "Last 7 days", range: last7 }]} />
```

### Constrained

Limits the selectable dates

```tsx
<DateRangePicker min={new Date(Date.UTC(2024, 0, 1))} max={new Date(Date.UTC(2024, 11, 31))} />
```

## Design tokens

- `--cascivo-calendar-bg`
- `--cascivo-calendar-day-selected-bg`
- `--cascivo-calendar-day-selected-fg`
- `--cascivo-calendar-range-bg`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** Enter, Space, Escape, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, End, PageUp, PageDown

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

date, range, calendar, picker, input, form

---

_Generated from registry v0.9.0 on 2026-07-22. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
