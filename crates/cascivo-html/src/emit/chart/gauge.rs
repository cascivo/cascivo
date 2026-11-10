use std::f64::consts::PI;
use std::fmt::Write as _;

use super::scale::{arc_path, fmt_num, polar_point, sane, short};
use super::*;
use crate::ast::{Node, Value};
use crate::render::Cx;

pub fn emit(node: &Node, _cx: &mut Cx, out: &mut String) {
    let value = match node.args.first() {
        Some(Value::Num(v)) => sane(*v),
        _ => 0.0,
    };
    let c = Common::new(node, "Gauge");
    let h = prop_px(node, "height").unwrap_or(240.0);
    let (min, max) = (
        prop_num(node, "min").unwrap_or(0.0),
        prop_num(node, "max").unwrap_or(100.0),
    );
    let unit = prop_str(node, "unit").unwrap_or("");
    let sweep = prop_num(node, "sweep").unwrap_or(270.0).clamp(1.0, 360.0);
    let ticks = prop_ticks(node, "ticks", 5);

    let span = if max - min == 0.0 { 1.0 } else { max - min };
    let clamped = value.clamp(min.min(max), max.max(min));
    let frac = (clamped - min) / span;
    let sweep_rad = sweep * PI / 180.0;
    let start = -sweep_rad / 2.0;
    let angle = |v: f64| start + (v - min) / span * sweep_rad;

    let (cx0, cy0) = (c.w / 2.0, h / 2.0);
    let outer = (c.w.min(h) / 2.0 - if c.plain { 6.0 } else { 24.0 }).max(0.0);
    let band = (outer * 0.18).max(6.0);
    let inner = outer - band;
    let needle = inner - 4.0;

    let f = Frame {
        w: c.w,
        h,
        fixed: c.fixed,
        title: &c.title,
        desc: c.desc,
    };
    open(out, &f, false);
    let _ = write!(
        out,
        "<g><path d=\"{}\" fill=\"var(--cascivo-chart-grid)\" fill-opacity=\"0.25\" data-track=\"\"/><path d=\"{}\" fill=\"var(--cascivo-color-accent)\" data-zone=\"\"/>",
        arc_path(cx0, cy0, outer, inner, start, start + sweep_rad),
        arc_path(cx0, cy0, outer, inner, angle(min), angle(clamped)),
    );
    if !c.plain {
        for i in 0..=ticks {
            let tv = min + span * i as f64 / ticks as f64;
            let a = angle(tv);
            let (x1, y1) = polar_point(cx0, cy0, inner - 2.0, a);
            let (x2, y2) = polar_point(cx0, cy0, inner - 8.0, a);
            let (lx, ly) = polar_point(cx0, cy0, inner - 18.0, a);
            let _ = write!(
                out,
                "<g><line x1=\"{}\" y1=\"{}\" x2=\"{}\" y2=\"{}\" stroke=\"var(--cascivo-color-foreground-muted)\" stroke-width=\"1\" data-tick=\"\"/><text x=\"{}\" y=\"{}\" text-anchor=\"middle\" dominant-baseline=\"middle\" font-size=\"0.625rem\" fill=\"var(--cascivo-color-foreground-muted)\">{}</text></g>",
                fmt_num(x1),
                fmt_num(y1),
                fmt_num(x2),
                fmt_num(y2),
                fmt_num(lx),
                fmt_num(ly),
                fmt_num(tv.round())
            );
        }
    }
    let (nx, ny) = polar_point(cx0, cy0, needle, angle(clamped));
    let _ = write!(
        out,
        "<line x1=\"{}\" y1=\"{}\" x2=\"{}\" y2=\"{}\" stroke=\"var(--cascivo-color-foreground)\" stroke-width=\"2.5\" stroke-linecap=\"round\" data-needle=\"\" data-frac=\"{:.3}\"/>\
<circle cx=\"{}\" cy=\"{}\" r=\"{}\" fill=\"var(--cascivo-color-foreground)\"/>\
<text x=\"{}\" y=\"{}\" text-anchor=\"middle\" font-size=\"1.25rem\" font-weight=\"600\" fill=\"var(--cascivo-color-foreground)\" data-readout=\"\">{}{}</text></g>",
        fmt_num(cx0),
        fmt_num(cy0),
        fmt_num(nx),
        fmt_num(ny),
        frac,
        fmt_num(cx0),
        fmt_num(cy0),
        fmt_num((band * 0.25).max(3.0)),
        fmt_num(cx0),
        fmt_num(cy0 + outer * 0.5),
        short(value),
        esc(unit)
    );
    close(out);
}
