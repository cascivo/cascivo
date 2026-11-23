//! Navigation and shell emitters: header, large-title-header, app-shell, dock, scroll-area, toc.
//! Each mirrors the SSR markup of `packages/components/src/<unit>/<unit>.tsx`.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{app_shell, dock, header, large_title_header, scroll_area, toc};
use crate::html::{attr, css_len, esc, num, safe_url};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "header" => header(node, out),
        "large-title-header" => large_title_header(node, cx, out),
        "app-shell" => app_shell(node, cx, out),
        "dock" => dock(node, out),
        "scroll-area" => scroll_area(node, cx, out),
        "toc" => toc(node, cx, out),
        _ => emit_children(node, cx, out),
    }
}

fn rows(node: &Node) -> &[Vec<String>] {
    node.arg_rows(0).unwrap_or(&[])
}

fn cell(row: &[String], i: usize) -> &str {
    row.get(i).map_or("", String::as_str)
}

/// A non-empty string prop (React treats `''` like an absent slot).
fn slot(node: &Node, name: &str) -> Option<String> {
    node.prop_str(name).filter(|s| !s.is_empty())
}

fn header(node: &Node, out: &mut String) {
    out.push_str("<header");
    attr(out, "role", "banner");
    if node.prop_bool("sticky") {
        attr(out, "data-sticky", "true");
    }
    attr(out, "class", header::ROOT);
    out.push('>');
    let links = rows(node);
    if !links.is_empty() {
        out.push_str("<nav");
        attr(out, "aria-label", "Main");
        attr(out, "class", header::NAV);
        out.push_str("><ul");
        attr(out, "class", header::LIST);
        out.push('>');
        for row in links {
            out.push_str("<li><a");
            attr(
                out,
                "href",
                &safe_url(cell(row, 1), false).unwrap_or_else(|| "#".into()),
            );
            if !cell(row, 2).is_empty() {
                attr(out, "aria-current", "page");
                attr(out, "data-state", "active");
            }
            attr(out, "class", header::LINK);
            out.push('>');
            esc(out, cell(row, 0));
            out.push_str("</a></li>");
        }
        out.push_str("</ul></nav>");
    }
    out.push_str("<div");
    attr(out, "class", header::SPACER);
    out.push_str("></div></header>");
}

fn large_title_header(node: &Node, cx: &mut Cx, out: &mut String) {
    let title = node.arg_str(0).unwrap_or_default();
    let level = match node.prop_str("level").as_deref() {
        Some("2") => "h2",
        Some("3") => "h3",
        _ => "h1",
    };
    let distance = node.prop_num("collapseDistance").unwrap_or(48.0);
    out.push_str("<div");
    attr(out, "class", large_title_header::ROOT);
    cx.style(out, &format!("--_collapse:{}px", num(distance)));
    out.push_str("><div");
    attr(out, "class", large_title_header::BAR);
    out.push_str("><div");
    attr(out, "class", large_title_header::SLOT);
    out.push_str("></div><span");
    attr(out, "aria-hidden", "true");
    attr(out, "class", large_title_header::COMPACT_TITLE);
    out.push('>');
    esc(out, &title);
    out.push_str("</span><div");
    attr(
        out,
        "class",
        &format!(
            "{} {}",
            large_title_header::SLOT,
            large_title_header::SLOT_END
        ),
    );
    out.push_str("></div></div><");
    out.push_str(level);
    attr(out, "class", large_title_header::LARGE_TITLE);
    out.push('>');
    esc(out, &title);
    out.push_str("</");
    out.push_str(level);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

fn app_shell(node: &Node, cx: &mut Cx, out: &mut String) {
    // Server render: a set `open` wins, then `defaultOpen`, else open (the effect that closes
    // the small-screen drawer only runs in the browser).
    let open = if node.prop_set("open") {
        node.prop_bool("open")
    } else if node.prop_set("defaultOpen") {
        node.prop_bool("defaultOpen")
    } else {
        true
    };
    let open = if open { "true" } else { "false" };
    out.push_str("<div");
    attr(out, "class", app_shell::ROOT);
    attr(out, "data-open", open);
    out.push_str("><div");
    attr(out, "class", app_shell::HEADER);
    out.push('>');
    esc(out, &node.prop_str("header").unwrap_or_default());
    out.push_str("</div><div");
    attr(out, "class", app_shell::BODY);
    out.push('>');
    if let Some(nav) = slot(node, "nav") {
        out.push_str("<div");
        attr(out, "class", app_shell::NAV_WRAPPER);
        attr(out, "data-open", open);
        attr(out, "data-testid", "app-shell-nav");
        attr(out, "data-cascivo-appshell-nav", "");
        out.push_str("><div");
        attr(out, "class", app_shell::NAV_INNER);
        out.push('>');
        esc(out, &nav);
        out.push_str("</div></div><div");
        attr(out, "class", app_shell::SCRIM);
        attr(out, "data-open", open);
        attr(out, "data-testid", "app-shell-scrim");
        attr(out, "aria-hidden", "true");
        out.push_str("></div>");
    }
    out.push_str("<main");
    attr(out, "id", "cascade-main");
    attr(out, "tabindex", "-1");
    attr(out, "class", app_shell::MAIN);
    attr(out, "data-cascivo-appshell-main", "");
    attr(out, "data-padding", "6");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</main></div>");
    if let Some(footer) = slot(node, "footer") {
        out.push_str("<div");
        attr(out, "class", app_shell::FOOTER);
        out.push('>');
        esc(out, &footer);
        out.push_str("</div>");
    }
    out.push_str("</div>");
}

fn dock(node: &Node, out: &mut String) {
    let label = slot(node, "ariaLabel")
        .or_else(|| slot(node, "label"))
        .unwrap_or_else(|| "Main navigation".into());
    let active = node.prop_num("activeIndex");
    out.push_str("<nav");
    attr(out, "aria-label", &label);
    attr(out, "class", dock::ROOT);
    out.push('>');
    for (i, row) in rows(node).iter().enumerate() {
        let href = (!cell(row, 1).is_empty())
            .then(|| safe_url(cell(row, 1), false).unwrap_or_else(|| "#".into()));
        let tag = if href.is_some() { "a" } else { "button" };
        out.push('<');
        out.push_str(tag);
        attr(out, "class", dock::ITEM);
        if active == Some(i as f64) {
            attr(out, "data-active", "true");
            attr(out, "aria-current", "page");
        }
        match &href {
            Some(h) => attr(out, "href", h),
            None => attr(out, "type", "button"),
        }
        out.push_str("><span");
        attr(out, "class", dock::ICON);
        attr(out, "aria-hidden", "true");
        out.push('>');
        esc(out, cell(row, 2));
        out.push_str("</span><span");
        attr(out, "class", dock::LABEL);
        out.push('>');
        esc(out, cell(row, 0));
        out.push_str("</span></");
        out.push_str(tag);
        out.push('>');
    }
    out.push_str("</nav>");
}

fn scroll_area(node: &Node, cx: &mut Cx, out: &mut String) {
    let mut style = String::new();
    for (prop, var) in [
        ("height", "--cascivo-scroll-area-height"),
        ("width", "--cascivo-scroll-area-width"),
    ] {
        if let Some(v) = node.prop_str(prop).and_then(|v| css_len(&v)) {
            if !style.is_empty() {
                style.push(';');
            }
            style.push_str(var);
            style.push(':');
            style.push_str(&v);
        }
    }
    out.push_str("<div");
    attr(
        out,
        "data-orientation",
        &node
            .prop_str("orientation")
            .unwrap_or_else(|| "vertical".into()),
    );
    attr(
        out,
        "data-edges",
        &node.prop_str("edges").unwrap_or_else(|| "shadow".into()),
    );
    attr(out, "class", scroll_area::ROOT);
    cx.style(out, &style);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

fn toc(node: &Node, cx: &mut Cx, out: &mut String) {
    let items = rows(node);
    // Uncontrolled SSR: the first item is active until the browser's scroll-spy runs.
    let active = slot(node, "activeId").or_else(|| items.first().map(|r| cell(r, 1).to_string()));
    out.push_str("<nav");
    attr(out, "aria-label", "On this page");
    attr(out, "class", toc::ROOT);
    out.push_str("><ol>");
    for row in items {
        let level = cell(row, 2).parse::<f64>().map_or_else(|_| "2".into(), num);
        out.push_str("<li");
        cx.style(out, &format!("--toc-level:{level}"));
        out.push_str("><a");
        attr(out, "href", &format!("#{}", cell(row, 1)));
        if active.as_deref() == Some(cell(row, 1)) {
            attr(out, "aria-current", "location");
        }
        out.push('>');
        esc(out, cell(row, 0));
        out.push_str("</a></li>");
    }
    out.push_str("</ol></nav>");
}
