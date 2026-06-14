# Field

**Category:** inputs  
**Description:** Form-field wrapper composing label, control, description, and error

## When to use

- Pairing a single control with its label, helper text, and validation message
- Wiring aria-describedby / aria-invalid automatically instead of by hand

## When NOT to use

- A standalone control that needs no label, description, or error
- Grouping multiple related controls — use a <fieldset> with a <legend>

## Anti-patterns

### Field clones exactly one child control to inject its id and aria wiring; multiple children break the association

**Bad:** `<Field label="Email"><Input /><Input /></Field>`  
**Good:** `<Field label="Email"><Input /></Field>`  
**Why:** Field clones exactly one child control to inject its id and aria wiring; multiple children break the association

### Hand-wired markup easily drifts: missing ids, no role="alert", mismatched aria-describedby — Field keeps them in sync

**Bad:** `<div><label>Email</label><input aria-invalid /><span>Error</span></div>`  
**Good:** `<Field label="Email" error="Error"><Input /></Field>`  
**Why:** Hand-wired markup easily drifts: missing ids, no role="alert", mismatched aria-describedby — Field keeps them in sync

## Related components

- **Label** (contains): Field renders a Label and links it to the control via htmlFor
- **Input** (contains): The control passed as children receives the generated id and aria attributes

## Accessibility rationale

Generates stable ids with useId and links them through htmlFor and aria-describedby; the error carries role="alert" so it is announced on appearance, and aria-invalid marks the control invalid for assistive tech

## Props

| Name          | Type           | Required | Default | Description |
| ------------- | -------------- | -------- | ------- | ----------- |
| `label`       | `ReactNode`    | No       | —       | —           |
| `description` | `ReactNode`    | No       | —       | —           |
| `error`       | `ReactNode`    | No       | —       | —           |
| `required`    | `boolean`      | No       | false   | —           |
| `disabled`    | `boolean`      | No       | false   | —           |
| `id`          | `string`       | No       | —       | —           |
| `children`    | `ReactElement` | Yes      | —       | —           |

## Tokens

- `--cascivo-space-2`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-leading-snug`
- `--cascivo-color-text-muted`
- `--cascivo-color-destructive`

## Examples

### Basic

```jsx
<Field label="Email">
  <Input type="email" />
</Field>
```

### With description

```jsx
<Field label="Email" description="We never share it.">
  <Input />
</Field>
```

### With error

Sets aria-invalid on the control and announces the error via role="alert".

```jsx
<Field label="Email" error="Email is required" required>
  <Input />
</Field>
```

## Boundaries

| Area            | Level    | Note                                                                   |
| --------------- | -------- | ---------------------------------------------------------------------- |
| token names     | strict   | Spacing and color must resolve to --cascivo-\* semantic tokens         |
| control element | flexible | Any single element accepting id/aria-\* props can be the child control |
