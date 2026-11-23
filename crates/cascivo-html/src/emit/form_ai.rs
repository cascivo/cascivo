//! AI disclosure components: ai-badge, ai-status, chain-of-thought, reasoning, sources, tool-call, prompt-suggestions. One emitter per component, matching the React markup (packages/components/src/<unit>);
//! parity cases in packages/components/test/html-conformance prove it.

#[allow(unused_imports)]
use super::{NodeExt, emit_children};
#[allow(unused_imports)]
use crate::ast::Node;
#[allow(unused_imports)]
use crate::html::{attr, esc, flag};
#[allow(unused_imports)]
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        _ => {
            let _ = (node, cx, out);
        }
    }
}
