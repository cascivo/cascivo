//! Pickers: checkbox-card, radio, radio-card, rating-group, slider, native-select. One emitter
//! per component, matching the React markup (packages/components/src/<unit>); parity cases in
//! packages/components/test/html-conformance prove it. A static page renders the first-render
//! state, so nothing here is interactive.

use super::NodeExt;
use super::form::{aria, aria_label, auto_id, control, disabled, label_el};
use crate::ast::Node;
use crate::contract::{checkbox_card, native_select, radio, radio_card, rating_group, slider};
use crate::html::{attr, esc, flag, num};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "checkbox-card" => checkbox_card_node(node, out),
        "radio" => radio_node(node, out),
        "radio-card" => radio_card_node(node, out),
        "rating-group" => rating_node(node, out),
        "slider" => slider_node(node, cx, out),
        "native-select" => native_select_node(node, cx, out),
        _ => {}
    }
}

fn non_empty(s: Option<String>) -> Option<String> {
    s.filter(|v| !v.is_empty())
}

fn span(out: &mut String, class: &str, s: &str) {
    out.push_str("<span");
    attr(out, "class", class);
    out.push('>');
    esc(out, s);
    out.push_str("</span>");
}

fn checkbox_card_node(node: &Node, out: &mut String) {
    let off = node.prop_bool("disabled");
    out.push_str("<label");
    attr(out, "class", checkbox_card::CARD);
    if off {
        attr(out, "data-disabled", "true");
    }
    out.push_str("><input");
    attr(out, "type", "checkbox");
    attr(out, "class", checkbox_card::INPUT);
    if off {
        flag(out, "disabled");
    }
    if node.prop_bool("checked") || node.prop_bool("defaultChecked") {
        flag(out, "checked");
    }
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if let Some(v) = node.prop_str("value") {
        attr(out, "value", &v);
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    out.push_str("/><span");
    attr(out, "class", checkbox_card::GLYPH);
    attr(out, "aria-hidden", "true");
    out.push_str("><svg");
    attr(out, "viewBox", "0 0 12 12");
    attr(out, "class", checkbox_card::CHECK);
    out.push_str("><path");
    attr(out, "d", "M2.5 6.5 5 9l4.5-5.5");
    attr(out, "fill", "none");
    attr(out, "stroke", "currentColor");
    attr(out, "stroke-width", "1.5");
    out.push_str("></path></svg></span><span");
    attr(out, "class", checkbox_card::BODY);
    out.push('>');
    span(
        out,
        checkbox_card::TITLE,
        &node.arg_str(0).unwrap_or_default(),
    );
    if let Some(d) = non_empty(node.prop_str("description")) {
        span(out, checkbox_card::DESCRIPTION, &d);
    }
    out.push_str("</span></label>");
}

fn radio_node(node: &Node, out: &mut String) {
    let lbl = non_empty(node.arg_str(0));
    let value = node.prop_str("value").unwrap_or_default();
    let off = node.prop_bool("disabled");
    let id = non_empty(node.prop_str("id"))
        .or_else(|| lbl.as_ref().map(|_| format!("cascade-radio-{value}")));
    out.push_str("<label");
    attr(out, "class", radio::WRAPPER);
    if off {
        attr(out, "data-disabled", "true");
    }
    out.push_str("><input");
    if let Some(id) = &id {
        attr(out, "id", id);
    }
    attr(out, "type", "radio");
    attr(out, "value", &value);
    attr(out, "class", radio::INPUT);
    if off {
        flag(out, "disabled");
    }
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if node.prop_bool("checked") {
        flag(out, "checked");
    }
    if node.prop_bool("required") {
        flag(out, "required");
    }
    aria_label(out, node);
    out.push_str("/><span");
    attr(out, "class", radio::CONTROL);
    attr(out, "aria-hidden", "true");
    out.push_str("></span>");
    if let Some(l) = &lbl {
        span(out, radio::LABEL, l);
    }
    out.push_str("</label>");
}

fn radio_card_node(node: &Node, out: &mut String) {
    let name = node.prop_str("name").unwrap_or_default();
    let chosen = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"));
    let off = node.prop_bool("disabled");
    let bare = node.prop_bool("hideIndicator");
    out.push_str("<div");
    attr(out, "role", "radiogroup");
    attr(
        out,
        "aria-label",
        &node.prop_str("label").unwrap_or_default(),
    );
    attr(out, "class", radio_card::GROUP);
    out.push('>');
    for row in node.arg_rows(0).unwrap_or(&[]) {
        let value = row.first().map_or("", String::as_str);
        let title = row.get(1).map_or(value, String::as_str);
        out.push_str("<label");
        attr(out, "class", radio_card::CARD);
        if off {
            attr(out, "data-disabled", "true");
        }
        out.push_str("><input");
        attr(out, "type", "radio");
        attr(out, "class", radio_card::INPUT);
        attr(out, "name", &name);
        attr(out, "value", value);
        if off {
            flag(out, "disabled");
        }
        if chosen.as_deref() == Some(value) {
            flag(out, "checked");
        }
        out.push_str("/>");
        if !bare {
            out.push_str("<span");
            attr(out, "class", radio_card::GLYPH);
            attr(out, "aria-hidden", "true");
            out.push_str("></span>");
        }
        out.push_str("<span");
        attr(out, "class", radio_card::BODY);
        out.push('>');
        span(out, radio_card::TITLE, title);
        if let Some(d) = row.get(2).filter(|d| !d.is_empty()) {
            span(out, radio_card::DESCRIPTION, d);
        }
        out.push_str("</span></label>");
    }
    out.push_str("</div>");
}

fn rating_node(node: &Node, out: &mut String) {
    let value = node.arg_num(0).unwrap_or(0.0);
    let max = node.prop_num("max").unwrap_or(5.0).max(0.0) as u32;
    let size = node
        .prop_str("size")
        .unwrap_or_else(|| rating_group::Size::Md.as_str().into());
    let off = node.prop_bool("disabled");
    out.push_str("<div");
    attr(out, "class", rating_group::WRAPPER);
    attr(out, "data-size", &size);
    attr(out, "role", "radiogroup");
    out.push('>');
    for star in 1..=max {
        let n = f64::from(star);
        out.push_str("<button");
        attr(out, "type", "button");
        attr(out, "role", "radio");
        attr(
            out,
            "aria-checked",
            if n == value { "true" } else { "false" },
        );
        attr(out, "aria-label", &format!("{star} of {max} stars"));
        attr(out, "class", rating_group::STAR);
        if n <= value {
            attr(out, "data-filled", "");
        }
        attr(out, "data-value", &star.to_string());
        if off {
            flag(out, "disabled");
        }
        // No `onValueChange` on a static page: React renders every star out of the tab order.
        attr(out, "tabindex", "-1");
        out.push_str("></button>");
    }
    out.push_str("</div>");
}

fn slider_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let lbl = non_empty(node.arg_str(0));
    let c = control(node, cx, "slider", lbl.as_deref());
    let id =
        c.id.clone()
            .or_else(|| lbl.as_deref().map(|l| auto_id("slider", l)));
    let off = disabled(node, &c);
    out.push_str("<div");
    attr(out, "class", slider::WRAPPER);
    if off {
        attr(out, "data-disabled", "true");
    }
    out.push('>');
    if let Some(l) = &lbl {
        label_el(out, slider::LABEL, id.as_deref(), l);
    }
    out.push_str("<input");
    if let Some(id) = &id {
        attr(out, "id", id);
    }
    attr(out, "type", "range");
    attr(
        out,
        "min",
        &node.prop_str("min").unwrap_or_else(|| "0".into()),
    );
    attr(
        out,
        "max",
        &node.prop_str("max").unwrap_or_else(|| "100".into()),
    );
    attr(
        out,
        "step",
        &node.prop_str("step").unwrap_or_else(|| "1".into()),
    );
    if off {
        flag(out, "disabled");
    }
    attr(out, "class", slider::SLIDER);
    aria(out, &c, None, None);
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
    }
    if let Some(v) = node
        .prop_num("value")
        .or_else(|| node.prop_num("defaultValue"))
    {
        attr(out, "value", &num(v));
    }
    aria_label(out, node);
    out.push_str("/></div>");
}

fn native_select_node(node: &Node, cx: &mut Cx, out: &mut String) {
    let placeholder = node.prop_str("placeholder");
    let c = control(node, cx, "native-select", None);
    let invalid = node.prop_bool("invalid");
    let chosen = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
        .or_else(|| placeholder.as_ref().map(|_| String::new()));
    let size = node
        .prop_str("size")
        .unwrap_or_else(|| native_select::Size::Md.as_str().into());
    out.push_str("<div");
    attr(out, "class", native_select::ROOT);
    attr(out, "data-size", &size);
    if invalid {
        attr(out, "data-invalid", "true");
    }
    out.push_str("><select");
    if let Some(id) = &c.id {
        attr(out, "id", id);
    }
    attr(out, "class", native_select::SELECT);
    if disabled(node, &c) {
        flag(out, "disabled");
    }
    // The field's own `aria-invalid` wins over the control's, as in React's prop spread.
    if invalid && !c.ctx.as_ref().is_some_and(|f| f.invalid) {
        attr(out, "aria-invalid", "true");
    }
    aria(out, &c, None, None);
    if let Some(n) = node.prop_str("name") {
        attr(out, "name", &n);
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
        flag(out, "hidden");
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
        if row.get(2).is_some_and(|f| f == "disabled") {
            flag(out, "disabled");
        }
        if chosen.as_deref() == Some(value) {
            flag(out, "selected");
        }
        out.push('>');
        esc(out, text);
        out.push_str("</option>");
    }
    out.push_str("</select><span");
    attr(out, "class", native_select::CHEVRON);
    attr(out, "aria-hidden", "true");
    out.push_str("></span></div>");
}
