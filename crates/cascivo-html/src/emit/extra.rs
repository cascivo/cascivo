//! Emitters for the six units that once needed a grammar or encoder first: indicator,
//! input-group, inline-citation, relative-time, qr-code and code-snippet. Each mirrors
//! `packages/components/src/<unit>/<unit>.tsx`. Anything live (hover timing, clock ticking,
//! clipboard) is not emitted: the markup is the first paint, and the copy button is opt-in.

use super::{NodeExt, emit_children};
use crate::ast::Node;
use crate::contract::{
    code_snippet, hover_card, indicator, inline_citation, input_group, qr_code, relative_time,
    visually_hidden,
};
use crate::html::{attr, esc, num, safe_url};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "indicator" => indicator(node, cx, out),
        "input-group" => input_group(node, cx, out),
        "inline-citation" => inline_citation(node, out),
        "relative-time" => relative_time(node, out),
        "qr-code" => qr_code(node, out),
        "code-snippet" => code_snippet(node, cx, out),
        _ => emit_children(node, cx, out),
    }
}

fn non_empty(v: Option<String>) -> Option<String> {
    v.filter(|s| !s.is_empty())
}

fn indicator(node: &Node, cx: &mut Cx, out: &mut String) {
    out.push_str("<div");
    attr(out, "class", indicator::ROOT);
    attr(
        out,
        "data-placement",
        &node
            .prop_str("placement")
            .unwrap_or_else(|| "top-end".into()),
    );
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("<div");
    attr(out, "class", indicator::OVERLAY);
    attr(out, "aria-hidden", "true");
    out.push('>');
    esc(out, &node.prop_str("overlay").unwrap_or_default());
    out.push_str("</div></div>");
}

fn input_group(node: &Node, cx: &mut Cx, out: &mut String) {
    let prefix = non_empty(node.prop_str("prefix"));
    let suffix = non_empty(node.prop_str("suffix"));
    out.push_str("<div");
    attr(out, "class", input_group::ROOT);
    if prefix.is_some() {
        attr(out, "data-has-prefix", "");
    }
    if suffix.is_some() {
        attr(out, "data-has-suffix", "");
    }
    out.push('>');
    let addon = |out: &mut String, pos: &str, text: &str| {
        out.push_str("<span");
        attr(out, "class", input_group::ADDON);
        attr(out, "data-position", pos);
        out.push('>');
        esc(out, text);
        out.push_str("</span>");
    };
    if let Some(p) = &prefix {
        addon(out, "prefix", p);
    }
    out.push_str("<span");
    attr(out, "class", input_group::INPUT_WRAP);
    out.push('>');
    emit_children(node, cx, out);
    out.push_str("</span>");
    if let Some(s) = &suffix {
        addon(out, "suffix", s);
    }
    out.push_str("</div>");
}

/// `new URL(url).href` for the http(s) URLs the card links; anything else stays unlinked.
fn source_href(url: &str) -> Option<String> {
    let href = safe_url(url, false)?;
    (href.starts_with("http://") || href.starts_with("https://")).then_some(href)
}

fn hostname(href: &str) -> &str {
    let rest = href.split_once("://").map_or(href, |(_, r)| r);
    let auth = rest.split(['/', '?', '#']).next().unwrap_or("");
    let host = auth.rsplit('@').next().unwrap_or(auth);
    host.rsplit_once(':')
        .filter(|(_, p)| p.bytes().all(|b| b.is_ascii_digit()))
        .map_or(host, |(h, _)| h)
}

fn inline_citation(node: &Node, out: &mut String) {
    let index = node.arg_num(0).unwrap_or(0.0);
    let index = num(index);
    let title = node.prop_str("title").unwrap_or_default();
    let href = node.prop_str("url").and_then(|u| source_href(&u));
    let name = format!("Source {index}: {title}");
    out.push_str("<sup");
    attr(out, "class", inline_citation::CITATION);
    out.push('>');
    let anchor = format!("--cascivo-popover-{}-{index}", "cv");
    out.push_str("<span");
    attr(out, "style", &format!("anchor-name:{anchor}"));
    attr(out, "class", hover_card::TRIGGER);
    out.push('>');
    let tag = if href.is_some() { "a" } else { "span" };
    out.push('<');
    out.push_str(tag);
    attr(out, "class", inline_citation::MARKER);
    if let Some(h) = &href {
        attr(out, "href", h);
    }
    out.push_str("><span");
    attr(out, "aria-hidden", "true");
    out.push('>');
    esc(out, &index);
    out.push_str("</span><span");
    attr(out, "class", visually_hidden::ROOT);
    out.push('>');
    esc(out, &name);
    out.push_str("</span></");
    out.push_str(tag);
    out.push_str("></span><div");
    attr(out, "popover", "auto");
    attr(out, "role", "complementary");
    attr(out, "data-state", "closed");
    attr(out, "style", &format!("position-anchor:{anchor}"));
    attr(
        out,
        "class",
        &format!("{} {}", hover_card::CONTENT, inline_citation::CARD),
    );
    out.push('>');
    let span = |out: &mut String, class: &str, text: &str| {
        out.push_str("<span");
        attr(out, "class", class);
        out.push('>');
        esc(out, text);
        out.push_str("</span>");
    };
    span(out, inline_citation::TITLE, &title);
    if let Some(h) = &href {
        span(out, inline_citation::HOST, hostname(h));
    }
    if let Some(d) = non_empty(node.prop_str("description")) {
        span(out, inline_citation::DESCRIPTION, &d);
    }
    out.push_str("</div></sup>");
}

// ---- relative-time ----

const SEC: i64 = 1000;
const MIN: i64 = 60 * SEC;
const HOUR: i64 = 60 * MIN;
const DAY: i64 = 24 * HOUR;
const WEEK: i64 = 7 * DAY;
const MONTH: i64 = 30 * DAY;
const YEAR: i64 = 365 * DAY;

/// Days since 1970-01-01 for a civil date (Howard Hinnant's algorithm).
fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * (if m > 2 { m - 3 } else { m + 9 }) + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

fn civil_from_days(z: i64) -> (i64, i64, i64) {
    let z = z + 719468;
    let era = z.div_euclid(146097);
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(m <= 2), m, d)
}

/// Epoch milliseconds from an ISO-8601 instant (`2026-11-25`, `…T12:00[:00[.sss]]`, `Z` or ±hh:mm)
/// or a plain number of milliseconds. Date-only and offset-less forms are UTC.
fn parse_instant(s: &str) -> Option<i64> {
    let s = s.trim();
    if let Ok(n) = s.parse::<i64>() {
        return Some(n);
    }
    let (date, time) = s.split_once(['T', ' ']).map_or((s, ""), |(d, t)| (d, t));
    let mut dp = date.split('-');
    let (y, m, d) = (
        dp.next()?.parse::<i64>().ok()?,
        dp.next()?.parse::<i64>().ok()?,
        dp.next()?.parse::<i64>().ok()?,
    );
    if dp.next().is_some() || !(1..=12).contains(&m) || !(1..=31).contains(&d) {
        return None;
    }
    let (clock, off) = if let Some(c) = time.strip_suffix('Z') {
        (c, 0)
    } else if let Some(i) = time.rfind(['+', '-']).filter(|&i| i >= 5) {
        let (c, o) = time.split_at(i);
        let sign = if o.starts_with('-') { -1 } else { 1 };
        let mut op = o[1..].split(':');
        let oh = op.next()?.parse::<i64>().ok()?;
        let om = op.next().map_or(Some(0), |v| v.parse::<i64>().ok())?;
        (c, sign * (oh * 60 + om) * MIN)
    } else {
        (time, 0)
    };
    let (mut h, mut mi, mut sec, mut ms) = (0, 0, 0, 0);
    if !clock.is_empty() {
        let mut cp = clock.split(':');
        h = cp.next()?.parse::<i64>().ok()?;
        mi = cp.next()?.parse::<i64>().ok()?;
        if let Some(sv) = cp.next() {
            let (whole, frac) = sv.split_once('.').unwrap_or((sv, ""));
            sec = whole.parse::<i64>().ok()?;
            let f = format!("{frac:0<3}");
            ms = f.get(..3)?.parse::<i64>().ok()?;
        }
    }
    Some(days_from_civil(y, m, d) * DAY + h * HOUR + mi * MIN + sec * SEC + ms - off)
}

/// JS `Math.round`: ties go toward +infinity.
fn js_round(x: f64) -> i64 {
    (x + 0.5).floor() as i64
}

/// Mirrors `selectUnit` plus `Intl.RelativeTimeFormat('en', {numeric: 'always'})`.
fn relative_phrase(delta: i64) -> String {
    let abs = delta.abs();
    let (div, unit) = if abs < MIN {
        (SEC, "second")
    } else if abs < HOUR {
        (MIN, "minute")
    } else if abs < DAY {
        (HOUR, "hour")
    } else if abs < WEEK {
        (DAY, "day")
    } else if abs < MONTH {
        (WEEK, "week")
    } else if abs < YEAR {
        (MONTH, "month")
    } else {
        (YEAR, "year")
    };
    let v = js_round(delta as f64 / div as f64);
    let n = v.abs();
    let label = if n == 1 {
        unit.to_string()
    } else {
        format!("{unit}s")
    };
    // `-0` formats as past in Intl; JS rounds a small negative delta to -0.
    if v < 0 || (v == 0 && delta < 0) {
        format!("{n} {label} ago")
    } else {
        format!("in {n} {label}")
    }
}

const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

/// `Intl.DateTimeFormat('en', {dateStyle:'long', timeStyle:'short'})` in UTC.
fn long_short(ms: i64) -> String {
    let (y, m, d) = civil_from_days(ms.div_euclid(DAY));
    let tod = ms.rem_euclid(DAY);
    let (h, mi) = (tod / HOUR, tod % HOUR / MIN);
    let h12 = if h % 12 == 0 { 12 } else { h % 12 };
    let ap = if h < 12 { "AM" } else { "PM" };
    format!(
        "{} {d}, {y} at {h12}:{mi:02}\u{202f}{ap}",
        MONTHS[(m - 1) as usize]
    )
}

fn iso(ms: i64) -> String {
    let (y, m, d) = civil_from_days(ms.div_euclid(DAY));
    let tod = ms.rem_euclid(DAY);
    format!(
        "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}.{:03}Z",
        tod / HOUR,
        tod % HOUR / MIN,
        tod % MIN / SEC,
        tod % SEC
    )
}

fn relative_time(node: &Node, out: &mut String) {
    let Some(target) = node.arg_str(0).and_then(|s| parse_instant(&s)) else {
        return;
    };
    // A static page has one fixed "now": the build clock unless the author pins `now`.
    let now = node.prop_num("now").map(|n| n as i64).unwrap_or_else(|| {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as i64)
    });
    out.push_str("<time");
    attr(out, "dateTime", &iso(target));
    attr(
        out,
        "title",
        &node.prop_str("title").unwrap_or_else(|| long_short(target)),
    );
    attr(out, "class", relative_time::ROOT);
    out.push('>');
    esc(out, &relative_phrase(target - now));
    out.push_str("</time>");
}

// ---- qr-code ----

fn qr_code(node: &Node, out: &mut String) {
    let value = node.arg_str(0).unwrap_or_default();
    if value.is_empty() {
        return;
    }
    let ec = node
        .prop_str("errorCorrection")
        .and_then(|s| s.chars().next())
        .unwrap_or('M');
    let matrix = crate::qr::encode(&value, ec);
    const QUIET: usize = 4;
    let dim = matrix.len() + QUIET * 2;
    let mut path = String::new();
    for (y, row) in matrix.iter().enumerate() {
        for (x, on) in row.iter().enumerate() {
            if *on {
                path.push_str(&format!("M{},{}h1v1h-1z", x + QUIET, y + QUIET));
            }
        }
    }
    let size = node.prop_num("size").unwrap_or(128.0);
    let mut style = format!("inline-size:{}px;block-size:{}px", num(size), num(size));
    if let Some(r) = node
        .prop_str("radius")
        .and_then(|r| crate::html::css_len(&r))
    {
        style.push_str(&format!(";border-radius:{r}"));
    }
    let label = node
        .prop_str("ariaLabel")
        .or_else(|| node.prop_str("label"))
        .unwrap_or_else(|| "QR code".into());
    let fill = node
        .prop_str("fill")
        .unwrap_or_else(|| "currentColor".into());
    let bg = node
        .prop_str("background")
        .unwrap_or_else(|| "transparent".into());
    out.push_str("<div");
    attr(out, "class", qr_code::ROOT);
    attr(out, "style", &style);
    out.push_str("><svg");
    attr(out, "class", qr_code::SVG);
    attr(out, "role", "img");
    attr(out, "aria-label", &label);
    attr(out, "viewBox", &format!("0 0 {dim} {dim}"));
    attr(out, "shape-rendering", "crispEdges");
    out.push_str("><rect");
    attr(out, "width", &dim.to_string());
    attr(out, "height", &dim.to_string());
    attr(out, "fill", &bg);
    out.push_str("></rect><path");
    attr(out, "d", &path);
    attr(out, "fill", &fill);
    out.push_str("></path></svg></div>");
}

// ---- code-snippet ----

fn copy_icon() -> String {
    format!(
        "<svg aria-hidden=\"true\" viewBox=\"0 0 16 16\" class=\"{}\">{COPY_PATHS}",
        code_snippet::ICON
    )
}
const COPY_PATHS: &str = "<rect x=\"5.5\" y=\"5.5\" width=\"8\" height=\"8\" rx=\"1.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"></rect><path d=\"M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path></svg>";

fn copy_button(out: &mut String, cx: &mut Cx) {
    cx.scripts.insert("copy-btn");
    out.push_str("<button type=\"button\"");
    attr(out, "aria-label", "Copy");
    attr(out, "data-state", "idle");
    attr(out, "data-copy-btn", "");
    attr(out, "class", code_snippet::COPY);
    out.push('>');
    out.push_str(&copy_icon());
    out.push_str("</button>");
}

fn code_snippet(node: &Node, cx: &mut Cx, out: &mut String) {
    let source = node.text.clone().unwrap_or_default();
    let variant = node.prop_str("variant").unwrap_or_else(|| "single".into());
    // The button needs JS, so unlike React it is opt-in: a static page carries no dead control.
    let copy = node.prop_bool("showCopyButton");
    if variant == "inline" {
        out.push_str("<span");
        attr(out, "class", code_snippet::ROOT);
        attr(out, "data-variant", "inline");
        out.push_str("><code");
        attr(out, "class", code_snippet::INLINE_CODE);
        out.push('>');
        esc(out, &source);
        out.push_str("</code>");
        if copy {
            copy_button(out, cx);
        }
        out.push_str("</span>");
        return;
    }
    let language = non_empty(node.prop_str("language"));
    let terminal = node.prop_bool("terminal");
    out.push_str("<div");
    attr(out, "class", code_snippet::ROOT);
    attr(out, "data-variant", &variant);
    if terminal {
        attr(out, "data-terminal", "");
    }
    out.push('>');
    if terminal {
        out.push_str("<div");
        attr(out, "class", code_snippet::BAR);
        attr(out, "aria-hidden", "true");
        out.push_str("><span");
        attr(out, "class", code_snippet::DOTS);
        out.push('>');
        for _ in 0..3 {
            out.push_str("<span");
            attr(out, "class", code_snippet::DOT);
            out.push_str("></span>");
        }
        out.push_str("</span>");
        if let Some(t) = non_empty(node.prop_str("title")) {
            out.push_str("<span");
            attr(out, "class", code_snippet::TITLE);
            out.push('>');
            esc(out, &t);
            out.push_str("</span>");
        }
        out.push_str("</div>");
    }
    out.push_str("<pre");
    attr(out, "class", code_snippet::PRE);
    out.push_str("><code");
    attr(out, "class", code_snippet::CODE);
    out.push('>');
    if let Some(lang) = &language {
        for (tok, text) in crate::highlight::tokenize(&source, lang) {
            out.push_str("<span");
            if let Some(t) = tok {
                attr(out, "data-tok", t);
            }
            out.push('>');
            esc(out, &text);
            out.push_str("</span>");
        }
    } else if variant == "multi" && node.prop_bool("showLineNumbers") {
        for (i, line) in source.split('\n').enumerate() {
            out.push_str("<span");
            attr(out, "class", code_snippet::LINE);
            out.push_str("><span");
            attr(out, "aria-hidden", "true");
            attr(out, "class", code_snippet::LINE_NUMBER);
            out.push('>');
            out.push_str(&(i + 1).to_string());
            out.push_str("</span><span");
            attr(out, "class", code_snippet::LINE_TEXT);
            out.push('>');
            esc(out, line);
            out.push_str("</span></span>");
        }
    } else {
        esc(out, &source);
    }
    out.push_str("</code></pre>");
    if copy {
        copy_button(out, cx);
    }
    out.push_str("</div>");
}
