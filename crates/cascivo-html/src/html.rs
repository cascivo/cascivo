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
    fn num_formats() {
        assert_eq!(num(3.0), "3");
        assert_eq!(num(0.5), "0.5");
        assert_eq!(num(-0.0), "0");
        assert_eq!(num(f64::NAN), "0");
        assert_eq!(num(1.0 / 3.0), "0.3333");
    }
}
