---
'cascivo': minor
---

`--example social` emails a reminder to connect LinkedIn again a week before its token
lapses, once per token, from the daily Cron Trigger after Threads tokens are renewed. It sends
through Email Service: set `REMINDER_FROM` and `APP_URL` in `wrangler.jsonc`. Until then, no
reminder is sent.
