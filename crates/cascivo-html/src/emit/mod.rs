//! Component emitters. `emit` dispatches on the catalog name to a group module.

use crate::ast::{Node, Value};
use crate::render::Cx;

pub mod chart;
mod display;
mod feedback;
mod layout;
mod nav;

pub use chart::emit_chart;

/// Writes the HTML for `node` and records the CSS and scripts it needs.
pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    for unit in node.spec.css {
        cx.used.insert(unit);
    }
    match node.spec.name {
        "flex" | "grid" | "columns" | "auto-grid" | "center" | "section" | "page-header"
        | "dashboard-layout" | "separator" | "spacer" => layout::emit(node, cx, out),
        "heading" | "text" | "prose" | "card" | "stat" | "kpi" | "badge" | "tag" | "avatar"
        | "avatar-group" | "image" | "list" | "data-list" | "structured-list" | "timeline"
        | "empty-state" | "blockquote" | "code" | "kbd" | "link" | "button" => {
            display::emit(node, cx, out);
        }
        "alert" | "notification" | "progress-bar" | "progress-circle" | "meter" | "skeleton"
        | "spinner" => feedback::emit(node, cx, out),
        "breadcrumb" | "steps" | "accordion" | "collapsible" | "tabs" | "table" => {
            nav::emit(node, cx, out);
        }
        "bar" | "line" | "area" | "pie" | "scatter" | "spark" | "gauge" => {
            emit_chart(node, cx, out);
        }
        _ => {}
    }
}

/// Emits every child node in order.
pub fn emit_children(node: &Node, cx: &mut Cx, out: &mut String) {
    for child in &node.children {
        emit(child, cx, out);
    }
}

/// Accessors that hide the `Value` plumbing from emitters.
pub trait NodeExt {
    /// Positional arg `i` as a string (numbers are formatted).
    fn arg_str(&self, i: usize) -> Option<String>;
    fn arg_num(&self, i: usize) -> Option<f64>;
    fn arg_rows(&self, i: usize) -> Option<&[Vec<String>]>;
    /// Explicit prop value, else the catalog default, as a string.
    fn prop_str(&self, name: &str) -> Option<String>;
    fn prop_num(&self, name: &str) -> Option<f64>;
    /// Explicit bool prop, else the catalog default (`"true"`), else false.
    fn prop_bool(&self, name: &str) -> bool;
    /// True only if the author set the prop (catalog defaults ignored).
    fn prop_set(&self, name: &str) -> bool;
}

#[allow(dead_code)]
fn fmt_value(v: &Value) -> Option<String> {
    match v {
        Value::Str(s) => Some(s.clone()),
        Value::Num(n) => Some(crate::html::num(*n)),
        Value::Bool(b) => Some(b.to_string()),
        _ => None,
    }
}

impl NodeExt for Node {
    fn arg_str(&self, i: usize) -> Option<String> {
        self.args.get(i).and_then(fmt_value)
    }
    fn arg_num(&self, i: usize) -> Option<f64> {
        match self.args.get(i)? {
            Value::Num(n) => Some(*n),
            Value::Str(s) => s.parse().ok(),
            _ => None,
        }
    }
    fn arg_rows(&self, i: usize) -> Option<&[Vec<String>]> {
        match self.args.get(i)? {
            Value::Rows(r) => Some(r),
            _ => None,
        }
    }
    fn prop_str(&self, name: &str) -> Option<String> {
        if let Some((_, v)) = self.props.iter().find(|(k, _)| *k == name) {
            return fmt_value(v);
        }
        self.spec
            .props
            .iter()
            .find(|p| p.name == name)
            .and_then(|p| p.default)
            .map(str::to_string)
    }
    fn prop_num(&self, name: &str) -> Option<f64> {
        self.prop_str(name).and_then(|s| s.parse().ok())
    }
    fn prop_bool(&self, name: &str) -> bool {
        self.prop_str(name).is_some_and(|s| s == "true")
    }
    fn prop_set(&self, name: &str) -> bool {
        self.props.iter().any(|(k, _)| *k == name)
    }
}
