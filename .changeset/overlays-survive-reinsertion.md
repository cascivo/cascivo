---
'@cascivo/react': patch
---

An open `Modal` or popover now survives being re-inserted into the document. Astro's
`transition:persist` in browsers without `Element.moveBefore` (Safari, Firefox) re-inserts the
persisted island by moving an ancestor. That dropped an open modal out of the top layer while it
still counted as open, so Escape and the backdrop did nothing, and it hid an open popover without a
`toggle` event. While open, `Modal` and `usePopover` (Popover, HoverCard, Menu and the other
components built on it) now watch for re-insertion and show the overlay again, without firing
`close` or `onClose`. Closed overlays do not watch.
