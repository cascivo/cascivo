---
'cascivo': minor
---

`--example social` and Buffer:

- **"Let Buffer hold it".** A scheduled post can hand its Buffer accounts to Buffer at once,
  with the post's time. They then wait in Buffer's queue, where they can still be edited, and
  show as `queued`. The other networks wait in the Workflow as before.
- **The request budget is counted.** The app counts its Buffer requests per 15-minute window
  in D1 (Buffer allows 100 for every user of the app together) and shows the count on the page.
  Channel lists stop refreshing when fewer than 20 requests remain, so those are kept for
  posting.
