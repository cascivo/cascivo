# NotificationCenter

A list of notification alerts with a mark-all-read action.

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add block/notification-center
```

_Copy-paste only — `NotificationCenter` is not exported from `@cascivo/react`. Run the command above to own the source, or compose it from the exported primitives (`Flex`, `Grid`, `Heading`, …)._

## Category

`display`

## Props

| Prop            | Type             | Required | Default             | Description                   |
| --------------- | ---------------- | -------- | ------------------- | ----------------------------- |
| `notifications` | `Notification[]` | no       | `demoNotifications` | Notification items to display |
| `onMarkAllRead` | `() => void`     | no       | —                   | Mark all read button handler  |

## Examples

### Default

Notification center

```tsx
<NotificationCenter />
```

## Client JavaScript

Enhancement only. The component still does its job with JavaScript disabled — the server-rendered HTML is correct and nothing is unreachable; client JS adds polish on top.

## Accessibility

- **WCAG level:** 2.1-AA
- **ARIA role:** `generic`

## Dependencies

- `@cascivo/react`

## Tags

block, notifications, alerts

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
