---
'cascivo': minor
---

`--example social` checks a Mastodon post against its server's own limits, read once a day
per server and kept in D1. The page checks it while you type, and the Workflow checks it again
when the post goes out, so a long post for a server that allows one is no longer refused at 500.
