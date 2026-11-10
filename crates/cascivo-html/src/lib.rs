//! Renders agent-written `.cv` text into deterministic cascivo HTML.

pub mod ast;
pub mod catalog;
mod catalog_gen;
pub mod diag;
mod lex;
mod parse;

pub use ast::{BrandItem, Directive, Doc, Node, Value};
pub use catalog::{
    ArgKind, ArgSpec, Children, ClientJs, CompSpec, PropKind, PropSpec, lookup, suggest,
};
pub use diag::Diagnostic;
pub use parse::parse;
