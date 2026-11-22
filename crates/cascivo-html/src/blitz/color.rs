//! Custom-property lookup and `oklch()` → `rgb()` so SVG attributes hold literals usvg can parse.

use std::collections::HashMap;

/// `--name: value` declarations of a stylesheet. Later ones win, like the cascade.
pub(crate) struct Vars(HashMap<String, String>);

impl Vars {
    pub(crate) fn from_css(css: &str) -> Self {
        let b = css.as_bytes();
        let mut map = HashMap::new();
        let mut i = 0;
        while i + 2 < b.len() {
            let ident_before = i > 0 && is_ident(b[i - 1]);
            if b[i] != b'-' || b[i + 1] != b'-' || ident_before {
                i += 1;
                continue;
            }
            let start = i;
            while i < b.len() && is_ident(b[i]) {
                i += 1;
            }
            let name = &css[start..i];
            let mut j = i;
            while j < b.len() && b[j] == b' ' {
                j += 1;
            }
            if j >= b.len() || b[j] != b':' {
                continue;
            }
            j += 1;
            let vstart = j;
            let mut depth = 0i32;
            while j < b.len() {
                match b[j] {
                    b'(' => depth += 1,
                    b')' => depth -= 1,
                    b';' | b'}' | b'{' if depth <= 0 => break,
                    _ => {}
                }
                j += 1;
            }
            if j < b.len() && b[j] != b'{' {
                let v = css[vstart..j].trim();
                // `contrast-color()` sits in `@supports`; the literal declared before it stays.
                if !v.is_empty() && !v.contains("contrast-color(") {
                    map.insert(name.to_string(), v.to_string());
                }
            }
            i = j;
        }
        Self(map)
    }

    /// A value with `var()` and `oklch()` replaced by literals; `None` when it cannot be.
    pub(crate) fn resolve(&self, value: &str) -> Option<String> {
        self.resolve_at(value, 0)
    }

    fn resolve_at(&self, value: &str, depth: u8) -> Option<String> {
        if depth > 16 {
            return None;
        }
        let v = value.trim();
        if let Some(inner) = v.strip_prefix("var(").and_then(|r| r.strip_suffix(')')) {
            let (name, fallback) = match split_top_comma(inner) {
                Some((n, f)) => (n.trim(), Some(f)),
                None => (inner.trim(), None),
            };
            if let Some(found) = self.0.get(name)
                && let Some(r) = self.resolve_at(found, depth + 1)
            {
                return Some(r);
            }
            return fallback.and_then(|f| self.resolve_at(f, depth + 1));
        }
        if v.starts_with("oklch(") {
            return oklch_to_rgb(v);
        }
        let opaque = [
            "color-mix(",
            "contrast-color(",
            "light-dark(",
            "color(",
            "oklab(",
        ]
        .iter()
        .any(|f| v.starts_with(f))
            || v.starts_with("lab(")
            || v.starts_with("lch(")
            || v.contains(" from ")
            || v.contains("var(");
        (!opaque && !v.is_empty()).then(|| v.to_string())
    }
}

fn is_ident(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'-' || c == b'_'
}

fn split_top_comma(s: &str) -> Option<(&str, &str)> {
    let mut depth = 0i32;
    for (i, c) in s.char_indices() {
        match c {
            '(' => depth += 1,
            ')' => depth -= 1,
            ',' if depth == 0 => return Some((&s[..i], &s[i + 1..])),
            _ => {}
        }
    }
    None
}

fn component(s: &str, pct_scale: f64) -> Option<f64> {
    let s = s.trim();
    match s.strip_suffix('%') {
        Some(p) => p.trim().parse::<f64>().ok().map(|n| n / 100.0 * pct_scale),
        None => s.parse().ok(),
    }
}

/// `oklch(L C H)` or `oklch(L C H / A)` → `rgb(r, g, b)` / `rgba(r, g, b, a)`.
/// Out-of-gamut colors are clamped per channel.
pub(crate) fn oklch_to_rgb(v: &str) -> Option<String> {
    let inner = v.strip_prefix("oklch(")?.strip_suffix(')')?;
    let (main, alpha) = match inner.split_once('/') {
        Some((m, a)) => (m, component(a, 1.0)?),
        None => (inner, 1.0),
    };
    let mut it = main.split_whitespace();
    let l = component(it.next()?, 1.0)?;
    let c = component(it.next()?, 0.4)?;
    let h = it
        .next()?
        .trim_end_matches("deg")
        .parse::<f64>()
        .ok()?
        .to_radians();
    if it.next().is_some() {
        return None;
    }
    let (a, b) = (c * h.cos(), c * h.sin());
    let l_ = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
    let m_ = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
    let s_ = l - 0.089_484_177_5 * a - 1.291_485_548 * b;
    let (l3, m3, s3) = (l_.powi(3), m_.powi(3), s_.powi(3));
    let lin = [
        4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3,
        -1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3,
        -0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3,
    ];
    let ch = lin.map(|x| {
        let x = x.clamp(0.0, 1.0);
        let g = if x <= 0.003_130_8 {
            12.92 * x
        } else {
            1.055 * x.powf(1.0 / 2.4) - 0.055
        };
        (g * 255.0).round() as u8
    });
    Some(if alpha >= 1.0 {
        format!("rgb({}, {}, {})", ch[0], ch[1], ch[2])
    } else {
        let a = (alpha.clamp(0.0, 1.0) * 1000.0).round() / 1000.0;
        format!("rgba({}, {}, {}, {a})", ch[0], ch[1], ch[2])
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn oklch_known_values() {
        assert_eq!(
            oklch_to_rgb("oklch(100% 0 0)").unwrap(),
            "rgb(255, 255, 255)"
        );
        assert_eq!(oklch_to_rgb("oklch(0% 0 0)").unwrap(), "rgb(0, 0, 0)");
        assert_eq!(
            oklch_to_rgb("oklch(62.8% 0.2577 29.23)").unwrap(),
            "rgb(255, 0, 0)"
        );
        assert_eq!(
            oklch_to_rgb("oklch(0% 0 0/.5)").unwrap(),
            "rgba(0, 0, 0, 0.5)"
        );
    }

    #[test]
    fn var_chain_and_fallback() {
        let v = Vars::from_css(
            ":root{--a:var(--b);--b:oklch(100% 0 0);--c:color-mix(in oklch, red, blue)}",
        );
        assert_eq!(v.resolve("var(--a)").unwrap(), "rgb(255, 255, 255)");
        assert_eq!(v.resolve("var(--missing, 0.25)").unwrap(), "0.25");
        assert_eq!(v.resolve("var(--c, red)").unwrap(), "red");
        assert!(v.resolve("var(--c)").is_none());
        assert_eq!(v.resolve("#fff").unwrap(), "#fff");
    }

    #[test]
    fn later_declaration_wins() {
        let v = Vars::from_css(":root{--x:red}[data-theme=a]{--x:blue}");
        assert_eq!(v.resolve("var(--x)").unwrap(), "blue");
    }

    #[test]
    fn contrast_color_keeps_literal() {
        let v = Vars::from_css(
            "a{--t:oklch(0% 0 0);@supports (color:contrast-color(red)){&{--t:contrast-color(red)}}}",
        );
        assert_eq!(v.resolve("var(--t)").unwrap(), "rgb(0, 0, 0)");
    }
}
