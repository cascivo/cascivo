---
'@cascivo/app': minor
---

`expiringConnections(db, { withinDays })` in `@cascivo/app/oauth-server`: every user's
connections that will stop working within the window (default 7 days) and cannot be renewed,
with the owner's email. Use it in a scheduled job that asks people to connect again before their
posts start failing.
