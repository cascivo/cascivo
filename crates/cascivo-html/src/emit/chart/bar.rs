use std::fmt::Write as _;

use super::scale::{Band, Linear, fmt_num, label_num};
use super::*;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    let data = Data::from_node(node);
    let n = data.len();
    if n == 0 {
        return empty(out, cx);
    }
    let c = Common::new(node, "Bar chart");
    let horizontal = prop_str(node, "orientation") == Some("horizontal");
    let mode = prop_str(node, "mode").unwrap_or("grouped");
    let percent = mode == "percent";
    let stacked = mode == "stacked" || percent;
    let cats: Vec<String> = (0..n).map(|i| data.label(i)).collect();
    let ns = data.series.len();

    // stack offsets [y0, y1] per series/category
    let mut totals = vec![0.0; n];
    let mut offsets: Vec<Vec<(f64, f64)>> = data
        .series
        .iter()
        .map(|s| {
            (0..n)
                .map(|i| {
                    let v = s.values.get(i).copied().unwrap_or(0.0);
                    let y0 = totals[i];
                    totals[i] += v;
                    (y0, totals[i])
                })
                .collect()
        })
        .collect();
    if percent {
        for per_series in &mut offsets {
            for (i, o) in per_series.iter_mut().enumerate() {
                let t = if totals[i] == 0.0 { 1.0 } else { totals[i] };
                *o = (o.0 / t, o.1 / t);
            }
        }
    }
    let y_min = if stacked {
        0.0
    } else {
        data.all().fold(0.0, f64::min)
    };
    let y_max = if percent {
        1.0
    } else if stacked {
        totals.iter().copied().fold(f64::MIN, f64::max)
    } else {
        data.all().fold(1.0, f64::max)
    };

    let val_ticks = prop_ticks(node, "valueAxisTicks", 5);
    let probe = Linear::new((y_min, y_max), (0.0, 1.0));
    let tick_text = |v: f64| {
        if percent {
            format!("{}%", (v * 100.0).round())
        } else {
            label_num(v)
        }
    };
    let val_labels: Vec<String> = probe.ticks(val_ticks).into_iter().map(tick_text).collect();
    let m = if horizontal {
        margins(&cats, &val_labels, c.plain)
    } else {
        margins(&val_labels, &cats, c.plain)
    };
    let (iw, ih) = ((c.w - m.l - m.r).max(0.0), (c.h - m.t - m.b).max(0.0));
    let cat_len = if horizontal { ih } else { iw };
    let band = Band::new(n, (0.0, cat_len), 0.2);
    let val = if horizontal {
        Linear::new((y_min, y_max), (0.0, iw))
    } else {
        Linear::new((y_min, y_max), (ih, 0.0))
    };
    let stride = prop_num(node, "categoryLabelEvery")
        .or_else(|| prop_num(node, "xLabelEvery"))
        .map_or_else(
            || auto_stride(&cats, cat_len, horizontal),
            |v| v.max(1.0) as usize,
        );

    let show_legend = !c.plain && c.legend.unwrap_or(ns > 1);
    let wrap = show_legend;
    open(out, &c.frame(), wrap);
    let _ = write!(
        out,
        "<g><g transform=\"translate({},{})\">",
        fmt_num(m.l),
        fmt_num(m.t)
    );
    if !c.plain {
        if horizontal {
            grid(out, &val, val_ticks, ih, false);
        } else {
            grid(out, &val, val_ticks, iw, true);
        }
    }
    let labels_on = !c.plain && prop_bool(node, "labels").unwrap_or(false);
    for (si, s) in data.series.iter().enumerate() {
        let sub = if stacked {
            band.bandwidth
        } else {
            band.bandwidth / ns as f64
        };
        for di in 0..n {
            let v = s.values.get(di).copied().unwrap_or(0.0);
            let (hi, lo) = if stacked {
                (offsets[si][di].1, offsets[si][di].0)
            } else {
                (v, 0.0)
            };
            let (a, b) = (val.map(hi), val.map(lo));
            let (start, len) = (a.min(b), (a - b).abs());
            let pos = band.pos(di) + if stacked { 0.0 } else { si as f64 * sub };
            let (x, y, w, h) = if horizontal {
                (start, pos, len, sub)
            } else {
                (pos, start, sub, len)
            };
            let _ = write!(
                out,
                "<g><rect x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\" fill=\"{}\" rx=\"2\" data-series=\"s{}\" data-x=\"{}\"/>",
                fmt_num(x),
                fmt_num(y),
                fmt_num(w),
                fmt_num(h),
                color(si),
                si + 1,
                esc(&cats[di])
            );
            if labels_on && !(stacked && len < 14.0) {
                let text = label_num(v);
                let center = pos + sub / 2.0;
                let inside = stacked || len < 18.0 || start < 14.0;
                if horizontal {
                    let end = start + len;
                    let (lx, anchor) = if inside {
                        (end - 4.0, "end")
                    } else {
                        (end + 4.0, "start")
                    };
                    data_label(out, lx, center + 4.0, &text, inside, anchor);
                } else {
                    data_label(
                        out,
                        center,
                        if inside { start + 13.0 } else { start - 4.0 },
                        &text,
                        inside,
                        "middle",
                    );
                }
            }
            out.push_str("</g>");
        }
    }
    if !c.plain {
        let cat_axis = band_ticks(&cats, &band, stride);
        if horizontal {
            axis(
                out,
                Orient::X,
                iw,
                &val.ticks(val_ticks)
                    .into_iter()
                    .map(|v| (val.map(v), tick_text(v)))
                    .collect::<Vec<_>>(),
                Some((0.0, ih)),
            );
            axis(out, Orient::Y, ih, &cat_axis, None);
        } else {
            axis(out, Orient::X, iw, &cat_axis, Some((0.0, ih)));
            axis(
                out,
                Orient::Y,
                ih,
                &val.ticks(val_ticks)
                    .into_iter()
                    .map(|v| (val.map(v), tick_text(v)))
                    .collect::<Vec<_>>(),
                None,
            );
        }
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
