# AuthLayout

Centered card layout for authentication pages (login, register, forgot password).

## Install

```bash
npx cascade add layout/auth-layout
```

## Category

`layout`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | yes | — | Auth form content |
| `logo` | `ReactNode` | no | — | Optional logo displayed above the form |

## Examples

### Login

Centered auth card with logo

```tsx
<AuthLayout logo={<img src="/logo.svg" alt="Logo" />}><form>...</form></AuthLayout>
```

## Design tokens

- `--cascade-color-bg-subtle`
- `--cascade-color-surface`
- `--cascade-color-border`
- `--cascade-radius-lg`
- `--cascade-space-4`
- `--cascade-space-6`
- `--cascade-space-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/core`

## Tags

layout, auth, login, page
