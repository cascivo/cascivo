---
'@cascivo/react': minor
'@cascivo/i18n': minor
'@cascivo/mcp': minor
---

`ShareMenu`: a Share button opening each network's own compose link for Bluesky, Mastodon,
Threads, LinkedIn and X. It also offers copy link, and the system share sheet where the browser
has one. No account, token or third-party script is involved. The panel is a native popover opened by
`popovertarget`, so the links work before hydration. On a phone it is a bottom sheet; wider, it
is anchored to the trigger and flips to stay on screen. Mastodon asks for the reader's server
and remembers it. `shareIntentUrl(network, { url, text, server })` builds the same links for
your own markup. New `builtin.shareMenu` messages (en, de).
