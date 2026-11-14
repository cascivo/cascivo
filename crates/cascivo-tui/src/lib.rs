//! Cascivo design system for the terminal, built on ratatui.
//!
//! Status: core in progress. Components land in later tasks.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod class;
pub mod error;
pub mod focus;
pub mod keys;
pub mod layout;
pub mod node;
pub mod theme;
mod theme_gen;

pub use class::{ClassCache, ClassStyle, Role, Size};
pub use error::{ClassError, TuiError};
pub use focus::Focus;
pub use keys::{Chord, Dispatch, Keymap, dispatch};
pub use node::{Node, col, row, spacer, text};

/// Convenient re-exports for application code.
pub mod prelude {
    pub use crate::class::{ClassCache, ClassStyle, Role, Size};
    pub use crate::error::{ClassError, TuiError};
    pub use crate::focus::Focus;
    pub use crate::keys::{Chord, Dispatch, Keymap, dispatch};
    pub use crate::layout::{LayoutOut, NARROW_COLS, RenderCx, render};
    pub use crate::node::{Node, NodeKind, Text, Widget, col, row, spacer, text};
    pub use crate::theme::{ColorDepth, StateFlags, Theme};
}
