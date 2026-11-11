use std::fmt::Write as _;

use super::scale::{Curve, Linear, Pt, area_path, fmt_num, label_num, line_path};
use super::*;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    emit_xy(node, cx, out, false);
}

/// Shared by `line` and `area`: x is the value index, y the series values.
pub(super) fn emit_xy(node: &Node, cx: &mut Cx, out: &mut String, area: bool) {
    let data = Data::from_node(node);
    let n = data.len();
    if n == 0 {
        return empty(out, cx);
    }
    let c = Common::new(node, if area { "Area chart" } else { "Line chart" });
    let stacked = area && prop_bool(node, "stacked").unwrap_or(false);
    let ns = data.series.len();
    let curve = Curve::parse(prop_str(node, "curve"));
    let (x_ticks_n, y_ticks_n) = (prop_ticks(node, "xTicks", 5), prop_ticks(node, "yTicks", 5));

    let mut totals = vec![0.0; n];
    let offsets: Vec<Vec<(f64, f64)>> = data
        .series
        .iter()
        .map(|s| {
            (0..n)
                .map(|i| {
                    let y0 = totals[i];
                    totals[i] += s.values.get(i).copied().unwrap_or(0.0);
                    (y0, totals[i])
                })
                .collect()
        })
        .collect();
    let y_min = if stacked {
        0.0
    } else {
        data.all().fold(0.0, f64::min)
    };
    let y_max = if stacked {
        totals.iter().copied().fold(f64::MIN, f64::max)
    } else {
        data.all().fold(f64::MIN, f64::max)
    };
    let x_max = (n - 1) as f64;

    let y_probe = Linear::new((y_min, y_max), (0.0, 1.0));
    let left = tick_labels(&y_probe.ticks(y_ticks_n));
    // Numeric x axis, or one tick per label when the data carries category labels.
    let labelled = !data.labels.is_empty();
    let bottom: Vec<String> = if labelled {
        (0..n).map(|i| data.label(i)).collect()
    } else {
        tick_labels(&Linear::new((0.0, x_max), (0.0, 1.0)).ticks(x_ticks_n))
    };
    let m = margins(&left, &bottom, c.plain);
    let (iw, ih) = ((c.w - m.l - m.r).max(0.0), (c.h - m.t - m.b).max(0.0));
    let xs = Linear::new((0.0, x_max), (0.0, iw));
    let ys = Linear::new((y_min, y_max), (ih, 0.0));

    let show_legend = !c.plain && c.legend.unwrap_or(ns > 1);
    open(out, &c.frame(), show_legend);
    out.push_str("<g>");
    // A lone non-stacked area gets the gradient fill React defaults to.
    let gradient = area
        && match prop_str(node, "fill") {
            Some(f) => f == "gradient",
            None => ns == 1 && !stacked,
        };
    let prefix = if gradient { cx.id() } else { String::new() };
    if gradient {
        out.push_str("<defs>");
        for si in 0..ns {
            let col = color(si);
            let _ = write!(
                out,
                "<linearGradient id=\"{prefix}-grad-s{}\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0%\" stop-color=\"{col}\" stop-opacity=\"0.9\"/><stop offset=\"100%\" stop-color=\"{col}\" stop-opacity=\"0.1\"/></linearGradient>",
                si + 1
            );
        }
        out.push_str("</defs>");
    }
    let _ = write!(
        out,
        "<g transform=\"translate({},{})\">",
        fmt_num(m.l),
        fmt_num(m.t)
    );
    if !c.plain {
        grid(out, &ys, y_ticks_n, iw, true);
    }
    let labels_on = !c.plain && prop_bool(node, "labels").unwrap_or(false);
    for (si, s) in data.series.iter().enumerate() {
        let col = color(si);
        let top: Vec<Pt> = (0..n)
            .map(|i| {
                let v = if stacked {
                    offsets[si][i].1
                } else {
                    s.values.get(i).copied().unwrap_or(0.0)
                };
                (xs.map(i as f64), ys.map(v))
            })
            .collect();
        let line_d = line_path(&top, curve);
        let sid = si + 1;
        if area {
            let d = if stacked {
                let base: Vec<Pt> = (0..n)
                    .map(|i| (xs.map(i as f64), ys.map(offsets[si][i].0)))
                    .collect();
                let mut d = line_d.clone();
                let (first, last) = (base[0], base[n - 1]);
                let _ = write!(d, "L{},{}", fmt_num(last.0), fmt_num(last.1));
                for p in base.iter().rev() {
                    let _ = write!(d, "L{},{}", fmt_num(p.0), fmt_num(p.1));
                }
                let _ = write!(d, "L{},{}Z", fmt_num(first.0), fmt_num(first.1));
                d
            } else {
                area_path(&top, ys.map(0.0), curve)
            };
            let (fill, style) = if gradient {
                (format!("url(#{prefix}-grad-s{sid})"), String::new())
            } else {
                let opacity = if stacked || ns <= 1 {
                    "var(--cascivo-chart-fill-opacity, 0.25)"
                } else {
                    "var(--cascivo-chart-fill-opacity-overlap, 0.12)"
                };
                (col.clone(), format!(" style=\"fill-opacity:{opacity}\""))
            };
            let _ = write!(
                out,
                "<g data-series=\"s{sid}\"><path d=\"{d}\" fill=\"{fill}\"{style} stroke=\"none\"/><path d=\"{line_d}\" fill=\"none\" stroke=\"{col}\" stroke-width=\"2\"/>"
            );
        } else {
            let _ = write!(
                out,
                "<g><path d=\"{line_d}\" fill=\"none\" stroke=\"{col}\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" data-series=\"s{sid}\"/>"
            );
        }
        if labels_on {
            for (i, p) in top.iter().enumerate() {
                data_label(
                    out,
                    p.0,
                    p.1 - 8.0,
                    &label_num(s.values.get(i).copied().unwrap_or(0.0)),
                    false,
                    "middle",
                );
            }
        }
        out.push_str("</g>");
    }
    if !c.plain {
        let x_axis: Vec<(f64, String)> = if labelled {
            let every = auto_stride(&bottom, iw, false);
            (0..n)
                .filter(|i| every <= 1 || i % every == 0 || *i == n - 1)
                .map(|i| (xs.map(i as f64), data.label(i)))
                .collect()
        } else {
            lin_ticks(&xs, x_ticks_n)
        };
        axis(out, Orient::X, iw, &x_axis, Some((0.0, ih)));
        axis(out, Orient::Y, ih, &lin_ticks(&ys, y_ticks_n), None);
    }
    out.push_str("</g></g>");
    close(out);
    if show_legend {
        let items: Vec<_> = data
            .series
            .iter()
            .enumerate()
            .map(|(i, s)| (s.name.clone(), color(i)))
            .collect();
        legend(out, cx, &items);
        out.push_str("</div>");
    }
}
