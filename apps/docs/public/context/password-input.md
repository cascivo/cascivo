# PasswordInput

**Category:** inputs  
**Description:** Password input with reveal toggle and optional strength meter

## When to use

- Collecting a secret credential that should be masked by default with an opt-in reveal toggle
- Password creation flows that benefit from inline strength feedback

## When NOT to use

- Non-secret text — use Input
- A fixed-length one-time verification code — use OtpInput

## Anti-patterns

### PasswordInput adds an accessible reveal/hide toggle and an optional strength meter on top of the masked field, which a raw password input lacks

**Bad:** `<Input type="password" />`  
**Good:** `<PasswordInput showStrengthMeter />`  
**Why:** PasswordInput adds an accessible reveal/hide toggle and an optional strength meter on top of the masked field, which a raw password input lacks

## Related components

- **Input** (alternative): Use for non-secret text that never needs masking
- **OtpInput** (alternative): Use for fixed-length one-time codes rather than passwords

## Accessibility rationale

The reveal control is a real <button> whose aria-label switches between reveal/hide so screen-reader users know the current masking state; toggling swaps the input type between password and text so the platform handles masking natively.

## Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `showStrengthMeter` | `boolean` | No | false | — |
| `size` | `'sm' | 'md' | 'lg'` | No | md | — |
| `labels` | `PasswordInputLabels` | No | — | — |
| `disabled` | `boolean` | No | false | — |
| `placeholder` | `string` | No | — | — |
| `value` | `string` | No | — | — |
| `onChange` | `(e: React.ChangeEvent<HTMLInputElement>) => void` | No | — | — |

## Tokens

- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-color-accent`
- `--cascivo-color-destructive`
- `--cascivo-color-warning`
- `--cascivo-color-success`
- `--cascivo-radius-input`
- `--cascivo-focus-ring`

## Examples

### Basic

```jsx
<PasswordInput placeholder="Enter password" />
```

### With strength meter

```jsx
<PasswordInput showStrengthMeter placeholder="Create password" />
```

## Boundaries

| Area | Level | Note |
|------|-------|------|
| token names | strict | Field, toggle, and strength-meter styling must resolve to the listed --cascivo-* tokens |
| labels | flexible | reveal, hide, and strengthLabel can be overridden via the labels prop |
