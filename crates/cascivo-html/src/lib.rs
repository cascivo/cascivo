//! Renders agent-written `.cv` text into deterministic cascivo HTML.

pub mod catalog;
mod catalog_gen;

pub use catalog::{
    ArgKind, ArgSpec, Children, ClientJs, CompSpec, PropKind, PropSpec, lookup, suggest,
};
