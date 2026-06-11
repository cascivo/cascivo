# NotificationCenter

A list of notification alerts with a mark-all-read action.

## Install

```bash
npx cascade add block/notification-center
```

## Category

`display`

## Props

| Prop            | Type             | Required | Default | Description                   |
| --------------- | ---------------- | -------- | ------- | ----------------------------- |
| `notifications` | `Notification[]` | no       | —       | Notification items to display |
| `onMarkAllRead` | `() => void`     | no       | —       | Mark all read button handler  |

## Examples

### Default

Notification center

```tsx
<NotificationCenter />
```

## Accessibility

- **WCAG level:** AA
- **ARIA role:** `generic`

## Dependencies

- `@cascade-ui/react`
- `layout/stack`

## Tags

block, notifications, alerts
