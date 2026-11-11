//! Escaping and small writers shared by every emitter.

use std::fmt::Write;

/// Escapes text for element content and double-quoted attribute values alike.
pub fn esc(out: &mut String, s: &str) {
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#x27;"),
            _ => out.push(c),
        }
    }
}

/// ` name="value"` with the value escaped.
pub fn attr(out: &mut String, name: &str, value: &str) {
    out.push(' ');
    out.push_str(name);
    out.push_str("=\"");
    esc(out, value);
    out.push('"');
}

/// A bare boolean attribute: ` name`.
pub fn flag(out: &mut String, name: &str) {
    out.push(' ');
    out.push_str(name);
}

/// Shortest decimal for `n`: integers without `.0`, at most 4 decimals, never `NaN`/`inf`/`-0`.
pub fn num(n: f64) -> String {
    if !n.is_finite() {
        return "0".to_string();
    }
    let mut s = String::new();
    let _ = write!(s, "{n:.4}");
    if s.contains('.') {
        while s.ends_with('0') {
            s.pop();
        }
        if s.ends_with('.') {
            s.pop();
        }
    }
    if s == "-0" { "0".to_string() } else { s }
}

/// Accepts a user-supplied CSS length/expression only if it cannot add declarations or
/// escape its value: a conservative charset with balanced parentheses (`calc(100% - 2rem)`).
pub fn css_len(s: &str) -> Option<String> {
    let s = s.trim();
    let mut depth = 0i32;
    for c in s.chars() {
        match c {
            '(' => depth += 1,
            ')' => {
                depth -= 1;
                if depth < 0 {
                    return None;
                }
            }
            c if c.is_ascii_alphanumeric() || " .%+-*/".contains(c) => {}
            _ => return None,
        }
    }
    let lower = s.to_ascii_lowercase();
    if s.is_empty() || depth != 0 || lower.contains("url") || lower.contains("expression") {
        return None;
    }
    Some(s.to_string())
}

/// A URL safe to put in `href`/`src`: http(s), relative, and (for non-images) mailto/tel;
/// images also allow raster `data:image/*`. Everything else (`javascript:`, `data:text/html`…) is dropped.
pub fn safe_url(s: &str, img: bool) -> Option<String> {
    // Browsers ignore tab/CR/LF inside a scheme (`java\tscript:`), so judge the stripped form.
    let n: String = s.trim().chars().filter(|c| !c.is_ascii_control()).collect();
    let l = n.to_ascii_lowercase();
    let scheme = l
        .find([':', '/', '?', '#'])
        .filter(|&i| l.as_bytes().get(i) == Some(&b':'));
    let ok = match scheme {
        None => true,
        Some(i) => match l.get(..i) {
            Some("http" | "https") => true,
            Some("mailto" | "tel") => !img,
            Some("data") => {
                img && ["png", "jpeg", "gif", "webp"].iter().any(|m| {
                    l.starts_with(&format!("data:image/{m};"))
                        || l.starts_with(&format!("data:image/{m},"))
                })
            }
            _ => false,
        },
    };
    ok.then_some(n)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_all_five() {
        let mut o = String::new();
        esc(&mut o, "<a href=\"x\">&'</a>");
        assert_eq!(o, "&lt;a href=&quot;x&quot;&gt;&amp;&#x27;&lt;/a&gt;");
    }

    #[test]
    fn css_len_rejects_injection() {
        assert_eq!(
            css_len("calc(100% - 2rem)").as_deref(),
            Some("calc(100% - 2rem)")
        );
        assert_eq!(css_len("16rem").as_deref(), Some("16rem"));
        for bad in [
            "1px;background:red",
            "1px}",
            "a)",
            "(a",
            "url(x)",
            "1\\",
            "\"x\"",
            "",
        ] {
            assert_eq!(css_len(bad), None, "{bad}");
        }
    }

    #[test]
    fn safe_url_filters_schemes() {
        for ok in [
            "https://a.b/c?d=e:f",
            "/x:y",
            "#top",
            "page.html",
            "mailto:a@b.c",
        ] {
            assert!(safe_url(ok, false).is_some(), "{ok}");
        }
        for bad in [
            "javascript:alert(1)",
            " JaVa\tScript:x",
            "data:text/html,x",
            "vbscript:x",
            "mailto:a@b.c",
        ] {
            assert!(safe_url(bad, bad.starts_with("mailto")).is_none(), "{bad}");
        }
        assert!(safe_url("data:image/png;base64,AAA", true).is_some());
        assert!(safe_url("data:image/svg+xml,<svg>", true).is_none());
    }

    #[test]
    fn num_formats() {
        assert_eq!(num(3.0), "3");
        assert_eq!(num(0.5), "0.5");
        assert_eq!(num(-0.0), "0");
        assert_eq!(num(f64::NAN), "0");
        assert_eq!(num(1.0 / 3.0), "0.3333");
    }
}
