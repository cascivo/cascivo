---
'cascivo': minor
---

`cascivo email lint` also reports links that go nowhere (`checkLinks` from `@cascivo/email`):
a blocked link fails the command like a blocked feature does. `--check-links` additionally
requests every http(s) URL (`HEAD`, then `GET`, redirects followed, 10s each) and fails on a
4xx/5xx or no answer.
