---
'@cascivo/themes': patch
---

Make `@cascivo/tokens` a direct dependency of `@cascivo/themes` instead of a peer.

The theme CSS `@import`s `@cascivo/tokens`, so it is a hard runtime edge — but as a
peer it only resolved when the consumer's package manager auto-installed peers (pnpm's
default). On npm, yarn-classic, or with `auto-install-peers=false`, the `@import`
dead-ended and every component rendered unstyled with no error pointing at the cause
(2026-07-20 adopter report). As a direct dependency it installs automatically on every
package manager. A new `css-imports` guard keeps cross-package CSS `@import` targets as
direct dependencies going forward.
