//! SVG lowering: Blitz renders inline SVG through usvg, which reads presentation attributes
//! but not CSS rules, inline `style`, `var()` or `oklch()`.

use std::collections::BTreeMap;

use super::color::Vars;
use super::css::{declarations, walk_rules};
use crate::html::esc;
use crate::render::DOC_CSS;

const SHAPES: &[&str] = &[
    "circle", "rect", "path", "line", "polyline", "polygon", "ellipse", "text", "tspan", "g",
    "stop", "use",
];

/// Properties usvg takes as attributes.
const PRESENTATION: &[&str] = &[
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-opacity",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stop-color",
    "stop-opacity",
];

type Decls = Vec<(String, String)>;

/// Moves styling onto SVG shape elements as attributes with literal values.
///
/// - CSS rules with a single class selector (`.cv-meter-track{fill:…}`) are applied to
///   shapes carrying that class. Like the cascade, they override an existing attribute.
/// - Inline `style` declarations for the same properties move to attributes.
/// - `var(--token)` is resolved from the token declarations in `stylesheet` (base, theme and
///   brand CSS: the part before the page shell), `oklch()` becomes `rgb()`.
/// - `transform: rotate(Ndeg)` with a centered origin on an element with `cx`/`cy`, and
///   `scale`/`scaleX`/`scaleY` from the origin `0`, become a `transform` attribute.
///
/// Values that cannot be resolved (`color-mix()`, `contrast-color()`) are left untouched.
pub fn lower_svg(html: &str, stylesheet: &str) -> String {
    let tokens_end = stylesheet.find(DOC_CSS).unwrap_or(stylesheet.len());
    let vars = Vars::from_css(&stylesheet[..tokens_end]);
    let classes = class_rules(stylesheet);
    let mut out = String::with_capacity(html.len());
    let mut rest = html;
    while let Some(lt) = rest.find('<') {
        out.push_str(&rest[..lt]);
        rest = &rest[lt..];
        let Some(name) = shape_at(rest) else {
            out.push('<');
            rest = &rest[1..];
            continue;
        };
        let Some(tag) = Tag::parse(rest, name.len() + 1) else {
            out.push('<');
            rest = &rest[1..];
            continue;
        };
        let end = tag.end;
        match lower_tag(tag, name, &vars, &classes) {
            Some(new) => out.push_str(&new),
            None => out.push_str(&rest[..end]),
        }
        rest = &rest[end..];
    }
    out.push_str(rest);
    out
}

fn shape_at(s: &str) -> Option<&'static str> {
    let after = s.strip_prefix('<')?;
    SHAPES.iter().copied().find(|n| {
        after.strip_prefix(n).is_some_and(|r| {
            r.starts_with(|c: char| c.is_ascii_whitespace() || c == '>' || c == '/')
        })
    })
}

fn class_rules(css: &str) -> BTreeMap<String, Decls> {
    let mut map: BTreeMap<String, Decls> = BTreeMap::new();
    walk_rules(css, &mut |sel, body| {
        let decls: Decls = declarations(body)
            .into_iter()
            .filter(|(p, _)| {
                PRESENTATION.contains(p) || *p == "transform" || *p == "transform-origin"
            })
            .map(|(p, v)| (p.to_string(), v.to_string()))
            .collect();
        if decls.is_empty() {
            return;
        }
        for part in sel.split(',') {
            let part = part.trim();
            let Some(class) = part.strip_prefix('.') else {
                continue;
            };
            if !class.is_empty()
                && class
                    .bytes()
                    .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_')
            {
                map.entry(class.to_string())
                    .or_default()
                    .extend(decls.clone());
            }
        }
    });
    map
}

struct Tag {
    attrs: Vec<(String, Option<String>)>,
    self_close: bool,
    end: usize,
}

impl Tag {
    /// `s` starts at `<`; `i` is just past the tag name.
    fn parse(s: &str, mut i: usize) -> Option<Self> {
        let b = s.as_bytes();
        let mut attrs = Vec::new();
        loop {
            while i < b.len() && b[i].is_ascii_whitespace() {
                i += 1;
            }
            match b.get(i)? {
                b'>' => {
                    return Some(Self {
                        attrs,
                        self_close: false,
                        end: i + 1,
                    });
                }
                b'/' if b.get(i + 1) == Some(&b'>') => {
                    return Some(Self {
                        attrs,
                        self_close: true,
                        end: i + 2,
                    });
                }
                b'/' => {
                    i += 1;
                    continue;
                }
                _ => {}
            }
            let ns = i;
            while i < b.len() && !b[i].is_ascii_whitespace() && !matches!(b[i], b'=' | b'>' | b'/')
            {
                i += 1;
            }
            let name = s[ns..i].to_string();
            let mut j = i;
            while j < b.len() && b[j].is_ascii_whitespace() {
                j += 1;
            }
            if b.get(j) != Some(&b'=') {
                attrs.push((name, None));
                continue;
            }
            j += 1;
            while j < b.len() && b[j].is_ascii_whitespace() {
                j += 1;
            }
            let value = match b.get(j)? {
                &q @ (b'"' | b'\'') => {
                    let vs = j + 1;
                    let ve = vs + s[vs..].find(q as char)?;
                    i = ve + 1;
                    let v = &s[vs..ve];
                    if q == b'\'' {
                        v.replace('"', "&quot;")
                    } else {
                        v.to_string()
                    }
                }
                _ => {
                    let vs = j;
                    while j < b.len() && !b[j].is_ascii_whitespace() && b[j] != b'>' {
                        j += 1;
                    }
                    i = j;
                    s[vs..j].to_string()
                }
            };
            attrs.push((name, Some(value)));
        }
    }

    fn get(&self, name: &str) -> Option<&str> {
        self.attrs
            .iter()
            .find(|(n, _)| n == name)
            .and_then(|(_, v)| v.as_deref())
    }

    fn set(&mut self, name: &str, value: &str) {
        let mut v = String::new();
        esc(&mut v, value);
        match self.attrs.iter_mut().find(|(n, _)| n == name) {
            Some(a) => a.1 = Some(v),
            None => self.attrs.push((name.to_string(), Some(v))),
        }
    }

    fn remove(&mut self, name: &str) {
        self.attrs.retain(|(n, _)| n != name);
    }
}

/// The rewritten tag, or `None` when nothing changed.
fn lower_tag(
    mut tag: Tag,
    name: &str,
    vars: &Vars,
    classes: &BTreeMap<String, Decls>,
) -> Option<String> {
    let before = tag.attrs.clone();
    let mut transform: Option<String> = None;
    let mut origin: Option<String> = None;

    let class_attr = tag.get("class").unwrap_or_default().to_string();
    for class in class_attr.split_whitespace() {
        for (p, v) in classes.get(class).into_iter().flatten() {
            apply(&mut tag, p, v, vars, &mut transform, &mut origin);
        }
    }
    let mut kept = Vec::new();
    let mut deferred = Vec::new();
    let mut moved_any = false;
    let had_style = tag.get("style").map(str::to_string);
    if let Some(style) = &had_style {
        for (p, v) in declarations(style) {
            if p == "transform" || p == "transform-origin" {
                apply(&mut tag, p, v, vars, &mut transform, &mut origin);
                deferred.push(format!("{p}:{v}"));
                moved_any = true;
            } else if PRESENTATION.contains(&p) && vars.resolve(v).is_some() {
                apply(&mut tag, p, v, vars, &mut transform, &mut origin);
                moved_any = true;
            } else {
                kept.push(format!("{p}:{v}"));
            }
        }
    }
    if let Some(t) = transform
        && tag.get("transform").is_none()
        && let Some(attr) = transform_attr(&t, origin.as_deref(), &tag)
    {
        tag.set("transform", &attr);
        deferred.clear();
    }
    if moved_any {
        kept.extend(deferred);
        if kept.is_empty() {
            tag.remove("style");
        } else {
            tag.set("style", &kept.join(";"));
        }
    }
    for i in 0..tag.attrs.len() {
        let (n, v) = &tag.attrs[i];
        if let Some(val) = v
            && val.contains("var(")
            && n != "style"
            && let Some(r) = vars.resolve(&val.replace("&quot;", "\""))
        {
            let mut e = String::new();
            esc(&mut e, &r);
            tag.attrs[i].1 = Some(e);
        }
    }
    if tag.attrs == before {
        return None;
    }
    let mut out = format!("<{name}");
    for (n, v) in &tag.attrs {
        out.push(' ');
        out.push_str(n);
        if let Some(v) = v {
            out.push_str("=\"");
            out.push_str(v);
            out.push('"');
        }
    }
    out.push_str(if tag.self_close { "/>" } else { ">" });
    Some(out)
}

fn apply(
    tag: &mut Tag,
    prop: &str,
    value: &str,
    vars: &Vars,
    transform: &mut Option<String>,
    origin: &mut Option<String>,
) {
    match prop {
        "transform" => *transform = Some(value.to_string()),
        "transform-origin" => *origin = Some(value.to_string()),
        _ => {
            if let Some(r) = vars.resolve(value) {
                tag.set(prop, &r);
            }
        }
    }
}

fn transform_attr(t: &str, origin: Option<&str>, tag: &Tag) -> Option<String> {
    let t = t.trim();
    let origin = origin.map(|o| o.split_whitespace().collect::<Vec<_>>().join(" "));
    let call = |name: &str| -> Option<f64> {
        t.strip_prefix(name)?
            .strip_prefix('(')?
            .strip_suffix(')')?
            .trim_end_matches("deg")
            .trim()
            .parse()
            .ok()
    };
    if let Some(deg) = call("rotate") {
        let centered = matches!(
            origin.as_deref(),
            Some("50%" | "50% 50%" | "center" | "center center")
        );
        let (cx, cy) = (tag.get("cx")?, tag.get("cy")?);
        let _ = (cx.parse::<f64>().ok()?, cy.parse::<f64>().ok()?);
        return centered.then(|| format!("rotate({} {cx} {cy})", crate::html::num(deg)));
    }
    let from_zero = matches!(
        origin.as_deref(),
        None | Some("0" | "0 0" | "0px" | "0px 0px" | "left top" | "top left")
    );
    if !from_zero {
        return None;
    }
    if let Some(n) = call("scaleX") {
        return Some(format!("scale({} 1)", crate::html::num(n)));
    }
    if let Some(n) = call("scaleY") {
        return Some(format!("scale(1 {})", crate::html::num(n)));
    }
    call("scale").map(|n| format!("scale({})", crate::html::num(n)))
}

#[cfg(test)]
mod tests {
    use super::*;

    const CSS: &str = ":root{--c:oklch(100% 0 0);--o:.25}\
@layer cascivo.component{.t{stroke:var(--c)}.f{stroke:var(--c);transform-origin:50%;transform:rotate(-90deg)}.m{transform-origin:0}}";

    #[test]
    fn class_rules_become_attributes() {
        let out = lower_svg(
            "<svg><circle class=\"t\" cx=\"1\" stroke=\"red\"/></svg>",
            CSS,
        );
        assert_eq!(
            out,
            "<svg><circle class=\"t\" cx=\"1\" stroke=\"rgb(255, 255, 255)\"/></svg>"
        );
    }

    #[test]
    fn rotate_uses_centre() {
        let out = lower_svg("<circle class=\"f\" cx=\"24\" cy=\"24\"></circle>", CSS);
        assert!(out.contains("stroke=\"rgb(255, 255, 255)\""), "{out}");
        assert!(out.contains("transform=\"rotate(-90 24 24)\""), "{out}");
    }

    #[test]
    fn inline_style_moves() {
        let out = lower_svg(
            "<rect class=\"m\" style=\"transform:scaleX(0.5)\" width=\"4\"></rect>",
            CSS,
        );
        assert_eq!(
            out,
            "<rect class=\"m\" width=\"4\" transform=\"scale(0.5 1)\"></rect>"
        );
        let out = lower_svg(
            "<path style=\"fill-opacity:var(--o, 0.12)\" d=\"M0\"/>",
            CSS,
        );
        assert_eq!(out, "<path d=\"M0\" fill-opacity=\".25\"/>");
        let out = lower_svg("<text style=\"pointer-events:none\">x</text>", CSS);
        assert_eq!(out, "<text style=\"pointer-events:none\">x</text>");
    }

    #[test]
    fn var_attribute_resolves() {
        let out = lower_svg("<line stroke=\"var(--c)\" x1=\"0\"/>", CSS);
        assert_eq!(out, "<line stroke=\"rgb(255, 255, 255)\" x1=\"0\"/>");
    }

    #[test]
    fn unresolvable_and_non_shapes_are_untouched() {
        let html = "<div class=\"t\" style=\"fill:var(--c)\"><lineargradient></lineargradient><circle stroke=\"var(--nope)\"/></div>";
        assert_eq!(lower_svg(html, CSS), html);
    }
}
