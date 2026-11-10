//! Renders agent-written `.cv` text into deterministic cascivo HTML.

pub mod ast;
pub mod brand;
pub mod catalog;
mod catalog_gen;
#[allow(dead_code)] // consumed by the renderer in S3
mod css_gen;
pub mod diag;
pub mod emit;
mod lex;
mod parse;
pub mod render;

pub use ast::{BrandItem, Directive, Doc, Node, Value};
pub use catalog::{
    ArgKind, ArgSpec, Children, ClientJs, CompSpec, PropKind, PropSpec, lookup, suggest,
};
pub use diag::Diagnostic;
pub use parse::parse;
