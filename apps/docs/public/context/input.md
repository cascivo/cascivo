# Input

**Category:** inputs  
**Description:** Text input field with optional label, hint, and error state

## When to use

- Collecting a single line of free-form text from the user
- Pairing a labelled field with optional hint and validation error messaging
- As a field control inside a Form, wired via form.field()

## When NOT to use

- Multi-line text — use Textarea
- Choosing from a fixed list of options — use Select, Combobox, or MultiSelect
- Editing one read-only value in place — use Editable

## Anti-patterns

### Placeholder text disappears on input and is not a substitute for a persistent, programmatically associated label

**Bad:** `<Input placeholder="Email" /> with no label`  
**Good:** `<Input label="Email" placeholder="you@example.com" />`  
**Why:** Placeholder text disappears on input and is not a substitute for a persistent, programmatically associated label

## Related components

- **Form** (contained-by): Input is the primary field control wired into a Form store
- **InputGroup** (pairs-with): Wrap Input in InputGroup to add prefix/suffix addons
- **Textarea** (alternative): Use Textarea for multi-line input

## Accessibility rationale

The label is associated to the input via htmlFor/id, error text is linked through aria-describedby and announced with role="alert", and aria-invalid is set when an error is present so assistive tech reports the field as erroneous; visual focus state is driven by CSS, not tracked imperatively.

## Props

| Name          | Type      | Required | Default | Description |
| ------------- | --------- | -------- | ------- | ----------- | --- | --- |
| `label`       | `string`  | No       | —       | —           |
| `hint`        | `string`  | No       | —       | —           |
| `error`       | `string`  | No       | —       | —           |
| `size`        | `'sm'     | 'md'     | 'lg'`   | No          | md  | —   |
| `placeholder` | `string`  | No       | —       | —           |
| `disabled`    | `boolean` | No       | false   | —           |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-color-accent`
- `--cascade-color-destructive`
- `--cascade-radius-input`
- `--cascade-focus-ring`

## Examples

### With label

```jsx
<Input label="Email" placeholder="you@example.com" />
```

### With error

```jsx
<Input label="Email" error="Invalid email address" />
```

## Boundaries

| Area                      | Level    | Note                                                                                                        |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- | --- | -------------------- |
| token names               | strict   | Surface, border, accent, destructive, radius, and focus-ring must resolve to the listed --cascade-\* tokens |
| label / hint / error copy | flexible | Free, within content tone guidance                                                                          |
| size                      | flexible | sm                                                                                                          | md  | lg, defaulting to md |
