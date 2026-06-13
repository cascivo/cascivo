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

### Combobox has role="combobox" with a listbox of selectable values and onChange semantics — actions belong in a menu

**Bad:** `Using Combobox to fire actions like "Delete" or "Export"`  
**Good:** `Use Dropdown for actions; Combobox is for picking a value`  
**Why:** Combobox has role="combobox" with a listbox of selectable values and onChange semantics — actions belong in a menu

### Without filtering the list becomes an unusable scroll; either keep search on or switch to a different selection pattern

**Bad:** `Setting searchable={false} on a 200-item list`  
**Good:** `undefined`  
**Why:** Without filtering the list becomes an unusable scroll; either keep search on or switch to a different selection pattern

## Related components

- **Select** (alternative): Use for short lists that do not need type-to-filter
- **MultiSelect** (alternative): Use when more than one value can be selected
- **CommandMenu** (alternative): Use the Cmd+K palette for command/navigation search rather than value selection

## Accessibility rationale

Trigger exposes role="combobox" with aria-expanded, aria-controls, aria-haspopup="listbox", and aria-activedescendant pointing at the active option so screen readers track focus through arrow navigation without moving DOM focus off the input; error state is wired via aria-invalid + aria-describedby and announced with role="alert"

## Props

| Name           | Type               | Required            | Default | Description |
| -------------- | ------------------ | ------------------- | ------- | ----------- | ---- | --- |
| `options`      | `ComboboxOption[]` | Yes                 | —       | —           |
| `value`        | `string`           | No                  | —       | —           |
| `defaultValue` | `string`           | No                  | —       | —           |
| `onChange`     | `(value: string    | undefined) => void` | No      | —           | —    |
| `clearable`    | `boolean`          | No                  | false   | —           |
| `searchable`   | `boolean`          | No                  | true    | —           |
| `label`        | `string`           | No                  | —       | —           |
| `hint`         | `string`           | No                  | —       | —           |
| `error`        | `string`           | No                  | —       | —           |
| `size`         | `'sm'              | 'md'                | 'lg'`   | No          | 'md' | —   |
| `disabled`     | `boolean`          | No                  | false   | —           |
| `labels`       | `ComboboxLabels`   | No                  | —       | —           |
| `className`    | `string`           | No                  | —       | —           |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-surface-overlay`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-text-subtle`
- `--cascivo-color-accent`
- `--cascivo-color-danger`
- `--cascivo-radius-input`
- `--cascivo-radius-md`
- `--cascivo-radius-sm`
- `--cascivo-shadow-lg`
- `--cascivo-motion-enter`
- `--cascivo-z-dropdown`

## Examples

### Basic combobox

```jsx
<Combobox
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ]}
  onChange={(value) => console.log(value)}
/>
```

## Boundaries

| Area                       | Level    | Note                                                                                     |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| searchable                 | flexible | Filtering can be toggled off for short lists via searchable={false}                      |
| controlled vs uncontrolled | flexible | Supports value + onChange or defaultValue                                                |
| token names                | strict   | Listbox/field styling resolves to semantic --cascivo-color-_ / --cascivo-radius-_ tokens |
