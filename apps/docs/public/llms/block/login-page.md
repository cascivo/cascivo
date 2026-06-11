# LoginPage

Authentication login page with email and password form.

## Install

```bash
npx cascade add block/login-page
```

## Category

`display`

## Props

| Prop       | Type                            | Required | Default | Description                             |
| ---------- | ------------------------------- | -------- | ------- | --------------------------------------- |
| `onSubmit` | `(values: LoginValues) => void` | no       | —       | Called with valid form values on submit |

## Examples

### Default

Login page

```tsx
<LoginPage />
```

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/react`
- `layout/auth-layout`

## Tags

block, login, auth, form, page
