//! Navigation and table emitters. Breadcrumb, steps, collapsible and table mirror the DOM of
//! `packages/components/src/<unit>/<unit>.tsx`. Accordion mirrors it too (it is already
//! `<details>`). Tabs deliberately differ: React drives `role="tab"` buttons from a signal, so
//! the static form uses radio inputs + labels + panels switched by CSS (`assets/extra/tabs.css`).

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::html::{attr, esc, flag, safe_url};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "breadcrumb" => breadcrumb(node, out),
        "steps" => steps(node, out),
        "collapsible" => collapsible(node, cx, out),
        "accordion" => accordion(node, cx, out),
        "tabs" => tabs(node, cx, out),
        "table" => table(node, cx, out),
        _ => emit_children(node, cx, out),
    }
}

fn open_tag(out: &mut String, tag: &str, class: &str) {
    out.push('<');
    out.push_str(tag);
    attr(out, "class", class);
}

fn text_el(out: &mut String, tag: &str, class: &str, s: &str) {
    open_tag(out, tag, class);
    out.push('>');
    esc(out, s);
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn explicit_str(node: &Node, name: &str) -> Option<String> {
    node.prop_set(name).then(|| node.prop_str(name)).flatten()
}

fn rows(node: &Node) -> &[Vec<String>] {
    node.arg_rows(0).unwrap_or(&[])
}

fn cell(row: &[String], i: usize) -> &str {
    row.get(i).map_or("", String::as_str)
}

// ---------------------------------------------------------------- breadcrumb

fn breadcrumb(node: &Node, out: &mut String) {
    let label = explicit_str(node, "ariaLabel")
        .or_else(|| explicit_str(node, "label"))
        .unwrap_or_else(|| "Breadcrumb".into());
    let items = rows(node);
    // (label, href); the collapsed middle is a plain ellipsis, like the TSX.
    let mut visible: Vec<(&str, Option<&str>)> = items
        .iter()
        .map(|r| (cell(r, 0), r.get(1).map(String::as_str)))
        .collect();
    if let (Some(max), Some(first)) = (node.prop_num("maxVisible"), visible.first().copied())
        && (visible.len() as f64) > max
    {
        // JS `slice(len - (max - 2))`: a non-positive tail keeps nothing.
        let tail = (max - 2.0).max(0.0) as usize;
        let start = visible.len().saturating_sub(tail);
        let mut v = vec![first, ("\u{2026}", None)];
        v.extend_from_slice(&visible[start..]);
        visible = v;
    }
    out.push_str("<nav");
    attr(out, "aria-label", &label);
    attr(out, "class", "cv-breadcrumb-breadcrumb");
    out.push_str("><ol>");
    let last = visible.len().saturating_sub(1);
    for (i, (text, href)) in visible.iter().enumerate() {
        out.push_str("<li>");
        if i == last {
            out.push_str("<span aria-current=\"page\">");
            esc(out, text);
            out.push_str("</span>");
        } else if let Some(url) = href.and_then(|h| safe_url(h, false)) {
            out.push_str("<a");
            attr(out, "href", &url);
            out.push('>');
            esc(out, text);
            out.push_str("</a>");
        } else {
            out.push_str("<span>");
            esc(out, text);
            out.push_str("</span>");
        }
        out.push_str("</li>");
    }
    out.push_str("</ol></nav>");
}

// --------------------------------------------------------------------- steps

fn steps(node: &Node, out: &mut String) {
    let label = explicit_str(node, "ariaLabel")
        .or_else(|| explicit_str(node, "label"))
        .unwrap_or_else(|| "Steps".into());
    let orientation = node
        .prop_str("orientation")
        .unwrap_or_else(|| "horizontal".into());
    let active = node.prop_num("activeStep").unwrap_or(0.0);
    out.push_str("<ol");
    attr(out, "class", "cv-steps-steps");
    attr(out, "data-orientation", &orientation);
    attr(out, "aria-label", &label);
    out.push('>');
    for (i, row) in rows(node).iter().enumerate() {
        let idx = i as f64;
        let state = if idx < active {
            "complete"
        } else if idx == active {
            "active"
        } else {
            "pending"
        };
        out.push_str("<li");
        attr(out, "class", "cv-steps-step");
        attr(out, "data-state", state);
        if state == "active" {
            attr(out, "aria-current", "step");
        }
        // The TSX has no description slot; keep the author's text as a tooltip.
        if let Some(d) = row.get(1).filter(|d| !d.is_empty()) {
            attr(out, "title", d);
        }
        out.push('>');
        out.push_str("<div");
        attr(out, "class", "cv-steps-circle");
        out.push('>');
        if state == "complete" {
            out.push('\u{2713}');
        } else {
            out.push_str(&(i + 1).to_string());
        }
        out.push_str("</div>");
        text_el(out, "span", "cv-steps-label", cell(row, 0));
        out.push_str("</li>");
    }
    out.push_str("</ol>");
}

// -------------------------------------------------- collapsible / accordion

fn is_open(node: &Node) -> bool {
    if node.prop_set("open") {
        node.prop_bool("open")
    } else {
        node.prop_bool("defaultOpen")
    }
}

fn state(open: bool) -> &'static str {
    if open { "open" } else { "closed" }
}

fn collapsible(node: &Node, cx: &mut Cx, out: &mut String) {
    let base = cx.id();
    let open = is_open(node);
    let title = explicit_str(node, "trigger")
        .or_else(|| node.arg_str(0))
        .unwrap_or_default();
    out.push_str("<details");
    attr(out, "data-state", state(open));
    attr(out, "class", "cv-collapsible-root");
    if open {
        flag(out, "open");
    }
    out.push('>');
    out.push_str("<summary");
    attr(out, "id", &format!("{base}-trigger"));
    attr(out, "aria-controls", &format!("{base}-content"));
    if node.prop_bool("disabled") {
        attr(out, "aria-disabled", "true");
    }
    attr(out, "data-state", state(open));
    attr(out, "class", "cv-collapsible-trigger");
    out.push('>');
    esc(out, &title);
    out.push_str("</summary>");
    out.push_str("<div");
    attr(out, "id", &format!("{base}-content"));
    attr(out, "role", "region");
    attr(out, "aria-labelledby", &format!("{base}-trigger"));
    attr(out, "class", "cv-collapsible-content");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></details>");
}

/// A child's label (first arg, else `fallback`) and whether its own children are the content.
/// `section` and `collapsible` are label-carrying wrappers, so their children are unwrapped;
/// any other node is emitted whole as the content.
fn label_of(child: &Node, fallback: &str) -> (String, bool) {
    let title = child.arg_str(0).filter(|t| !t.is_empty());
    let unwrap = matches!(child.spec.name, "section" | "collapsible");
    (title.unwrap_or_else(|| fallback.to_string()), unwrap)
}

fn emit_content(child: &Node, unwrap: bool, cx: &mut Cx, out: &mut String) {
    if unwrap {
        emit_children(child, cx, out);
    } else {
        super::emit(child, cx, out);
    }
}

fn accordion(node: &Node, cx: &mut Cx, out: &mut String) {
    let base = cx.id();
    let single = node.prop_str("type").as_deref() != Some("multiple");
    out.push_str("<div");
    attr(out, "data-type", if single { "single" } else { "multiple" });
    attr(out, "class", "cv-accordion-accordion");
    out.push('>');
    for (i, child) in node.children.iter().enumerate() {
        let value = (i + 1).to_string();
        let (title, unwrap) = label_of(child, &format!("Item {value}"));
        let open = child.spec.name == "collapsible" && is_open(child);
        out.push_str("<details");
        if single {
            // Native exclusivity: opening one closes the others, with no script.
            attr(out, "name", &base);
        }
        attr(out, "data-value", &value);
        attr(out, "data-state", state(open));
        attr(out, "class", "cv-accordion-item");
        if open {
            flag(out, "open");
        }
        out.push('>');
        out.push_str("<summary");
        attr(out, "id", &format!("{base}-trigger-{value}"));
        attr(out, "aria-controls", &format!("{base}-content-{value}"));
        attr(out, "data-state", state(open));
        attr(out, "class", "cv-accordion-trigger");
        out.push('>');
        text_el(out, "h3", "cv-accordion-heading", &title);
        out.push_str("<span");
        attr(out, "class", "cv-accordion-indicator");
        attr(out, "aria-hidden", "true");
        out.push_str("></span></summary>");
        out.push_str("<div");
        attr(out, "role", "region");
        attr(out, "id", &format!("{base}-content-{value}"));
        attr(out, "aria-labelledby", &format!("{base}-trigger-{value}"));
        attr(out, "class", "cv-accordion-content");
        out.push('>');
        emit_content(child, unwrap, cx, out);
        out.push_str("</div></details>");
    }
    out.push_str("</div>");
}

// ---------------------------------------------------------------------- tabs

fn tabs(node: &Node, cx: &mut Cx, out: &mut String) {
    let base = cx.id();
    let labels: Vec<(String, bool)> = node
        .children
        .iter()
        .enumerate()
        .map(|(i, c)| label_of(c, &format!("Tab {}", i + 1)))
        .collect();
    // `value` wins over `defaultValue`; it names a tab by label, else by 1-based position.
    let wanted = explicit_str(node, "value").or_else(|| explicit_str(node, "defaultValue"));
    let checked = wanted
        .and_then(|w| {
            labels.iter().position(|(l, _)| *l == w).or_else(|| {
                w.parse::<usize>()
                    .ok()
                    .and_then(|n| n.checked_sub(1))
                    .filter(|&n| n < labels.len())
            })
        })
        .unwrap_or(0);
    out.push_str("<div");
    attr(out, "class", "cv-tabs-tabs");
    attr(out, "data-radio", "");
    out.push('>');
    for (i, child) in node.children.iter().enumerate() {
        let (title, unwrap) = labels.get(i).cloned().unwrap_or_default();
        let id = format!("{base}-{i}");
        out.push_str("<input");
        attr(out, "type", "radio");
        attr(out, "class", "cv-tabs-input");
        attr(out, "name", &base);
        attr(out, "id", &id);
        if i == checked {
            flag(out, "checked");
        }
        out.push('>');
        out.push_str("<label");
        attr(out, "class", "cv-tabs-trigger");
        attr(out, "for", &id);
        attr(out, "id", &format!("{id}-label"));
        out.push('>');
        esc(out, &title);
        out.push_str("</label>");
        out.push_str("<div");
        attr(out, "class", "cv-tabs-content");
        attr(out, "role", "group");
        attr(out, "id", &format!("{id}-panel"));
        attr(out, "aria-labelledby", &format!("{id}-label"));
        out.push('>');
        emit_content(child, unwrap, cx, out);
        out.push_str("</div>");
    }
    out.push_str("</div>");
}

// --------------------------------------------------------------------- table

fn table(node: &Node, cx: &mut Cx, out: &mut String) {
    let all = rows(node);
    let (head, body) = all
        .split_first()
        .map_or((&[][..], &[][..]), |(h, b)| (h.as_slice(), b));
    let ncols = all.iter().map(Vec::len).max().unwrap_or(0);
    // `sort` is not a catalog prop yet; an explicit `sortMode=client` (or a future `sort`)
    // opts in. The default `client` alone must not pull in a script.
    let sortable = node.prop_bool("sort")
        || (node.prop_set("sortMode") && node.prop_str("sortMode").as_deref() == Some("client"));
    if sortable {
        cx.scripts.insert("table-sort");
    }
    let base = cx.id();
    let title = explicit_str(node, "title");
    let description = explicit_str(node, "description");
    let loading = node.prop_bool("loading");

    out.push_str("<div");
    attr(out, "class", "cv-data-table-root");
    attr(
        out,
        "data-density",
        &node.prop_str("density").unwrap_or_else(|| "normal".into()),
    );
    if node.prop_bool("zebra") {
        attr(out, "data-zebra", "true");
    }
    if node.prop_bool("stickyHeader") {
        attr(out, "data-sticky-header", "true");
    }
    out.push('>');
    out.push_str("<span aria-live=\"polite\" class=\"cv-data-table-srOnly\"></span>");
    if title.is_some() || description.is_some() {
        out.push_str("<div class=\"cv-data-table-toolbar\"><div class=\"cv-data-table-heading\">");
        if let Some(t) = &title {
            out.push_str("<div");
            attr(out, "id", &format!("{base}-title"));
            attr(out, "class", "cv-data-table-title");
            out.push('>');
            esc(out, t);
            out.push_str("</div>");
        }
        if let Some(d) = &description {
            out.push_str("<div");
            attr(out, "id", &format!("{base}-description"));
            attr(out, "class", "cv-data-table-description");
            out.push('>');
            esc(out, d);
            out.push_str("</div>");
        }
        out.push_str("</div><div class=\"cv-data-table-toolbarActions\"></div></div>");
    }
    out.push_str("<div class=\"cv-data-table-scroller\"><table");
    attr(out, "class", "cv-data-table-table");
    if title.is_some() {
        attr(out, "aria-labelledby", &format!("{base}-title"));
    } else if let Some(l) = explicit_str(node, "ariaLabel") {
        attr(out, "aria-label", &l);
    }
    if description.is_some() {
        attr(out, "aria-describedby", &format!("{base}-description"));
    }
    if loading {
        attr(out, "aria-busy", "true");
    }
    if sortable {
        flag(out, "data-sortable");
    }
    out.push_str("><colgroup>");
    for _ in 0..ncols {
        out.push_str("<col>");
    }
    out.push_str("</colgroup><thead><tr>");
    for i in 0..ncols {
        out.push_str("<th scope=\"col\" class=\"cv-data-table-headerCell\" data-align=\"start\"");
        if sortable {
            out.push_str(" aria-sort=\"none\"");
        }
        out.push_str("><span class=\"cv-data-table-headerInner\">");
        if sortable {
            out.push_str(
                "<button type=\"button\" class=\"cv-data-table-sortButton\" data-state=\"none\">",
            );
            esc(out, cell(head, i));
            out.push_str("</button>");
        } else {
            esc(out, cell(head, i));
        }
        out.push_str("</span></th>");
    }
    out.push_str("</tr></thead><tbody>");
    if loading {
        for _ in 0..5 {
            out.push_str("<tr class=\"cv-data-table-row\">");
            for _ in 0..ncols {
                out.push_str(
                    "<td><span class=\"cv-data-table-shimmer\" aria-hidden=\"true\"></span></td>",
                );
            }
            out.push_str("</tr>");
        }
    } else if body.is_empty() {
        // React serialises `colSpan` with that casing; HTML attribute names are case-insensitive.
        out.push_str("<tr data-empty-row=\"true\"><td");
        attr(out, "colSpan", &ncols.max(1).to_string());
        attr(out, "class", "cv-data-table-emptyCell");
        out.push('>');
        esc(
            out,
            &explicit_str(node, "emptyState").unwrap_or_else(|| "No data".into()),
        );
        out.push_str("</td></tr>");
    } else {
        for (r, row) in body.iter().enumerate() {
            out.push_str("<tr class=\"cv-data-table-row\"");
            attr(out, "data-parity", if r % 2 == 0 { "even" } else { "odd" });
            out.push('>');
            for i in 0..ncols {
                out.push_str("<td data-align=\"start\">");
                esc(out, cell(row, i));
                out.push_str("</td>");
            }
            out.push_str("</tr>");
        }
    }
    out.push_str("</tbody></table></div></div>");
}
