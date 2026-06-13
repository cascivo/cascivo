# TimePicker

**Category:** inputs  
**Description:** Native time input wrapper with label, hint, error, and size variants

## When to use

- Capturing a time of day (HH:mm) in a form, such as a meeting or reminder time
- You want the native OS time entry UX with built-in formatting and validation
- A time field that needs a label, hint, error, or min/max bounds

## When NOT to use

- Picking a calendar date — use DatePicker
- A free-form or non-time text value — use Input

## Anti-patterns

### A plain Input cannot enforce time format or offer the native time UI; TimePicker gives parsing and locale handling for free

**Bad:** `<Input placeholder="HH:mm" /> // hand-rolled time field`  
**Good:** `<TimePicker label="Start" />`  
**Why:** A plain Input cannot enforce time format or offer the native time UI; TimePicker gives parsing and locale handling for free

## Related components

- **DatePicker** (alternative): Use when a calendar date is needed instead of a time
- **Input** (alternative): Use for non-time free-text values

## Accessibility rationale

Renders a native <input type="time"> so segmented HH/mm entry, format enforcement, and keyboard support come from the platform; error text is linked via aria-describedby with aria-invalid.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | No | — | Controlled value (HH:mm) |
| `defaultValue` | `string` | No | — | — |
| `onChange` | `(value: string) => void` | No | — | — |
| `min` | `string` | No | — | — |
| `max` | `string` | No | — | — |
| `step` | `number` | No | — | — |
| `label` | `string` | No | — | — |
| `hint` | `string` | No | — | — |
| `error` | `string` | No | — | — |
| `size` | `'sm' | 'md' | 'lg'` | No | 'md' | — |
| `disabled` | `boolean` | No | — | — |
| `className` | `string` | No | — | — |

## Tokens

- `--cascade-color-surface`
- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-accent`
- `--cascade-color-danger`
- `--cascade-radius-input`
- `--cascade-radius-md`

## Examples

### Basic time picker

```jsx
<TimePicker label="Meeting time" onChange={(v) => console.log(v)} />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| value format | strict | Value is a 24-hour HH:mm string driven by the native time input |
| min/max/step | flexible | Consumer-defined bounds and step granularity |
