---
'@cascivo/react': minor
---

`Avatar` accepts a `name` prop and derives initials from it (grapheme-safe, first +
last word), so `<Avatar name="Ada Lovelace" />` renders "AL" and is labeled "Ada
Lovelace" — no need to pre-compute `fallback`. Explicit `fallback` still wins, and
`name` also supplies the image `alt` when `src` is set without an explicit `alt`. The
`User` composite forwards its string `name` to the Avatar automatically.
