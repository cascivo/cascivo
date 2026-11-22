//! Compatibility lint: what in a `.cv` document still degrades on a target.

use super::Target;
use crate::ast::Node;
use crate::diag::Diagnostic;
use crate::emit::NodeExt;
use crate::parse::parse;

/// Warnings for features of `src` that degrade on `target`, in document order.
/// `Err` holds the parse errors; the lint needs a valid document. [`Target::Browser`] never
/// warns. These are warnings: [`crate::render`] still succeeds.
///
/// ```
/// use cascivo_html::{lint, Target};
///
/// let w = lint("table sort Name,Qty | a,1\n", Target::Blitz).unwrap();
/// assert!(w.iter().any(|d| d.msg.contains("sort")));
/// assert!(lint("card \"Hi\"\n", Target::Browser).unwrap().is_empty());
/// ```
pub fn lint(src: &str, target: Target) -> Result<Vec<Diagnostic>, Vec<Diagnostic>> {
    let doc = parse(src)?;
    let mut out = Vec::new();
    if target == Target::Blitz {
        for n in &doc.nodes {
            visit(n, &mut out);
        }
    }
    Ok(out)
}

fn visit(node: &Node, out: &mut Vec<Diagnostic>) {
    let mut warn = |msg: &str| {
        out.push(Diagnostic::new(
            node.line,
            node.col,
            format!("{}: {msg}", node.spec.name),
        ));
    };
    match node.spec.name {
        "table" => {
            if node.prop_bool("sort")
                || (node.prop_set("sortMode")
                    && node.prop_str("sortMode").as_deref() == Some("client"))
            {
                warn(
                    "sorting is client JS and Blitz runs no scripts; headers render but clicking sorts nothing until the host handles `[data-sortable]`",
                );
            }
            if node.prop_bool("stickyHeader") {
                warn("`position:sticky` is unfinished in Blitz; the header scrolls away");
            }
            if node.prop_set("virtualized") && node.prop_bool("virtualized") {
                warn("virtualized rows need scroll observers Blitz lacks; all rows render");
            }
        }
        "spinner" => warn(
            "the spin animates SVG stroke-dasharray via CSS; Blitz SVG is static, so a still arc shows",
        ),
        "alert" | "notification" => warn(
            "the icon strokes with `currentColor`; Blitz SVG does not inherit the CSS text color reliably, so the icon may render black",
        ),
        "svg" => warn(
            "inlined SVG keeps its own CSS and `currentColor`; Blitz applies only presentation attributes",
        ),
        "grid" | "columns" | "dashboard-layout" => warn(
            "container queries are lowered to viewport media queries; breakpoints follow the window, not the parent width",
        ),
        "card" => warn(
            "padding uses `:has()`, which Blitz enables only with pref `layout.css.has-selector.enabled` (cascivo-blitz sets it)",
        ),
        "link" if node.prop_bool("external") => warn(
            "the external-link arrow uses `:has()`, which needs Blitz pref `layout.css.has-selector.enabled`",
        ),
        "image" if node.prop_set("fallbackSrc") => {
            warn("load-failure fallback is client JS and does not run on Blitz");
        }
        _ => {}
    }
    for c in &node.children {
        visit(c, out);
    }
}
