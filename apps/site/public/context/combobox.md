# Combobox

**Category:** inputs  
**Description:** Filterable single-select with an animated custom listbox, built on the dropdown open/close machine

## When to use

- Single-select from a long list where type-to-filter makes finding an option faster
- Form fields where the value is one of many known options (country, assignee, repository)

## When NOT to use

- Short option lists (≈2–7) where filtering adds no value — use Select or SegmentedControl
- Selecting multiple values — use MultiSelect
- Triggering actions or commands — use Dropdown or CommandMenu

## Anti-patterns

### Combobox has role="combobox" with a listbox of selectable values and onValueChange semantics — actions belong in a menu

**Bad:** `Using Combobox to fire actions like "Delete" or "Export"`  
**Good:** `Use Dropdown for actions; Combobox is for picking a value`  
**Why:** Combobox has role="combobox" with a listbox of selectable values and onValueChange semantics — actions belong in a menu

### Type-to-select still jumps to a matching option, but without a visible filter a 200-row list is an unusable scroll; searchable={false} is for short lists

**Bad:** `Setting searchable={false} on a 200-item list`  
**Good:** `Keep the default searchable so the user can filter`  
**Why:** Type-to-select still jumps to a matching option, but without a visible filter a 200-row list is an unusable scroll; searchable={false} is for short lists

### The built-in matcher still runs over the server’s results and filters them a second time against the same query, hiding rows the server deliberately returned

**Bad:** `<Combobox options={remote} onSearchChange={search} />`  
**Good:** `<Combobox options={remote} onSearchChange={search} filter={() => true} />`  
**Why:** The built-in matcher still runs over the server’s results and filters them a second time against the same query, hiding rows the server deliberately returned

## Related components

- **Select** (alternative): Use for short lists that do not need type-to-filter
- **MultiSelect** (alternative): Use when more than one value can be selected
- **CommandMenu** (alternative): Use the Cmd+K palette for command/navigation search rather than value selection

## Accessibility rationale

Two APG combobox shapes, chosen by `searchable`. With searchable (the default) the field is an <input role="combobox"> with aria-autocomplete="list" that filters as the user types — the APG editable combobox. With searchable={false} it is a <button role="combobox"> and printable characters type-to-select — the APG select-only combobox. Either way the field itself keeps DOM focus and owns aria-expanded, aria-controls and aria-activedescendant, so assistive technology tracks the active option as the arrows move it; the previous build put aria-activedescendant on a trigger while focus had moved into a separate search input, so nothing was tracked. The listbox holds only role="option" rows (with aria-selected and aria-disabled) and role="group" headings — the loading and no-results messages are siblings of it, as role="listbox" owns no other children. ArrowUp/ArrowDown skip disabled rows and wrap, PageUp/PageDown move by ten, Alt+ArrowDown opens without moving the active option and Alt+ArrowUp closes keeping the value, Enter selects, Escape closes and returns focus to the field, and Tab closes without stealing focus back. Home/End jump the list only in the select-only variant, because in the editable one they belong to the text caret. Outside-pointer and Escape dismissal come from the shared DismissableLayer rather than a hand-rolled document listener. A polite live region reports the result count as the filter narrows. Selection, the active row and the focus ring each carry a non-colour channel under forced-colors, and every control reaches the coarse-pointer target minimum.

## Props

| Name               | Type                                                 | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                             | No       | —       | Base id for the input and its listbox/aria wiring; auto-generated when omitted.                                                                                                                                                                                                                                                                                                                      |
| `options`          | `ComboboxOption[]`                                   | Yes      | —       | The selectable options.                                                                                                                                                                                                                                                                                                                                                                              |
| `value`            | `string`                                             | No       | —       | The controlled value.                                                                                                                                                                                                                                                                                                                                                                                |
| `defaultValue`     | `string`                                             | No       | —       | The initial value when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                 |
| `onValueChange`    | `(value: string \| undefined) => void`               | No       | —       | Called with the selected option value (or undefined when cleared).                                                                                                                                                                                                                                                                                                                                   |
| `clearable`        | `boolean`                                            | No       | false   | When true, shows a control to clear the selected value.                                                                                                                                                                                                                                                                                                                                              |
| `searchable`       | `boolean`                                            | No       | true    | When true the field is a text input that filters the list as the user types (the APG editable combobox). When false it is a button that opens the list, and type-to-select jumps to a matching option (the APG select-only combobox).                                                                                                                                                                |
| `loading`          | `boolean`                                            | No       | false   | When true, the list reports itself as busy and shows a loading row instead of the empty message.                                                                                                                                                                                                                                                                                                     |
| `onSearchChange`   | `(query: string) => void`                            | No       | —       | Called with the search text on every keystroke. Pair it with filter={() => true} for a server-driven list.                                                                                                                                                                                                                                                                                           |
| `filter`           | `(option: ComboboxOption, query: string) => boolean` | No       | —       | Replaces the built-in diacritic-insensitive matcher.                                                                                                                                                                                                                                                                                                                                                 |
| `creatable`        | `boolean`                                            | No       | false   | When true, offers the current search text as a new option.                                                                                                                                                                                                                                                                                                                                           |
| `onCreate`         | `(label: string) => void`                            | No       | —       | Called with the typed label when the user picks the "create" row.                                                                                                                                                                                                                                                                                                                                    |
| `name`             | `string`                                             | No       | —       | Submitted with a surrounding form — a hidden input carrying the selected value.                                                                                                                                                                                                                                                                                                                      |
| `required`         | `boolean`                                            | No       | —       | Marks the control as required for assistive technology.                                                                                                                                                                                                                                                                                                                                              |
| `open`             | `boolean`                                            | No       | —       | Controlled open state of the listbox.                                                                                                                                                                                                                                                                                                                                                                |
| `defaultOpen`      | `boolean`                                            | No       | false   | The initial open state when uncontrolled.                                                                                                                                                                                                                                                                                                                                                            |
| `onOpenChange`     | `(open: boolean) => void`                            | No       | —       | Called when the listbox opens or closes.                                                                                                                                                                                                                                                                                                                                                             |
| `label`            | `string`                                             | No       | —       | Text label for the control. Rendered on screen.                                                                                                                                                                                                                                                                                                                                                      |
| `hint`             | `string`                                             | No       | —       | Supplementary hint text shown with the control.                                                                                                                                                                                                                                                                                                                                                      |
| `error`            | `string`                                             | No       | —       | Error message shown when the value is invalid.                                                                                                                                                                                                                                                                                                                                                       |
| `size`             | `'sm' \| 'md' \| 'lg'`                               | No       | 'md'    | Visual size of the component (e.g. 'sm', 'md', 'lg').                                                                                                                                                                                                                                                                                                                                                |
| `disabled`         | `boolean`                                            | No       | false   | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                                                                   |
| `labels`           | `ComboboxLabels`                                     | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                                                                           |
| `className`        | `string`                                             | No       | —       | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                             |
| `aria-labelledby`  | `string`                                             | No       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                                                                          |
| `aria-describedby` | `string`                                             | No       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                                                                  |
| `aria-invalid`     | `boolean`                                            | No       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                                                                              |
| `ariaLabel`        | `string`                                             | No       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. The raw DOM `aria-label` still wins over this. Not rendered — screen readers only. |

## Tokens

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

## Examples

### Grouped options

Options carrying a group render under a labelled role="group" heading.

```jsx
<Combobox
  options={[
    { value: 'de', label: 'Germany', group: 'Europe' },
    { value: 'jp', label: 'Japan', group: 'Asia' },
  ]}
/>
```

### Remote search

filter={() => true} hands filtering to the server; loading marks the list busy between keystroke and response.

```jsx
<Combobox options={results} loading={pending} onSearchChange={search} filter={() => true} />
```

### Select-only

A button rather than a text field; printable characters type-to-select, and Home/End jump the list.

```jsx
<Combobox options={options} searchable={false} />
```

### Basic combobox

```jsx
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

## Boundaries

| Area                       | Level    | Note                                                                                     |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| searchable                 | flexible | Filtering can be toggled off for short lists via searchable={false}                      |
| controlled vs uncontrolled | flexible | Supports value + onValueChange or defaultValue                                           |
| token names                | strict   | Listbox/field styling resolves to semantic --cascivo-color-_ / --cascivo-radius-_ tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Combobox component (inputs). Filterable single-select with an animated custom listbox, built on the dropdown open/close machine

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Combobox is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-accent-text, --cascivo-color-surface, --cascivo-color-surface-overlay, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-text-subtle, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-font-medium, --cascivo-font-bold, --cascivo-radius-field, --cascivo-radius-overlay, --cascivo-radius-item, --cascivo-radius-control, --cascivo-shadow-overlay, --cascivo-motion-enter, --cascivo-z-dropdown, --cascivo-target-min-coarse

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/PageUp/PageDown/Enter/Space/Escape/Tab. Keep it AA.

Do not change (strict): token names — Listbox/field styling resolves to semantic --cascivo-color-* / --cascivo-radius-* tokens
Flexible: searchable, controlled vs uncontrolled.

Do not invent props, tokens, or global viewport media queries.
```
