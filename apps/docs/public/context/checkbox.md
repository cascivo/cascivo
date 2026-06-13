# Checkbox

**Category:** inputs  
**Description:** Binary toggle for forms, with indeterminate support

## When to use

- Selecting zero or more options from a list where each choice is independent
- A single opt-in within a form (accept terms, subscribe) submitted alongside other fields
- A "select all" control that needs an indeterminate (partial) state

## When NOT to use

- A binary setting that applies immediately on change — use Toggle
- Choosing exactly one option from a mutually exclusive set — use Radio

## Anti-patterns

### Checkbox signals a form value to be submitted; Toggle signals an immediate on/off state change

**Bad:** `<Checkbox label="Dark mode" /> that flips a setting live`  
**Good:** `<Toggle label="Dark mode" />`  
**Why:** Checkbox signals a form value to be submitted; Toggle signals an immediate on/off state change

### Independent checkboxes let the user select both or neither, which a single exclusive choice should not allow

**Bad:** `Two checkboxes for one either/or choice`  
**Good:** `Use Radio for mutually exclusive options`  
**Why:** Independent checkboxes let the user select both or neither, which a single exclusive choice should not allow

## Related components

- **Toggle** (alternative): Use for immediate binary settings rather than form values
- **Radio** (alternative): Use for selecting exactly one from a mutually exclusive set
- **CheckboxCard** (alternative): Use the card variant when each option needs a title plus description

## Accessibility rationale

Renders a native <input type="checkbox"> wrapped in a <label>, so role, checked/indeterminate state, Space activation, and label association come from the platform; the indeterminate visual is set on the DOM node since it is a property not an attribute

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | No | — | — |
| `checked` | `boolean` | No | — | — |
| `indeterminate` | `boolean` | No | false | — |
| `disabled` | `boolean` | No | false | — |
| `onChange` | `React.ChangeEventHandler<HTMLInputElement>` | No | — | — |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-accent`
- `--cascade-color-border-strong`
- `--cascade-color-text-on-accent`
- `--cascade-radius-sm`
- `--cascade-focus-ring`

## Examples

### With label

```jsx
<Checkbox label="Accept terms" />
```

### Indeterminate

```jsx
<Checkbox label="Select all" indeterminate />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| native input props | flexible | Spreads InputHTMLAttributes — name, value, required, checked, onChange all pass through |
| token names | strict | Control styling resolves to semantic --cascade-color-* / --cascade-radius-sm tokens |
