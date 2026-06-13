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

| Name          | Type                                                     | Required | Default | Description |
| ------------- | -------------------------------------------------------- | -------- | ------- | ----------- | --- | --- |
| `label`       | `string`                                                 | No       | —       | —           |
| `hint`        | `string`                                                 | No       | —       | —           |
| `error`       | `string`                                                 | No       | —       | —           |
| `placeholder` | `string`                                                 | No       | —       | —           |
| `options`     | `{ value: string; label: string; disabled?: boolean }[]` | Yes      | —       | —           |
| `size`        | `'sm'                                                    | 'md'     | 'lg'`   | No          | md  | —   |
| `disabled`    | `boolean`                                                | No       | false   | —           |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-text-muted`
- `--cascade-radius-input`
- `--cascade-focus-ring`

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
| token names   | strict   | Visual props must resolve to --cascade-color-\* / radius / focus-ring tokens |
| option labels | flexible | Free, supplied by the consumer via the options array                         |
