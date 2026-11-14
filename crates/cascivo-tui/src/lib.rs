//! Cascivo design system for the terminal, built on ratatui.
//!
//! Status: core in progress. Components land in later tasks.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod class;
pub mod error;
pub mod theme;
mod theme_gen;

pub use class::{ClassCache, ClassStyle, Role, Size};
pub use error::{ClassError, TuiError};

/// Convenient re-exports for application code.
pub mod prelude {
    pub use crate::class::{ClassCache, ClassStyle, Role, Size};
    pub use crate::error::{ClassError, TuiError};
    pub use crate::theme::{ColorDepth, StateFlags, Theme};
}
