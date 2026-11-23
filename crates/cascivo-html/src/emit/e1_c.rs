//! Emitters for icon-button, context-meter, progress, progress-indicator, radial-progress and
//! switcher. Each mirrors the SSR markup of `packages/components/src/<unit>/<unit>.tsx`.

use super::NodeExt;
use super::feedback::js_num;
use crate::ast::Node;
use crate::html::{attr, esc, flag, safe_url};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "icon-button" => icon_button(node, out),
        "context-meter" => context_meter(node, cx, out),
        "progress" => progress(node, out),
        "progress-indicator" => progress_indicator(node, out),
        "radial-progress" => radial_progress(node, cx, out),
        "switcher" => switcher(node, out),
        _ => {}
    }
}

fn explicit(node: &Node, name: &str) -> Option<String> {
    node.prop_set(name).then(|| node.prop_str(name)).flatten()
}

fn cell(row: &[String], i: usize) -> &str {
    row.get(i).map_or("", String::as_str)
}

fn pick(node: &Node, name: &str, default: &str) -> String {
    node.prop_str(name).unwrap_or_else(|| default.into())
}

// --------------------------------------------------------------- icon-button

fn icon_button(node: &Node, out: &mut String) {
    use crate::contract::icon_button as c;
    out.push_str("<button");
    attr(out, "type", "button");
    if let Some(l) = explicit(node, "label").or_else(|| explicit(node, "ariaLabel")) {
        attr(out, "aria-label", &l);
    }
    attr(out, "data-size", &pick(node, "size", "md"));
    attr(out, "data-variant", &pick(node, "variant", "ghost"));
    attr(out, "class", c::ROOT);
    if node.prop_bool("disabled") {
        flag(out, "disabled");
    }
    out.push('>');
    esc(out, node.text.as_deref().unwrap_or(""));
    out.push_str("</button>");
}

// ------------------------------------------------------------- context-meter

/// `Intl.NumberFormat('en')` default: grouped, at most three fraction digits.
fn fmt_plain(n: f64) -> String {
    if !n.is_finite() {
        return "0".into();
    }
    let s = format!("{:.3}", n.abs());
    let (int, frac) = s.split_once('.').unwrap_or((&s, ""));
    let mut grouped = String::new();
    for (i, ch) in int.chars().enumerate() {
        if i > 0 && (int.len() - i) % 3 == 0 {
            grouped.push(',');
        }
        grouped.push(ch);
    }
    let frac = frac.trim_end_matches('0');
    let sign = if n < 0.0 && (grouped != "0" || !frac.is_empty()) {
        "-"
    } else {
        ""
    };
    if frac.is_empty() {
        format!("{sign}{grouped}")
    } else {
        format!("{sign}{grouped}.{frac}")
    }
}

/// `notation: 'compact'` in English: 1.2K, 12K, 123K, 1M. Two significant digits below 100,
/// whole numbers above, and a rounding carry moves up a unit.
fn fmt_compact(n: f64) -> String {
    if !n.is_finite() {
        return "0".into();
    }
    const UNITS: [(f64, &str); 5] = [(1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K"), (1.0, "")];
    let a = n.abs();
    let mut i = UNITS
        .iter()
        .position(|(d, _)| a >= *d)
        .unwrap_or(UNITS.len() - 1);
    let (v, suf) = loop {
        let (div, suf) = UNITS[i];
        let x = a / div;
        let v = if x < 100.0 {
            (x * 10.0).round() / 10.0
        } else {
            x.round()
        };
        if v >= 1000.0 && i > 0 {
            i -= 1;
            continue;
        }
        break (v, suf);
    };
    let s = format!("{}{suf}", fmt_plain(v));
    if n < 0.0 { format!("-{s}") } else { s }
}

fn context_meter(node: &Node, cx: &mut Cx, out: &mut String) {
    use crate::contract::context_meter as c;
    let value = node.arg_num(0).filter(|v| v.is_finite()).unwrap_or(0.0);
    let max = node.arg_num(1).filter(|v| v.is_finite()).unwrap_or(0.0);
    let fraction = if max > 0.0 {
        (value / max).clamp(0.0, 1.0)
    } else {
        0.0
    };
    let level = if fraction >= 0.95 {
        c::Level::Full
    } else if fraction >= 0.8 {
        c::Level::High
    } else {
        c::Level::Normal
    };
    let percent = format!("{}%", fmt_plain((fraction * 100.0).round()));
    let name = pick(node, "label", "Context");
    let usage = format!(
        "{} of {} tokens used ({percent})",
        fmt_plain(value),
        fmt_plain(max)
    );
    out.push_str("<div");
    attr(out, "role", "meter");
    attr(out, "aria-label", &name);
    attr(out, "aria-valuenow", &js_num(value));
    attr(out, "aria-valuemin", "0");
    attr(out, "aria-valuemax", &js_num(max));
    attr(out, "aria-valuetext", &usage);
    attr(out, "data-level", level.as_str());
    attr(out, "class", c::ROOT);
    cx.style(out, &format!("--_fill:{}", js_num(fraction)));
    out.push_str("><div");
    attr(out, "class", c::HEADER);
    attr(out, "aria-hidden", "true");
    // The TSX reads `styles.label`, which the module does not define: the span carries no class.
    out.push_str("><span>");
    esc(out, &name);
    out.push_str("</span><span");
    attr(out, "class", c::VALUE);
    out.push('>');
    esc(
        out,
        &format!("{} / {}", fmt_compact(value), fmt_compact(max)),
    );
    out.push_str("</span></div><div");
    attr(out, "class", c::TRACK);
    attr(out, "aria-hidden", "true");
    out.push_str("><div");
    attr(out, "class", c::FILL);
    out.push_str("></div></div></div>");
}

// ------------------------------------------------------------------ progress

fn progress(node: &Node, out: &mut String) {
    use crate::contract::progress as c;
    let value = node.arg_num(0).filter(|v| v.is_finite());
    out.push_str("<progress");
    if let Some(l) = explicit(node, "aria-label")
        .or_else(|| explicit(node, "ariaLabel"))
        .or_else(|| explicit(node, "label"))
    {
        attr(out, "aria-label", &l);
    }
    attr(out, "class", c::ROOT);
    attr(out, "data-variant", &pick(node, "variant", "primary"));
    attr(out, "data-size", &pick(node, "size", "md"));
    let state = if value.is_none() {
        c::State::Indeterminate
    } else {
        c::State::Determinate
    };
    attr(out, "data-state", state.as_str());
    if let Some(v) = value {
        attr(out, "value", &js_num(v));
        attr(out, "max", "100");
    }
    if let Some(d) = explicit(node, "aria-describedby") {
        attr(out, "aria-describedby", &d);
    }
    out.push_str("></progress>");
}

// -------------------------------------------------------- progress-indicator

fn progress_indicator(node: &Node, out: &mut String) {
    use crate::contract::progress_indicator as c;
    let current = node.prop_num("currentIndex").unwrap_or(0.0);
    let orient = if node.prop_bool("vertical") {
        c::Orientation::Vertical
    } else {
        c::Orientation::Horizontal
    };
    out.push_str("<ol");
    attr(out, "class", c::ROOT);
    attr(out, "data-orientation", orient.as_str());
    out.push('>');
    for (i, row) in node.arg_rows(0).unwrap_or(&[]).iter().enumerate() {
        let idx = i as f64;
        let status = if idx < current {
            c::StepStatus::Complete
        } else if idx == current {
            c::StepStatus::Current
        } else {
            c::StepStatus::Incomplete
        };
        out.push_str("<li");
        attr(out, "class", c::STEP);
        attr(out, "data-status", status.as_str());
        if status == c::StepStatus::Current {
            attr(out, "aria-current", "step");
        }
        out.push_str("><span");
        attr(out, "class", c::MARKER);
        attr(out, "aria-hidden", "true");
        out.push('>');
        if status == c::StepStatus::Complete {
            out.push('\u{2713}');
        } else {
            out.push_str(&(i + 1).to_string());
        }
        out.push_str("</span><span");
        attr(out, "class", c::TEXT);
        out.push_str("><span");
        attr(out, "class", c::LABEL);
        out.push('>');
        esc(out, cell(row, 0));
        out.push_str("</span>");
        if !cell(row, 1).is_empty() {
            out.push_str("<span");
            attr(out, "class", c::DESCRIPTION);
            out.push('>');
            esc(out, cell(row, 1));
            out.push_str("</span>");
        }
        out.push_str("</span></li>");
    }
    out.push_str("</ol>");
}

// ------------------------------------------------------------ radial-progress

fn radial_progress(node: &Node, cx: &mut Cx, out: &mut String) {
    use crate::contract::radial_progress as c;
    let value = node.arg_num(0).filter(|v| v.is_finite()).unwrap_or(0.0);
    let clamped = value.clamp(0.0, 100.0);
    let id = cx.id();
    let aria = explicit(node, "ariaLabel")
        .or_else(|| explicit(node, "label"))
        .or_else(|| explicit(node, "aria-label"));
    out.push_str("<div");
    attr(out, "role", "progressbar");
    attr(out, "aria-valuenow", &js_num(clamped));
    attr(out, "aria-valuemin", "0");
    attr(out, "aria-valuemax", "100");
    if let Some(l) = &aria {
        attr(out, "aria-label", l);
    }
    if aria.as_deref().is_none_or(str::is_empty) {
        attr(out, "aria-labelledby", &id);
    }
    attr(out, "class", c::ROOT);
    attr(out, "data-size", &pick(node, "size", "md"));
    attr(out, "data-variant", &pick(node, "variant", "primary"));
    cx.style(
        out,
        &format!("--cascivo-radial-progress:{}", js_num(clamped)),
    );
    out.push_str("><span");
    attr(out, "id", &id);
    attr(out, "class", c::LABEL);
    out.push('>');
    match node.text.as_deref().filter(|t| !t.is_empty()) {
        Some(t) => esc(out, t),
        None => esc(out, &format!("{}%", js_num(clamped))),
    }
    out.push_str("</span></div>");
}

// ------------------------------------------------------------------ switcher

fn switcher(node: &Node, out: &mut String) {
    use crate::contract::switcher as c;
    let label =
        explicit(node, "ariaLabel").unwrap_or_else(|| pick(node, "label", "Switch application"));
    out.push_str("<ul");
    attr(out, "aria-label", &label);
    attr(out, "class", c::ROOT);
    out.push('>');
    for row in node.arg_rows(0).unwrap_or(&[]) {
        out.push_str("<li><a");
        if let Some(u) = safe_url(cell(row, 1), false) {
            attr(out, "href", &u);
        }
        if cell(row, 2) == "active" {
            attr(out, "aria-current", "page");
            attr(out, "data-state", c::ItemState::Active.as_str());
        }
        attr(out, "class", c::ITEM);
        out.push('>');
        esc(out, cell(row, 0));
        out.push_str("</a></li>");
    }
    out.push_str("</ul>");
}
