//! Emitters mirroring `packages/components/src/<unit>/<unit>.tsx` for the E1 static units:
//! chat-bubble, shimmer-text, stack, aspect-ratio, skip-nav, typing-indicator, ai-disclaimer.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{
    ai_disclaimer, aspect_ratio, chat_bubble, shimmer_text, skip_nav, stack, typing_indicator,
};
use crate::html::{attr, esc};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "chat-bubble" => chat_bubble(node, cx, out),
        "shimmer-text" => shimmer_text(node, out),
        "stack" => stack(node, cx, out),
        "aspect-ratio" => aspect_ratio(node, cx, out),
        "skip-nav" => skip_nav(node, out),
        "typing-indicator" => typing_indicator(node, out),
        "ai-disclaimer" => ai_disclaimer(node, out),
        _ => emit_children(node, cx, out),
    }
}

/// A number the way JS stringifies it (Rust's `Display` is also shortest round-trip).
fn js_num(n: f64) -> String {
    if n.is_finite() {
        format!("{n}")
    } else {
        "0".into()
    }
}

/// A prop React treats as absent when empty (`name && …`).
fn non_empty(v: Option<String>) -> Option<String> {
    v.filter(|s| !s.is_empty())
}

fn chat_bubble(node: &Node, cx: &mut Cx<'_>, out: &mut String) {
    use chat_bubble as c;
    out.push_str("<div");
    attr(out, "class", c::ROOT);
    attr(
        out,
        "data-side",
        &node.prop_str("side").unwrap_or_else(|| "start".into()),
    );
    out.push_str("><div");
    attr(out, "class", c::CONTENT);
    out.push('>');
    let name = non_empty(node.prop_str("name"));
    let time = non_empty(node.prop_str("time"));
    if name.is_some() || time.is_some() {
        out.push_str("<div");
        attr(out, "class", c::META);
        out.push('>');
        if let Some(n) = &name {
            out.push_str("<span");
            attr(out, "class", c::NAME);
            out.push('>');
            esc(out, n);
            out.push_str("</span>");
        }
        if let Some(t) = &time {
            out.push_str("<time");
            attr(out, "class", c::TIME);
            out.push('>');
            esc(out, t);
            out.push_str("</time>");
        }
        out.push_str("</div>");
    }
    out.push_str("<div");
    attr(out, "class", c::BODY);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></div></div>");
}

fn shimmer_text(node: &Node, out: &mut String) {
    let tag = match node.prop_str("as").as_deref() {
        Some("p") => "p",
        Some("div") => "div",
        _ => "span",
    };
    out.push('<');
    out.push_str(tag);
    attr(out, "class", shimmer_text::ROOT);
    out.push('>');
    esc(out, node.text.as_deref().unwrap_or(""));
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn stack(node: &Node, cx: &mut Cx<'_>, out: &mut String) {
    let offset = node.prop_num("offset").unwrap_or(4.0);
    out.push_str("<div");
    attr(out, "class", stack::ROOT);
    cx.style(out, &format!("--cascivo-stack-offset:{}px", js_num(offset)));
    out.push('>');
    // React wraps an absent child as one empty layer, so an empty stack keeps that layer.
    let layer = |i: usize, child: Option<&Node>, cx: &mut Cx<'_>, out: &mut String| {
        out.push_str("<div");
        attr(out, "class", stack::LAYER);
        cx.style(out, &format!("--cascivo-stack-index:{i}"));
        out.push('>');
        if let Some(n) = child {
            super::emit(n, cx, out);
        }
        out.push_str("</div>");
    };
    if node.children.is_empty() {
        layer(0, None, cx, out);
    }
    for (i, child) in node.children.iter().enumerate() {
        layer(i, Some(child), cx, out);
    }
    out.push_str("</div>");
}

fn aspect_ratio(node: &Node, cx: &mut Cx<'_>, out: &mut String) {
    let ratio = node.prop_num("ratio").unwrap_or(16.0 / 9.0);
    out.push_str("<div");
    attr(out, "class", aspect_ratio::ROOT);
    cx.style(out, &format!("--cascivo-aspect-ratio:{}", js_num(ratio)));
    out.push_str("><div");
    attr(out, "class", aspect_ratio::INNER);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div></div>");
}

fn skip_nav(node: &Node, out: &mut String) {
    let target = node
        .prop_str("targetId")
        .unwrap_or_else(|| "cascade-skip-target".into());
    out.push_str("<a");
    attr(out, "href", &format!("#{target}"));
    attr(out, "class", skip_nav::ROOT);
    out.push('>');
    esc(out, node.text.as_deref().unwrap_or("Skip to content"));
    out.push_str("</a>");
}

fn typing_indicator(node: &Node, out: &mut String) {
    let label = if node.prop_set("ariaLabel") {
        node.prop_str("ariaLabel")
    } else if node.prop_set("label") {
        node.prop_str("label")
    } else {
        None
    }
    .unwrap_or_else(|| "Assistant is typing".into());
    out.push_str("<span");
    attr(out, "role", "status");
    attr(out, "aria-label", &label);
    attr(out, "class", typing_indicator::ROOT);
    out.push('>');
    for _ in 0..3 {
        out.push_str("<span");
        attr(out, "class", typing_indicator::DOT);
        attr(out, "aria-hidden", "true");
        out.push_str("></span>");
    }
    out.push_str("</span>");
}

fn ai_disclaimer(node: &Node, out: &mut String) {
    use ai_disclaimer as c;
    out.push_str("<p");
    attr(out, "class", c::ROOT);
    out.push_str("><svg");
    attr(out, "class", c::GLYPH);
    attr(out, "viewBox", "0 0 16 16");
    attr(out, "width", "12");
    attr(out, "height", "12");
    attr(out, "fill", "currentColor");
    attr(out, "aria-hidden", "true");
    out.push_str("><path");
    attr(
        out,
        "d",
        "M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z",
    );
    out.push_str("></path></svg><span>");
    esc(
        out,
        node.text
            .as_deref()
            .unwrap_or("AI-generated content may be incorrect."),
    );
    out.push_str("</span></p>");
}
