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
    #[serde(default)]
    pub build: BuildConfig,
    #[serde(default)]
    pub assets: AssetsConfig,
    #[serde(default)]
    pub images: ImagesConfig,
    #[serde(default)]
    pub vite: ViteConfig,
    /// `name = "path"` (JSON or TOML by extension) → template global `data.<name>`.
    #[serde(default)]
    pub data: std::collections::BTreeMap<String, String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct BuildConfig {
    /// `false`: neither write `cascivo.css` nor link it (the site brings its own CSS).
    #[serde(default = "yes")]
    pub cascivo_css: bool,
}

impl Default for BuildConfig {
    fn default() -> Self {
        Self { cascivo_css: true }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct AssetsConfig {
    /// Source folder for `asset()`, relative to the site root.
    #[serde(default = "assets_dir")]
    pub dir: String,
}

impl Default for AssetsConfig {
    fn default() -> Self {
        Self { dir: assets_dir() }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ImagesConfig {
    /// Source folder for `img()`, relative to the site root (may point outside it).
    #[serde(default = "assets_dir")]
    pub dir: String,
}

impl Default for ImagesConfig {
    fn default() -> Self {
        Self { dir: assets_dir() }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ViteConfig {
    /// Vite `manifest.json`, relative to the site root (read-only; may be outside it).
    #[serde(default)]
    pub manifest: Option<String>,
    /// `{ "<x.module.css path>": { "<local>": "<hashed>" } }`, for `m()`.
    #[serde(default)]
    pub css_modules: Option<String>,
    /// Manifest key of an island; `{name}` is the island name.
    #[serde(default = "islands_pattern")]
    pub islands: String,
}

impl Default for ViteConfig {
    fn default() -> Self {
        Self {
            manifest: None,
            css_modules: None,
            islands: islands_pattern(),
        }
    }
}

fn yes() -> bool {
    true
}

fn assets_dir() -> String {
    "assets".into()
}

fn islands_pattern() -> String {
    "src/marketing/islands/{name}.tsx".into()
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
        assert!(c.build.cascivo_css);
        assert_eq!(
            (c.assets.dir.as_str(), c.images.dir.as_str()),
            ("assets", "assets")
        );
        assert_eq!(c.vite.islands, "src/marketing/islands/{name}.tsx");
        assert!(c.vite.manifest.is_none() && c.data.is_empty());
    }

    #[test]
    fn web_tables() {
        let c = Config::parse(
            "title = \"x\"\n[build]\ncascivo_css = false\n[assets]\ndir = \"a\"\n[images]\ndir = \"../public\"\n[vite]\nmanifest = \"m.json\"\ncss_modules = \"c.json\"\nislands = \"i/{name}.js\"\n[data]\nweb = \"w.json\"\n",
        )
        .unwrap();
        assert!(!c.build.cascivo_css);
        assert_eq!(
            (c.assets.dir.as_str(), c.images.dir.as_str()),
            ("a", "../public")
        );
        assert_eq!(c.vite.manifest.as_deref(), Some("m.json"));
        assert_eq!(c.vite.islands, "i/{name}.js");
        assert_eq!(c.data["web"], "w.json");
        assert!(Config::parse("title = \"x\"\n[vite]\nbogus = 1").is_err());
    }

    #[test]
    fn unknown_key_names_line() {
        let e = Config::parse("title = \"Hi\"\ncolour = 1").unwrap_err();
        assert_eq!(e.0[0].line, Some(2));
        assert!(e.0[0].msg.contains("colour"), "{e}");
    }
}
