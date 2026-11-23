//! Manual emitters for label, status, user, item and inline-loading. Each mirrors the SSR markup
//! of `packages/components/src/<unit>/<unit>.tsx` (parity cases in `tests/conformance`).

use super::display::{AvatarView, avatar_view};
use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{avatar, inline_loading, item, label, spinner, status, user};
use crate::html::{attr, esc};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "label" => label_el(node, out),
        "status" => status_el(node, out),
        "user" => user_el(node, out),
        "item" => item_el(node, cx, out),
        "inline-loading" => inline_loading_el(node, out),
        _ => {}
    }
}

fn text(node: &Node) -> &str {
    node.text.as_deref().unwrap_or("")
}

fn span(out: &mut String, class: &str, body: &str) {
    out.push_str("<span");
    attr(out, "class", class);
    out.push('>');
    esc(out, body);
    out.push_str("</span>");
}

fn label_el(node: &Node, out: &mut String) {
    out.push_str("<label");
    if node.prop_bool("disabled") {
        attr(out, "data-disabled", "");
    }
    attr(out, "class", label::ROOT);
    if let Some(id) = node.prop_str("htmlFor") {
        attr(out, "for", &id);
    }
    out.push('>');
    esc(out, text(node));
    if node.prop_bool("required") {
        out.push_str("<span");
        attr(out, "aria-hidden", "true");
        attr(out, "class", label::MARKER);
        out.push_str(">*</span>");
        span(out, label::SR_ONLY, "Required");
    }
    out.push_str("</label>");
}

fn status_el(node: &Node, out: &mut String) {
    out.push_str("<span");
    attr(
        out,
        "data-status",
        &node.prop_str("status").unwrap_or_else(|| "neutral".into()),
    );
    if node.prop_bool("pulse") {
        attr(out, "data-pulse", "");
    }
    attr(out, "class", status::ROOT);
    out.push_str("><span");
    attr(out, "aria-hidden", "true");
    attr(out, "class", status::DOT);
    out.push_str("></span>");
    esc(out, text(node));
    out.push_str("</span>");
}

fn user_el(node: &Node, out: &mut String) {
    let name = node.arg_str(0).unwrap_or_default();
    out.push_str("<div");
    attr(out, "role", "group");
    attr(out, "class", user::ROOT);
    out.push('>');
    avatar_view(
        out,
        &AvatarView {
            src: "",
            alt: "",
            name: &name,
            fallback: None,
            size: "md",
            status: None,
            class: avatar::ROOT,
            aria_label: None,
        },
    );
    out.push_str("<span");
    attr(out, "class", user::TEXT);
    out.push('>');
    span(out, user::NAME, &name);
    if let Some(d) = node.prop_str("description") {
        span(out, user::DESCRIPTION, &d);
    }
    out.push_str("</span></div>");
}

fn item_el(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    attr(
        out,
        "data-variant",
        &node.prop_str("variant").unwrap_or_else(|| "default".into()),
    );
    attr(
        out,
        "data-size",
        &node.prop_str("size").unwrap_or_else(|| "md".into()),
    );
    attr(out, "class", item::ROOT);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

const CHECK: &str = "<path d=\"M3.5 8.5l3 3 6-7\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>";
const CROSS: &str = "<path d=\"M8 4.5v4M8 11h.01\" stroke=\"currentColor\" stroke-width=\"1.75\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path><circle cx=\"8\" cy=\"8\" r=\"6.25\" stroke=\"currentColor\" stroke-width=\"1.5\"></circle>";

fn inline_loading_el(node: &Node, out: &mut String) {
    let status = node.prop_str("status").unwrap_or_else(|| "inactive".into());
    out.push_str("<div");
    attr(out, "role", "status");
    attr(out, "aria-live", "polite");
    attr(out, "data-status", &status);
    attr(out, "class", inline_loading::ROOT);
    out.push_str("><span");
    attr(out, "aria-hidden", "true");
    attr(out, "class", inline_loading::INDICATOR);
    out.push('>');
    match status.as_str() {
        "active" => {
            out.push_str("<span");
            attr(out, "role", "status");
            attr(out, "aria-label", "Loading");
            attr(out, "data-size", "sm");
            attr(
                out,
                "class",
                &format!("{} {}", spinner::ROOT, inline_loading::SPINNER),
            );
            out.push_str("></span>");
        }
        "finished" | "error" => {
            out.push_str("<svg");
            attr(out, "class", inline_loading::ICON);
            attr(out, "viewBox", "0 0 16 16");
            attr(out, "width", "16");
            attr(out, "height", "16");
            attr(out, "fill", "none");
            attr(out, "aria-hidden", "true");
            out.push('>');
            out.push_str(if status == "finished" { CHECK } else { CROSS });
            out.push_str("</svg>");
        }
        _ => {}
    }
    out.push_str("</span>");
    let label = match node.prop_str("label") {
        Some(l) => l,
        None => match status.as_str() {
            "active" => "Loading".into(),
            "finished" => "Loaded".into(),
            "error" => "Error".into(),
            _ => String::new(),
        },
    };
    if !label.is_empty() {
        span(out, inline_loading::LABEL, &label);
    }
    out.push_str("</div>");
}
