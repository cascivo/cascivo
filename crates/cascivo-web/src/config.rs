//! `site.toml`: site-wide settings exposed to templates as `site`.

use serde::{Deserialize, Serialize};

use crate::error::{Errors, Result};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Config {
    pub title: String,
    /// Absolute origin, e.g. `https://example.com`; the sitemap is skipped without it.
    #[serde(default)]
    pub base_url: String,
    #[serde(default = "lang")]
    pub lang: String,
    /// A cascivo theme name (`light`, `dark`, `midnight`, …); picks the theme CSS shipped.
    #[serde(default = "theme")]
    pub theme: String,
}

fn lang() -> String {
    "en".into()
}

fn theme() -> String {
    "light".into()
}

impl Config {
    pub fn parse(src: &str) -> Result<Self> {
        toml::from_str(src).map_err(|e| {
            let line = e.span().map(|s| line_of(src, s.start));
            Errors::one("site.toml", line, e.message().to_string())
        })
    }
}

/// 1-based line of a byte offset.
pub(crate) fn line_of(src: &str, at: usize) -> u32 {
    let n = src.as_bytes()[..at.min(src.len())]
        .iter()
        .filter(|b| **b == b'\n')
        .count();
    u32::try_from(n + 1).unwrap_or(u32::MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults() {
        let c = Config::parse("title = \"Hi\"").unwrap();
        assert_eq!((c.lang.as_str(), c.theme.as_str()), ("en", "light"));
    }

    #[test]
    fn unknown_key_names_line() {
        let e = Config::parse("title = \"Hi\"\ncolour = 1").unwrap_err();
        assert_eq!(e.0[0].line, Some(2));
        assert!(e.0[0].msg.contains("colour"), "{e}");
    }
}
