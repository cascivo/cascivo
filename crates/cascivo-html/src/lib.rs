//! Renders agent-written `.cv` text into deterministic cascivo HTML.

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
