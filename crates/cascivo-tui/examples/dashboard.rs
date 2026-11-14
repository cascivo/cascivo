//! A three-tab dashboard: `cargo run -p cascivo-tui --example dashboard`.
//!
//! Keys: left/right or 1-3 switch tabs, tab moves focus, j/k move, enter selects,
//! `r` restart (modal), `t` next theme, `q` quit. The app lives in `support/mod.rs` so
//! `tests/example_smoke.rs` can drive it headless.

#[path = "support/mod.rs"]
mod support;

fn main() -> Result<(), cascivo_tui::TuiError> {
    // Start on the `terminal` theme; the app switches themes itself via `Cmd::SetTheme`.
    cascivo_tui::run_with(
        support::Dashboard::default(),
        cascivo_tui::RunOptions {
            theme: Some("terminal".into()),
            ..Default::default()
        },
    )
}
