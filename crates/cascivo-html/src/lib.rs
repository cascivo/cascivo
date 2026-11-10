//! Renders agent-written `.cv` text into deterministic cascivo HTML.

pub mod ast;
pub mod brand;
pub mod catalog;
mod catalog_gen;
mod css_gen;
pub mod diag;
pub mod emit;
pub mod html;
mod lex;
mod parse;
pub mod render;

pub use ast::{BrandItem, Directive, Doc, Node, Value};
pub use brand::Brand;
pub use catalog::{
    ArgKind, ArgSpec, Children, ClientJs, CompSpec, PropKind, PropSpec, lookup, suggest,
};
pub use diag::Diagnostic;
pub use parse::parse;
pub use render::{BrandResolver, Cx, Options, render, render_fragment};
