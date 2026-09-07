# MultiSelect

Searchable multi-value select with a popover listbox, chips and grouping

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add multi-select
```

Or use it from the prebuilt package without copying:

```tsx
import { MultiSelect } from '@cascivo/react'
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

| Prop               | Type                                                    | Required | Default   | Description                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`          | `MultiSelectOption[]`                                   | yes      | —         | The selectable options.                                                                                                                                                                                                                                                                                                                               |
| `value`            | `string[]`                                              | no       | —         | The controlled value. Omit it and pass defaultValue to let the component own the selection.                                                                                                                                                                                                                                                           |
| `defaultValue`     | `string[]`                                              | no       | `[]`      | The initial value when uncontrolled.                                                                                                                                                                                                                                                                                                                  |
| `onValueChange`    | `(value: string[]) => void`                             | no       | —         | Called with the new value when it changes.                                                                                                                                                                                                                                                                                                            |
| `placeholder`      | `string`                                                | no       | —         | Placeholder text shown when the field is empty.                                                                                                                                                                                                                                                                                                       |
| `label`            | `string`                                                | no       | —         | Visible field label, rendered above the trigger. Rendered on screen.                                                                                                                                                                                                                                                                                  |
| `ariaLabel`        | `string`                                                | no       | —         | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. Not rendered — screen readers only. |
| `aria-labelledby`  | `string`                                                | no       | —         | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                           |
| `aria-describedby` | `string`                                                | no       | —         | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                   |
| `aria-invalid`     | `boolean`                                               | no       | —         | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                               |
| `hint`             | `string`                                                | no       | —         | Helper text below the field.                                                                                                                                                                                                                                                                                                                          |
| `error`            | `string`                                                | no       | —         | Error text below the field; also marks the control invalid.                                                                                                                                                                                                                                                                                           |
| `display`          | `'count' \| 'chips'`                                    | no       | `'count'` | How the trigger summarises the selection: a count, or one removable chip per value.                                                                                                                                                                                                                                                                   |
| `disabled`         | `boolean`                                               | no       | `false`   | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                    |
| `clearable`        | `boolean`                                               | no       | `false`   | When true, shows a control that clears every selected value.                                                                                                                                                                                                                                                                                          |
| `selectAll`        | `boolean`                                               | no       | `false`   | When true, shows a row that selects or clears every enabled option at once.                                                                                                                                                                                                                                                                           |
| `max`              | `number`                                                | no       | —         | Maximum number of values that may be selected. Further options become unselectable once reached.                                                                                                                                                                                                                                                      |
| `creatable`        | `boolean`                                               | no       | `false`   | When true, offers the current search text as a new option.                                                                                                                                                                                                                                                                                            |
| `onCreate`         | `(label: string) => void`                               | no       | —         | Called with the typed label when the user picks the "create" row.                                                                                                                                                                                                                                                                                     |
| `loading`          | `boolean`                                               | no       | `false`   | When true, the list reports itself as busy and shows a loading row instead of the no-results message.                                                                                                                                                                                                                                                 |
| `onSearchChange`   | `(query: string) => void`                               | no       | —         | Called with the search text on every keystroke. Pair it with filter={() => true} for a server-driven list.                                                                                                                                                                                                                                            |
| `filter`           | `(option: MultiSelectOption, query: string) => boolean` | no       | —         | Replaces the built-in diacritic-insensitive matcher.                                                                                                                                                                                                                                                                                                  |
| `searchable`       | `boolean`                                               | no       | `true`    | When true, shows the search field. The list is keyboard-navigable either way.                                                                                                                                                                                                                                                                         |
| `size`             | `'sm' \| 'md' \| 'lg'`                                  | no       | `'md'`    | Field height.                                                                                                                                                                                                                                                                                                                                         |
| `name`             | `string`                                                | no       | —         | Submitted with a surrounding form — one hidden input per selected value.                                                                                                                                                                                                                                                                              |
| `labels`           | `MultiSelectLabels`                                     | no       | —         | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                            |
| `id`               | `string`                                                | no       | —         | Id for the trigger control.                                                                                                                                                                                                                                                                                                                           |

## Examples

### Basic

```tsx
<MultiSelect
  options={[
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
  ]}
  defaultValue={[]}
/>
```

### Chips with a clear control

Each selection renders as a chip with its own remove button.

```tsx
<MultiSelect options={options} display="chips" clearable defaultValue={['1']} />
```

### Grouped options

Options carrying a group render under a labelled role="group" heading.

```tsx
<MultiSelect
  options={[
    { label: 'Apple', value: 'a', group: 'Pome' },
    { label: 'Cherry', value: 'c', group: 'Stone' },
  ]}
/>
```

### Remote search

filter={() => true} hands filtering to the server; loading marks the list busy between keystroke and response.

```tsx
<MultiSelect options={results} loading={pending} onSearchChange={search} filter={() => true} />
```

### Bounded selection

Options past the limit report aria-disabled; select-all stops at the limit.

```tsx
<MultiSelect options={options} max={3} selectAll />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-font-medium`
- `--cascivo-font-bold`
- `--cascivo-radius-field`
- `--cascivo-radius-overlay`
- `--cascivo-radius-item`
- `--cascivo-radius-indicator`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`
- `--cascivo-target-min-coarse`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `listbox`
- **Keyboard:** ArrowDown, ArrowUp, Home, End, PageUp, PageDown, Enter, Space, Escape, Backspace

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

form, select, multi, input, popover, combobox, tags

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
