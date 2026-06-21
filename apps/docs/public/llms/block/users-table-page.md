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
- `layout/page-header`
- `layout/stack`

## Tags

block, users, table, page
