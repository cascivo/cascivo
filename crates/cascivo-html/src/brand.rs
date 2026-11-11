//! `@brand` handling: parse keys, derive oklch accent scales, emit one `@layer cascivo.theme` block.
//!
//! Lightness/chroma table mirrors `packages/theme-kit/src/css.ts` (`configToCSS`).

use std::fmt::Write as _;

use crate::ast::{BrandItem, Directive, Doc};
use crate::catalog::closest;
use crate::diag::Diagnostic;
use crate::render::Options;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Mode {
    #[default]
    Light,
    Dark,
    Auto,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Density {
    Compact,
    #[default]
    Normal,
    Comfy,
}

/// Hue in degrees, chroma in oklch units.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Oklch {
    pub h: f64,
    pub c: f64,
}

/// Every field optional so a caller-supplied brand can override a document's field by field.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Brand {
    pub primary: Option<Oklch>,
    pub accent: Option<Oklch>,
    pub theme: Option<String>,
    pub mode: Option<Mode>,
    pub radius: Option<u32>,
    pub gap: Option<u32>,
    pub density: Option<Density>,
    pub font: Option<String>,
    pub mono: Option<String>,
}

impl Brand {
    /// Fields set in `over` win.
    #[must_use]
    pub fn merge(mut self, over: &Brand) -> Brand {
        macro_rules! take {
            ($($f:ident),*) => {$(if over.$f.is_some() { self.$f = over.$f.clone(); })*};
        }
        take!(
            primary, accent, theme, mode, radius, gap, density, font, mono
        );
        self
    }
}

/// Space-scale steps that exist as `--cascivo-space-N` tokens.
const GAP_STEPS: &[u32] = &[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
const KEYS: &[&str] = &[
    "accent", "auto", "dark", "density", "font", "light", "mono", "theme",
];

pub fn hex_to_oklch(hex: &str) -> Option<Oklch> {
    let h = hex.strip_prefix('#')?;
    if !h.bytes().all(|b| b.is_ascii_hexdigit()) {
        return None;
    }
    let chan = |s: &str| u8::from_str_radix(s, 16).ok().map(f64::from);
    let (r, g, b) = match h.len() {
        3 => {
            let d = |i: usize| chan(&format!("{0}{0}", &h[i..=i]));
            (d(0)?, d(1)?, d(2)?)
        }
        6 => (chan(&h[0..2])?, chan(&h[2..4])?, chan(&h[4..6])?),
        _ => return None,
    };
    let lin = |v: f64| {
        let v = v / 255.0;
        if v <= 0.04045 {
            v / 12.92
        } else {
            ((v + 0.055) / 1.055).powf(2.4)
        }
    };
    let (r, g, b) = (lin(r), lin(g), lin(b));
    let l = (0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b).cbrt();
    let m = (0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b).cbrt();
    let s = (0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b).cbrt();
    let a = 1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s;
    let bb = 0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s;
    let c = a.hypot(bb);
    let hue = if c < 0.000_4 {
        0.0
    } else {
        bb.atan2(a).to_degrees().rem_euclid(360.0)
    };
    // Round like the CSS we print so Brand equality matches the output.
    Some(Oklch {
        h: (hue * 1000.0).round() / 1000.0,
        c: (c * 1000.0).round() / 1000.0,
    })
}

fn err(line: u32, msg: impl Into<String>) -> Diagnostic {
    Diagnostic::new(line, 1, msg)
}

fn is_hex_token(s: &str) -> bool {
    s.strip_prefix('#')
        .is_some_and(|h| matches!(h.len(), 3 | 6) && h.bytes().all(|b| b.is_ascii_hexdigit()))
}

fn parse_color(s: &str, line: u32) -> Result<Oklch, Diagnostic> {
    hex_to_oklch(s).ok_or_else(|| {
        err(
            line,
            format!("'{s}' is not a color; expected #rgb or #rrggbb"),
        )
    })
}

fn font_value(key: &str, v: &str, line: u32) -> Result<String, Diagnostic> {
    let ok = !v.is_empty()
        && v.chars()
            .all(|c| c.is_alphanumeric() || matches!(c, ' ' | '-' | '_' | '.'));
    if ok {
        Ok(v.to_string())
    } else {
        Err(err(
            line,
            format!("{key}= needs a font family name (letters, digits, space, - _ .)"),
        ))
    }
}

fn parse_item(b: &mut Brand, item: &BrandItem, line: u32) -> Result<(), Diagnostic> {
    let key = item.key.as_str();
    match (key, item.value.as_deref()) {
        (k, None) if k.starts_with('#') => b.primary = Some(parse_color(k, line)?),
        ("accent", Some(v)) => b.accent = Some(parse_color(v, line)?),
        ("theme", Some(v)) => {
            if crate::css_gen::THEMES.iter().any(|(n, _)| *n == v) {
                b.theme = Some(v.to_string());
            } else {
                let names = crate::css_gen::THEMES.iter().map(|(n, _)| *n);
                let hint = closest(v, names.clone())
                    .map(|s| format!("did you mean '{s}'?"))
                    .unwrap_or_else(|| {
                        format!("expected one of: {}", names.collect::<Vec<_>>().join(", "))
                    });
                return Err(err(line, format!("unknown theme '{v}'; {hint}")));
            }
        }
        ("light", None) => b.mode = Some(Mode::Light),
        ("dark", None) => b.mode = Some(Mode::Dark),
        ("auto", None) => b.mode = Some(Mode::Auto),
        ("density", Some(v)) => {
            b.density = Some(match v {
                "compact" => Density::Compact,
                "normal" => Density::Normal,
                "comfy" => Density::Comfy,
                _ => {
                    return Err(err(
                        line,
                        format!("bad density '{v}'; expected one of: compact, normal, comfy"),
                    ));
                }
            });
        }
        ("font", Some(v)) => b.font = Some(font_value(key, v, line)?),
        ("mono", Some(v)) => b.mono = Some(font_value(key, v, line)?),
        (k, None)
            if k.len() > 1 && k.starts_with('r') && k[1..].bytes().all(|c| c.is_ascii_digit()) =>
        {
            let n: u32 =
                k[1..].parse().ok().filter(|n| *n <= 64).ok_or_else(|| {
                    err(line, format!("radius '{k}' out of range; expected r0..r64"))
                })?;
            b.radius = Some(n);
        }
        (k, None)
            if k.len() > 3
                && k.starts_with("gap")
                && k[3..].bytes().all(|c| c.is_ascii_digit()) =>
        {
            let n: u32 = k[3..]
                .parse()
                .ok()
                .filter(|n| GAP_STEPS.contains(n))
                .ok_or_else(|| {
                    err(
                        line,
                        format!(
                            "gap step '{k}' not on the space scale; expected one of: {}",
                            GAP_STEPS
                                .iter()
                                .map(|n| format!("gap{n}"))
                                .collect::<Vec<_>>()
                                .join(", ")
                        ),
                    )
                })?;
            b.gap = Some(n);
        }
        (k, v) => {
            let shown = v.map_or_else(|| k.to_string(), |v| format!("{k}={v}"));
            let hint = closest(k, KEYS.iter().copied())
                .map(|s| format!("did you mean '{s}'?"))
                .unwrap_or_else(|| "expected a #hex color, accent=, theme=, light|dark|auto, r<n>, gap<n>, density=, font=, mono=".into());
            return Err(err(line, format!("unknown brand key '{shown}'; {hint}")));
        }
    }
    Ok(())
}

/// Parses items from one `@brand` line or a flattened brand file.
pub fn parse_brand(items: &[BrandItem]) -> Result<Brand, Vec<Diagnostic>> {
    parse_brand_at(items.iter().map(|i| (i, 1)))
}

/// Parses the text of a brand file (the same keys as `@brand`, one or more per line).
/// Diagnostic lines refer to lines of that file.
pub fn parse_brand_file(text: &str) -> Result<Brand, Vec<Diagnostic>> {
    let items = file_items(text);
    parse_brand_at(items.iter().map(|(i, l)| (i, *l)))
}

fn parse_brand_at<'a>(
    items: impl Iterator<Item = (&'a BrandItem, u32)>,
) -> Result<Brand, Vec<Diagnostic>> {
    let mut b = Brand::default();
    let mut errs = Vec::new();
    for (item, line) in items {
        if let Err(e) = parse_item(&mut b, item, line) {
            errs.push(e);
        }
    }
    if errs.is_empty() { Ok(b) } else { Err(errs) }
}

/// Brand files: one item per whitespace-separated token; `# comment` lines (a `#` that is not a hex
/// color) and blank lines are skipped; `key="two words"` keeps its spaces.
fn file_items(text: &str) -> Vec<(BrandItem, u32)> {
    let mut out = Vec::new();
    for (i, raw) in text.lines().enumerate() {
        let line = u32::try_from(i + 1).unwrap_or(u32::MAX);
        let t = raw.trim();
        let first = t.split_whitespace().next().unwrap_or("");
        if t.is_empty() || (t.starts_with('#') && !is_hex_token(first)) {
            continue;
        }
        let t = t.strip_prefix("@brand").map_or(t, str::trim_start);
        let mut chars = t.chars().peekable();
        while chars.peek().is_some() {
            while chars.next_if(|c| c.is_whitespace()).is_some() {}
            let mut key = String::new();
            let mut val: Option<String> = None;
            let mut quoted = false;
            while let Some(&c) = chars.peek() {
                if c.is_whitespace() && !quoted {
                    break;
                }
                chars.next();
                match (c, val.as_mut()) {
                    ('"', Some(v)) if !quoted && v.is_empty() => quoted = true,
                    ('"', Some(_)) if quoted => quoted = false,
                    ('=', None) => val = Some(String::new()),
                    (c, Some(v)) => v.push(c),
                    (c, None) => key.push(c),
                }
            }
            if !key.is_empty() {
                out.push((BrandItem { key, value: val }, line));
            }
        }
    }
    out
}

/// Collects every `@brand` / `@brand-file` of `doc`, then applies `opts.brand` on top.
/// Returns `(base theme name, brand CSS)`. The CSS is empty when nothing customizes the page.
pub fn document_brand(
    doc: &Doc,
    opts: &Options,
) -> Result<(Option<String>, String), Vec<Diagnostic>> {
    let mut brand = Brand::default();
    let mut errs = Vec::new();
    fn absorb(r: Result<Brand, Vec<Diagnostic>>, brand: &mut Brand, errs: &mut Vec<Diagnostic>) {
        match r {
            Ok(b) => *brand = std::mem::take(brand).merge(&b),
            Err(e) => errs.extend(e),
        }
    }
    for d in &doc.directives {
        match d {
            Directive::Brand(items) => absorb(parse_brand(items), &mut brand, &mut errs),
            Directive::BrandFile(path) => match opts.brand_resolver {
                None => errs.push(err(1, "brand files need a resolver")),
                Some(resolve) => match resolve(path) {
                    Err(e) => errs.push(err(1, format!("cannot load brand file '{path}': {e}"))),
                    Ok(text) => {
                        let items = file_items(&text);
                        absorb(
                            parse_brand_at(items.iter().map(|(i, l)| (i, *l))),
                            &mut brand,
                            &mut errs,
                        );
                    }
                },
            },
            Directive::Title(_) | Directive::Lang(_) => {}
        }
    }
    if let Some(over) = &opts.brand {
        brand = brand.merge(over);
    }
    if !errs.is_empty() {
        return Err(errs);
    }
    let theme = brand.theme.clone().or(match brand.mode {
        Some(Mode::Dark) => Some("dark".to_string()),
        Some(Mode::Light) => Some("light".to_string()),
        _ => None,
    });
    Ok((theme, brand_css(&brand)))
}

fn num(v: f64) -> String {
    let s = format!("{v:.3}");
    s.trim_end_matches('0').trim_end_matches('.').to_string()
}

fn scale(out: &mut String, name: &str, o: Oklch, light: bool, with_fg: bool) {
    let acc = |l: &str, c: f64| format!("oklch({l} {c:.3} {})", num(o.h));
    let (h, c) = (num(o.h), o.c);
    let _ = write!(
        out,
        "--cascivo-color-{name}:{};--cascivo-color-{name}-hover:{};--cascivo-color-{name}-active:{};",
        acc(if light { "0.52" } else { "0.65" }, c),
        acc(if light { "0.45" } else { "0.707" }, c),
        acc(if light { "0.373" } else { "0.808" }, c.min(0.155)),
    );
    if with_fg {
        let fg = if light {
            "oklch(1 0 0)".to_string()
        } else {
            format!("oklch(0.145 0.005 {h})")
        };
        let _ = write!(
            out,
            "--cascivo-color-accent-foreground:{fg};--cascivo-color-accent-subtle:{};--cascivo-color-accent-muted:{};",
            acc(if light { "0.97" } else { "0.623" }, 0.025),
            acc(
                if light { "0.932" } else { "0.623" },
                if light { 0.055 } else { c * 0.2 }
            ),
        );
    } else {
        let fg = if light {
            "oklch(0.985 0 0)".to_string()
        } else {
            format!("oklch(0.145 0.005 {h})")
        };
        let _ = write!(out, "--cascivo-color-{name}-fg:{fg};");
    }
}

fn colors(b: &Brand, light: bool) -> String {
    let mut s = String::new();
    // A lone primary hex also drives the accent unless `accent=` says otherwise.
    if let Some(a) = b.accent.or(b.primary) {
        scale(&mut s, "accent", a, light, true);
    }
    if let Some(p) = b.primary {
        scale(&mut s, "primary", p, light, false);
    }
    // Charts follow the brand: series 1 is the brand hue, the rest rotate around it.
    if let Some(a) = b.accent.or(b.primary) {
        chart_scale(&mut s, a, light);
    }
    s
}

/// Hue offsets (degrees) for `--cascivo-chart-1..8`, spread so neighbours stay distinguishable.
const CHART_HUES: [f64; 8] = [0.0, 150.0, 300.0, 75.0, 225.0, 30.0, 180.0, 330.0];

fn chart_scale(out: &mut String, o: Oklch, light: bool) {
    let l = if light { "0.62" } else { "0.74" };
    // Gray brands would make a gray chart; keep series tellable apart.
    let c = o.c.clamp(0.1, 0.16);
    for (i, off) in CHART_HUES.iter().enumerate() {
        let hue = (o.h + off).rem_euclid(360.0);
        let _ = write!(
            out,
            "--cascivo-chart-{}:oklch({l} {c:.3} {});",
            i + 1,
            num(hue)
        );
    }
}

/// `brand_css` is public and `Options::brand` is caller-built, so re-check what `parse_item` checks.
fn safe_family(v: &str) -> bool {
    !v.is_empty()
        && v.chars()
            .all(|c| c.is_alphanumeric() || matches!(c, ' ' | '-' | '_' | '.'))
}

fn clamp_oklch(o: Oklch) -> Oklch {
    let fin = |v: f64, hi: f64| if v.is_finite() { v.clamp(0.0, hi) } else { 0.0 };
    Oklch {
        h: fin(o.h, 360.0),
        c: fin(o.c, 0.5),
    }
}

fn family(v: &str, fallback: &str) -> String {
    let name = if v.contains(' ') {
        format!("'{v}'")
    } else {
        v.to_string()
    };
    format!("{name},{fallback}")
}

/// One `@layer cascivo.theme` block. `:root:root` outranks both `[data-theme=x]` and the light
/// theme's `:root:not([data-theme])` fallback; this block is emitted after the theme, so it wins ties.
pub fn brand_css(b: &Brand) -> String {
    let dark_theme = matches!(b.theme.as_deref(), Some("dark" | "midnight"));
    let light = match b.mode {
        Some(Mode::Dark) => false,
        Some(_) => true,
        None => !dark_theme,
    };
    let b = &Brand {
        primary: b.primary.map(clamp_oklch),
        accent: b.accent.map(clamp_oklch),
        font: b.font.clone().filter(|f| safe_family(f)),
        mono: b.mono.clone().filter(|f| safe_family(f)),
        ..b.clone()
    };
    let mut body = colors(b, light);
    if let Some(r) = b.radius {
        let _ = write!(
            body,
            "--cascivo-radius-base:{r}px;--cascivo-radius-control:var(--cascivo-radius-base);\
--cascivo-radius-surface:calc(var(--cascivo-radius-base)*1.66);\
--cascivo-radius-indicator:calc(var(--cascivo-radius-base)/2);\
--cascivo-radius-component:var(--cascivo-radius-base);--cascivo-radius-button:var(--cascivo-radius-base);\
--cascivo-radius-input:var(--cascivo-radius-base);--cascivo-radius-card:calc(var(--cascivo-radius-base)*1.66);\
--cascivo-radius-modal:calc(var(--cascivo-radius-base)*2);"
        );
    }
    if let Some(g) = b.gap {
        let _ = write!(body, "--cascivo-gap-default:var(--cascivo-space-{g});");
    }
    if let Some(d) = b.density {
        let v = match d {
            Density::Compact => "0.875",
            Density::Normal => "1",
            Density::Comfy => "1.125",
        };
        let _ = write!(body, "--cascivo-density:{v};");
    }
    if let Some(f) = &b.font {
        let _ = write!(
            body,
            "--cascivo-font-sans:{};",
            family(f, "ui-sans-serif,system-ui,sans-serif")
        );
    }
    if let Some(m) = &b.mono {
        let _ = write!(
            body,
            "--cascivo-font-mono:{};",
            family(m, "ui-monospace,monospace")
        );
    }
    let mut css = String::new();
    if !body.is_empty() {
        let _ = write!(css, ":root:root{{{body}}}");
    }
    if b.mode == Some(Mode::Auto) {
        let dark = colors(b, false);
        if !dark.is_empty() {
            let _ = write!(
                css,
                "@media (prefers-color-scheme:dark){{:root:root{{{dark}}}}}"
            );
        }
    }
    if css.is_empty() {
        css
    } else {
        format!("@layer cascivo.theme{{{css}}}")
    }
}
