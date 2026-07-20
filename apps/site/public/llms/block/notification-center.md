# NotificationCenter

A list of notification alerts with a mark-all-read action.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/notification-center
```

_Copy-paste only — this block/layout is not published as an importable package._

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

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, notifications, alerts

---

_Generated from registry v0.8.0 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
