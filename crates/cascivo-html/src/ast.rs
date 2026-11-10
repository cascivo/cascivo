//! Parsed `.cv` document. Every node is already validated against the catalog.

use crate::catalog::CompSpec;

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Doc {
    pub directives: Vec<Directive>,
    pub nodes: Vec<Node>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Directive {
    Brand(Vec<BrandItem>),
    BrandFile(String),
    Title(String),
    Lang(String),
}

/// `#5b5bd6` → key `#5b5bd6`, no value; `font=Inter` → key `font`, value `Inter`.
#[derive(Debug, Clone, PartialEq)]
pub struct BrandItem {
    pub key: String,
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Node {
    pub spec: &'static CompSpec,
    /// Positional args in `spec.args` order; trailing optional args may be absent.
    pub args: Vec<Value>,
    /// Sorted by `spec.props` order so output never depends on how the author ordered them.
    pub props: Vec<(&'static str, Value)>,
    /// Raw text child; escaping is the emitter's job.
    pub text: Option<String>,
    pub children: Vec<Node>,
    pub line: u32,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Str(String),
    Num(f64),
    Bool(bool),
    Pairs(Vec<(String, f64)>),
    Nums(Vec<f64>),
    Rows(Vec<Vec<String>>),
}
