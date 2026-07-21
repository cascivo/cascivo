---
'@cascivo/core': minor
'@cascivo/react': patch
---

Expose the router-link contract as a named, documented type.

`setLinkComponent` shipped, but the prop bag it hands a custom link was an opaque
`ElementType` — an adopter reading the shipped `.d.ts` as documentation couldn't see
`href`/`aria-current`/`onClick`/… or the `href → to` mapping idiom (2026-07-20 report, #6).
`@cascivo/core` now exports a JSDoc'd `LinkComponentProps` interface, re-exported from
`@cascivo/react`, and `setLinkComponent`'s docs show the TanStack adapter inline.

`SideNavLinkProps.onClick` is now optional: cascivo always provides it and it only
`preventDefault`s a disabled item, so it composes cleanly when spread onto a router
`<Link>` (which keeps middle-click / open-in-new-tab).
