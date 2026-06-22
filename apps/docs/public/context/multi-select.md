# MultiSelect

**Category:** inputs  
**Description:** Searchable multi-value select with popover listbox

## When to use

- Selecting several values at once from a known list of options
- Lists long enough that the built-in search/filter helps the user find options
- Cases needing a compact trigger that summarizes the selected count

## When NOT to use

- Choosing exactly one value — use Select
- Allowing free-text entries not in a predefined list — use Combobox or TagsInput
- A handful of always-visible options — use a Checkbox group

## Anti-patterns

### Selection is fully controlled; the listbox reflects value, so dropping the update leaves checkboxes out of sync with state

**Bad:** `<MultiSelect value={value} onValueChange={...} /> without keeping value in sync`  
**Good:** `Store the selected string[] and update it from onValueChange every toggle`  
**Why:** Selection is fully controlled; the listbox reflects value, so dropping the update leaves checkboxes out of sync with state

## Related components

- **Select** (alternative): Use Select for single-value selection
- **Combobox** (alternative): Use Combobox when users may type values not in the list
- **Checkbox** (alternative): Use a Checkbox group for a small set of always-visible options

## Accessibility rationale

The trigger advertises aria-haspopup="listbox" and aria-expanded, the panel is role="listbox" with aria-multiselectable, each option is role="option" with aria-selected reflecting membership and aria-disabled for unavailable ones; ArrowUp/ArrowDown move the active option, Space/Enter toggle it, and Escape closes the popover.

## Props

| Name            | Type                    | Required | Default | Description |
| --------------- | ----------------------- | -------- | ------- | ----------- |
| `options`       | `MultiSelectOption[]`   | Yes      | —       | —           |
| `value`         | `string[]`              | Yes      | —       | —           |
| `onValueChange` | `(v: string[]) => void` | Yes      | —       | —           |
| `placeholder`   | `string`                | No       | —       | —           |
| `disabled`      | `boolean`               | No       | false   | —           |
| `labels`        | `MultiSelectLabels`     | No       | —       | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-radius-input`
- `--cascivo-radius-md`
- `--cascivo-shadow-md`
- `--cascivo-focus-ring`
- `--cascivo-motion-enter`

## Examples

### Basic

```jsx
<MultiSelect
  options={[
    { label: 'One', value: '1' },
    { label: 'Two', value: '2' },
  ]}
  value={[]}
  onValueChange={() => {}}
/>
```

## Boundaries

| Area        | Level    | Note                                                                                                           |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| token names | strict   | Surface, border, accent, radius, shadow, focus-ring, and motion must resolve to the listed --cascivo-\* tokens |
| labels      | flexible | placeholder, selected(count), search, and noResults are overridable                                            |
| options     | flexible | Caller supplies the option list and may mark individual options disabled                                       |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo MultiSelect component (inputs). Searchable multi-value select with popover listbox

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

MultiSelect is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-radius-input, --cascivo-radius-md, --cascivo-shadow-md, --cascivo-focus-ring, --cascivo-motion-enter

Accessibility: role "listbox", WCAG 2.2-AA, keyboard: ArrowDown/ArrowUp/Space/Enter/Escape. Keep it AA.

Do not change (strict): token names — Surface, border, accent, radius, shadow, focus-ring, and motion must resolve to the listed --cascivo-* tokens
Flexible: labels, options.

Do not invent props, tokens, or global viewport media queries.
```
