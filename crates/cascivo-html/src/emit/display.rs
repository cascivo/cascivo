//! Display emitters. Each mirrors the DOM of `packages/components/src/<unit>/<unit>.tsx`
//! (`kpi` mirrors `packages/charts/src/charts/kpi/kpi.tsx`) so the shared CSS applies unchanged.
//! Interactivity that needs JS (tag dismiss, image/avatar load-failure fallback, selection
//! changes) is not emitted; the markup is the server-rendered first paint.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::html::{attr, css_len, esc, flag, num, safe_url};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "heading" => heading(node, out),
        "text" => text(node, out),
        "prose" => prose(node, cx, out),
        "card" => card(node, cx, out),
        "stat" => stat(node, out),
        "kpi" => kpi(node, out),
        "badge" => badge(node, out),
        "tag" => tag(node, out),
        "avatar" => avatar_node(node, out),
        "avatar-group" => avatar_group(node, cx, out),
        "image" => image(node, out),
        "list" => list(node, cx, out),
        "data-list" => data_list(node, out),
        "structured-list" => structured_list(node, cx, out),
        "timeline" => timeline(node, out),
        "empty-state" => empty_state(node, out),
        "blockquote" => blockquote(node, out),
        "code" => simple_text(node, out, "code", "cv-code-code"),
        "kbd" => simple_text(node, out, "kbd", "cv-kbd-kbd"),
        "link" => link(node, out),
        "button" => button(node, cx, out),
        _ => emit_children(node, cx, out),
    }
}

fn raw_text(node: &Node) -> &str {
    node.text.as_deref().unwrap_or("")
}

fn prop_or(node: &Node, name: &str, fallback: &str) -> String {
    node.prop_str(name).unwrap_or_else(|| fallback.to_string())
}

/// `<tag class="cls">escaped</tag>`.
fn text_el(out: &mut String, tag: &str, class: &str, s: &str) {
    out.push('<');
    out.push_str(tag);
    attr(out, "class", class);
    out.push('>');
    esc(out, s);
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

/// A component with a `size` prop and a text child only: `<tag data-size class>text</tag>`.
fn simple_text(node: &Node, out: &mut String, tag: &str, class: &str) {
    out.push('<');
    out.push_str(tag);
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "class", class);
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn heading(node: &Node, out: &mut String) {
    let level = node
        .prop_num("level")
        .filter(|n| n.is_finite())
        .map_or(2, |n| n.round().clamp(1.0, 6.0) as u8);
    // The catalog default for `size` is prose ("derived from level"), so only an explicit
    // value counts; otherwise derive it exactly as the component does.
    let size = if node.prop_set("size") {
        prop_or(node, "size", "xl")
    } else {
        match level {
            1 => "2xl",
            2 => "xl",
            3 => "lg",
            4 => "md",
            _ => "sm",
        }
        .to_string()
    };
    out.push_str(&format!("<h{level}"));
    attr(out, "data-size", &size);
    attr(out, "class", "cv-heading-heading");
    out.push('>');
    esc(out, raw_text(node));
    out.push_str(&format!("</h{level}>"));
}

fn text(node: &Node, out: &mut String) {
    let tag = match node.prop_str("as").as_deref() {
        Some("span") => "span",
        Some("div") => "div",
        _ => "p",
    };
    out.push('<');
    out.push_str(tag);
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "data-weight", &prop_or(node, "weight", "normal"));
    if node.prop_bool("muted") {
        flag(out, "data-muted");
    }
    attr(out, "class", "cv-text-text");
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn prose(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    attr(out, "class", "cv-prose-prose");
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</div>");
}

/// `card "Title" [actions=…]` is Card > CardHeader(CardTitle) + CardContent(children). With
/// no title or actions the children sit directly in the Card, which pads itself (the
/// stylesheet zeroes the card padding only when a header/content child is present).
fn card(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    flag(out, "data-cascivo-card");
    attr(out, "data-variant", &prop_or(node, "variant", "default"));
    attr(out, "data-padding", &prop_or(node, "padding", "md"));
    if node.prop_bool("ai") {
        flag(out, "data-ai");
    }
    attr(out, "class", "cv-card-card");
    out.push('>');
    let title = node.arg_str(0).filter(|t| !t.is_empty());
    let actions = node.prop_str("actions");
    if title.is_some() || actions.is_some() {
        card_header(out, title.as_deref(), actions.as_deref());
        if !node.children.is_empty() {
            out.push_str("<div");
            attr(out, "class", "cv-card-content");
            out.push('>');
            emit_children(node, cx, out);
            out.push_str("</div>");
        }
    } else {
        emit_children(node, cx, out);
    }
    out.push_str("</div>");
}

fn card_header(out: &mut String, title: Option<&str>, actions: Option<&str>) {
    let title_html = |out: &mut String| {
        if let Some(t) = title {
            text_el(out, "h3", "cv-card-title", t);
        }
    };
    out.push_str("<div");
    match actions {
        None => {
            attr(out, "class", "cv-card-header");
            out.push('>');
            title_html(out);
        }
        Some(a) => {
            attr(out, "class", "cv-card-header cv-card-headerRow");
            out.push_str("><div");
            attr(out, "class", "cv-card-headerMain");
            out.push('>');
            title_html(out);
            out.push_str("</div><div");
            attr(out, "class", "cv-card-headerActions");
            out.push('>');
            esc(out, a);
            out.push_str("</div>");
        }
    }
    out.push_str("</div>");
}

fn sentiment(trend: &str, good: &str) -> &'static str {
    if trend == "flat" || good == "neutral" {
        "neutral"
    } else if trend == good {
        "good"
    } else {
        "bad"
    }
}

fn arrow(trend: &str) -> &'static str {
    match trend {
        "up" => "▲",
        "down" => "▼",
        _ => "–",
    }
}

/// `trend` unset: read the direction off the delta's sign, so `+12%` shows ▲ instead of a stray "–".
fn infer_trend(delta: &str) -> &'static str {
    match delta.trim_start().chars().next() {
        Some('+') => "up",
        Some('-' | '\u{2212}') if delta.chars().any(|c| matches!(c, '1'..='9')) => "down",
        _ => "flat",
    }
}

fn stat(node: &Node, out: &mut String) {
    let delta_arg = node.arg_str(2).filter(|d| !d.is_empty());
    let trend = if node.prop_set("trend") {
        prop_or(node, "trend", "flat")
    } else {
        infer_trend(delta_arg.as_deref().unwrap_or_default()).to_string()
    };
    let good = prop_or(node, "goodDirection", "up");
    out.push_str("<div");
    if node.prop_bool("card") {
        // React renders `data-card={true}` as the string "true".
        attr(out, "data-card", "true");
    }
    attr(out, "class", "cv-stat-stat");
    out.push('>');
    text_el(
        out,
        "span",
        "cv-stat-label",
        &node.arg_str(0).unwrap_or_default(),
    );
    text_el(
        out,
        "span",
        "cv-stat-value",
        &node.arg_str(1).unwrap_or_default(),
    );
    if let Some(delta) = delta_arg {
        out.push_str("<span");
        attr(out, "data-trend", &trend);
        attr(out, "data-sentiment", sentiment(&trend, &good));
        attr(out, "class", "cv-stat-delta");
        out.push_str("><span");
        attr(out, "aria-hidden", "true");
        attr(out, "class", "cv-stat-arrow");
        out.push('>');
        out.push_str(arrow(&trend));
        out.push_str("</span>");
        esc(out, &delta);
        out.push_str("</span>");
    }
    if let Some(h) = node.prop_str("helpText").filter(|h| !h.is_empty()) {
        text_el(out, "span", "cv-stat-help", &h);
    }
    out.push_str("</div>");
}

/// How a `kpi` delta string is shown. A numeric delta is formatted like `Kpi` does (sign,
/// locale grouping, optional `%`); anything else is shown verbatim.
struct KpiDelta {
    trend: &'static str,
    text: String,
}

/// `en` `toLocaleString`: grouped integer part, at most three fraction digits.
fn locale_num(n: f64) -> String {
    let s = format!("{:.3}", n.abs());
    let (int, frac) = s.split_once('.').unwrap_or((&s, ""));
    let mut grouped = String::new();
    for (i, c) in int.chars().enumerate() {
        if i > 0 && (int.len() - i) % 3 == 0 {
            grouped.push(',');
        }
        grouped.push(c);
    }
    let frac = frac.trim_end_matches('0');
    if !frac.is_empty() {
        grouped.push('.');
        grouped.push_str(frac);
    }
    if n < 0.0 && grouped != "0" {
        format!("-{grouped}")
    } else {
        grouped
    }
}

fn kpi_delta(raw: &str) -> KpiDelta {
    let raw = raw.trim();
    let (body, percent) = match raw.strip_suffix('%') {
        Some(b) => (b, true),
        None => (raw, false),
    };
    let numeric = body
        .chars()
        .next()
        .is_some_and(|c| c.is_ascii_digit() || matches!(c, '+' | '-' | '.'));
    if let Some(n) = body
        .parse::<f64>()
        .ok()
        .filter(|n| numeric && n.is_finite())
    {
        // -0 must read as 0: `delta >= 0` is true for it, so it takes a `+`.
        let n = if n == 0.0 { 0.0 } else { n };
        let sign = if n >= 0.0 { "+" } else { "" };
        let pct = if percent { "%" } else { "" };
        return KpiDelta {
            trend: if n >= 0.0 { "up" } else { "down" },
            text: format!("{sign}{}{pct}", locale_num(n)),
        };
    }
    KpiDelta {
        trend: if raw.starts_with('-') { "down" } else { "up" },
        text: raw.to_string(),
    }
}

fn kpi(node: &Node, out: &mut String) {
    out.push_str("<div");
    attr(out, "class", "cv-kpi-kpi");
    out.push_str("><div");
    attr(out, "class", "cv-kpi-head");
    out.push('>');
    text_el(
        out,
        "span",
        "cv-kpi-label",
        &node.arg_str(0).unwrap_or_default(),
    );
    if let Some(icon) = node.prop_str("icon").filter(|i| !i.is_empty()) {
        out.push_str("<span");
        attr(out, "aria-hidden", "true");
        out.push('>');
        esc(out, &icon);
        out.push_str("</span>");
    }
    out.push_str("</div><div");
    attr(out, "class", "cv-kpi-valueRow");
    out.push('>');
    text_el(
        out,
        "span",
        "cv-kpi-value",
        &node.arg_str(1).unwrap_or_default(),
    );
    if let Some(raw) = node.arg_str(2).filter(|d| !d.trim().is_empty()) {
        let d = kpi_delta(&raw);
        let good = prop_or(node, "goodDirection", "up");
        let label = node.prop_str("deltaLabel").filter(|l| !l.is_empty());
        let suffix = label
            .as_deref()
            .map(|l| format!(" {l}"))
            .unwrap_or_default();
        out.push_str("<span");
        attr(out, "role", "img");
        attr(out, "class", "cv-kpi-delta");
        attr(out, "data-trend", d.trend);
        attr(out, "data-sentiment", sentiment(d.trend, &good));
        attr(out, "aria-label", &format!("Trend: {}{suffix}", d.text));
        out.push('>');
        out.push_str(arrow(d.trend));
        out.push(' ');
        esc(out, &d.text);
        esc(out, &suffix);
        out.push_str("</span>");
    }
    out.push_str("</div></div>");
}

fn badge(node: &Node, out: &mut String) {
    // `Badge` resolves tone aliases: its "default" is the subtle look, "destructive" is the
    // canonical danger tone; the rest key the stylesheet directly.
    let variant = match prop_or(node, "variant", "default").as_str() {
        "default" => "secondary".to_string(),
        other => other.to_string(),
    };
    out.push_str("<span");
    attr(out, "data-variant", &variant);
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "class", "cv-badge-badge");
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</span>");
}

/// No dismiss button: it needs an `onDismiss` handler, which static HTML cannot carry.
fn tag(node: &Node, out: &mut String) {
    out.push_str("<span");
    attr(out, "data-variant", &prop_or(node, "variant", "default"));
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "class", "cv-tag-tag");
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</span>");
}

/// First character of `word` plus any combining marks that follow it, a cheap stand-in for
/// the first grapheme cluster.
fn first_grapheme(word: &str) -> String {
    let mut it = word.chars();
    let mut g = String::new();
    if let Some(c) = it.next() {
        g.push(c);
        for m in it {
            if ('\u{300}'..='\u{36f}').contains(&m) {
                g.push(m);
            } else {
                break;
            }
        }
    }
    g
}

fn initials_from(name: &str) -> Option<String> {
    let words: Vec<&str> = name.split_whitespace().collect();
    let first = first_grapheme(words.first()?);
    let last = if words.len() > 1 {
        words.last().map(|w| first_grapheme(w)).unwrap_or_default()
    } else {
        String::new()
    };
    let s = format!("{first}{last}").to_uppercase();
    (!s.is_empty()).then_some(s)
}

struct AvatarView<'a> {
    src: &'a str,
    alt: &'a str,
    name: &'a str,
    fallback: Option<&'a str>,
    size: &'a str,
    status: Option<&'a str>,
    class: &'a str,
    /// Replaces the computed `aria-label` (the +N chip passes its own).
    aria_label: Option<&'a str>,
}

fn avatar_view(out: &mut String, v: &AvatarView) {
    let show_image = !v.src.is_empty();
    let fallback_text = v
        .fallback
        .map(str::to_string)
        .or_else(|| initials_from(v.name));
    let label = [v.alt, v.name, v.fallback.unwrap_or("")]
        .into_iter()
        .find(|s| !s.is_empty())
        .unwrap_or("");
    out.push_str("<span");
    attr(out, "data-size", v.size);
    if let Some(s) = v.status {
        attr(out, "data-status", s);
    }
    attr(out, "class", v.class);
    // A nameless avatar stays decorative rather than an unlabeled image.
    if !show_image && !label.is_empty() {
        attr(out, "role", "img");
    }
    if let Some(l) = v.aria_label {
        attr(out, "aria-label", l);
    } else if !show_image && !label.is_empty() {
        attr(out, "aria-label", label);
    }
    out.push('>');
    if show_image {
        let alt = [v.alt, v.name].into_iter().find(|s| !s.is_empty());
        out.push_str("<img");
        attr(out, "class", "cv-avatar-image");
        if let Some(u) = safe_url(v.src, true) {
            attr(out, "src", &u);
        }
        attr(out, "alt", alt.unwrap_or(""));
        out.push('>');
    } else {
        out.push_str("<span");
        attr(out, "class", "cv-avatar-fallback");
        attr(out, "aria-hidden", "true");
        out.push('>');
        esc(out, fallback_text.as_deref().unwrap_or(""));
        out.push_str("</span>");
    }
    if v.status.is_some() {
        out.push_str("<span");
        attr(out, "class", "cv-avatar-status");
        attr(out, "aria-hidden", "true");
        out.push_str("></span>");
    }
    out.push_str("</span>");
}

fn avatar_node(node: &Node, out: &mut String) {
    let name = node.arg_str(0).unwrap_or_default();
    let src = node.prop_str("src").unwrap_or_default();
    let alt = node.prop_str("alt").unwrap_or_default();
    let fallback = node.prop_str("fallback");
    let size = prop_or(node, "size", "md");
    let status = node.prop_str("status");
    avatar_view(
        out,
        &AvatarView {
            src: &src,
            alt: &alt,
            name: &name,
            fallback: fallback.as_deref(),
            size: &size,
            status: status.as_deref(),
            class: "cv-avatar-avatar",
            aria_label: None,
        },
    );
}

fn avatar_group(node: &Node, cx: &mut Cx, out: &mut String) {
    let items = node.children.len();
    let max = node.prop_num("max").map(|m| m.max(0.0) as usize);
    let visible = max.map_or(items, |m| m.min(items));
    let count = node
        .prop_num("total")
        .map_or(items as i64, |t| (t.clamp(0.0, 1e9)) as i64);
    let overflow = count.saturating_sub(visible as i64);
    out.push_str("<div");
    attr(out, "role", "group");
    attr(out, "data-spacing", &prop_or(node, "spacing", "md"));
    if node.prop_bool("isGrid") {
        attr(out, "data-grid", "true");
    }
    attr(out, "class", "cv-avatar-group-group");
    out.push('>');
    for child in node.children.iter().take(visible) {
        super::emit(child, cx, out);
    }
    if overflow > 0 {
        avatar_view(
            out,
            &AvatarView {
                src: "",
                alt: "",
                name: "",
                fallback: Some(&format!("+{overflow}")),
                size: "md",
                status: None,
                class: "cv-avatar-avatar cv-avatar-group-overflow",
                aria_label: Some(&format!("{overflow} more")),
            },
        );
    }
    out.push_str("</div>");
}

/// A bare number is pixels (as in the catalog's prop docs); anything else is a CSS length.
fn length(v: &str) -> Option<String> {
    match v.trim().parse::<f64>() {
        Ok(n) if n.is_finite() => Some(format!("{}px", num(n))),
        _ => css_len(v),
    }
}

fn image(node: &Node, out: &mut String) {
    let src = node
        .arg_str(0)
        .and_then(|u| safe_url(&u, true))
        .unwrap_or_default();
    let alt = node.arg_str(1).unwrap_or_default();
    let mut style = Vec::new();
    if let Some(w) = node.prop_str("width") {
        if let Some(l) = length(&w) {
            style.push(format!("inline-size:{l}"));
        }
    }
    if let Some(h) = node.prop_str("height") {
        if let Some(l) = length(&h) {
            style.push(format!("block-size:{l}"));
        }
    }
    let style = style.join(";");
    // `fallbackSrc` only matters after a load error, which static HTML cannot observe.
    if node.prop_bool("removeWrapper") {
        out.push_str("<img");
        attr(out, "class", "cv-image-image");
        attr(out, "src", &src);
        attr(out, "alt", &alt);
        if !style.is_empty() {
            attr(out, "style", &style);
        }
        out.push('>');
        return;
    }
    out.push_str("<span");
    attr(out, "data-state", "loading");
    attr(out, "data-radius", &prop_or(node, "radius", "md"));
    if node.prop_bool("zoom") {
        attr(out, "data-zoom", "true");
    }
    if node.prop_bool("isBlurred") {
        attr(out, "data-blurred", "true");
    }
    attr(out, "class", "cv-image-wrapper");
    if !style.is_empty() {
        attr(out, "style", &style);
    }
    out.push_str("><span");
    attr(out, "class", "cv-image-placeholder");
    attr(out, "aria-hidden", "true");
    out.push_str("></span><img");
    attr(out, "class", "cv-image-image");
    attr(out, "src", &src);
    attr(out, "alt", &alt);
    out.push_str("></span>");
}

/// Each child node becomes a `ListItem` (`<li>`).
fn list(node: &Node, cx: &mut Cx, out: &mut String) {
    let tag = if node.prop_str("as").as_deref() == Some("ol") {
        "ol"
    } else {
        "ul"
    };
    // The catalog default for `marker` is prose; derive it from the element like the component.
    let marker = if node.prop_set("marker") {
        prop_or(node, "marker", "disc")
    } else if tag == "ol" {
        "decimal".to_string()
    } else {
        "disc".to_string()
    };
    out.push('<');
    out.push_str(tag);
    attr(out, "data-marker", &marker);
    attr(out, "class", "cv-list-list");
    out.push('>');
    for child in &node.children {
        out.push_str("<li");
        attr(out, "class", "cv-list-item");
        out.push('>');
        super::emit(child, cx, out);
        out.push_str("</li>");
    }
    out.push_str("</");
    out.push_str(tag);
    out.push('>');
}

fn cell(row: &[String], i: usize) -> &str {
    row.get(i).map_or("", String::as_str)
}

/// Cells from `i` on, rejoined: a value that itself contained a comma was split by the
/// rows syntax, so put it back.
fn rest_joined(row: &[String], i: usize) -> String {
    row.get(i..).unwrap_or_default().join(", ")
}

/// Each row is `label, value`; DataList's `items` form.
fn data_list(node: &Node, out: &mut String) {
    out.push_str("<dl");
    attr(
        out,
        "data-orientation",
        &prop_or(node, "orientation", "horizontal"),
    );
    attr(out, "data-size", &prop_or(node, "size", "md"));
    if node.prop_bool("dividers") {
        flag(out, "data-dividers");
    }
    attr(out, "class", "cv-data-list-list");
    out.push('>');
    for row in node.arg_rows(0).unwrap_or_default() {
        out.push_str("<div");
        attr(out, "class", "cv-data-list-row");
        out.push('>');
        text_el(out, "dt", "cv-data-list-term", cell(row, 0));
        text_el(out, "dd", "cv-data-list-detail", &rest_joined(row, 1));
        out.push_str("</div>");
    }
    out.push_str("</dl>");
}

/// First row = headers, the rest = items (same convention as `table`); an item's id is its
/// 0-based index among items.
fn structured_list(node: &Node, cx: &mut Cx, out: &mut String) {
    let rows = node.arg_rows(0).unwrap_or_default();
    let (headers, items) = match rows.split_first() {
        Some((h, rest)) => (Some(h.as_slice()), rest),
        None => (None, rows),
    };
    // Same precedence as the component: aria-label, then ariaLabel, then label.
    let aria = ["aria-label", "ariaLabel", "label"]
        .iter()
        .find_map(|k| node.prop_str(k));
    if node.prop_bool("selectable") {
        selectable_list(node, cx, out, headers, items, aria.as_deref());
        return;
    }
    out.push_str("<div");
    attr(out, "role", "table");
    if let Some(a) = &aria {
        attr(out, "aria-label", a);
    }
    attr(out, "class", "cv-structured-list-list");
    out.push('>');
    if let Some(h) = headers {
        out.push_str("<div");
        attr(out, "role", "row");
        attr(out, "class", "cv-structured-list-headerRow");
        out.push('>');
        for c in h {
            out.push_str("<div");
            attr(out, "role", "columnheader");
            attr(out, "class", "cv-structured-list-headerCell");
            out.push('>');
            esc(out, c);
            out.push_str("</div>");
        }
        out.push_str("</div>");
    }
    out.push_str("<div");
    attr(out, "role", "rowgroup");
    attr(out, "class", "cv-structured-list-body");
    out.push('>');
    for row in items {
        out.push_str("<div");
        attr(out, "role", "row");
        attr(out, "class", "cv-structured-list-row");
        out.push('>');
        for c in row {
            out.push_str("<div");
            attr(out, "role", "cell");
            attr(out, "class", "cv-structured-list-cell");
            out.push('>');
            esc(out, c);
            out.push_str("</div>");
        }
        out.push_str("</div>");
    }
    out.push_str("</div></div>");
}

/// Static first paint of the selectable list: the initially selected row is marked, but with
/// no JS the selection cannot change.
fn selectable_list(
    node: &Node,
    cx: &mut Cx,
    out: &mut String,
    headers: Option<&[String]>,
    items: &[Vec<String>],
    aria: Option<&str>,
) {
    let group_id = cx.id();
    // `value` wins over `defaultValue`; either may name an item by index or by first cell.
    let wanted = node
        .prop_str("value")
        .or_else(|| node.prop_str("defaultValue"))
        .unwrap_or_default();
    let selected = items
        .iter()
        .position(|r| cell(r, 0) == wanted)
        .or_else(|| wanted.parse::<usize>().ok().filter(|i| *i < items.len()));
    out.push_str("<div");
    attr(out, "role", "radiogroup");
    if let Some(a) = aria {
        attr(out, "aria-label", a);
    }
    attr(
        out,
        "class",
        "cv-structured-list-list cv-structured-list-selectable",
    );
    out.push('>');
    if let Some(h) = headers {
        out.push_str("<div");
        attr(out, "class", "cv-structured-list-headerRow");
        out.push_str("><div");
        attr(out, "class", "cv-structured-list-headerCell");
        attr(out, "aria-hidden", "true");
        out.push_str("></div>");
        for c in h {
            text_el(out, "div", "cv-structured-list-headerCell", c);
        }
        out.push_str("</div>");
    }
    out.push_str("<div");
    attr(out, "class", "cv-structured-list-body");
    out.push('>');
    for (i, row) in items.iter().enumerate() {
        let checked = selected == Some(i);
        let label_id = format!("{group_id}-{i}-label");
        out.push_str("<div");
        attr(out, "role", "radio");
        attr(out, "aria-checked", if checked { "true" } else { "false" });
        attr(out, "aria-labelledby", &label_id);
        if checked {
            attr(out, "data-selected", "true");
        }
        attr(out, "class", "cv-structured-list-row");
        // Roving focus: only the first row is in the tab order.
        attr(out, "tabindex", if i == 0 { "0" } else { "-1" });
        out.push_str("><div");
        attr(out, "class", "cv-structured-list-cell");
        attr(out, "aria-hidden", "true");
        out.push_str("><span");
        attr(out, "class", "cv-structured-list-indicator");
        out.push_str("></span></div><div");
        attr(out, "class", "cv-structured-list-cell");
        attr(out, "id", &label_id);
        out.push('>');
        esc(out, cell(row, 0));
        out.push_str("</div>");
        for c in row.iter().skip(1) {
            out.push_str("<div");
            attr(out, "role", "cell");
            attr(out, "class", "cv-structured-list-cell");
            out.push('>');
            esc(out, c);
            out.push_str("</div>");
        }
        out.push_str("</div>");
    }
    out.push_str("</div></div>");
}

/// Rows are `title, description, time, status, tone`; every cell after the title is optional.
fn timeline(node: &Node, out: &mut String) {
    out.push_str("<ol");
    attr(
        out,
        "data-orientation",
        &prop_or(node, "orientation", "vertical"),
    );
    attr(out, "class", "cv-timeline-list");
    out.push('>');
    for row in node.arg_rows(0).unwrap_or_default() {
        timeline_item(out, row);
    }
    out.push_str("</ol>");
}

fn timeline_item(out: &mut String, row: &[String]) {
    let status = match cell(row, 3) {
        "" | "pending" | "upcoming" => "pending",
        "current" => "active",
        other => other,
    };
    let status_attr = match status {
        "pending" => "upcoming",
        "active" => "current",
        "complete" => "complete",
        "error" => "error",
        _ => "upcoming",
    };
    let tone = match cell(row, 4) {
        "" => None,
        "default" => Some("neutral"),
        "error" | "destructive" => Some("danger"),
        t => Some(t),
    };
    out.push_str("<li");
    attr(out, "data-status", status_attr);
    if let Some(t) = tone {
        attr(out, "data-tone", t);
    }
    if status == "active" {
        attr(out, "aria-current", "step");
    }
    attr(out, "class", "cv-timeline-item");
    out.push_str("><span");
    attr(out, "class", "cv-timeline-marker");
    attr(out, "aria-hidden", "true");
    out.push('>');
    // A failed entry keeps a glyph so it survives without colour vision.
    if status == "error" {
        out.push('✕');
    }
    out.push_str("</span><div");
    attr(out, "class", "cv-timeline-content");
    out.push('>');
    text_el(out, "div", "cv-timeline-title", cell(row, 0));
    if !cell(row, 2).is_empty() {
        text_el(out, "time", "cv-timeline-time", cell(row, 2));
    }
    if !cell(row, 1).is_empty() {
        text_el(out, "div", "cv-timeline-description", cell(row, 1));
    }
    out.push_str("</div></li>");
}

fn empty_state(node: &Node, out: &mut String) {
    out.push_str("<div");
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "class", "cv-empty-state-empty-state");
    out.push('>');
    if let Some(icon) = node.prop_str("icon").filter(|i| !i.is_empty()) {
        out.push_str("<span");
        attr(out, "class", "cv-empty-state-icon");
        attr(out, "aria-hidden", "true");
        out.push('>');
        esc(out, &icon);
        out.push_str("</span>");
    }
    text_el(
        out,
        "h3",
        "cv-empty-state-title",
        &node.arg_str(0).unwrap_or_default(),
    );
    if let Some(d) = node.arg_str(1).filter(|d| !d.is_empty()) {
        text_el(out, "p", "cv-empty-state-description", &d);
    }
    if let Some(a) = node.prop_str("action").filter(|a| !a.is_empty()) {
        text_el(out, "div", "cv-empty-state-action", &a);
    }
    out.push_str("</div>");
}

fn blockquote(node: &Node, out: &mut String) {
    out.push_str("<blockquote");
    attr(out, "class", "cv-blockquote-blockquote");
    out.push('>');
    esc(out, raw_text(node));
    // The catalog default for `cite` is the literal "undefined"; only an explicit value counts.
    if let Some(c) = node.prop_str("cite").filter(|_| node.prop_set("cite")) {
        if !c.is_empty() {
            out.push_str("<footer");
            attr(out, "class", "cv-blockquote-footer");
            out.push_str("><cite>");
            esc(out, &c);
            out.push_str("</cite></footer>");
        }
    }
    out.push_str("</blockquote>");
}

fn link(node: &Node, out: &mut String) {
    out.push_str("<a");
    attr(out, "data-variant", &prop_or(node, "variant", "standalone"));
    attr(out, "data-size", &prop_or(node, "size", "md"));
    let external = node.prop_bool("external");
    if external {
        attr(out, "data-external", "true");
    }
    attr(out, "class", "cv-link-link");
    if external {
        attr(out, "target", "_blank");
        attr(out, "rel", "noreferrer");
    }
    let href = node.arg_str(0).and_then(|u| safe_url(&u, false));
    attr(out, "href", href.as_deref().unwrap_or("#"));
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</a>");
}

fn button(node: &Node, cx: &mut Cx, out: &mut String) {
    let loading = node.prop_bool("loading");
    out.push_str("<button");
    attr(out, "data-variant", &prop_or(node, "variant", "primary"));
    attr(out, "data-size", &prop_or(node, "size", "md"));
    attr(out, "data-state", if loading { "loading" } else { "idle" });
    if loading {
        attr(out, "aria-busy", "true");
    }
    attr(out, "class", "cv-button-button");
    // A loading button is disabled, like the component's `disabled || loading`.
    if node.prop_bool("disabled") || loading {
        flag(out, "disabled");
    }
    out.push('>');
    if loading {
        // The Spinner is a separate unit the button's own CSS unit list does not name.
        cx.used.insert("spinner");
        out.push_str("<span");
        attr(out, "role", "status");
        attr(out, "aria-label", "Loading");
        attr(out, "data-size", "sm");
        attr(out, "aria-hidden", "true");
        attr(out, "class", "cv-spinner-spinner");
        out.push_str("></span>");
    }
    out.push_str("<span");
    attr(out, "class", "cv-button-label");
    out.push('>');
    esc(out, raw_text(node));
    out.push_str("</span></button>");
}
