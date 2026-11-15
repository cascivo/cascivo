---
'cascivo-tui': minor
---

Wrapping `text` now reports its wrapped height, so its tail is no longer cut off. A container with
no size class and no growing child takes its intrinsic size instead of a share of the free space.
`input` no longer draws a built-in leading space (add `px-1` for an inset). New
`TestApp::assert_snapshot(name)` with `UPDATE_SNAPSHOTS=1`. `Theme` is re-exported at the crate root.
