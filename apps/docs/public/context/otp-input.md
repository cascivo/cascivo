# OtpInput

**Category:** inputs  
**Description:** Segmented one-time code input

## When to use

- Entering a fixed-length one-time code (2FA, SMS verification, email confirmation) split across per-character slots
- Codes that benefit from auto-advance between slots and pasting the full code at once
- Numeric or alphanumeric short codes of a known length

## When NOT to use

- Variable-length or free-form text — use Input
- Secret credentials that should be masked — use PasswordInput
- Long codes where per-character boxes add no value over a single field — use Input

## Anti-patterns

### OtpInput gives per-digit slots with auto-advance, backspace-to-previous, full-code paste handling, and autoComplete="one-time-code" that a single Input does not

**Bad:** `<Input maxLength={6} placeholder="Enter code" />`  
**Good:** `<OtpInput length={6} value={code} onValueChange={setCode} />`  
**Why:** OtpInput gives per-digit slots with auto-advance, backspace-to-previous, full-code paste handling, and autoComplete="one-time-code" that a single Input does not

## Related components

- **Input** (alternative): Use for variable-length or non-code text entry
- **PasswordInput** (alternative): Use when the entered value is a secret that must be masked

## Accessibility rationale

Wraps the slots in role="group" with a localized aria-label and labels each slot with its position so screen readers announce which digit is being entered; the first slot carries autoComplete="one-time-code" so platform SMS autofill can populate the code.

## Props

| Name            | Type                  | Required        | Default | Description |
| --------------- | --------------------- | --------------- | ------- | ----------- | --- |
| `length`        | `number`              | No              | 6       | —           |
| `value`         | `string`              | Yes             | —       | —           |
| `onValueChange` | `(v: string) => void` | Yes             | —       | —           |
| `disabled`      | `boolean`             | No              | false   | —           |
| `type`          | `'numeric'            | 'alphanumeric'` | No      | numeric     | —   |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-bg-subtle`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<OtpInput value="" onValueChange={() => {}} />
```

### 4-digit

```jsx
<OtpInput length={4} value="" onValueChange={() => {}} />
```

## Boundaries

| Area            | Level    | Note                                                                          |
| --------------- | -------- | ----------------------------------------------------------------------------- |
| token names     | strict   | Slot styling must resolve to the listed --cascivo-\* tokens                   |
| length and type | flexible | length and numeric/alphanumeric type are free to match the issued code format |
