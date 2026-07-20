# UsersTablePage

Full users management page with table, search, and invite action.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/users-table-page
```

_Copy-paste only — this block/layout is not published as an importable package._

## Category

`display`

## Props

| Prop       | Type         | Required | Default | Description           |
| ---------- | ------------ | -------- | ------- | --------------------- |
| `users`    | `User[]`     | no       | —       | User data             |
| `onInvite` | `() => void` | no       | —       | Invite button handler |

## Examples

### Default

Demo users table

```tsx
<UsersTablePage />
```

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, users, table, page

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
