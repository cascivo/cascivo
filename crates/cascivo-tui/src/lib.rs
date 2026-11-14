//! Cascivo design system for the terminal, built on ratatui.
//!
//! Status: core in progress. Class parsing and components land in later tasks.
#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod error;

pub use error::{ClassError, TuiError};

/// Convenient re-exports for application code.
pub mod prelude {
    pub use crate::error::{ClassError, TuiError};
}
