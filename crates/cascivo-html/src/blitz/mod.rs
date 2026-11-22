//! Blitz render target: CSS and SVG lowering plus a compatibility lint.
//!
//! [Blitz](https://github.com/DioxusLabs/blitz) is a native HTML/CSS engine (Stylo + Taffy, no
//! JavaScript). It matches most of what cascivo emits, but a few features degrade. With
//! [`Target::Blitz`] the output is lowered so those parts still work:
//!
//! | Gap in Blitz | Lowering |
//! |---|---|
//! | `@container` never matches | rewritten to `@media` on the viewport (see [`lower_css`]) |
//! | `:focus-visible` never matches | rewritten to `:focus` |
//! | `@container scroll-state(…)` | rule removed (never matches) |
//! | SVG ignores CSS `fill`/`stroke`/`transform` | moved to presentation attributes ([`lower_svg`]) |
//! | SVG ignores `var(--token)` and `oklch()` | resolved to `rgb()` literals |
//! | no `<script>` | inline scripts are not emitted |
//!
//! `overflow:auto` needs no lowering: Blitz treats it as `scroll`. `:has()` needs the engine
//! pref `layout.css.has-selector.enabled`, which the host sets (cascivo-blitz does).
//! [`lint`] lists what still degrades for a given `.cv` source.

mod color;
mod css;
mod lint;
mod svg;

pub use css::lower_css;
pub use lint::lint;
pub use svg::lower_svg;

/// What the output is for. `Browser` (the default) changes nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Target {
    #[default]
    Browser,
    Blitz,
}

impl Target {
    /// `"browser"` or `"blitz"`.
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "browser" => Some(Self::Browser),
            "blitz" => Some(Self::Blitz),
            _ => None,
        }
    }
}
