# LoginPage

Authentication login page with email and password form.

## Install

```bash
npx cascivo add block/login-page
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

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`
- `layout/auth-layout`

## Tags

block, login, auth, form, page
