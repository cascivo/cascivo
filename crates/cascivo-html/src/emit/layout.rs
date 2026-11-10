//! Layout emitters.

use super::emit_children;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "separator" => out.push_str("<hr data-orientation=\"horizontal\" class=\"cv-separator-separator\">"),
        _ => emit_children(node, cx, out),
    }
}
