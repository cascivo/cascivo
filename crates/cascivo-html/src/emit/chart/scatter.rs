use std::fmt::Write as _;

use super::scale::{Linear, fmt_num};
use super::*;
use crate::ast::{Node, Value};
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    // `label:value` pairs are x:y points; a non-numeric label falls back to the point's index.
    let pts: Vec<(f64, f64)> = match node.args.first() {
        Some(Value::Pairs(p)) => p
            .iter()
            .enumerate()
            .map(|(i, (l, y))| (scale::sane(l.parse().unwrap_or(i as f64)), scale::sane(*y)))
            .collect(),
        _ => Vec::new(),
    };
    if pts.is_empty() {
        return empty(out, cx);
    }
    let c = Common::new(node, "Scatter chart");
    let (xt, yt) = (prop_ticks(node, "xTicks", 5), prop_ticks(node, "yTicks", 5));
    let fold = |f: fn(f64, f64) -> f64, init: f64, g: fn(&(f64, f64)) -> f64| {
        pts.iter().map(g).fold(init, f)
    };
    let (x_min, x_max) = (
        fold(f64::min, f64::MAX, |p| p.0),
        fold(f64::max, f64::MIN, |p| p.0),
    );
    let (y_min, y_max) = (
        fold(f64::min, 0.0, |p| p.1),
        fold(f64::max, f64::MIN, |p| p.1),
    );

    let left = tick_labels(&Linear::new((y_min, y_max), (0.0, 1.0)).ticks(yt));
    let bottom = tick_labels(&Linear::new((x_min, x_max), (0.0, 1.0)).ticks(xt));
    let m = margins(&left, &bottom, c.plain);
    let (iw, ih) = ((c.w - m.l - m.r).max(0.0), (c.h - m.t - m.b).max(0.0));
    let xs = Linear::new((x_min, x_max), (0.0, iw));
    let ys = Linear::new((y_min, y_max), (ih, 0.0));

    let show_legend = !c.plain && c.legend.unwrap_or(false);
    open(out, &c.frame(), show_legend);
    let _ = write!(
        out,
        "<g><g transform=\"translate({},{})\">",
        fmt_num(m.l),
        fmt_num(m.t)
    );
    if !c.plain {
        grid(out, &ys, yt, iw, true);
    }
    let col = color(0);
    out.push_str("<g data-series=\"s1\">");
    for (x, y) in &pts {
        let _ = write!(
            out,
            "<circle cx=\"{}\" cy=\"{}\" r=\"4\" fill=\"{col}\" fill-opacity=\"0.7\" stroke=\"{col}\" stroke-width=\"1\"/>",
            fmt_num(xs.map(*x)),
            fmt_num(ys.map(*y))
        );
    }
    out.push_str("</g>");
    if !c.plain {
        axis(out, Orient::X, iw, &lin_ticks(&xs, xt), Some((0.0, ih)));
        axis(out, Orient::Y, ih, &lin_ticks(&ys, yt), None);
    }
    out.push_str("</g></g>");
    close(out);
    if show_legend {
        legend(out, cx, &[("Series".to_string(), col)]);
        out.push_str("</div>");
    }
}
