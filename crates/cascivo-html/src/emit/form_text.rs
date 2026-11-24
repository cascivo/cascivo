//! Text-like inputs and lists: number-input, password-input, search, contained-list. One emitter per component, matching the React markup (packages/components/src/<unit>);
//! parity cases in packages/components/test/html-conformance prove it.

use super::NodeExt;
use crate::ast::Node;
use crate::contract::{contained_list, number_input, password_input, search};
use crate::html::{attr, esc, flag, num};
use crate::render::{Cx, FieldCtx};

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "number-input" => number_input_node(node, cx, out),
        "password-input" => password_input_node(node, cx, out),
        "search" => search_node(node, cx, out),
        "contained-list" => contained_list_node(node, cx, out),
        _ => {}
    }
}

fn non_empty(s: Option<String>) -> Option<String> {
    s.filter(|v| !v.is_empty())
}

/// A Field's ARIA wiring wins over the control's own, as React's prop spread does.
fn field_aria(out: &mut String, ctx: Option<&FieldCtx>, own_describe: Option<String>) {
    if ctx.is_some_and(|f| f.invalid) {
        attr(out, "aria-invalid", "true");
    }
    if let Some(d) = ctx.and_then(|f| f.described_by.clone()).or(own_describe) {
        attr(out, "aria-describedby", &d);
    }
    if let Some(l) = ctx.and_then(|f| f.labelled_by.as_deref()) {
        attr(out, "aria-labelledby", l);
    }
}

fn size(node: &Node) -> String {
    node.prop_str("size").unwrap_or_else(|| "md".into())
}

fn chevron(out: &mut String, d: &str) {
    out.push_str("<svg viewBox=\"0 0 10 10\" aria-hidden=\"true\" focusable=\"false\"><path d=\"");
    out.push_str(d);
    out.push_str(
        "\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path></svg>",
    );
}

fn stepper(out: &mut String, label: &str, off: bool, d: &str) {
    out.push_str("<button");
    attr(out, "type", "button");
    attr(out, "class", number_input::STEPPER);
    attr(out, "aria-label", label);
    attr(out, "tabindex", "-1");
    if off {
        flag(out, "disabled");
    }
    out.push('>');
    chevron(out, d);
    out.push_str("</button>");
}

fn number_input_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let ctx = cx.field.take();
    let lbl = non_empty(node.arg_str(0));
    let error = non_empty(node.prop_str("error"));
    let hint = non_empty(node.prop_str("hint"));
    let id = ctx.as_ref().map(|c| c.id.clone()).or_else(|| {
        lbl.as_ref()
            .map(|l| format!("cascade-number-input-{}", slug(l)))
    });
    let current = node
        .prop_num("value")
        .or_else(|| node.prop_num("defaultValue"));
    let min = node.prop_num("min");
    let max = node.prop_num("max");
    let off = node.prop_bool("disabled") || ctx.as_ref().is_some_and(|f| f.disabled);
    let at_max = matches!((current, max), (Some(c), Some(m)) if c >= m);
    let at_min = matches!((current, min), (Some(c), Some(m)) if c <= m);
    let idv = id.as_deref().unwrap_or("undefined");

    out.push_str("<div");
    attr(out, "class", number_input::ROOT);
    attr(
        out,
        "data-state",
        if error.is_some() {
            number_input::State::Error.as_str()
        } else {
            number_input::State::Idle.as_str()
        },
    );
    attr(out, "data-size", &size(node));
    out.push('>');
    if let Some(l) = &lbl {
        out.push_str("<label");
        attr(out, "class", number_input::LABEL);
        if let Some(id) = &id {
            attr(out, "for", id);
        }
        out.push('>');
        esc(out, l);
        out.push_str("</label>");
    }
    out.push_str("<div");
    attr(out, "class", number_input::FIELD);
    out.push_str("><input");
    if let Some(id) = &id {
        attr(out, "id", id);
    }
    attr(out, "type", "text");
    attr(out, "inputMode", "decimal");
    attr(out, "autoComplete", "off");
    attr(out, "role", "spinbutton");
    attr(out, "class", number_input::INPUT);
    attr(out, "value", &current.map_or_else(String::new, num));
    if off {
        flag(out, "disabled");
    }
    if let Some(c) = current {
        attr(out, "aria-valuenow", &num(c));
    }
    if let Some(m) = min {
        attr(out, "aria-valuemin", &num(m));
    }
    if let Some(m) = max {
        attr(out, "aria-valuemax", &num(m));
    }
    if error.is_some() {
        attr(out, "aria-invalid", "true");
    }
    let own = error
        .as_ref()
        .map(|_| format!("{idv}-error"))
        .or_else(|| hint.as_ref().map(|_| format!("{idv}-hint")));
    // Field wiring replaces the control's own describedby, but an error keeps aria-invalid.
    field_aria(out, ctx.as_ref(), own);
    if let Some(l) = node.prop_str("ariaLabel") {
        attr(out, "aria-label", &l);
    }
    out.push_str("/><div");
    attr(out, "class", number_input::STEPPERS);
    out.push('>');
    let inc = node
        .prop_str("incrementLabel")
        .unwrap_or_else(|| "Increment".into());
    let dec = node
        .prop_str("decrementLabel")
        .unwrap_or_else(|| "Decrement".into());
    stepper(out, &inc, off || at_max, "M2 6.5 5 3.5 8 6.5");
    stepper(out, &dec, off || at_min, "M2 3.5 5 6.5 8 3.5");
    out.push_str("</div></div>");
    if let Some(e) = &error {
        out.push_str("<span");
        attr(out, "id", &format!("{idv}-error"));
        attr(out, "class", number_input::ERROR);
        attr(out, "role", "alert");
        out.push('>');
        esc(out, e);
        out.push_str("</span>");
    } else if let Some(h) = &hint {
        out.push_str("<span");
        attr(out, "id", &format!("{idv}-hint"));
        attr(out, "class", number_input::HINT);
        out.push('>');
        esc(out, h);
        out.push_str("</span>");
    }
    out.push_str("</div>");
}

/// React's label slug: lowercased, whitespace runs as `-`.
fn slug(label: &str) -> String {
    let mut s = String::new();
    let mut gap = false;
    for c in label.to_lowercase().chars() {
        if c.is_whitespace() {
            if !gap {
                s.push('-');
            }
            gap = true;
        } else {
            gap = false;
            s.push(c);
        }
    }
    s
}

/// (score, level) as `getStrengthLevel` in password-input.tsx.
fn strength(v: &str) -> (usize, &'static str) {
    if v.is_empty() {
        return (0, "weak");
    }
    let mut score = 0;
    if v.chars().any(|c| c.is_ascii_lowercase()) {
        score += 1;
    }
    if v.chars().any(|c| c.is_ascii_uppercase()) {
        score += 1;
    }
    if v.chars().any(|c| c.is_ascii_digit()) {
        score += 1;
    }
    if v.chars().any(|c| !c.is_ascii_alphanumeric()) {
        score += 1;
    }
    // JS `length` counts UTF-16 units.
    if v.encode_utf16().count() >= 12 {
        score = (score + 1).min(4);
    }
    (score, ["weak", "weak", "fair", "good", "strong"][score])
}

fn password_input_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let ctx = cx.field.take();
    let id = non_empty(node.prop_str("id"))
        .or_else(|| ctx.as_ref().map(|c| c.id.clone()))
        .unwrap_or_else(|| format!("cascade-password-{}", cx.id()));
    let value = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"));
    out.push_str("<div");
    attr(out, "class", password_input::ROOT);
    attr(out, "data-size", &size(node));
    out.push_str("><div");
    attr(out, "class", password_input::INPUT_ROW);
    out.push_str("><input");
    field_aria(out, ctx.as_ref(), None);
    if let Some(p) = node.prop_str("placeholder") {
        attr(out, "placeholder", &p);
    }
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    if node.prop_bool("disabled") || ctx.as_ref().is_some_and(|f| f.disabled) {
        flag(out, "disabled");
    }
    attr(out, "id", &id);
    attr(out, "type", "password");
    attr(out, "class", password_input::INPUT);
    if let Some(v) = &value {
        attr(out, "value", v);
    }
    out.push_str("/><button");
    attr(out, "type", "button");
    attr(out, "class", password_input::REVEAL_BTN);
    attr(out, "aria-label", "Show password");
    out.push_str("><span");
    attr(out, "class", password_input::REVEAL_ICON);
    attr(out, "aria-hidden", "true");
    out.push_str("></span></button></div>");
    if node.prop_bool("showStrengthMeter") {
        let (score, level) = strength(value.as_deref().unwrap_or(""));
        out.push_str("<div");
        attr(out, "class", password_input::STRENGTH_METER);
        attr(out, "role", "meter");
        attr(out, "aria-label", &format!("Password strength: {level}"));
        attr(out, "aria-valuenow", &score.to_string());
        attr(out, "aria-valuemin", "0");
        attr(out, "aria-valuemax", "4");
        attr(out, "data-strength", level);
        out.push('>');
        for i in 0..4 {
            out.push_str("<div");
            attr(out, "class", password_input::STRENGTH_SEGMENT);
            if i < score {
                attr(out, "data-filled", "");
            }
            out.push_str("></div>");
        }
        out.push_str("</div>");
    }
    out.push_str("</div>");
}

fn search_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let ctx = cx.field.take();
    let id = non_empty(node.prop_str("id"))
        .or_else(|| ctx.as_ref().map(|c| c.id.clone()))
        .unwrap_or_else(|| format!("cascade-search-{}", cx.id()));
    let externally = ctx.as_ref().is_some_and(|f| f.labelled_by.is_some());
    // The catalog default for `label` is the built-in name, which a Field's label replaces.
    let label = if node.prop_set("label") || !externally {
        node.prop_str("label")
    } else {
        None
    };
    let value = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
        .unwrap_or_default();
    let filled = !value.is_empty();
    let off = node.prop_bool("disabled");
    out.push_str("<div");
    attr(out, "class", search::ROOT);
    attr(out, "data-size", &size(node));
    attr(out, "data-state", if filled { "filled" } else { "empty" });
    out.push('>');
    if let Some(l) = &label {
        out.push_str("<label");
        attr(out, "class", search::LABEL);
        attr(out, "for", &id);
        out.push('>');
        esc(out, l);
        out.push_str("</label>");
    }
    out.push_str("<span");
    attr(out, "class", search::ICON);
    out.push_str(
        "><svg viewBox=\"0 0 16 16\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"7\" cy=\"7\" r=\"4.5\"></circle><line x1=\"10.5\" y1=\"10.5\" x2=\"14\" y2=\"14\"></line></svg></span><input",
    );
    attr(out, "id", &id);
    attr(out, "type", "search");
    let ctx_ref = ctx.as_ref();
    if let Some(l) = ctx_ref.and_then(|f| f.labelled_by.as_deref()) {
        attr(out, "aria-labelledby", l);
    } else if let Some(l) = node.prop_str("aria-labelledby") {
        attr(out, "aria-labelledby", &l);
    }
    if let Some(l) = node.prop_str("ariaLabel") {
        attr(out, "aria-label", &l);
    }
    if let Some(d) = ctx_ref
        .and_then(|f| f.described_by.clone())
        .or_else(|| node.prop_str("aria-describedby"))
    {
        attr(out, "aria-describedby", &d);
    }
    if ctx_ref.is_some_and(|f| f.invalid) || node.prop_bool("aria-invalid") {
        attr(out, "aria-invalid", "true");
    }
    attr(out, "class", search::INPUT);
    attr(out, "value", &value);
    attr(
        out,
        "placeholder",
        &node
            .prop_str("placeholder")
            .unwrap_or_else(|| "Search".into()),
    );
    if off {
        flag(out, "disabled");
    }
    out.push_str("/>");
    if filled {
        out.push_str("<button");
        attr(out, "type", "button");
        attr(out, "class", search::CLEAR);
        attr(
            out,
            "aria-label",
            &node
                .prop_str("clearLabel")
                .unwrap_or_else(|| "Clear search".into()),
        );
        if off {
            flag(out, "disabled");
        }
        out.push_str("><span aria-hidden=\"true\">✕</span></button>");
    }
    out.push_str("</div>");
}

fn contained_list_node(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    attr(
        out,
        "data-kind",
        &node
            .prop_str("kind")
            .unwrap_or_else(|| contained_list::Kind::OnPage.as_str().into()),
    );
    attr(out, "class", contained_list::ROOT);
    out.push_str("><div");
    attr(out, "class", contained_list::HEADER);
    out.push_str("><h3");
    attr(out, "class", contained_list::LABEL);
    out.push('>');
    esc(out, &node.arg_str(0).unwrap_or_default());
    out.push_str("</h3>");
    if let Some(a) = non_empty(node.prop_str("action")) {
        out.push_str("<div");
        attr(out, "class", contained_list::ACTION);
        out.push('>');
        esc(out, &a);
        out.push_str("</div>");
    }
    out.push_str("</div><ul");
    attr(out, "class", contained_list::LIST);
    out.push('>');
    for child in &node.children {
        out.push_str("<li");
        attr(out, "class", contained_list::ITEM);
        out.push_str("><div");
        attr(out, "class", contained_list::ITEM_CONTENT);
        out.push('>');
        super::emit(child, cx, out);
        out.push_str("</div></li>");
    }
    out.push_str("</ul></div>");
}
