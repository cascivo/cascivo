---
'@cascivo/app': minor
---

- `bluesky()` names the account: its display name and avatar come from its profile record on its
  own PDS (the avatar as the PDS's blob URL). Best effort: a missing profile leaves them `null`.
- `mastodonServerLimits(server)` in `@cascivo/app/social` reads a server's own limits from its
  public `/api/v2/instance`: characters, images per post, and what a URL counts as. It falls
  back to Mastodon's defaults when the server does not say. `mastodonPublisher` takes all three
  (`maxImages` and `urlWeight` are new), and `mastodonLength(text, urlWeight?)` counts with the
  server's URL weight.
