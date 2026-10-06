---
'cascivo': patch
---

The `newsletter` example passes `confirmSubscriptions: true` to `handleSns`, which no longer
confirms SNS subscriptions unless asked, so the scaffold still confirms its configured topic.
