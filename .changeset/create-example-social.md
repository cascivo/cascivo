---
'cascivo': minor
---

`cascivo create --framework cloudflare --example social`: `/social` connects LinkedIn and
Mastodon accounts and posts to them now or at a time you pick. Each post is a Workflow that
waits until it is due, then posts to each account in its own step: Mastodon's retry with an
idempotency key, LinkedIn's never (an interrupted LinkedIn post is reported, not repeated).
What a network would refuse shows while you type, and the Worker refuses the same before
scheduling. It brings `--auth oauth` unless another sign-in is chosen.
