//! Renders agent-written `.cv` text into one deterministic, self-contained cascivo HTML file.
//!
//! The library has no dependencies and does no file I/O: pass images and brand files through
//! [`Options`]. The `cascivo-html` CLI (crate `cascivo-html-cli`) wires files for you.
//!
//! ```
//! use cascivo_html::{render, Options};
//!
//! let html = render("@title \"Hi\"\ncard \"Hello\"\n", &Options::default()).unwrap();
//! assert!(html.starts_with("<!doctype html>") || html.contains("<html"));
//! assert!(html.contains("Hello"));
//! ```
//!
//! [`GUIDE`] and [`guide_for`] return the agent cheat sheet. Full guide:
//! <https://cascivo.com/docs/guides/using-cascivo-html>.

pub mod asset;
pub mod ast;
pub mod brand;
pub mod catalog;
mod catalog_gen;
mod css_gen;
pub mod diag;
pub mod emit;
pub mod guide;
mod guide_gen;
pub mod html;
mod lex;
mod parse;
pub mod render;

pub use ast::{BrandItem, Directive, Doc, Node, Value};
pub use brand::{Brand, parse_brand_file};
pub use catalog::{
    ArgKind, ArgSpec, Children, ClientJs, CompSpec, PropKind, PropSpec, lookup, suggest,
};
pub use diag::Diagnostic;
pub use guide::{GUIDE, guide_for};
pub use parse::parse;
pub use render::{AssetResolver, BrandResolver, Cx, Options, render, render_fragment};

/// Parse-only validation: every diagnostic in `src`, empty when it is valid.
/// Brand files need a resolver, so they are checked by `render` instead.
pub fn check(src: &str) -> Vec<Diagnostic> {
    parse(src).err().unwrap_or_default()
}
