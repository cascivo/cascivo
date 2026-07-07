# NativeSelect

**Category:** inputs  
**Description:** A styled native <select> that keeps platform form/keyboard behavior with a custom chevron and focus ring

## When to use

- A standard single-choice dropdown where native behavior and form integration matter most
- Mobile-first forms that should use the platform picker UI
- Pairing with a Field/Label inside a regular HTML form

## When NOT to use

- Multi-select, search/typeahead, or rich option rendering — use the custom Select/Combobox
- A handful of mutually exclusive options where radios read better

## Anti-patterns

### Native <option> cannot render icons or be searched; use a custom listbox for rich options

**Bad:** `<NativeSelect options={oneHundredOptionsWithIcons} />`  
**Good:** `<Combobox options={...} />`  
**Why:** Native <option> cannot render icons or be searched; use a custom listbox for rich options

## Related components

- **Select** (alternative): Custom-rendered listbox for richer options at the cost of native form/keyboard behavior
- **RadioCard** (alternative): Better for a small fixed set of mutually exclusive choices shown inline

## Accessibility rationale

It is a real <select>, so the browser provides the combobox role, keyboard interaction, and announcement. aria-invalid is set when invalid; the placeholder is a disabled hidden first option so it shows but is not selectable.

## Props

| Name           | Type                                          | Required | Default | Description                                                        |
| -------------- | --------------------------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `options`      | `NativeSelectOption[]`                        | No       | —       | Options to render. Alternatively pass <option> children.           |
| `children`     | `React.ReactNode`                             | No       | —       | Raw <option> children (used when options is not provided).         |
| `size`         | `'sm' \| 'md' \| 'lg'`                        | No       | md      | Visual size of the component (e.g. 'sm', 'md', 'lg').              |
| `invalid`      | `boolean`                                     | No       | —       | Marks the control as invalid for error styling and a11y.           |
| `placeholder`  | `string`                                      | No       | —       | Placeholder rendered as a disabled, hidden first option.           |
| `value`        | `string`                                      | No       | —       | The controlled value.                                              |
| `defaultValue` | `string`                                      | No       | —       | The initial value when uncontrolled.                               |
| `onChange`     | `React.ChangeEventHandler<HTMLSelectElement>` | No       | —       | Called when the selected value changes.                            |
| `disabled`     | `boolean`                                     | No       | —       | When true, disables the control and removes it from the tab order. |
| `className`    | `string`                                      | No       | —       | Additional CSS class names merged onto the root element.           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-text-muted`
- `--cascivo-radius-field`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<NativeSelect
  placeholder="Choose a country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
  ]}
  onChange={(e) => setCountry(e.target.value)}
/>
```

### Option children

```jsx
<NativeSelect size="sm" defaultValue="light">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</NativeSelect>
```

### Invalid

```jsx
<NativeSelect invalid placeholder="Required" options={countries} />
```

## Boundaries

| Area    | Level    | Note                                                       |
| ------- | -------- | ---------------------------------------------------------- |
| options | flexible | Pass an options array or raw <option> children             |
| value   | flexible | Controlled (value/onChange) or uncontrolled (defaultValue) |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo NativeSelect component (inputs). A styled native <select> that keeps platform form/keyboard behavior with a custom chevron and focus ring

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

NativeSelect is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-text-muted, --cascivo-radius-field, --cascivo-focus-ring

Accessibility: role "combobox", WCAG 2.2-AA, keyboard: ArrowUp/ArrowDown/Enter/Space/Home/End. Keep it AA.
Flexible: options, value.

Do not invent props, tokens, or global viewport media queries.
```
