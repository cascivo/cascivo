# LoginPage

Authentication login page with email and password form.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/login-page
```

_Copy-paste only — `LoginPage` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

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

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, login, auth, form, page

---

_Generated from registry v0.18.0 on 2026-08-17. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
