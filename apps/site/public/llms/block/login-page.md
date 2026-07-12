# LoginPage

Authentication login page with email and password form.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/login-page
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSubmit` | `(values: LoginValues) => void` | no | — | Called with valid form values on submit |

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

## Tags

block, login, auth, form, page
