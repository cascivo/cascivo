//! Scales, tick selection, path builders and number formatting.
//!
//! Ported from `packages/charts/src/engine/{scale,shape,polar}.ts` so the geometry matches
//! the React charts. Every number that reaches the output goes through [`fmt_num`] and every
//! input is clamped by [`sane`], so no `NaN`/`inf` can leak into an SVG attribute.

use std::f64::consts::PI;
use std::fmt::Write as _;

/// Largest magnitude we accept; keeps every product in the scales finite.
const LIMIT: f64 = 1e15;

/// Clamps data into a range where all later arithmetic stays finite.
pub fn sane(v: f64) -> f64 {
    if v.is_nan() {
        0.0
    } else {
        v.clamp(-LIMIT, LIMIT)
    }
}

/// SVG number: 2 decimals, trailing zeros trimmed, `-0` → `0`, non-finite → `0`.
pub fn fmt_num(v: f64) -> String {
    if !v.is_finite() {
        return "0".into();
    }
    let s = format!("{v:.2}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() || s == "-0" {
        "0".into()
    } else {
        s.into()
    }
}

/// Mirrors JS `Number.prototype.toLocaleString()` for en-US: grouped, at most 3 decimals.
pub fn label_num(v: f64) -> String {
    let v = if v.is_finite() { v } else { 0.0 };
    let s = format!("{:.3}", v.abs());
    let s = s.trim_end_matches('0').trim_end_matches('.');
    let (int, frac) = s.split_once('.').map_or((s, ""), |(i, f)| (i, f));
    let mut out = String::new();
    if v < 0.0 && (int != "0" || !frac.is_empty()) {
        out.push('-');
    }
    for (i, c) in int.chars().enumerate() {
        if i > 0 && (int.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(c);
    }
    if !frac.is_empty() {
        out.push('.');
        out.push_str(frac);
    }
    out
}

/// Shortest decimal form, like JS `String(number)` for the values we allow.
pub fn short(v: f64) -> String {
    let v = if v.is_finite() { v } else { 0.0 };
    format!("{v}")
}

#[derive(Clone, Copy, Debug)]
pub struct Linear {
    pub d0: f64,
    pub d1: f64,
    pub r0: f64,
    pub r1: f64,
}

impl Linear {
    pub fn new(domain: (f64, f64), range: (f64, f64)) -> Self {
        Self {
            d0: domain.0,
            d1: domain.1,
            r0: range.0,
            r1: range.1,
        }
    }

    pub fn map(&self, v: f64) -> f64 {
        let span = self.d1 - self.d0;
        if span == 0.0 {
            self.r0
        } else {
            self.r0 + (v - self.d0) / span * (self.r1 - self.r0)
        }
    }

    pub fn ticks(&self, count: usize) -> Vec<f64> {
        nice_ticks(self.d0, self.d1, count)
    }
}

/// Nice-number ticks: steps are 1, 2, 2.5 or 5 × 10^k; whole-number domains get whole-number steps.
pub fn nice_ticks(min: f64, max: f64, count: usize) -> Vec<f64> {
    if !min.is_finite() || !max.is_finite() || min == max {
        return vec![if min.is_finite() { min } else { 0.0 }];
    }
    let (min, max) = if min > max { (max, min) } else { (min, max) };
    let decimals = !(min.fract() == 0.0 && max.fract() == 0.0);
    let raw = (max - min) / count.max(1) as f64;
    let mag = 10f64.powf(raw.log10().floor());
    let mantissa = raw / mag;
    let cands: &[f64] = if decimals {
        &[1.0, 2.0, 2.5, 5.0, 10.0]
    } else {
        &[1.0, 2.0, 5.0, 10.0]
    };
    let mut step = cands
        .iter()
        .copied()
        .find(|c| *c >= mantissa)
        .unwrap_or(10.0)
        * mag;
    if !decimals {
        step = step.round().max(1.0);
    }
    if !step.is_finite() || step <= 0.0 {
        return vec![min];
    }
    let start = (min / step).ceil() as i64;
    let end = (max / step + 1e-9).floor() as i64;
    let precision = ((-step.log10()).ceil() + 2.0).clamp(0.0, 15.0) as usize;
    // Bounded: a pathological step must not allocate an enormous tick list.
    (start..=end.min(start.saturating_add(200)))
        .map(|i| {
            format!("{:.*}", precision, i as f64 * step)
                .parse()
                .unwrap_or(0.0)
        })
        .collect()
}

/// Band scale over `n` categories; `pos(i)` is the band start, `bandwidth` its width.
#[derive(Clone, Copy, Debug)]
pub struct Band {
    pub r0: f64,
    pub bandwidth: f64,
    offset: f64,
}

impl Band {
    pub fn new(n: usize, range: (f64, f64), padding: f64) -> Self {
        let step = (range.1 - range.0) / (n as f64 + padding * (n as f64 + 1.0)).max(1.0);
        Self {
            r0: range.0,
            bandwidth: step,
            offset: step * padding,
        }
    }

    pub fn pos(&self, i: usize) -> f64 {
        self.r0 + self.offset + i as f64 * (self.bandwidth + self.offset)
    }
}

pub type Pt = (f64, f64);

fn pt(p: Pt) -> String {
    format!("{},{}", fmt_num(p.0), fmt_num(p.1))
}

#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum Curve {
    Linear,
    #[default]
    Monotone,
    Step,
    StepBefore,
    StepAfter,
}

impl Curve {
    /// `natural`, `basis`, `cardinal` and `catmullRom` are not ported; they draw as `monotone`.
    pub fn parse(s: Option<&str>) -> Curve {
        match s {
            Some("linear") => Curve::Linear,
            Some("step") => Curve::Step,
            Some("stepBefore") => Curve::StepBefore,
            Some("stepAfter") => Curve::StepAfter,
            _ => Curve::Monotone,
        }
    }
}

/// Path through `points` (curve default `monotone`, like the React charts).
pub fn line_path(points: &[Pt], curve: Curve) -> String {
    let n = points.len();
    let mut d = String::new();
    if n == 0 {
        return d;
    }
    let _ = write!(d, "M{}", pt(points[0]));
    if n == 1 {
        return d;
    }
    match curve {
        Curve::Linear => {
            for p in &points[1..] {
                let _ = write!(d, "L{}", pt(*p));
            }
            return d;
        }
        Curve::Step | Curve::StepBefore | Curve::StepAfter => {
            for w in points.windows(2) {
                let ((x0, y0), (x1, y1)) = (w[0], w[1]);
                match curve {
                    Curve::StepBefore => {
                        let _ = write!(
                            d,
                            "L{},{}L{},{}",
                            fmt_num(x0),
                            fmt_num(y1),
                            fmt_num(x1),
                            fmt_num(y1)
                        );
                    }
                    Curve::StepAfter => {
                        let _ = write!(
                            d,
                            "L{},{}L{},{}",
                            fmt_num(x1),
                            fmt_num(y0),
                            fmt_num(x1),
                            fmt_num(y1)
                        );
                    }
                    _ => {
                        let mx = (x0 + x1) / 2.0;
                        let _ = write!(
                            d,
                            "L{},{}L{},{}L{},{}",
                            fmt_num(mx),
                            fmt_num(y0),
                            fmt_num(mx),
                            fmt_num(y1),
                            fmt_num(x1),
                            fmt_num(y1)
                        );
                    }
                }
            }
            return d;
        }
        Curve::Monotone => {}
    }
    let slope: Vec<f64> = points
        .windows(2)
        .map(|w| {
            let dx = w[1].0 - w[0].0;
            if dx == 0.0 {
                0.0
            } else {
                (w[1].1 - w[0].1) / dx
            }
        })
        .collect();
    let mut tangent = vec![slope[0]];
    for i in 1..n - 1 {
        let (a, b) = (slope[i - 1], slope[i]);
        tangent.push(if a * b <= 0.0 {
            0.0
        } else {
            2.0 * a * b / (a + b)
        });
    }
    tangent.push(slope[n - 2]);
    for i in 0..n - 1 {
        let ((x0, y0), (x1, y1)) = (points[i], points[i + 1]);
        let h = (x1 - x0) / 3.0;
        let _ = write!(
            d,
            "C{} {} {}",
            pt((x0 + h, y0 + h * tangent[i])),
            pt((x1 - h, y1 - h * tangent[i + 1])),
            pt((x1, y1)),
        );
    }
    d
}

/// Closed area between the curve and `baseline` (a y coordinate).
pub fn area_path(points: &[Pt], baseline: f64, curve: Curve) -> String {
    let (Some(first), Some(last)) = (points.first(), points.last()) else {
        return String::new();
    };
    format!(
        "{}L{},{}L{},{}Z",
        line_path(points, curve),
        fmt_num(last.0),
        fmt_num(baseline),
        fmt_num(first.0),
        fmt_num(baseline)
    )
}

fn quantize(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

/// Angle 0 points up and grows clockwise (radians), like `arcPath` in the React engine.
pub fn polar_point(cx: f64, cy: f64, r: f64, angle: f64) -> Pt {
    (
        quantize(cx + r * angle.sin()),
        quantize(cy - r * angle.cos()),
    )
}

pub fn arc_path(cx: f64, cy: f64, outer: f64, inner: f64, a0: f64, a1: f64) -> String {
    let two_pi = 2.0 * PI;
    if (a1 - a0).abs() >= two_pi - 1e-9 {
        let mid = a0 + PI;
        return arc_path(cx, cy, outer, inner, a0, mid)
            + &arc_path(cx, cy, outer, inner, mid, a0 + two_pi - 1e-9);
    }
    let large = i32::from(a1 - a0 > PI);
    let (os, is) = (fmt_num(quantize(outer)), fmt_num(quantize(inner)));
    let p0 = polar_point(cx, cy, outer, a0);
    let p1 = polar_point(cx, cy, outer, a1);
    if inner <= 0.0 {
        return format!(
            "M{},{}L{}A{os},{os} 0 {large} 1 {}Z",
            fmt_num(quantize(cx)),
            fmt_num(quantize(cy)),
            pt(p0),
            pt(p1)
        );
    }
    let i0 = polar_point(cx, cy, inner, a1);
    let i1 = polar_point(cx, cy, inner, a0);
    format!(
        "M{}A{os},{os} 0 {large} 1 {}L{}A{is},{is} 0 {large} 0 {}Z",
        pt(p0),
        pt(p1),
        pt(i0),
        pt(i1)
    )
}
