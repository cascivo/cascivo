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
| `showStrengthMeter` | `boolean` | No | false | When true, shows a password-strength meter. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | md | Visual size of the component (e.g. 'sm', 'md', 'lg'). |
| `labels` | `PasswordInputLabels` | No | — | Overrides for the component’s user-visible strings (i18n). |
| `disabled` | `boolean` | No | false | When true, disables the control and removes it from the tab order. |
| `placeholder` | `string` | No | — | Placeholder text shown when the field is empty. |
| `value` | `string` | No | — | The controlled value. |
| `onChange` | `(e: React.ChangeEvent<HTMLInputElement>) => void` | No | — | Called when the value changes. |

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

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo PasswordInput component (inputs). Password input with reveal toggle and optional strength meter

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

PasswordInput is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-border, --cascivo-color-accent, --cascivo-color-destructive, --cascivo-color-warning, --cascivo-color-success, --cascivo-radius-input, --cascivo-focus-ring

Accessibility: role "textbox", WCAG 2.2-AA, keyboard: Tab/Shift+Tab. Keep it AA.

Do not change (strict): token names — Field, toggle, and strength-meter styling must resolve to the listed --cascivo-* tokens
Flexible: labels.

Do not invent props, tokens, or global viewport media queries.
```
