//! Components rendered inside another component's markup (anatomy `'@<unit>'` children). Each
//! fn decides from the host node whether it renders; generated emitters (`auto_gen.rs`) call them.

use super::NodeExt;
use crate::ast::Node;
use crate::contract::spinner;
use crate::html::attr;
use crate::render::Cx;

/// The busy indicator of a `loading` host: a small decorative spinner (the host carries
/// `aria-busy`, so the spinner is hidden from assistive tech).
pub fn spinner(node: &Node, cx: &mut Cx, out: &mut String) {
    if !node.prop_bool("loading") {
        return;
    }
    // The Spinner is a separate unit the host's own CSS unit list does not name.
    cx.used.insert("spinner");
    out.push_str("<span");
    attr(out, "role", "status");
    attr(out, "aria-label", "Loading");
    attr(out, "data-size", "sm");
    attr(out, "aria-hidden", "true");
    attr(out, "class", spinner::ROOT);
    out.push_str("></span>");
}
