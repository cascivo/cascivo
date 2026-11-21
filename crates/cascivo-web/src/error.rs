//! Diagnostics with a file and (when known) a 1-based line, collected rather than fail-fast so
//! one build reports every broken entry.

use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub struct Error {
    pub file: String,
    pub line: Option<u32>,
    pub msg: String,
}

impl Error {
    pub fn new(file: impl Into<String>, line: Option<u32>, msg: impl Into<String>) -> Self {
        Self {
            file: file.into(),
            line,
            msg: msg.into(),
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.line {
            Some(l) => write!(f, "{}:{l}: {}", self.file, self.msg),
            None => write!(f, "{}: {}", self.file, self.msg),
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Errors(pub Vec<Error>);

impl Errors {
    pub fn one(file: impl Into<String>, line: Option<u32>, msg: impl Into<String>) -> Self {
        Self(vec![Error::new(file, line, msg)])
    }
}

impl fmt::Display for Errors {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        for (i, e) in self.0.iter().enumerate() {
            if i > 0 {
                writeln!(f)?;
            }
            write!(f, "{e}")?;
        }
        Ok(())
    }
}

impl std::error::Error for Errors {}

pub type Result<T> = std::result::Result<T, Errors>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_with_and_without_line() {
        let e = Errors(vec![
            Error::new("a.md", Some(3), "bad"),
            Error::new("b.toml", None, "worse"),
        ]);
        assert_eq!(e.to_string(), "a.md:3: bad\nb.toml: worse");
    }
}
