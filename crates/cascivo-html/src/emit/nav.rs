//! nav emitters (S3 fills these in).

use super::emit_children;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    emit_children(node, cx, out);
}
