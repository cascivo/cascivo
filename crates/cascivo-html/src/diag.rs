//! Parser diagnostics.

use std::fmt;

/// One problem in `.cv` source. Columns count chars, 1-based.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub line: u32,
    pub col: u32,
    pub msg: String,
}

impl Diagnostic {
    pub(crate) fn new(line: u32, col: u32, msg: impl Into<String>) -> Self {
        Self {
            line,
            col,
            msg: msg.into(),
        }
    }
}

impl fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}: {}", self.line, self.col, self.msg)
    }
}

impl std::error::Error for Diagnostic {}
