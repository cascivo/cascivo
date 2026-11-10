//! Feedback emitters. Each mirrors the DOM of `packages/components/src/<unit>/<unit>.tsx`
//! (`meter` mirrors `packages/charts/src/charts/meter/meter.tsx`) so the shared CSS applies
//! unchanged. No dismiss button: with no JS it would do nothing (an a11y trap), so `dismissible` is accepted but ignored.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::html::{attr, css_len, esc, flag};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "alert" => alert(node, out),
        "notification" => notification(node, out),
        "progress-bar" => progress_bar(node, out),
        "progress-circle" => progress_circle(node, out),
        "meter" => meter(node, out),
        "skeleton" => skeleton(node, out),
        "spinner" => spinner(node, out),
        _ => emit_children(node, cx, out),
    }
}

/// A number the way JS stringifies it (shortest round-trip, so values computed with the same
/// IEEE operations as the React component print identically). Non-finite becomes `0`.
fn js_num(n: f64) -> String {
    if !n.is_finite() || n == 0.0 {
        return "0".to_string();
    }
    let a = n.abs();
    if !(1e-6..1e21).contains(&a) {
        return format!("{n:e}").replace("e", if a >= 1.0 { "e+" } else { "e" });
    }
    format!("{n}")
}

fn finite(n: Option<f64>) -> Option<f64> {
    n.filter(|v| v.is_finite())
}

fn el(out: &mut String, tag: &str, class: &str, s: &str) {
    out.push('<');
    out.push_str(tag);
    attr(out, "class", class);
    out.push('>');
    esc(out, s);
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn non_empty(s: Option<String>) -> Option<String> {
    s.filter(|s| !s.is_empty())
}

fn icon_span(out: &mut String, class: &str, icon: &str) {
    out.push_str("<span");
    attr(out, "class", class);
    attr(out, "aria-hidden", "true");
    out.push('>');
    esc(out, icon);
    out.push_str("</span>");
}

fn alert(node: &Node, out: &mut String) {
    let variant = node.prop_str("variant").unwrap_or_else(|| "default".into());
    let role = if variant == "warning" || variant == "destructive" {
        "alert"
    } else {
        "status"
    };
    out.push_str("<div");
    attr(out, "role", role);
    attr(out, "data-variant", &variant);
    attr(out, "class", "cv-alert-alert");
    out.push('>');
    if let Some(icon) = non_empty(node.prop_str("icon")) {
        icon_span(out, "cv-alert-icon", &icon);
    }
    out.push_str("<div");
    attr(out, "class", "cv-alert-body");
    out.push('>');
    if let Some(t) = non_empty(node.arg_str(0)) {
        el(out, "div", "cv-alert-title", &t);
    }
    if let Some(t) = node.text.as_deref().filter(|t| !t.is_empty()) {
        el(out, "div", "cv-alert-content", t);
    }
    out.push_str("</div>");
    out.push_str("</div>");
}

fn variant_icon(out: &mut String, variant: &str) {
    out.push_str(
        r#"<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">"#,
    );
    let circle =
        r#"<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"></circle>"#;
    let path = |d: &str, round_join: bool| {
        let join = if round_join {
            r#" stroke-linejoin="round""#
        } else {
            ""
        };
        format!(
            r#"<path d="{d}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"{join}></path>"#
        )
    };
    match variant {
        "success" => {
            out.push_str(circle);
            out.push_str(&path("M6.5 10.5l2.5 2.5 4.5-5", true));
        }
        "warning" => {
            out.push_str(
                r#"<path d="M10 2.5L18.5 17H1.5L10 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>"#,
            );
            out.push_str(&path("M10 8v3.5M10 14h.01", false));
        }
        "error" => {
            out.push_str(circle);
            out.push_str(&path("M10 6v4.5M10 13.5h.01", false));
        }
        _ => {
            out.push_str(circle);
            out.push_str(&path("M10 9v5M10 6.5h.01", false));
        }
    }
    out.push_str("</svg>");
}

fn notification(node: &Node, out: &mut String) {
    let variant = node.prop_str("variant").unwrap_or_else(|| "info".into());
    let role = if variant == "warning" || variant == "error" {
        "alert"
    } else {
        "status"
    };
    out.push_str("<div");
    attr(out, "role", role);
    attr(out, "data-variant", &variant);
    // `Presence` marks its child open on the server render.
    attr(out, "data-state", "open");
    attr(out, "class", "cv-notification-notification");
    out.push_str("><span");
    attr(out, "class", "cv-notification-icon");
    attr(out, "aria-hidden", "true");
    out.push('>');
    match non_empty(node.prop_str("icon")) {
        Some(icon) => esc(out, &icon),
        None => variant_icon(out, &variant),
    }
    out.push_str("</span><div");
    attr(out, "class", "cv-notification-body");
    out.push('>');
    el(
        out,
        "div",
        "cv-notification-title",
        &node.arg_str(0).unwrap_or_default(),
    );
    // Trailing body text stands in for `description` when the prop is not set.
    let description = non_empty(node.prop_str("description"))
        .or_else(|| node.text.clone().filter(|t| !t.is_empty()));
    if let Some(d) = description {
        el(out, "div", "cv-notification-description", &d);
    }
    if let Some(a) = non_empty(node.prop_str("actions")) {
        el(out, "div", "cv-notification-actions", &a);
    }
    out.push_str("</div>");
    out.push_str("</div>");
}

/// `clamped` and `percent` as the progress components compute them.
fn clamp_percent(value: f64, max: f64) -> (f64, f64) {
    let clamped = value.max(0.0).min(max);
    let percent = if max > 0.0 {
        clamped / max * 100.0
    } else {
        0.0
    };
    (clamped, percent)
}

fn progress_bar(node: &Node, out: &mut String) {
    let value = finite(node.arg_num(0));
    let max = finite(node.prop_num("max")).unwrap_or(100.0);
    let (clamped, percent) = clamp_percent(value.unwrap_or(0.0), max);
    let label = non_empty(node.prop_str("label"));
    let status = node.prop_str("status").unwrap_or_else(|| "active".into());
    let label_id = label.as_ref().map(|l| {
        let mut id = String::from("cascade-progress-");
        let mut in_ws = false;
        for c in l.to_lowercase().chars() {
            if c.is_whitespace() {
                if !in_ws {
                    id.push('-');
                }
                in_ws = true;
            } else {
                in_ws = false;
                id.push(c);
            }
        }
        id
    });
    out.push_str("<div");
    attr(out, "data-status", &status);
    attr(
        out,
        "data-size",
        &node.prop_str("size").unwrap_or_else(|| "md".into()),
    );
    if value.is_none() {
        attr(out, "data-state", "indeterminate");
    }
    attr(out, "class", "cv-progress-bar-progress");
    out.push('>');
    if let (Some(l), Some(id)) = (&label, &label_id) {
        out.push_str("<span");
        attr(out, "id", id);
        attr(out, "class", "cv-progress-bar-label");
        out.push('>');
        esc(out, l);
        let glyph = match status.as_str() {
            "success" => Some("\u{2713}"),
            "error" => Some("\u{2715}"),
            _ => None,
        };
        if let Some(g) = glyph {
            out.push_str("<span");
            attr(out, "class", "cv-progress-bar-glyph");
            attr(out, "aria-hidden", "true");
            out.push('>');
            out.push_str(g);
            out.push_str("</span>");
        }
        out.push_str("</span>");
    }
    out.push_str("<div");
    attr(out, "role", "progressbar");
    attr(out, "aria-valuemin", "0");
    attr(out, "aria-valuemax", &js_num(max));
    if value.is_some() {
        attr(out, "aria-valuenow", &js_num(clamped));
    }
    if let Some(id) = &label_id {
        attr(out, "aria-labelledby", id);
    }
    attr(out, "class", "cv-progress-bar-track");
    out.push_str("><div");
    attr(out, "class", "cv-progress-bar-fill");
    if value.is_some() {
        attr(
            out,
            "style",
            &format!("--cascivo-progress-value:{}%", js_num(percent)),
        );
    }
    out.push_str("></div></div>");
    if let Some(h) = non_empty(node.prop_str("helperText")) {
        el(out, "span", "cv-progress-bar-helper", &h);
    }
    out.push_str("</div>");
}

fn progress_circle(node: &Node, out: &mut String) {
    const RADIUS: f64 = 20.0;
    let circumference = 2.0 * std::f64::consts::PI * RADIUS;
    let max = finite(node.prop_num("max")).unwrap_or(100.0);
    let (clamped, percent) = clamp_percent(finite(node.arg_num(0)).unwrap_or(0.0), max);
    let offset = circumference * (1.0 - percent / 100.0);
    out.push_str("<div");
    attr(out, "role", "progressbar");
    attr(out, "aria-valuemin", "0");
    attr(out, "aria-valuemax", &js_num(max));
    attr(out, "aria-valuenow", &js_num(clamped));
    if let Some(l) = non_empty(node.prop_str("ariaLabel")).or_else(|| node.prop_str("label")) {
        attr(out, "aria-label", &l);
    }
    attr(
        out,
        "data-size",
        &node.prop_str("size").unwrap_or_else(|| "md".into()),
    );
    attr(out, "class", "cv-progress-circle-progressCircle");
    out.push_str("><svg");
    attr(out, "viewBox", "0 0 48 48");
    attr(out, "aria-hidden", "true");
    attr(out, "class", "cv-progress-circle-svg");
    out.push_str("><circle");
    attr(out, "class", "cv-progress-circle-track");
    for (k, v) in [
        ("cx", "24"),
        ("cy", "24"),
        ("r", "20"),
        ("fill", "none"),
        ("stroke-width", "4"),
    ] {
        attr(out, k, v);
    }
    out.push_str("></circle><circle");
    attr(out, "class", "cv-progress-circle-fill");
    for (k, v) in [
        ("cx", "24"),
        ("cy", "24"),
        ("r", "20"),
        ("fill", "none"),
        ("stroke-width", "4"),
        ("stroke-linecap", "round"),
    ] {
        attr(out, k, v);
    }
    attr(out, "stroke-dasharray", &js_num(circumference));
    attr(out, "stroke-dashoffset", &js_num(offset));
    out.push_str("></circle></svg>");
    if node.prop_bool("showValue") {
        out.push_str("<span");
        attr(out, "class", "cv-progress-circle-value");
        out.push('>');
        out.push_str(&js_num(percent.round()));
        out.push_str("%</span>");
    }
    out.push_str("</div>");
}

/// Two-decimal rounding the chart engine applies to trig-derived coordinates.
fn quantize(n: f64) -> f64 {
    // JS `Math.round` rounds halves toward +inf, unlike `f64::round`.
    (n * 100.0 + 0.5).floor() / 100.0
}

/// Port of the charts engine `arcPath` for a sweep of at most half a turn (all a meter needs).
fn arc_path(cx: f64, cy: f64, outer: f64, inner: f64, start: f64, end: f64) -> String {
    let point = |r: f64, a: f64| (quantize(cx + r * a.sin()), quantize(cy - r * a.cos()));
    let large = i32::from(end - start > std::f64::consts::PI);
    let (o_r, i_r) = (js_num(quantize(outer)), js_num(quantize(inner)));
    let (ox0, oy0) = point(outer, start);
    let (ox1, oy1) = point(outer, end);
    let (ix0, iy0) = point(inner, end);
    let (ix1, iy1) = point(inner, start);
    if inner <= 0.0 {
        let [cx, cy, ox0, oy0, ox1, oy1] =
            [quantize(cx), quantize(cy), ox0, oy0, ox1, oy1].map(js_num);
        return format!("M{cx},{cy}L{ox0},{oy0}A{o_r},{o_r} 0 {large} 1 {ox1},{oy1}Z");
    }
    let [ox0, oy0, ox1, oy1, ix0, iy0, ix1, iy1] =
        [ox0, oy0, ox1, oy1, ix0, iy0, ix1, iy1].map(js_num);
    format!(
        "M{ox0},{oy0}A{o_r},{o_r} 0 {large} 1 {ox1},{oy1}L{ix0},{iy0}A{i_r},{i_r} 0 {large} 0 {ix1},{iy1}Z"
    )
}

fn meter(node: &Node, out: &mut String) {
    let value = finite(node.arg_num(0)).unwrap_or(0.0);
    let min = finite(node.prop_num("min")).unwrap_or(0.0);
    let max = finite(node.prop_num("max")).unwrap_or(100.0);
    let label = node.prop_str("label").unwrap_or_default();
    // The React component seeds its width at 200 until a ResizeObserver measures it.
    let width = finite(node.prop_num("width")).unwrap_or(200.0);
    let height = finite(node.prop_num("height"));
    let clamped = max.min(min.max(value));
    let ratio = if max > min {
        (clamped - min) / (max - min)
    } else {
        0.0
    };
    let color = "var(--cascivo-chart-1)";
    let gauge = node.prop_str("variant").as_deref() == Some("gauge");

    out.push_str("<div");
    attr(out, "class", "cv-meter-meter");
    attr(out, "aria-label", &label);
    attr(out, "role", "meter");
    attr(out, "aria-valuenow", &js_num(value));
    attr(out, "aria-valuemin", &js_num(min));
    attr(out, "aria-valuemax", &js_num(max));
    out.push_str("><svg");
    if gauge {
        let svg_h = height.unwrap_or(100.0);
        let cx = width / 2.0;
        let cy = svg_h * 0.9;
        let outer = cx.min(cy) - 4.0;
        let inner = outer * 0.65;
        let start = std::f64::consts::PI;
        let end = 2.0 * std::f64::consts::PI;
        attr(out, "class", "cv-meter-svg");
        attr(out, "width", &js_num(width));
        attr(out, "height", &js_num(svg_h));
        attr(
            out,
            "viewBox",
            &format!("0 0 {} {}", js_num(width), js_num(svg_h)),
        );
        attr(out, "aria-hidden", "true");
        out.push_str("><path");
        attr(out, "d", &arc_path(cx, cy, outer, inner, start, end));
        attr(out, "class", "cv-meter-track");
        out.push_str("></path>");
        if ratio > 0.0 {
            out.push_str("<path");
            attr(
                out,
                "d",
                &arc_path(
                    cx,
                    cy,
                    outer,
                    inner,
                    start,
                    start + ratio * std::f64::consts::PI,
                ),
            );
            attr(out, "fill", color);
            out.push_str("></path>");
        }
        out.push_str("</svg><div");
        attr(out, "class", "cv-meter-gaugeLabel");
        out.push('>');
        esc(out, &format!("{label}: {}", js_num(value)));
        out.push_str("</div></div>");
        return;
    }
    let bar_h = height.unwrap_or(12.0);
    let (w, h) = (js_num(width), js_num(bar_h));
    attr(out, "class", "cv-meter-svg cv-meter-bar");
    attr(out, "width", &w);
    attr(out, "height", &h);
    attr(out, "viewBox", &format!("0 0 {w} {h}"));
    attr(out, "aria-hidden", "true");
    out.push_str("><rect");
    for (k, v) in [("x", "0"), ("y", "0")] {
        attr(out, k, v);
    }
    attr(out, "width", &w);
    attr(out, "height", &h);
    attr(out, "class", "cv-meter-track");
    out.push_str("></rect><rect");
    for (k, v) in [("x", "0"), ("y", "0")] {
        attr(out, k, v);
    }
    attr(out, "width", &w);
    attr(out, "height", &h);
    attr(out, "fill", color);
    attr(out, "class", "cv-meter-fill");
    attr(
        out,
        "style",
        &format!("transform:scaleX({})", js_num(ratio)),
    );
    out.push_str("></rect></svg>");
    el(out, "div", "cv-meter-label", &label);
    out.push_str("</div>");
}

fn skeleton(node: &Node, out: &mut String) {
    let variant = node.prop_str("variant").unwrap_or_else(|| "text".into());
    out.push_str("<div");
    attr(out, "aria-hidden", "true");
    attr(out, "data-variant", &variant);
    if node.prop_bool("ai") {
        flag(out, "data-ai");
    }
    attr(out, "class", "cv-skeleton-skeleton");
    let mut style = Vec::new();
    for (prop, var) in [
        ("width", "--cascivo-skeleton-width"),
        ("height", "--cascivo-skeleton-height"),
    ] {
        if let Some(v) = node.prop_str(prop).and_then(|v| css_len(&v)) {
            style.push(format!("{var}:{v}"));
        }
    }
    if !style.is_empty() {
        attr(out, "style", &style.join(";"));
    }
    out.push('>');
    if variant == "text" {
        // Array.from({length}) truncates; the cap keeps a typo from emitting megabytes.
        let lines = finite(node.prop_num("lines"))
            .unwrap_or(1.0)
            .clamp(0.0, 1000.0) as usize;
        for _ in 0..lines {
            out.push_str("<span");
            attr(out, "class", "cv-skeleton-line");
            out.push_str("></span>");
        }
    }
    out.push_str("</div>");
}

fn spinner(node: &Node, out: &mut String) {
    let label = non_empty(node.prop_str("ariaLabel"))
        .or_else(|| node.prop_str("label"))
        .unwrap_or_else(|| "Loading".into());
    out.push_str("<span");
    attr(out, "role", "status");
    attr(out, "aria-label", &label);
    attr(
        out,
        "data-size",
        &node.prop_str("size").unwrap_or_else(|| "md".into()),
    );
    attr(out, "class", "cv-spinner-spinner");
    out.push_str("></span>");
}
