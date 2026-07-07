# Select

**Category:** inputs  
**Description:** Native select menu styled to match the design system

## When to use

- Choosing exactly one value from a known, finite list inside a form
- A compact single-value picker where the native OS dropdown UX is acceptable
- You want zero-JS reliability and built-in mobile/keyboard handling from a real <select>

## When NOT to use

- Users need to filter/search a long list — use Combobox
- Multiple values must be selectable — use MultiSelect
- Triggering actions or commands rather than picking a form value — use Dropdown or Menu

## Anti-patterns

### A long unfiltered native list is hard to scan; Combobox adds type-ahead filtering

**Bad:** `<Select options={fiftyCountries} placeholder="Search country" />`  
**Good:** `<Combobox options={fiftyCountries} />`  
**Why:** A long unfiltered native list is hard to scan; Combobox adds type-ahead filtering

## Related components

- **Combobox** (alternative): Use when the list is long and needs filtering/search
- **MultiSelect** (alternative): Use when more than one value can be chosen
- **Dropdown** (alternative): Use for action menus, not single-value form selection

## Accessibility rationale

Renders a native <select> so options, type-ahead, and arrow-key navigation come from the platform; error text is linked via aria-describedby and role="alert" with aria-invalid on the control.

## Props

| Name          | Type                                                     | Required | Default | Description                                                        |
| ------------- | -------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `label`       | `string`                                                 | No       | —       | Text label for the control.                                        |
| `hint`        | `string`                                                 | No       | —       | Supplementary hint text shown with the control.                    |
| `error`       | `string`                                                 | No       | —       | Error message shown when the value is invalid.                     |
| `placeholder` | `string`                                                 | No       | —       | Placeholder text shown when the field is empty.                    |
| `options`     | `{ value: string; label: string; disabled?: boolean }[]` | Yes      | —       | The selectable options.                                            |
| `size`        | `'sm' \| 'md' \| 'lg'`                                   | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `disabled`    | `boolean`                                                | No       | false   | When true, disables the control and removes it from the tab order. |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-text-muted`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<Select label="Role" options={[{ value: 'admin', label: 'Admin' }]} />
```

### With placeholder

```jsx
<Select label="Country" placeholder="Choose…" options={countries} />
```

## Boundaries

| Area          | Level    | Note                                                                         |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| token names   | strict   | Visual props must resolve to --cascivo-color-\* / radius / focus-ring tokens |
| option labels | flexible | Free, supplied by the consumer via the options array                         |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo Select component (inputs). Native select menu styled to match the design system

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

Select is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-text-muted, --cascivo-radius-input, --cascivo-focus-ring

Accessibility: role "listbox", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/Space. Keep it AA.

Do not change (strict): token names — Visual props must resolve to --cascivo-color-* / radius / focus-ring tokens
Flexible: option labels.

Do not invent props, tokens, or global viewport media queries.
```
