---
"cascivo-blitz": minor
---

Interactivity without Dioxus. New `App` (`from_cv`, `from_html`, `on(selector, Event, handler)`,
`bind_text`/`bind_attr`/`bind_class`, `build`, `launch`) builds an `InteractiveDocument`, a Blitz
`Document` that routes click, input and key events to Rust handlers and applies changes through
`DocumentMutator`. New small signal layer (`Signal`, `computed`, `effect`, `batch`). Native
behaviours replace the omitted table-sort script and what Blitz lacks: table sort, radio and ARIA
tabs with arrow keys, `details` groups, `<dialog>`, and a listbox fallback for `<select>`; Enter and
Space activate focused controls. `Options` now renders with `Target::Blitz` by default and has
`lint`; `App` surfaces `cascivo_html::lint` warnings. Headless helpers (`click`, `press`,
`pointer_click`, `input`) drive events in tests.
