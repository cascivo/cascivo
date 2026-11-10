use std::f64::consts::PI;
use std::fmt::Write as _;

use super::scale::{arc_path, fmt_num, label_num, polar_point};
use super::*;
use crate::ast::Node;
use crate::render::Cx;

pub fn emit(node: &Node, cx: &mut Cx, out: &mut String) {
    let data = Data::from_node(node);
    // Negative slices have no meaning in a pie; treat them as zero.
    let values: Vec<f64> = data
        .series
        .first()
        .map_or_else(Vec::new, |s| s.values.iter().map(|v| v.max(0.0)).collect());
    let total: f64 = values.iter().sum();
    if values.is_empty() || total <= 0.0 {
        return empty(out, cx);
    }
    let mut c = Common::new(node, "Pie chart");
    let size = prop_px(node, "size");
    if let Some(s) = size {
        c.w = prop_px(node, "width").unwrap_or(s);
        c.h = prop_px(node, "height").unwrap_or(s);
        c.fixed = true;
    }
    let donut = prop_bool(node, "donut").unwrap_or(false);
    let (cx0, cy0) = (c.w / 2.0, c.h / 2.0);
    let outer = (cx0.min(cy0) - 8.0).max(0.0);
    let raw_inner = prop_num(node, "innerRadius")
        .or_else(|| prop_num(node, "thickness").map(|t| outer - t))
        .unwrap_or(outer * 0.6);
    let inner = if donut {
        raw_inner.clamp(0.0, outer)
    } else {
        0.0
    };
    let show_legend = !c.plain && c.legend.unwrap_or(true);
    let labels_on = !c.plain && prop_bool(node, "labels").unwrap_or(false);

    open(out, &c.frame(), show_legend);
    out.push_str("<g>");
    let mut start = 0.0;
    for (i, v) in values.iter().enumerate() {
        let end = start + v / total * 2.0 * PI;
        let mid = (start + end) / 2.0;
        let _ = write!(
            out,
            "<g><path d=\"{}\" fill=\"{}\" stroke=\"var(--cascivo-color-surface)\" stroke-width=\"1\" data-series=\"{}\"/>",
            arc_path(cx0, cy0, outer, inner, start, end),
            color(i),
            i + 1
        );
        let pct = v / total * 100.0;
        if labels_on && pct >= 4.0 {
            let label_r = if inner > 0.0 {
                (inner + outer) / 2.0
            } else {
                outer * 0.6
            };
            let (lx, ly) = polar_point(cx0, cy0, label_r, mid);
            data_label(
                out,
                lx,
                ly + 4.0,
                &format!("{}%", pct.round()),
                true,
                "middle",
            );
        }
        out.push_str("</g>");
        start = end;
    }
    let (center_value, center_label) =
        (prop_str(node, "centerValue"), prop_str(node, "centerLabel"));
    if donut && (center_value.is_some() || center_label.is_some()) {
        out.push_str("<g data-center=\"\">");
        if let Some(v) = center_value {
            let y = if center_label.is_some() {
                cy0 - 8.0
            } else {
                cy0
            };
            let _ = write!(
                out,
                "<text x=\"{}\" y=\"{}\" text-anchor=\"middle\" dominant-baseline=\"central\" font-size=\"1.5rem\" font-weight=\"700\" fill=\"var(--cascivo-color-foreground)\">{}</text>",
                fmt_num(cx0),
                fmt_num(y),
                esc(v)
            );
        }
        if let Some(l) = center_label {
            let y = if center_value.is_some() {
                cy0 + 14.0
            } else {
                cy0
            };
            let _ = write!(
                out,
                "<text x=\"{}\" y=\"{}\" text-anchor=\"middle\" dominant-baseline=\"central\" font-size=\"0.8125rem\" fill=\"var(--cascivo-color-foreground-muted)\">{}</text>",
                fmt_num(cx0),
                fmt_num(y),
                esc(l)
            );
        }
        out.push_str("</g>");
    }
    out.push_str("</g>");
    close(out);
    if show_legend {
        let items: Vec<_> = values
            .iter()
            .enumerate()
            .map(|(i, v)| (format!("{} ({})", data.label(i), label_num(*v)), color(i)))
            .collect();
        legend(out, cx, &items);
        out.push_str("</div>");
    }
}
