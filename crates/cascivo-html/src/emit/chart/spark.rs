use std::fmt::Write as _;

use super::scale::{Curve, Linear, Pt, fmt_num, line_path};
use super::*;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    let data = Data::from_node(node);
    let Some(values) = data
        .series
        .first()
        .map(|s| &s.values)
        .filter(|v| !v.is_empty())
    else {
        return empty(out, cx);
    };
    let w = prop_px(node, "width").unwrap_or(120.0);
    let h = prop_px(node, "height").unwrap_or(32.0);
    let title = prop_str(node, "label")
        .or_else(|| prop_str(node, "ariaLabel"))
        .unwrap_or("Trend");
    // The value is written into a style-free attribute; keep it to a CSS color-ish token.
    let col = prop_str(node, "color")
        .filter(|c| {
            c.chars()
                .all(|ch| ch.is_ascii_alphanumeric() || "#-(), .%_".contains(ch))
        })
        .map_or_else(|| color(0), str::to_string);
    let pad = 2.0;
    let (lo, hi) = (
        values.iter().copied().fold(f64::MAX, f64::min),
        values.iter().copied().fold(f64::MIN, f64::max),
    );
    let xs = Linear::new((0.0, (values.len() - 1) as f64), (pad, w - pad));
    let ys = Linear::new((if lo == hi { lo - 1.0 } else { lo }, hi), (h - pad, pad));
    let pts: Vec<Pt> = values
        .iter()
        .enumerate()
        .map(|(i, v)| (xs.map(i as f64), ys.map(*v)))
        .collect();

    let f = Frame {
        w,
        h,
        fixed: true,
        title,
        desc: None,
    };
    open(out, &f, false);
    let _ = write!(
        out,
        "<path d=\"{}\" fill=\"none\" stroke=\"{col}\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
        line_path(&pts, Curve::Monotone)
    );
    if prop_bool(node, "endDot").unwrap_or(true) {
        let last = pts[pts.len() - 1];
        let _ = write!(
            out,
            "<circle cx=\"{}\" cy=\"{}\" r=\"2.5\" fill=\"{col}\"/>",
            fmt_num(last.0),
            fmt_num(last.1)
        );
    }
    close(out);
}
