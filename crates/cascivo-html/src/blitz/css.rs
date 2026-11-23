//! Stylesheet lowering and the small CSS scanner the SVG pass reuses.

/// Rewrites CSS for Blitz.
///
/// - `@container (width>=30rem)` becomes `@media (min-width:30rem)`: Blitz never matches
///   container queries, so the nearest working query is the viewport. This is exact for
///   page-level layouts and wrong only for a narrow container inside a wide viewport.
///   `@container scroll-state(…)` and `style(…)` blocks are dropped (they never match).
/// - `:focus-visible` becomes `:focus`: Blitz never matches the former, so rings would vanish.
///   Pointer focus now shows the ring too.
pub fn lower_css(css: &str) -> String {
    lower_containers(css).replace(":focus-visible", ":focus")
}

fn lower_containers(css: &str) -> String {
    const AT: &str = "@container";
    let mut out = String::with_capacity(css.len());
    let mut rest = css;
    while let Some(i) = rest.find(AT) {
        out.push_str(&rest[..i]);
        let after = &rest[i + AT.len()..];
        let Some(open) = after.find('{') else {
            out.push_str(&rest[i..]);
            return out;
        };
        let prelude = &after[..open];
        let end = matching_brace(after, open).map_or(after.len(), |c| c + 1);
        if prelude.contains("scroll-state(") || prelude.contains("style(") {
            rest = &after[end..];
            continue;
        }
        out.push_str("@media ");
        out.push_str(&query(prelude));
        out.push('{');
        rest = &after[open + 1..];
    }
    out.push_str(rest);
    out
}

/// A container prelude as a media query: the optional container name is dropped and
/// size-feature ranges become `min-`/`max-` features.
fn query(prelude: &str) -> String {
    let p = prelude.trim();
    let p = if p.starts_with('(') || p.starts_with("not ") {
        p
    } else {
        p.split_once(char::is_whitespace)
            .map_or("", |(_, r)| r.trim())
    };
    let mut out = String::new();
    let mut chars = p.char_indices().peekable();
    while let Some((i, c)) = chars.next() {
        if c != '(' {
            out.push(c);
            continue;
        }
        let mut depth = 1;
        let mut end = p.len();
        for (j, d) in chars.by_ref() {
            match d {
                '(' => depth += 1,
                ')' => {
                    depth -= 1;
                    if depth == 0 {
                        end = j;
                        break;
                    }
                }
                _ => {}
            }
        }
        out.push('(');
        out.push_str(&feature(&p[i + 1..end]));
        out.push(')');
    }
    out
}

fn feature(f: &str) -> String {
    let f: String = f.split_whitespace().collect::<Vec<_>>().join("");
    for (op, kind) in [(">=", "min"), ("<=", "max"), (">", "min"), ("<", "max")] {
        if let Some((name, val)) = f.split_once(op) {
            let axis = match name {
                "width" | "inline-size" => "width",
                "height" | "block-size" => "height",
                _ => return f,
            };
            return format!("{kind}-{axis}:{val}");
        }
    }
    f.replace("inline-size", "width")
}

/// Index of the `}` that closes the `{` at `open`, skipping strings and comments.
pub(crate) fn matching_brace(s: &str, open: usize) -> Option<usize> {
    let b = s.as_bytes();
    let mut depth = 0i32;
    let mut i = open;
    while i < b.len() {
        match b[i] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            q @ (b'"' | b'\'') => {
                i += 1;
                while i < b.len() && b[i] != q {
                    i += usize::from(b[i] == b'\\');
                    i += 1;
                }
            }
            b'/' if b.get(i + 1) == Some(&b'*') => {
                i += 2;
                while i + 1 < b.len() && !(b[i] == b'*' && b[i + 1] == b'/') {
                    i += 1;
                }
                i += 1;
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// Calls `f(selector, body)` for every style rule, descending into `@layer`, `@media`,
/// `@supports` and `@container` blocks. Nested rules inside a body are not visited.
pub(crate) fn walk_rules(css: &str, f: &mut dyn FnMut(&str, &str)) {
    let b = css.as_bytes();
    let mut i = 0;
    while i < b.len() {
        let start = i;
        let mut depth = 0i32;
        while i < b.len() {
            match b[i] {
                b'(' => depth += 1,
                b')' => depth -= 1,
                q @ (b'"' | b'\'') => {
                    i += 1;
                    while i < b.len() && b[i] != q {
                        i += usize::from(b[i] == b'\\');
                        i += 1;
                    }
                }
                b'{' | b';' if depth <= 0 => break,
                _ => {}
            }
            i += 1;
        }
        if i >= b.len() || b[i] == b';' {
            i += 1;
            continue;
        }
        let prelude = css[start..i].trim();
        let close = matching_brace(css, i).unwrap_or(css.len());
        let body = &css[i + 1..close.min(css.len())];
        if let Some(at) = prelude.strip_prefix('@') {
            let name = at.split(|c: char| !c.is_ascii_alphabetic()).next();
            if matches!(name, Some("layer" | "media" | "supports" | "container")) {
                walk_rules(body, f);
            }
        } else {
            f(prelude, body);
        }
        i = close + 1;
    }
}

/// `prop: value` pairs declared directly in a rule body; nested rules are skipped.
pub(crate) fn declarations(body: &str) -> Vec<(&str, &str)> {
    let b = body.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i < b.len() {
        let start = i;
        let mut depth = 0i32;
        while i < b.len() {
            match b[i] {
                b'(' => depth += 1,
                b')' => depth -= 1,
                q @ (b'"' | b'\'') => {
                    i += 1;
                    while i < b.len() && b[i] != q {
                        i += usize::from(b[i] == b'\\');
                        i += 1;
                    }
                }
                b'{' | b';' if depth <= 0 => break,
                _ => {}
            }
            i += 1;
        }
        if i < b.len() && b[i] == b'{' {
            i = matching_brace(body, i).map_or(b.len(), |c| c + 1);
            continue;
        }
        if let Some((p, v)) = body[start..i.min(b.len())].split_once(':') {
            out.push((p.trim(), v.trim()));
        }
        i += 1;
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn container_ranges_become_media() {
        assert_eq!(
            lower_css("@container (width>=30rem){.a{x:y}}"),
            "@media (min-width:30rem){.a{x:y}}"
        );
        assert_eq!(
            lower_css("@container (width<=40rem){.a{x:y}}"),
            "@media (max-width:40rem){.a{x:y}}"
        );
        assert_eq!(
            lower_css("@container (width > 10rem) and (width < 20rem){.a{x:y}}"),
            "@media (min-width:10rem) and (max-width:20rem){.a{x:y}}"
        );
    }

    #[test]
    fn container_name_and_nested_form() {
        assert_eq!(
            lower_css(".g{@container card (min-width:20rem){&{a:b}}c:d}"),
            ".g{@media (min-width:20rem){&{a:b}}c:d}"
        );
        assert_eq!(
            lower_css("@container (inline-size>=20rem){.a{x:y}}"),
            "@media (min-width:20rem){.a{x:y}}"
        );
    }

    #[test]
    fn scroll_state_container_is_dropped() {
        assert_eq!(
            lower_css(".a{b:c}@container scroll-state(stuck:top){.x{y:z}}.d{e:f}"),
            ".a{b:c}.d{e:f}"
        );
    }

    #[test]
    fn focus_visible_becomes_focus() {
        assert_eq!(
            lower_css(".a:focus-visible{o:1}.b:is(:focus-visible,:hover){o:2}"),
            ".a:focus{o:1}.b:is(:focus,:hover){o:2}"
        );
    }

    #[test]
    fn plain_css_is_untouched() {
        let css = "@layer a{.x{color:red}}@media (min-width:40rem){.y{top:0}}";
        assert_eq!(lower_css(css), css);
    }

    #[test]
    fn walk_and_declarations() {
        let mut seen = Vec::new();
        walk_rules(
            "@layer a{.x{fill:red;&:hover{fill:blue}stroke:var(--a,1)}@media (min-width:1px){.y,.z{top:0}}}@property --p{syntax:'*'}",
            &mut |s, b| seen.push((s.to_string(), declarations(b).len())),
        );
        assert_eq!(seen, vec![(".x".to_string(), 2), (".y,.z".to_string(), 1)]);
    }
}
