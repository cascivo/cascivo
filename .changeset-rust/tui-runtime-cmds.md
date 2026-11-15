---
'cascivo-tui': minor
---

Runtime commands from adopter feedback: `Cmd::Focus(id)` / `Cmd::focus`, `Cmd::FocusNext` and
`Cmd::FocusPrev` (applied after the next view); `Cmd::Task` / `Cmd::task` runs a closure on a worker
thread and feeds its result to `update` (`TestApp` runs it inline; `run` and `run_with` now require
`Msg: Send`; `Cmd` is no longer `Clone`); `Cmd::NextTheme` / `Cmd::PrevTheme` cycle the built-in
themes, and the new `App::theme_changed` hook reports the starting theme and every switch.
