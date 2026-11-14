//! Cascivo design system for the terminal, built on ratatui.
//!
//! Status: core in progress. Components land in later tasks.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod app;
pub mod class;
pub mod error;
pub mod focus;
pub mod keys;
pub mod layout;
pub mod node;
pub mod runtime;
pub mod testing;
pub mod theme;
mod theme_gen;
pub mod widgets;

// Compiles every Rust block in the guide (`cargo test --doc`), so it cannot rot. Test-only:
// the path is outside the crate, so it is never part of the published docs.
#[cfg(doctest)]
#[doc = include_str!("../../../docs/USING-CASCIVO-TUI.md")]
mod guide_doctests {}

pub use app::{App, Cmd};
pub use class::{ClassCache, ClassStyle, Role, Size};
pub use error::{ClassError, TuiError};
pub use focus::Focus;
pub use keys::{Chord, Dispatch, Keymap, dispatch};
pub use node::{Node, Placement, col, row, spacer, text};
pub use runtime::{RunOptions, Runtime, StepOut, run, run_with};
pub use testing::{CellView, TestApp, render_to_string};
pub use widgets::{
    Col, Cursor, Kind, Scroll, button, card, heading, input, keyhints, list, modal, progress,
    sparkline, statusbar, table, tabs, toast, toasts,
};

/// Convenient re-exports for application code.
pub mod prelude {
    pub use crate::app::{App, Cmd};
    pub use crate::class::{ClassCache, ClassStyle, Role, Size};
    pub use crate::error::{ClassError, TuiError};
    pub use crate::focus::Focus;
    pub use crate::keys::{Chord, Dispatch, Keymap, dispatch};
    pub use crate::layout::{LayoutOut, NARROW_COLS, RenderCx, render};
    pub use crate::node::{Node, NodeKind, Placement, Text, Widget, col, row, spacer, text};
    pub use crate::runtime::{RunOptions, Runtime, StepOut, run, run_with};
    pub use crate::testing::{CellView, TestApp, render_to_string};
    pub use crate::theme::{ColorDepth, StateFlags, Theme};
    pub use crate::widgets::{
        Col, Cursor, Kind, Scroll, button, card, heading, input, keyhints, list, modal, progress,
        sparkline, statusbar, table, tabs, toast, toasts,
    };
}
