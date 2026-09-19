# MultiSelect

**Category:** inputs  
**Description:** Searchable multi-value select with a popover listbox, chips and grouping

## When to use

- Selecting several values at once from a known list of options
- Lists long enough that the built-in search/filter helps the user find options
- Cases needing a compact trigger that summarizes the selected count, or chips per value
- Server-driven option lists, via onSearchChange plus filter={() => true}

## When NOT to use

- Choosing exactly one value — use Select
- Free-text entries with no option list behind them — use TagsInput
- A handful of always-visible options — use a Checkbox group

## Anti-patterns

### Passing value makes the component controlled for its whole life; without onValueChange the selection can never change. Use defaultValue when the component should own the state.

**Bad:** `<MultiSelect value={value} /> with no onValueChange`  
**Good:** `<MultiSelect defaultValue={value} onValueChange={setValue} />`  
**Why:** Passing value makes the component controlled for its whole life; without onValueChange the selection can never change. Use defaultValue when the component should own the state.

### The built-in matcher still runs over the server’s results and filters them a second time against the same query, hiding rows the server deliberately returned.

**Bad:** `<MultiSelect options={remote} onSearchChange={search} />`  
**Good:** `<MultiSelect options={remote} onSearchChange={search} filter={() => true} />`  
**Why:** The built-in matcher still runs over the server’s results and filters them a second time against the same query, hiding rows the server deliberately returned.

## Related components

- **Select** (alternative): Use Select for single-value selection
- **Combobox** (alternative): Use Combobox for a single value chosen from a searchable list
- **TagsInput** (alternative): Use TagsInput for free-text values with no option list
- **Checkbox** (alternative): Use a Checkbox group for a small set of always-visible options

## Accessibility rationale

The trigger is a button with aria-haspopup="listbox", aria-expanded and aria-controls pointing at the panel. Inside the panel the search field carries role="combobox" with aria-expanded, aria-controls and aria-autocomplete="list", and owns aria-activedescendant — it is the element that holds DOM focus, so assistive technology tracks the active option as the arrows move it. With searchable={false} the listbox itself takes focus and the same attributes. The listbox is aria-multiselectable with role="option" rows carrying aria-selected, aria-disabled for unavailable ones and role="group" headings for grouped options; the search field, the select-all row and the loading/no-results message are siblings of the listbox rather than children, because a listbox owns only option and group children. ArrowUp/ArrowDown move the active option and skip disabled rows, Home/End jump to the ends, PageUp/PageDown move by ten, Enter toggles (Space too when there is no search field), Backspace removes the last chip from an empty search, and Escape closes the panel and returns focus to the trigger. A permanently mounted polite live region reports the selection count, so the first selection is announced as well as later ones. Selection, the active row and the focus ring each carry a non-colour channel under forced-colors, and every control reaches the coarse-pointer target minimum.

## Props

| Name               | Type                                                    | Required | Default | Description                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options`          | `MultiSelectOption[]`                                   | Yes      | —       | The selectable options.                                                                                                                                                                                                                                                                                                                               |
| `value`            | `string[]`                                              | No       | —       | The controlled value. Omit it and pass defaultValue to let the component own the selection.                                                                                                                                                                                                                                                           |
| `defaultValue`     | `string[]`                                              | No       | []      | The initial value when uncontrolled.                                                                                                                                                                                                                                                                                                                  |
| `onValueChange`    | `(value: string[]) => void`                             | No       | —       | Called with the new value when it changes.                                                                                                                                                                                                                                                                                                            |
| `placeholder`      | `string`                                                | No       | —       | Placeholder text shown when the field is empty.                                                                                                                                                                                                                                                                                                       |
| `label`            | `string`                                                | No       | —       | Visible field label, rendered above the trigger. Rendered on screen.                                                                                                                                                                                                                                                                                  |
| `ariaLabel`        | `string`                                                | No       | —       | Invisible accessible name, for when a visible element outside this component already labels it and `label` would render that text a second time. ⚠ `label` on this component is **visible**; `IconButton.label`/`Sparkline.label` are invisible names, which is the prior that costs adopters a duplicated label. Not rendered — screen readers only. |
| `aria-labelledby`  | `string`                                                | No       | —       | Wired automatically by a wrapping `Field` — its label id, forwarded to the focusable control so the Field's label names it.                                                                                                                                                                                                                           |
| `aria-describedby` | `string`                                                | No       | —       | Wired automatically by a wrapping `Field` — the ids of its hint/error text, forwarded to the focusable control so the supporting text is announced.                                                                                                                                                                                                   |
| `aria-invalid`     | `boolean`                                               | No       | —       | Wired automatically by a wrapping `Field` when it is in an error state.                                                                                                                                                                                                                                                                               |
| `hint`             | `string`                                                | No       | —       | Helper text below the field.                                                                                                                                                                                                                                                                                                                          |
| `error`            | `string`                                                | No       | —       | Error text below the field; also marks the control invalid.                                                                                                                                                                                                                                                                                           |
| `display`          | `'count' \| 'chips'`                                    | No       | 'count' | How the trigger summarises the selection: a count, or one removable chip per value.                                                                                                                                                                                                                                                                   |
| `disabled`         | `boolean`                                               | No       | false   | When true, disables the control and removes it from the tab order.                                                                                                                                                                                                                                                                                    |
| `clearable`        | `boolean`                                               | No       | false   | When true, shows a control that clears every selected value.                                                                                                                                                                                                                                                                                          |
| `selectAll`        | `boolean`                                               | No       | false   | When true, shows a row that selects or clears every enabled option at once.                                                                                                                                                                                                                                                                           |
| `max`              | `number`                                                | No       | —       | Maximum number of values that may be selected. Further options become unselectable once reached.                                                                                                                                                                                                                                                      |
| `creatable`        | `boolean`                                               | No       | false   | When true, offers the current search text as a new option.                                                                                                                                                                                                                                                                                            |
| `onCreate`         | `(label: string) => void`                               | No       | —       | Called with the typed label when the user picks the "create" row.                                                                                                                                                                                                                                                                                     |
| `loading`          | `boolean`                                               | No       | false   | When true, the list reports itself as busy and shows a loading row instead of the no-results message.                                                                                                                                                                                                                                                 |
| `onSearchChange`   | `(query: string) => void`                               | No       | —       | Called with the search text on every keystroke. Pair it with filter={() => true} for a server-driven list.                                                                                                                                                                                                                                            |
| `filter`           | `(option: MultiSelectOption, query: string) => boolean` | No       | —       | Replaces the built-in diacritic-insensitive matcher.                                                                                                                                                                                                                                                                                                  |
| `searchable`       | `boolean`                                               | No       | true    | When true, shows the search field. The list is keyboard-navigable either way.                                                                                                                                                                                                                                                                         |
| `size`             | `'sm' \| 'md' \| 'lg'`                                  | No       | 'md'    | Field height.                                                                                                                                                                                                                                                                                                                                         |
| `name`             | `string`                                                | No       | —       | Submitted with a surrounding form — one hidden input per selected value.                                                                                                                                                                                                                                                                              |
| `labels`           | `MultiSelectLabels`                                     | No       | —       | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                            |
| `id`               | `string`                                                | No       | —       | Id for the trigger control.                                                                                                                                                                                                                                                                                                                           |

## Tokens

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

## Examples

### Basic

```jsx
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

```jsx
<MultiSelect options={options} display="chips" clearable defaultValue={['1']} />
```

### Grouped options

Options carrying a group render under a labelled role="group" heading.

```jsx
<MultiSelect
  options={[
    { label: 'Apple', value: 'a', group: 'Pome' },
    { label: 'Cherry', value: 'c', group: 'Stone' },
  ]}
/>
```

### Remote search

filter={() => true} hands filtering to the server; loading marks the list busy between keystroke and response.

```jsx
<MultiSelect options={results} loading={pending} onSearchChange={search} filter={() => true} />
```

### Bounded selection

Options past the limit report aria-disabled; select-all stops at the limit.

```jsx
<MultiSelect options={options} max={3} selectAll />
```

## Boundaries

| Area        | Level    | Note                                                                                                           |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| token names | strict   | Surface, border, accent, radius, shadow, focus-ring, and motion must resolve to the listed --cascivo-\* tokens |
| labels      | flexible | Every user-visible string is overridable through labels                                                        |
| options     | flexible | Caller supplies the option list and may mark options disabled or assign them a group                           |
| filtering   | flexible | The default matcher folds diacritics and searches label then value; filter replaces it entirely                |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo MultiSelect component (inputs). Searchable multi-value select with a popover listbox, chips and grouping

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

MultiSelect is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-font-medium, --cascivo-font-bold, --cascivo-radius-field, --cascivo-radius-overlay, --cascivo-radius-item, --cascivo-radius-indicator, --cascivo-shadow-md, --cascivo-focus-ring, --cascivo-motion-enter, --cascivo-target-min-coarse

Accessibility: role "listbox", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Home/End/PageUp/PageDown/Enter/Space/Escape/Backspace. Keep it AA.

Do not change (strict): token names — Surface, border, accent, radius, shadow, focus-ring, and motion must resolve to the listed --cascivo-* tokens
Flexible: labels, options, filtering.

Do not invent props, tokens, or global viewport media queries.
```
