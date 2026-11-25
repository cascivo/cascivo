//! Form controls: `field`, `input`, `textarea`, `select`, `checkbox`. Markup matches the React
//! components (`packages/components/src/<unit>`); the parity cases prove it. Focus state is
//! CSS-only here: a static page renders every control `idle` (or `error`).

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{checkbox, field, input, label, select, textarea};
use crate::html::{attr, esc, flag};
use crate::render::{Cx, FieldCtx};

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "field" => field_node(node, cx, out),
        "input" => input_node(node, cx, out),
        "textarea" => textarea_node(node, cx, out),
        "select" => select_node(node, cx, out),
        "checkbox" => checkbox_node(node, cx, out),
        _ => {}
    }
}

fn non_empty(s: Option<String>) -> Option<String> {
    s.filter(|v| !v.is_empty())
}

/// React's `cascade-<unit>-<label lowercased, whitespace runs as -->`.
pub(super) fn auto_id(unit: &str, label: &str) -> String {
    let mut slug = String::new();
    let mut gap = false;
    for c in label.to_lowercase().chars() {
        if c.is_whitespace() {
            if !gap {
                slug.push('-');
            }
            gap = true;
        } else {
            gap = false;
            slug.push(c);
        }
    }
    format!("cascade-{unit}-{slug}")
}

/// What `<unit>` needs from its surroundings: the id and the field's ARIA overrides.
pub(super) struct Control {
    pub(super) id: Option<String>,
    pub(super) ctx: Option<FieldCtx>,
}

pub(super) fn control(node: &Node, cx: &mut Cx, unit: &str, label: Option<&str>) -> Control {
    let ctx = cx.field.take();
    let id = non_empty(node.prop_str("id"))
        .or_else(|| ctx.as_ref().map(|c| c.id.clone()))
        .or_else(|| label.map(|l| auto_id(unit, l)));
    Control { id, ctx }
}

/// `aria-invalid`, `aria-describedby`, `aria-labelledby` and `disabled` of a control, with the
/// field's wiring winning over the control's own, as React's prop spread does.
pub(super) fn aria(out: &mut String, c: &Control, error: Option<&str>, hint: Option<&str>) {
    let own_describe = c.id.as_ref().and_then(|id| {
        error
            .map(|_| format!("{id}-error"))
            .or_else(|| hint.map(|_| format!("{id}-hint")))
    });
    let field = c.ctx.as_ref();
    if error.is_some() || field.is_some_and(|f| f.invalid) {
        attr(out, "aria-invalid", "true");
    }
    if let Some(d) = field.and_then(|f| f.described_by.clone()).or(own_describe) {
        attr(out, "aria-describedby", &d);
    }
    if let Some(l) = field.and_then(|f| f.labelled_by.as_deref()) {
        attr(out, "aria-labelledby", l);
    }
}

pub(super) fn disabled(node: &Node, c: &Control) -> bool {
    node.prop_bool("disabled") || c.ctx.as_ref().is_some_and(|f| f.disabled)
}

pub(super) fn aria_label(out: &mut String, node: &Node) {
    if let Some(l) = node.prop_str("ariaLabel") {
        attr(out, "aria-label", &l);
    }
}

fn text_el(
    out: &mut String,
    tag: &str,
    id: Option<&str>,
    role: Option<&str>,
    class: &str,
    s: &str,
) {
    out.push('<');
    out.push_str(tag);
    if let Some(id) = id {
        attr(out, "id", id);
    }
    if let Some(r) = role {
        attr(out, "role", r);
    }
    attr(out, "class", class);
    out.push('>');
    esc(out, s);
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

/// The label, then (after the control) the error or hint of a wrapper control.
pub(super) fn label_el(out: &mut String, class: &str, id: Option<&str>, text: &str) {
    out.push_str("<label");
    attr(out, "class", class);
    if let Some(id) = id {
        attr(out, "for", id);
    }
    out.push('>');
    esc(out, text);
    out.push_str("</label>");
}

fn feedback(
    out: &mut String,
    c: &Control,
    error: Option<&str>,
    hint: Option<&str>,
    err: &str,
    hnt: &str,
) {
    let id = c.id.as_deref().unwrap_or("undefined");
    if let Some(e) = error {
        text_el(
            out,
            "span",
            Some(&format!("{id}-error")),
            Some("alert"),
            err,
            e,
        );
    } else if let Some(h) = hint {
        text_el(out, "span", Some(&format!("{id}-hint")), None, hnt, h);
    }
}

fn size(node: &Node) -> String {
    node.prop_str("size").unwrap_or_else(|| "md".into())
}

fn state(error: bool) -> &'static str {
    if error {
        input::State::Error.as_str()
    } else {
        input::State::Idle.as_str()
    }
}

fn input_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let lbl = non_empty(node.arg_str(0));
    let error = non_empty(node.prop_str("error"));
    let hint = non_empty(node.prop_str("hint"));
    let c = control(node, cx, "input", lbl.as_deref());
    out.push_str("<div");
    attr(out, "class", input::ROOT);
    attr(out, "data-state", state(error.is_some()));
    attr(out, "data-size", &size(node));
    if node.prop_bool("ai") {
        attr(out, "data-ai", "");
    }
    out.push('>');
    if let Some(l) = &lbl {
        label_el(out, input::LABEL, c.id.as_deref(), l);
    }
    out.push_str("<input");
    if let Some(id) = &c.id {
        attr(out, "id", id);
    }
    attr(out, "class", input::INPUT);
    aria(out, &c, error.as_deref(), hint.as_deref());
    if let Some(t) = node.prop_str("type") {
        attr(out, "type", &t);
    }
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if let Some(p) = node.prop_str("placeholder") {
        attr(out, "placeholder", &p);
    }
    if let Some(v) = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
    {
        attr(out, "value", &v);
    }
    if disabled(node, &c) {
        flag(out, "disabled");
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    aria_label(out, node);
    out.push_str("/>");
    feedback(
        out,
        &c,
        error.as_deref(),
        hint.as_deref(),
        input::ERROR,
        input::HINT,
    );
    out.push_str("</div>");
}

fn textarea_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let lbl = non_empty(node.arg_str(0));
    let error = non_empty(node.prop_str("error"));
    let hint = non_empty(node.prop_str("hint"));
    let c = control(node, cx, "textarea", lbl.as_deref());
    let rows = node.prop_num("rows").map_or(4.0, |n| n);
    let autosize = node.prop_bool("autosize");
    out.push_str("<div");
    attr(out, "class", textarea::ROOT);
    attr(out, "data-state", state(error.is_some()));
    attr(
        out,
        "data-resize",
        &node.prop_str("resize").unwrap_or_else(|| "vertical".into()),
    );
    if autosize {
        attr(out, "data-autosize", "");
    }
    if node.prop_bool("ai") {
        attr(out, "data-ai", "");
    }
    if autosize {
        cx.style(out, &format!("--_rows:{}", crate::html::num(rows)));
    }
    out.push('>');
    if let Some(l) = &lbl {
        label_el(out, textarea::LABEL, c.id.as_deref(), l);
    }
    out.push_str("<textarea");
    if let Some(id) = &c.id {
        attr(out, "id", id);
    }
    attr(out, "rows", &crate::html::num(rows));
    attr(out, "aria-multiline", "true");
    attr(out, "class", textarea::TEXTAREA);
    aria(out, &c, error.as_deref(), hint.as_deref());
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if let Some(p) = node.prop_str("placeholder") {
        attr(out, "placeholder", &p);
    }
    if disabled(node, &c) {
        flag(out, "disabled");
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    aria_label(out, node);
    out.push('>');
    if let Some(v) = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
    {
        esc(out, &v);
    }
    out.push_str("</textarea>");
    feedback(
        out,
        &c,
        error.as_deref(),
        hint.as_deref(),
        textarea::ERROR,
        textarea::HINT,
    );
    out.push_str("</div>");
}

fn select_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let lbl = non_empty(node.prop_str("label"));
    let error = non_empty(node.prop_str("error"));
    let hint = non_empty(node.prop_str("hint"));
    let placeholder = node.prop_str("placeholder");
    let c = control(node, cx, "select", lbl.as_deref());
    let chosen = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
        .or_else(|| placeholder.as_ref().map(|_| String::new()));
    out.push_str("<div");
    attr(out, "class", select::ROOT);
    attr(out, "data-state", state(error.is_some()));
    attr(out, "data-size", &size(node));
    out.push('>');
    if let Some(l) = &lbl {
        label_el(out, select::LABEL, c.id.as_deref(), l);
    }
    out.push_str("<div");
    attr(out, "class", select::FIELD);
    out.push_str("><select");
    if let Some(id) = &c.id {
        attr(out, "id", id);
    }
    attr(out, "class", select::SELECT);
    aria(out, &c, error.as_deref(), hint.as_deref());
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if disabled(node, &c) {
        flag(out, "disabled");
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    aria_label(out, node);
    out.push('>');
    if let Some(p) = &placeholder {
        out.push_str("<option");
        attr(out, "value", "");
        flag(out, "disabled");
        if chosen.as_deref() == Some("") {
            flag(out, "selected");
        }
        out.push('>');
        esc(out, p);
        out.push_str("</option>");
    }
    for row in node.arg_rows(0).unwrap_or(&[]) {
        let value = row.first().map_or("", String::as_str);
        let text = row.get(1).map_or(value, String::as_str);
        out.push_str("<option");
        attr(out, "value", value);
        if chosen.as_deref() == Some(value) {
            flag(out, "selected");
        }
        out.push('>');
        esc(out, text);
        out.push_str("</option>");
    }
    out.push_str("</select><span");
    attr(out, "class", select::CHEVRON);
    attr(out, "aria-hidden", "true");
    out.push_str("></span></div>");
    feedback(
        out,
        &c,
        error.as_deref(),
        hint.as_deref(),
        select::ERROR,
        select::HINT,
    );
    out.push_str("</div>");
}

fn checkbox_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let lbl = non_empty(node.arg_str(0));
    let c = control(node, cx, "checkbox", lbl.as_deref());
    let off = disabled(node, &c);
    let checked = node.prop_bool("checked");
    let st = if node.prop_bool("indeterminate") {
        "indeterminate"
    } else if checked {
        "checked"
    } else {
        "unchecked"
    };
    out.push_str("<label");
    attr(out, "class", checkbox::ROOT);
    if off {
        attr(out, "data-disabled", "true");
    }
    attr(out, "data-state", st);
    out.push_str("><input");
    if let Some(id) = &c.id {
        attr(out, "id", id);
    }
    attr(out, "type", "checkbox");
    attr(out, "class", checkbox::INPUT);
    if off {
        flag(out, "disabled");
    }
    if checked {
        flag(out, "checked");
    }
    aria(out, &c, None, None);
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if let Some(v) = node.prop_str("value") {
        attr(out, "value", &v);
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    aria_label(out, node);
    out.push_str("/><span");
    attr(out, "class", checkbox::CONTROL);
    attr(out, "aria-hidden", "true");
    out.push_str("></span>");
    if let Some(l) = &lbl {
        text_el(out, "span", None, None, checkbox::LABEL, l);
    }
    out.push_str("</label>");
}

fn field_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let base = cx.id();
    let id = non_empty(node.prop_str("id")).unwrap_or_else(|| format!("cascade-field-{base}"));
    let lbl = non_empty(node.arg_str(0));
    let hint = non_empty(
        node.prop_str("description")
            .or_else(|| node.prop_str("hint")),
    );
    let error = non_empty(node.prop_str("error"));
    let off = node.prop_bool("disabled");
    let described = [
        hint.as_ref().map(|_| format!("{id}-description")),
        error.as_ref().map(|_| format!("{id}-error")),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join(" ");
    out.push_str("<div");
    attr(out, "class", field::ROOT);
    if off {
        attr(out, "data-disabled", "");
    }
    attr(
        out,
        "data-state",
        if off {
            "disabled"
        } else if error.is_some() {
            "invalid"
        } else {
            "default"
        },
    );
    out.push('>');
    if let Some(l) = &lbl {
        cx.used.insert("label");
        out.push_str("<label");
        attr(out, "id", &format!("{id}-label"));
        attr(out, "for", &id);
        if off {
            attr(out, "data-disabled", "");
        }
        attr(out, "class", label::ROOT);
        out.push('>');
        esc(out, l);
        if node.prop_bool("required") {
            out.push_str("<span");
            attr(out, "class", label::MARKER);
            attr(out, "aria-hidden", "true");
            out.push_str(">*</span><span");
            attr(out, "class", label::SR_ONLY);
            out.push_str(">Required</span>");
        }
        out.push_str("</label>");
    }
    cx.field = Some(FieldCtx {
        id: id.clone(),
        labelled_by: lbl.as_ref().map(|_| format!("{id}-label")),
        described_by: (!described.is_empty()).then_some(described),
        invalid: error.is_some(),
        disabled: off,
    });
    emit_children(node, cx, out);
    cx.field = None;
    if let Some(h) = &hint {
        text_el(
            out,
            "p",
            Some(&format!("{id}-description")),
            None,
            field::DESCRIPTION,
            h,
        );
    }
    if let Some(e) = &error {
        text_el(
            out,
            "p",
            Some(&format!("{id}-error")),
            Some("alert"),
            field::ERROR,
            e,
        );
    }
    out.push_str("</div>");
}
