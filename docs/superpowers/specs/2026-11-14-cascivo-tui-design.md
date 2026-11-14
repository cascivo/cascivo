# cascivo-tui: design

## Intent

Rust crate that lets an agent build a rich terminal UI in very little code. Built on ratatui.
Same look as the web system: cascivo tokens and themes map to terminal colors. Idea source:
Text.js (anomalyco/textjs): declarative tree, class-string flex layout, one input hook, diffed frames.

## Goals

- Declarative tree: `col("gap-1 p-1 border rounded", [text("Hi").bold(), ...])`.
- Class-string layout + style (Tailwind-like, small fixed vocabulary, unknown class = parse error).
- Themes: generated from `packages/themes/src/*.css` at build time (no runtime CSS parse).
- Ready widgets: card, text, list, table, tabs, input, button, progress, sparkline/chart, toast, modal, statusbar, keyhints.
- App runtime: state struct + `update(msg)` + `view(&state)`; key handling; focus ring (Tab/Shift-Tab).
- Headless test helper: render to a string buffer at a given size, for snapshot tests.
- Agent skill `skills/cascivo-tui` + guide `docs/USING-CASCIVO-TUI.md` + one example binary.

## Non-goals

- No own renderer (ratatui + crossterm do drawing and diffing).
- No React/JSX, no macro DSL in v1.
- No mouse beyond what ratatui gives free.

## Anti-goals

- API an agent must read source to use. Every public item has a doc example.
- Silent layout fallbacks. Bad class = clear error with the bad token.

## Approaches

- **A (picked):** ratatui helpers + cascivo tokens/themes + class strings + widgets. Reuses ratatui ecosystem; shared look with web.
- B: plain ratatui toolkit, no cascivo link. Lighter, no shared design. Rejected: loses repo fit.
- C: own renderer (Text.js style). Rejected: large, fights ratatui ecosystem.

## Constraints

- Lives in `crates/cascivo-tui` in the existing Cargo workspace (edition 2024, rust 1.85).
- `cargo clippy -D warnings`, `cargo fmt --check`, `cargo test` clean. Latest stable ratatui/crossterm.
- Deterministic tests (TestBackend snapshots).

## Left to the builder

Exact class vocabulary, widget API shapes, theme codegen mechanism (build.rs vs checked-in generated file
with a drift test). Analysis session decides and records in the plan.
