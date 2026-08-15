# UsersTablePage

Full users management page with table, search, and invite action.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/users-table-page
```

_Copy-paste only — `UsersTablePage` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`display`

## Props

| Prop       | Type         | Required | Default     | Description           |
| ---------- | ------------ | -------- | ----------- | --------------------- |
| `users`    | `User[]`     | no       | `demoUsers` | User data             |
| `onInvite` | `() => void` | no       | —           | Invite button handler |

## Examples

### Default

Demo users table

```tsx
<UsersTablePage />
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, users, table, page

---

_Generated from registry v0.17.1 on 2026-08-11. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
