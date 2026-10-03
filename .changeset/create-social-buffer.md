---
'cascivo': minor
---

`--example social` connects Buffer too, once `BUFFER_CLIENT_ID` is set: each channel in a
connected Buffer is an account in the composer, checked against its network's limit. Channel
lists are kept for an hour to spare Buffer's request budget, and Buffer posts, like LinkedIn's,
are never retried.
