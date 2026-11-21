//! Path confinement shared by the CLI and cascivo-web: an author-supplied path may only name a
//! file below its base directory.

use std::path::{Component, Path};

/// Relative, non-empty, and made only of normal segments (no `..`, root, or drive prefix).
/// Lexical only; callers that touch the filesystem must also check symlinks resolve inside.
pub fn is_safe_relative(rel: &str) -> bool {
    !rel.is_empty()
        && !rel.contains('\0')
        && Path::new(rel)
            .components()
            .all(|c| matches!(c, Component::Normal(_) | Component::CurDir))
}

#[cfg(test)]
mod tests {
    use super::is_safe_relative;

    #[test]
    fn accepts_nested_relative() {
        assert!(is_safe_relative("a/b.png"));
        assert!(is_safe_relative("./a"));
    }

    #[test]
    fn rejects_escapes() {
        for bad in ["", "../x", "a/../../x", "/etc/passwd", "a\0b"] {
            assert!(!is_safe_relative(bad), "{bad:?}");
        }
    }
}
