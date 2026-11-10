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
    fn num_formats() {
        assert_eq!(num(3.0), "3");
        assert_eq!(num(0.5), "0.5");
        assert_eq!(num(-0.0), "0");
        assert_eq!(num(f64::NAN), "0");
        assert_eq!(num(1.0 / 3.0), "0.3333");
    }
}
