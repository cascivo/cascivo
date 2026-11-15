# Changelog

## 0.2.0

### Minor Changes

- New crate `cascivo-tui`: a ratatui toolkit with class strings, cascivo themes, an MVU runtime,
  a headless `TestApp`, and 13 widgets.

- Wrapping `text` now reports its wrapped height, so its tail is no longer cut off. A container with
  no size class and no growing child takes its intrinsic size instead of a share of the free space.
  `input` no longer draws a built-in leading space (add `px-1` for an inset). New
  `TestApp::assert_snapshot(name)` with `UPDATE_SNAPSHOTS=1`. `Theme` is re-exported at the crate root.

- Runtime commands from adopter feedback: `Cmd::Focus(id)` / `Cmd::focus`, `Cmd::FocusNext` and
  `Cmd::FocusPrev` (applied after the next view); `Cmd::Task` / `Cmd::task` runs a closure on a worker
  thread and feeds its result to `update` (`TestApp` runs it inline; `run` and `run_with` now require
  `Msg: Send`; `Cmd` is no longer `Clone`); `Cmd::NextTheme` / `Cmd::PrevTheme` cycle the built-in
  themes, and the new `App::theme_changed` hook reports the starting theme and every switch.

## Unreleased

First release: class-string styling, cascivo themes, MVU runtime, `TestApp`, and the widgets
`card`, `heading`, `statusbar`, `progress`, `sparkline`, `button`, `input`, `list`, `tabs`,
`table`, `modal`, `toast`, `keyhints`.

Not yet: `select`, `tree`, `textarea`, `command_palette`, `spinner`, hex colors, margins,
absolute overlays, mouse, async `Cmd`.
