//! Layout emitters. Each mirrors the DOM of `packages/layouts/src/<unit>/<unit>.tsx`
//! (and `packages/components/src/separator`) so the shared CSS applies unchanged.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::html::{attr, esc, flag, num};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "flex" => flex(node, cx, out),
        "grid" => grid(node, cx, out),
        "columns" => columns(node, cx, out),
        "auto-grid" => auto_grid(node, cx, out),
        "center" => center(node, cx, out),
        "section" => section(node, cx, out),
        "page-header" => page_header(node, cx, out),
        "dashboard-layout" => dashboard_layout(node, cx, out),
        "separator" => separator(node, out),
        "spacer" => spacer(node, out),
        _ => emit_children(node, cx, out),
    }
}

/// `var(--cascivo-space-<step>)`, the value every gap/size prop maps to.
fn space(step: &str) -> String {
    format!("var(--cascivo-space-{step})")
}

fn gap_of(node: &Node, name: &str, default: &str) -> String {
    node.prop_str(name).unwrap_or_else(|| default.to_string())
}

fn flex(node: &Node, cx: &mut Cx, out: &mut String) {
    // A size/basis/truncate prop makes this node a FlexItem (the child-sizing wrapper).
    if node.prop_set("size") || node.prop_set("basis") || node.prop_set("truncate") {
        out.push_str("<div");
        attr(out, "class", "cv-flex-flex-item");
        attr(out, "data-size", &node.prop_str("size").unwrap_or_default());
        if node.prop_bool("truncate") {
            flag(out, "data-truncate");
        }
        if let Some(b) = node.prop_str("basis") {
            attr(out, "style", &format!("flex-basis:{b}"));
        }
        out.push('>');
        emit_children(node, cx, out);
        out.push_str("</div>");
        return;
    }
    let mut style = format!("--_flex-gap:{}", space(&gap_of(node, "gap", "4")));
    if let Some(a) = node.prop_str("align") {
        let v = if a == "start" || a == "end" {
            format!("flex-{a}")
        } else {
            a
        };
        style.push_str(";align-items:");
        style.push_str(&v);
    }
    if let Some(j) = node.prop_str("justify") {
        let v = match j.as_str() {
            "between" => "space-between".to_string(),
            "start" | "end" => format!("flex-{j}"),
            _ => j,
        };
        style.push_str(";justify-content:");
        style.push_str(&v);
    }
    out.push_str("<div");
    attr(out, "class", "cv-flex-flex");
    attr(
        out,
        "data-direction",
        &node
            .prop_str("direction")
            .unwrap_or_else(|| "vertical".into()),
    );
    if node.prop_bool("wrap") {
        flag(out, "data-wrap");
    }
    attr(out, "style", &style);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

fn grid(node: &Node, cx: &mut Cx, out: &mut String) {
    let cols = node.arg_num(0).unwrap_or(12.0);
    let mut style = format!(
        "--_grid-cols:{};--_grid-gap:{}",
        num(cols),
        space(&gap_of(node, "gap", "4"))
    );
    if let Some(a) = node.prop_str("align") {
        style.push_str(";--_grid-align:");
        style.push_str(&a);
    }
    if let Some(j) = node.prop_str("justify") {
        style.push_str(";--_grid-justify:");
        style.push_str(&j);
    }
    // The outer element is the query container; the inner one hosts the column rules.
    out.push_str("<div");
    attr(out, "class", "cv-grid-grid-container");
    attr(out, "style", &style);
    out.push_str("><div");
    attr(out, "class", "cv-grid-grid");
    if node.prop_bool("alignRows") {
        flag(out, "data-align-rows");
    }
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></div>");
}

fn columns(node: &Node, cx: &mut Cx, out: &mut String) {
    let count = node.arg_num(0).unwrap_or(2.0);
    let style = format!(
        "--_cols:{};--_gap:{}",
        num(count),
        space(&gap_of(node, "gap", "4"))
    );
    out.push_str("<div");
    attr(out, "class", "cv-columns-columns-container");
    attr(out, "style", &style);
    out.push_str("><div");
    attr(out, "class", "cv-columns-columns");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></div>");
}

fn auto_grid(node: &Node, cx: &mut Cx, out: &mut String) {
    let min = node.prop_str("min").unwrap_or_else(|| "16rem".into());
    let style = format!("--_min:{min};--_gap:{}", space(&gap_of(node, "gap", "4")));
    out.push_str("<div");
    attr(out, "class", "cv-auto-grid-auto-grid");
    attr(out, "style", &style);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

fn center(node: &Node, cx: &mut Cx, out: &mut String) {
    let max = node.prop_str("maxWidth").unwrap_or_else(|| "48rem".into());
    out.push_str("<div");
    attr(out, "class", "cv-center-center");
    attr(out, "style", &format!("--_center-max:{max}"));
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

fn section(node: &Node, cx: &mut Cx, out: &mut String) {
    // React's Section has no title prop; the optional `title` arg becomes the accessible name,
    // which is what `<Section aria-label>` renders.
    let style = format!("--_max:72rem;--_gap:{}", space(&gap_of(node, "gap", "8")));
    out.push_str("<section");
    attr(out, "class", "cv-section-section");
    if let Some(t) = node.arg_str(0) {
        attr(out, "aria-label", &t);
    }
    attr(out, "style", &style);
    out.push_str("><div");
    attr(out, "class", "cv-section-inner");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></section>");
}

fn text_div(out: &mut String, class: &str, text: &str) {
    out.push_str("<div");
    attr(out, "class", class);
    out.push('>');
    esc(out, text);
    out.push_str("</div>");
}

fn page_header(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<header");
    attr(out, "class", "cv-page-header-header");
    out.push('>');
    if let Some(b) = node.prop_str("breadcrumb").filter(|s| !s.is_empty()) {
        text_div(out, "cv-page-header-breadcrumb", &b);
    }
    out.push_str("<div");
    attr(out, "class", "cv-page-header-row");
    out.push_str("><h1");
    attr(out, "class", "cv-page-header-title");
    out.push('>');
    esc(out, &node.arg_str(0).unwrap_or_default());
    out.push_str("</h1>");
    // Children are the action slot, rendered after any `actions` text.
    let actions = node.prop_str("actions").filter(|s| !s.is_empty());
    if actions.is_some() || !node.children.is_empty() {
        out.push_str("<div");
        attr(out, "class", "cv-page-header-actions");
        out.push('>');
        if let Some(a) = &actions {
            esc(out, a);
        }
        emit_children(node, cx, out);
        out.push_str("</div>");
    }
    out.push_str("</div>");
    if let Some(d) = node.arg_str(1).filter(|s| !s.is_empty()) {
        out.push_str("<p");
        attr(out, "class", "cv-page-header-description");
        out.push('>');
        esc(out, &d);
        out.push_str("</p>");
    }
    out.push_str("</header>");
}

fn dashboard_layout(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    attr(out, "class", "cv-dashboard-layout-layout");
    out.push('>');
    if let Some(s) = node.prop_str("stats").filter(|s| !s.is_empty()) {
        text_div(out, "cv-dashboard-layout-stats", &s);
    }
    out.push_str("<div");
    attr(out, "class", "cv-dashboard-layout-body");
    out.push_str("><div");
    attr(out, "class", "cv-dashboard-layout-main");
    out.push('>');
    // Children are the main slot, after any `main` text.
    if let Some(m) = node.prop_str("main") {
        esc(out, &m);
    }
    emit_children(node, cx, out);
    out.push_str("</div>");
    if let Some(a) = node.prop_str("aside").filter(|s| !s.is_empty()) {
        text_div(out, "cv-dashboard-layout-aside", &a);
    }
    out.push_str("</div></div>");
}

fn separator(node: &Node, out: &mut String) {
    let orientation = node
        .prop_str("orientation")
        .unwrap_or_else(|| "horizontal".into());
    let decorative = node.prop_bool("decorative");
    if orientation == "horizontal" && !decorative {
        out.push_str("<hr");
        attr(out, "data-orientation", "horizontal");
        attr(out, "class", "cv-separator-separator");
        out.push('>');
        return;
    }
    out.push_str("<div");
    attr(out, "role", if decorative { "none" } else { "separator" });
    if !decorative {
        attr(out, "aria-orientation", &orientation);
    }
    attr(out, "data-orientation", &orientation);
    attr(out, "class", "cv-separator-separator");
    out.push_str("></div>");
}

fn spacer(node: &Node, out: &mut String) {
    out.push_str("<div");
    attr(out, "role", "none");
    attr(out, "class", "cv-spacer-spacer");
    attr(
        out,
        "style",
        &format!("--_spacer-size:{}", space(&gap_of(node, "size", "4"))),
    );
    out.push_str("></div>");
}

#[cfg(test)]
mod tests {
    use crate::{Options, render};

    fn body(src: &str) -> String {
        render(src, &Options::default()).unwrap_or_else(|e| panic!("{e:?}"))
    }

    #[test]
    fn flex_alias_defaults_and_mapping() {
        let h = body("row justify=between align=end\n");
        assert!(h.contains("data-direction=\"horizontal\""));
        assert!(h.contains("align-items:flex-end;justify-content:space-between"));
        assert!(
            !h.contains("data-wrap=\"\"") && !h.contains("<div class=\"cv-flex-flex\" data-wrap")
        );
    }

    #[test]
    fn section_title_is_escaped() {
        let h = body("section \"<b>\"\n");
        assert!(h.contains("aria-label=\"&lt;b&gt;\""));
        assert!(!h.contains("<b>"));
    }

    #[test]
    fn page_header_omits_empty_slots() {
        let h = body("page-header \"T\"\n");
        assert!(h.contains("<h1 class=\"cv-page-header-title\">T</h1>"));
        assert!(!h.contains("<div class=\"cv-page-header-actions\""));
        assert!(!h.contains("<p class"));
    }
}
