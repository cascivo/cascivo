# UsersTablePage

Full users management page with table, search, and invite action.

## Install

```bash
npx cascade add block/users-table-page
```

## Category

`display`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `users` | `User[]` | no | — | User data |
| `onInvite` | `() => void` | no | — | Invite button handler |

## Examples

### Default

Demo users table

```tsx
<UsersTablePage />
```

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/react`
- `layout/page-header`
- `layout/stack`

## Tags

block, users, table, page
