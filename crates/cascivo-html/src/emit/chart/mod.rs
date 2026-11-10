//! Static SVG charts. Geometry follows `packages/charts` (margins, scales, ticks, curves) so the
//! output matches the React charts; chrome that needs JS (tooltips, legend toggles, zoom) is left out.

mod area;
mod bar;
mod gauge;
mod line;
mod pie;
mod scale;
mod scatter;
mod spark;

use std::fmt::Write as _;

use crate::ast::{Node, Value};
use crate::render::Cx;
use scale::{fmt_num, label_num, sane};

pub fn emit_chart(node: &Node, cx: &mut Cx, out: &mut String) {
    match node.spec.name {
        "bar" => bar::emit(node, cx, out),
        "line" => line::emit(node, cx, out),
        "area" => area::emit(node, cx, out),
        "pie" => pie::emit(node, cx, out),
        "scatter" => scatter::emit(node, cx, out),
        "spark" => spark::emit(node, cx, out),
        "gauge" => gauge::emit(node, cx, out),
        _ => {}
    }
}

pub(crate) fn esc(s: &str) -> String {
    let mut o = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => o.push_str("&amp;"),
            '<' => o.push_str("&lt;"),
            '>' => o.push_str("&gt;"),
            '"' => o.push_str("&quot;"),
            '\'' => o.push_str("&#39;"),
            c => o.push(c),
        }
    }
    o
}

pub(crate) fn color(i: usize) -> String {
    format!("var(--cascivo-chart-{})", i % 8 + 1)
}

// ---- node props -------------------------------------------------------------------------

fn prop<'a>(n: &'a Node, key: &str) -> Option<&'a Value> {
    n.props.iter().find(|(k, _)| *k == key).map(|(_, v)| v)
}

pub(crate) fn prop_num(n: &Node, key: &str) -> Option<f64> {
    match prop(n, key) {
        Some(Value::Num(v)) => Some(sane(*v)),
        _ => None,
    }
}

pub(crate) fn prop_bool(n: &Node, key: &str) -> Option<bool> {
    match prop(n, key) {
        Some(Value::Bool(b)) => Some(*b),
        _ => None,
    }
}

pub(crate) fn prop_str<'a>(n: &'a Node, key: &str) -> Option<&'a str> {
    match prop(n, key) {
        Some(Value::Str(s)) => Some(s),
        _ => None,
    }
}

/// A positive pixel size, or `None`.
pub(crate) fn prop_px(n: &Node, key: &str) -> Option<f64> {
    prop_num(n, key)
        .filter(|v| *v >= 1.0)
        .map(|v| v.min(4000.0))
}

pub(crate) fn prop_ticks(n: &Node, key: &str, default: usize) -> usize {
    prop_num(n, key).map_or(default, |v| v.clamp(1.0, 20.0) as usize)
}

// ---- data -------------------------------------------------------------------------------

pub(crate) struct Series {
    pub name: String,
    pub values: Vec<f64>,
}

pub(crate) struct Data {
    /// Category labels (bar/pie/scatter x) — empty for a bare number list.
    pub labels: Vec<String>,
    pub series: Vec<Series>,
}

impl Data {
    /// `Pairs` → one series with labels; `Nums` → one unlabeled series; `Rows` → header row of
    /// labels, then `name v1,v2,…` rows (the series name is everything before the last space of
    /// a row's first cell).
    pub fn from_node(n: &Node) -> Data {
        let single = |values: Vec<f64>, labels: Vec<String>| Data {
            labels,
            series: vec![Series {
                name: n.args.first().map_or(String::new(), |_| "Series".into()),
                values,
            }],
        };
        match n.args.first() {
            Some(Value::Pairs(p)) => single(
                p.iter().map(|(_, v)| sane(*v)).collect(),
                p.iter().map(|(l, _)| l.clone()).collect(),
            ),
            Some(Value::Nums(v)) => single(v.iter().map(|v| sane(*v)).collect(), Vec::new()),
            Some(Value::Rows(rows)) => {
                let labels = rows.first().cloned().unwrap_or_default();
                let series = rows
                    .iter()
                    .skip(1)
                    .enumerate()
                    .map(|(i, row)| {
                        let mut cells = row.iter();
                        let first = cells.next().map_or("", String::as_str);
                        let (name, v0) = first.rsplit_once(' ').unwrap_or(("", first));
                        let parse = |s: &str| sane(s.trim().parse::<f64>().unwrap_or(0.0));
                        let values = std::iter::once(parse(v0))
                            .chain(cells.map(|c| parse(c)))
                            .collect();
                        let name = if name.is_empty() {
                            format!("Series {}", i + 1)
                        } else {
                            name.to_string()
                        };
                        Series { name, values }
                    })
                    .collect();
                Data { labels, series }
            }
            Some(Value::Num(v)) => single(vec![sane(*v)], Vec::new()),
            _ => Data {
                labels: Vec::new(),
                series: Vec::new(),
            },
        }
    }

    pub fn len(&self) -> usize {
        self.series
            .iter()
            .map(|s| s.values.len())
            .max()
            .unwrap_or(0)
    }

    pub fn label(&self, i: usize) -> String {
        self.labels.get(i).cloned().unwrap_or_else(|| i.to_string())
    }

    pub fn all(&self) -> impl Iterator<Item = f64> + '_ {
        self.series.iter().flat_map(|s| s.values.iter().copied())
    }
}

// ---- frame ------------------------------------------------------------------------------

pub(crate) struct Frame<'a> {
    pub w: f64,
    pub h: f64,
    /// Emit `width="<w>"` instead of 100% (author gave a size, or the chart is inherently fixed).
    pub fixed: bool,
    pub title: &'a str,
    pub desc: Option<&'a str>,
}

/// Frame styles are inline: the only chart CSS shipped is the legend's.
const FRAME_STYLE: &str = "position:relative;inline-size:100%;min-inline-size:0";

pub(crate) fn open(out: &mut String, f: &Frame, wrap: bool) {
    if wrap {
        out.push_str("<div style=\"display:flex;flex-direction:column;gap:0.5rem\">");
    }
    let width = if f.fixed { fmt_num(f.w) } else { "100%".into() };
    let _ = write!(
        out,
        "<div style=\"{FRAME_STYLE}\"><svg role=\"img\" aria-label=\"{t}\" width=\"{width}\" viewBox=\"0 0 {w} {h}\" \
preserveAspectRatio=\"xMidYMid meet\" style=\"max-inline-size:100%;block-size:auto\"><title>{t}</title>",
        t = esc(f.title),
        w = fmt_num(f.w),
        h = fmt_num(f.h),
    );
    if let Some(d) = f.desc {
        let _ = write!(out, "<desc>{}</desc>", esc(d));
    }
}

/// Closes the frame; a `wrap`ped chart still owes its caller a `</div>` after the legend.
pub(crate) fn close(out: &mut String) {
    out.push_str("</svg></div>");
}

pub(crate) fn empty(out: &mut String, cx: &mut Cx) {
    cx.used.insert("empty-state");
    out.push_str(
        "<div data-size=\"md\" class=\"cv-empty-state-empty-state\"><h3 class=\"cv-empty-state-title\">No data</h3></div>",
    );
}

pub(crate) fn legend(out: &mut String, cx: &mut Cx, items: &[(String, String)]) {
    cx.used.insert("chart-legend");
    out.push_str(
        "<div class=\"cv-chart-legend-legend\" role=\"group\" aria-label=\"Chart legend\">",
    );
    for (name, c) in items {
        let _ = write!(
            out,
            "<span class=\"cv-chart-legend-item\"><span class=\"cv-chart-legend-swatch\" style=\"background:{c}\" aria-hidden=\"true\"></span>{}</span>",
            esc(name)
        );
    }
    out.push_str("</div>");
}

pub(crate) fn data_label(out: &mut String, x: f64, y: f64, text: &str, muted: bool, anchor: &str) {
    let fill = if muted { "background" } else { "foreground" };
    let _ = write!(
        out,
        "<text x=\"{}\" y=\"{}\" text-anchor=\"{anchor}\" font-size=\"0.6875rem\" font-weight=\"500\" fill=\"var(--cascivo-color-{fill})\" aria-hidden=\"true\" data-data-label=\"\" style=\"pointer-events:none\">{}</text>",
        fmt_num(x),
        fmt_num(y),
        esc(text)
    );
}

// ---- cartesian chrome -------------------------------------------------------------------

pub(crate) const AXIS_CHAR_PX: f64 = 6.5;

pub(crate) struct Margins {
    pub l: f64,
    pub t: f64,
    pub r: f64,
    pub b: f64,
}

fn chars(s: &str) -> f64 {
    s.chars().count() as f64
}

pub(crate) fn margins(left_labels: &[String], bottom_labels: &[String], plain: bool) -> Margins {
    if plain {
        return Margins {
            l: 2.0,
            t: 2.0,
            r: 2.0,
            b: 2.0,
        };
    }
    let widest = left_labels.iter().map(|s| chars(s)).fold(0.0, f64::max);
    let overhang = bottom_labels
        .last()
        .map_or(0.0, |s| (chars(s) * AXIS_CHAR_PX / 2.0 + 2.0).ceil());
    Margins {
        l: 36f64.max((widest * AXIS_CHAR_PX + 12.0).ceil()),
        t: 8.0,
        r: 8f64.max(overhang),
        b: 24.0,
    }
}

pub(crate) fn tick_labels(ticks: &[f64]) -> Vec<String> {
    ticks.iter().map(|v| label_num(*v)).collect()
}

/// Every Nth category label (plus the last) so a crowded band axis stays readable.
pub(crate) fn auto_stride(labels: &[String], axis_len: f64, vertical: bool) -> usize {
    if labels.len() <= 1 || axis_len <= 0.0 {
        return 1;
    }
    let band = axis_len / labels.len() as f64;
    let needed = if vertical {
        14.0
    } else {
        labels.iter().map(|s| chars(s)).fold(0.0, f64::max) * AXIS_CHAR_PX + 6.0
    };
    if band >= needed {
        1
    } else {
        (needed / band).ceil() as usize
    }
}

/// `(position along the axis, label)` for a band axis, honouring the label stride.
pub(crate) fn band_ticks(
    labels: &[String],
    band: &scale::Band,
    every: usize,
) -> Vec<(f64, String)> {
    let last = labels.len().saturating_sub(1);
    let pos = |i: usize| band.pos(i) + band.bandwidth / 2.0;
    let strided = every > 1;
    let penult = if strided { last / every * every } else { 0 };
    let widest = labels.iter().map(|s| chars(s)).fold(0.0, f64::max) * AXIS_CHAR_PX;
    let drop_penult = strided && penult != last && pos(last) - pos(penult) < widest;
    labels
        .iter()
        .enumerate()
        .filter(|(i, _)| {
            !strided || *i == last || (!(drop_penult && *i == penult) && i % every == 0)
        })
        .map(|(i, l)| (pos(i), l.clone()))
        .collect()
}

#[derive(Clone, Copy, PartialEq)]
pub(crate) enum Orient {
    X,
    Y,
}

const AXIS: &str = "stroke=\"var(--cascivo-chart-axis)\" stroke-width=\"1\"";

pub(crate) fn axis(
    out: &mut String,
    o: Orient,
    length: f64,
    ticks: &[(f64, String)],
    at: Option<(f64, f64)>,
) {
    let x = o == Orient::X;
    out.push_str("<g");
    if let Some((tx, ty)) = at {
        let _ = write!(
            out,
            " transform=\"translate({},{})\"",
            fmt_num(tx),
            fmt_num(ty)
        );
    }
    let (x2, y2) = if x { (length, 0.0) } else { (0.0, length) };
    let _ = write!(
        out,
        " aria-hidden=\"true\"><line x1=\"0\" y1=\"0\" x2=\"{}\" y2=\"{}\" {AXIS}/>",
        fmt_num(x2),
        fmt_num(y2)
    );
    for (pos, label) in ticks {
        let (tr, tick, lx, ly, anchor) = if x {
            (
                format!("{},0", fmt_num(*pos)),
                "x2=\"0\" y2=\"4\"",
                0,
                16,
                "middle",
            )
        } else {
            (
                format!("0,{}", fmt_num(*pos)),
                "x2=\"-4\" y2=\"0\"",
                -8,
                4,
                "end",
            )
        };
        let _ = write!(
            out,
            "<g transform=\"translate({tr})\"><line x1=\"0\" y1=\"0\" {tick} {AXIS}/><text x=\"{lx}\" y=\"{ly}\" text-anchor=\"{anchor}\" fill=\"var(--cascivo-chart-axis)\" font-size=\"11\">{}</text></g>",
            esc(label)
        );
    }
    out.push_str("</g>");
}

pub(crate) fn lin_ticks(s: &scale::Linear, count: usize) -> Vec<(f64, String)> {
    s.ticks(count)
        .into_iter()
        .map(|v| (s.map(v), label_num(v)))
        .collect()
}

/// Dashed grid lines at each tick of `s`. `horizontal` lines run along x (one per y tick).
pub(crate) fn grid(
    out: &mut String,
    s: &scale::Linear,
    count: usize,
    length: f64,
    horizontal: bool,
) {
    out.push_str("<g aria-hidden=\"true\">");
    for v in s.ticks(count) {
        let p = fmt_num(s.map(v));
        let l = fmt_num(length);
        let (x1, y1, x2, y2) = if horizontal {
            ("0", p.as_str(), l.as_str(), p.as_str())
        } else {
            (p.as_str(), "0", p.as_str(), l.as_str())
        };
        let _ = write!(
            out,
            "<line x1=\"{x1}\" y1=\"{y1}\" x2=\"{x2}\" y2=\"{y2}\" stroke=\"var(--cascivo-chart-grid)\" stroke-width=\"1\" stroke-dasharray=\"2 4\"/>"
        );
    }
    out.push_str("</g>");
}

/// Size, title, plain and legend flags shared by every chart.
pub(crate) struct Common<'a> {
    pub w: f64,
    pub h: f64,
    pub fixed: bool,
    pub plain: bool,
    pub title: String,
    pub desc: Option<&'a str>,
    pub legend: Option<bool>,
}

impl<'a> Common<'a> {
    pub fn new(n: &'a Node, default_title: &str) -> Self {
        let plain = prop_bool(n, "plain").unwrap_or(false);
        let w = prop_px(n, "width");
        Common {
            w: w.unwrap_or(400.0),
            h: prop_px(n, "height").unwrap_or(if plain { 48.0 } else { 300.0 }),
            fixed: w.is_some(),
            plain,
            title: prop_str(n, "title").unwrap_or(default_title).to_string(),
            desc: prop_str(n, "description"),
            legend: prop_bool(n, "legend"),
        }
    }

    pub fn frame(&self) -> Frame<'_> {
        Frame {
            w: self.w,
            h: self.h,
            fixed: self.fixed,
            title: &self.title,
            desc: self.desc,
        }
    }
}
