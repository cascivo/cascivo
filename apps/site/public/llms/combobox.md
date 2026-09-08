# Combobox

Filterable single-select with an animated custom listbox, built on the dropdown open/close machine

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add combobox
```

Or use it from the prebuilt package without copying:

```tsx
import { Combobox } from '@cascivo/react'
```

## Category

`inputs`

## Sizes

- `sm`
- `md`
- `lg`

## States

- `closed`
- `open`
- `error`

## Props

| Prop               | Type                                                 | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                             | no       | —       | Base id for the input and its listbox/aria wiring; auto-generated when omitted.                                                                                                                                                                                                                                                                                                                      |
| `options`          | `ComboboxOption[]`                                   | yes      | —       | The selectable options.                                                                                                                                                                                                                                                                                                                                                                              |
| `value`            | `string`                                             | no       | —       | The controlled value.                                                                                                                                                                                                                                                                                                                                                                                |
| `defaultValue`     | `string`                                             | no       | —       | The initial value when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                 |
| `onValueChange`    | `(value: string \| undefined) => void`               | no       | —       | Called with the selected option value (or undefined when cleared).                                                                                                                                                                                                                                                                                                                                   |
| `clearable`        | `boolean`                                            | no       | `false` | When true, shows a control to clear the selected value.                                                                                                                                                                                                                                                                                                                                              |
| `searchable`       | `boolean`                                            | no       | `true`  | When true the field is a text input that filters the list as the user types (the APG editable combobox). When false it is a button that opens the list, and type-to-select jumps to a matching option (the APG select-only combobox).                                                                                                                                                                |
| `loading`          | `boolean`                                            | no       | `false` | When true, the list reports itself as busy and shows a loading row instead of the empty message.                                                                                                                                                                                                                                                                                                     |
| `onSearchChange`   | `(query: string) => void`                            | no       | —       | Called with the search text on every keystroke. Pair it with filter={() => true} for a server-driven list.                                                                                                                                                                                                                                                                                           |
| `filter`           | `(option: ComboboxOption, query: string) => boolean` | no       | —       | Replaces the built-in diacritic-insensitive matcher.                                                                                                                                                                                                                                                                                                                                                 |
| `creatable`        | `boolean`                                            | no       | `false` | When true, offers the current search text as a new option.                                                                                                                                                                                                                                                                                                                                           |
| `onCreate`         | `(label: string) => void`                            | no       | —       | Called with the typed label when the user picks the "create" row.                                                                                                                                                                                                                                                                                                                                    |
| `name`             | `string`                                             | no       | —       | Submitted with a surrounding form — a hidden input carrying the selected value.                                                                                                                                                                                                                                                                                                                      |
| `required`         | `boolean`                                            | no       | —       | Marks the control as required for assistive technology.                                                                                                                                                                                                                                                                                                                                              |
| `open`             | `boolean`                                            | no       | —       | Controlled open state of the listbox.                                                                                                                                                                                                                                                                                                                                                                |
| `defaultOpen`      | `boolean`                                            | no       | `false` | The initial open state when uncontrolled.                                                                                                                                                                                                                                                                                                                                                            |
| `onOpenChange`     | `(open: boolean) => void`                            | no       | —       | Called when the listbox opens or closes.                                                                                                                                                                                                                                                                                                                                                             |
| `label`            | `string`                                             | no       | —       | Text label for the control. Rendered on screen.                                                                                                                                                                                                                                                                                                                                                      |
| `hint`             | `string`                                             | no       | —       | Supplementary hint text shown with the control.                                                                                                                                                                                                                                                                                                                                                      |
| `error`            | `string`                                             | no       | —       | Error message shown when the value is invalid.                                                                                                                                                                                                                                                                                                                                                       |
| `size`             | `'sm' \| 'md' \| 'lg'`                               | no       | `'md'`  | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                                                                                                                                                                                                                                |
| `disabled`         | `boolean`                                            | no       | `false` | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                                                                   |
| `labels`           | `ComboboxLabels`                                     | no       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                                                                           |
| `className`        | `string`                                             | no       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                             |
| `aria-labelledby`  | `string`                                             | no       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                                                                          |
| `aria-describedby` | `string`                                             | no       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                                                                  |
| `aria-invalid`     | `boolean`                                            | no       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                                                                              |
| `ariaLabel`        | `string`                                             | no       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Examples

### Grouped options

Options carrying a group render under a labelled role="group" heading.

```tsx
<Combobox
  options={[
    { value: 'de', label: 'Germany', group: 'Europe' },
    { value: 'jp', label: 'Japan', group: 'Asia' },
  ]}
/>
```

### Remote search

filter={() => true} hands filtering to the server; loading marks the list busy between keystroke and response.

```tsx
<Combobox options={results} loading={pending} onSearchChange={search} filter={() => true} />
```

### Select-only

A button rather than a text field; printable characters type-to-select, and Home/End jump the list.

```tsx
<Combobox options={options} searchable={false} />
```

### Basic combobox

```tsx
<Combobox
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ]}
  onValueChange={(value) => console.log(value)}
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-accent-text`
- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-font-medium`
- `--cascivo-font-bold`
- `--cascivo-radius-field`
- `--cascivo-radius-overlay`
- `--cascivo-radius-item`
- `--cascivo-radius-control`
- `--cascivo-shadow-overlay`
- `--cascivo-motion-enter`
- `--cascivo-z-dropdown`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `combobox`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, PageUp, PageDown, Enter, Space, Escape, Tab

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

select, combobox, dropdown, filter, search

---

_Generated from registry v1.2.0 on 2026-09-08. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
