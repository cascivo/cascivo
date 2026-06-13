# AuthLayout

Centered card layout for authentication pages (login, register, forgot password).

## Install

```bash
npx cascivo add layout/auth-layout
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

- `--cascivo-color-bg-subtle`
- `--cascivo-color-surface`
- `--cascivo-color-border`
- `--cascivo-radius-lg`
- `--cascivo-space-4`
- `--cascivo-space-6`
- `--cascivo-space-8`

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/core`

## Tags

layout, auth, login, page
