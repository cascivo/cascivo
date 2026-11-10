//! STUB owned by S4 (brand parsing and CSS). Replaced on merge.

use crate::ast::Doc;
use crate::diag::Diagnostic;
use crate::render::Options;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Brand;

/// Returns `(theme name, brand CSS)` for the document.
pub fn document_brand(
    _doc: &Doc,
    _opts: &Options,
) -> Result<(Option<String>, String), Vec<Diagnostic>> {
    Ok((None, String::new()))
}
