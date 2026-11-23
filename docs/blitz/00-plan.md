# cascivo × Blitz plan

Goal: cascivo is the best UI library for Blitz. It renders natively without Dioxus.

| WP | Scope | Depends |
|----|-------|---------|
| 1 | `crates/cascivo-blitz`: `.cv`/HTML goes to a native window (`blitz` 0.2 stable). Prefs shim (`:has()`), a headless computed-style test harness, an example, docs | – |
| 2 | `cascivo-html` Blitz target: `@container` fallback, `:focus-visible` to `:focus`, SVG presentational attrs, `check --target blitz` compat lint | – |
| 3 | Dioxus-free reactivity: signals plus `EventHandler` and `DocumentMutator` bindings. Native table-sort, tabs, dialog/select replacements | 1 |
| 4 | Review, CI (fmt/clippy/test), changesets, single PR | 1–3 |

Research: `01-blitz-research.md`, `02-cascivo-audit.md`.
