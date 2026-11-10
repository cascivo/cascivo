use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    super::line::emit_xy(node, cx, out, true);
}
