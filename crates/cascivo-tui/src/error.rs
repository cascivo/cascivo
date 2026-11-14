//! Error types.

use std::fmt;

/// A utility-class token that could not be resolved.
///
/// ```
/// use cascivo_tui::ClassError;
///
/// let e = ClassError {
///     token: "bg-primary".into(),
///     message: "unknown class".into(),
///     suggestion: Some("bg-accent".into()),
/// };
/// assert_eq!(e.to_string(), r#"unknown class "bg-primary": did you mean "bg-accent"?"#);
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClassError {
    /// The offending token as written.
    pub token: String,
    /// What is wrong, e.g. "unknown class" or "out of range".
    pub message: String,
    /// The closest valid token, if one is known.
    pub suggestion: Option<String>,
}

impl fmt::Display for ClassError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} \"{}\"", self.message, self.token)?;
        if let Some(s) = &self.suggestion {
            write!(f, ": did you mean \"{s}\"?")?;
        }
        Ok(())
    }
}

impl std::error::Error for ClassError {}

/// Any error this crate can return.
#[derive(Debug)]
pub enum TuiError {
    /// A class token failed to resolve.
    Class(ClassError),
    /// A terminal or file I/O failure.
    Io(std::io::Error),
    /// A key binding string failed to parse.
    Key(String),
}

impl fmt::Display for TuiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Class(e) => e.fmt(f),
            Self::Io(e) => write!(f, "io error: {e}"),
            Self::Key(k) => write!(f, "invalid key \"{k}\""),
        }
    }
}

impl std::error::Error for TuiError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io(e) => Some(e),
            Self::Class(e) => Some(e),
            Self::Key(_) => None,
        }
    }
}

impl From<ClassError> for TuiError {
    fn from(e: ClassError) -> Self {
        Self::Class(e)
    }
}

impl From<std::io::Error> for TuiError {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn err(s: Option<&str>) -> ClassError {
        ClassError {
            token: "bg-primary".into(),
            message: "unknown class".into(),
            suggestion: s.map(Into::into),
        }
    }

    #[test]
    fn display_includes_token_and_suggestion() {
        let s = err(Some("bg-accent")).to_string();
        assert_eq!(
            s,
            r#"unknown class "bg-primary": did you mean "bg-accent"?"#
        );
    }

    #[test]
    fn display_without_suggestion() {
        let s = err(None).to_string();
        assert!(s.contains("bg-primary"));
        assert!(!s.contains("did you mean"));
    }

    #[test]
    fn tui_error_class_forwards() {
        let e: TuiError = err(Some("bg-accent")).into();
        assert_eq!(e.to_string(), err(Some("bg-accent")).to_string());
    }

    #[test]
    fn io_has_source() {
        use std::error::Error;
        let e: TuiError = std::io::Error::other("boom").into();
        assert!(e.source().is_some());
    }
}
