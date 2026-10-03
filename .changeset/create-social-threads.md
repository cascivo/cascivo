---
'cascivo': minor
---

`--example social` connects Threads once `THREADS_APP_ID` and `THREADS_APP_SECRET` are set.
A daily Cron Trigger (`17 4 * * *`) renews Threads tokens in their last 30 days. It shares
the Worker's one `scheduled` handler with `--example digest`, which tells the two apart by
schedule. Threads posts, like Buffer's and LinkedIn's, are never retried.
