# DatePicker

An accessible date-picker with a calendar popover.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add date-picker
```

Or use it from the prebuilt package without copying:

```tsx
import { DatePicker } from '@cascivo/react'
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
- `error`
- `disabled`

## Props

| Prop               | Type                                   | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                               | no       | —       | Base id for the input and its popover/aria wiring; auto-generated when omitted.                                                                                                                                                                                                                                                                                                                      |
| `value`            | `string`                               | no       | —       | Controlled ISO date value (YYYY-MM-DD)                                                                                                                                                                                                                                                                                                                                                               |
| `defaultValue`     | `string`                               | no       | —       | Uncontrolled default value                                                                                                                                                                                                                                                                                                                                                                           |
| `onValueChange`    | `(value: string \| undefined) => void` | no       | —       | Called with the selected ISO date string (or undefined when cleared)                                                                                                                                                                                                                                                                                                                                 |
| `min`              | `string`                               | no       | —       | Minimum ISO date                                                                                                                                                                                                                                                                                                                                                                                     |
| `max`              | `string`                               | no       | —       | Maximum ISO date                                                                                                                                                                                                                                                                                                                                                                                     |
| `clearable`        | `boolean`                              | no       | `false` | Shows a clear button                                                                                                                                                                                                                                                                                                                                                                                 |
| `label`            | `string`                               | no       | —       | Visible field label rendered above the input; it also names the control. Rendered on screen.                                                                                                                                                                                                                                                                                                         |
| `hint`             | `string`                               | no       | —       | Hint text                                                                                                                                                                                                                                                                                                                                                                                            |
| `error`            | `string`                               | no       | —       | Error message                                                                                                                                                                                                                                                                                                                                                                                        |
| `size`             | `'sm' \| 'md' \| 'lg'`                 | no       | `md`    | Field size                                                                                                                                                                                                                                                                                                                                                                                           |
| `disabled`         | `boolean`                              | no       | `false` | Disables the picker                                                                                                                                                                                                                                                                                                                                                                                  |
| `labels`           | `DatePickerLabels`                     | no       | —       | i18n label overrides                                                                                                                                                                                                                                                                                                                                                                                 |
| `aria-labelledby`  | `string`                               | no       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                                                                          |
| `aria-describedby` | `string`                               | no       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                                                                  |
| `aria-invalid`     | `boolean`                              | no       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                                                                              |
| `ariaLabel`        | `string`                               | no       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Examples

### Basic

Uncontrolled date picker

```tsx
<DatePicker label="Date" />
```

### Clearable

With clear button

```tsx
<DatePicker label="Date" clearable />
```

### With constraints

Date range constraint

```tsx
<DatePicker min="2024-01-01" max="2024-12-31" />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** Enter, Space, Escape, ArrowUp, ArrowDown, ArrowLeft, ArrowRight

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

date, calendar, picker, input, form

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
