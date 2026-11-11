//! External images and SVG: byte lookup (never IO here), base64, MIME sniffing and the SVG sanitizer.

use crate::html::esc;

/// Embedded assets above this need `Options::max_asset_bytes`.
pub const DEFAULT_MAX_ASSET_BYTES: usize = 2 * 1024 * 1024;

const B64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// RFC 4648 §4 base64 with padding.
pub fn base64(data: &[u8]) -> String {
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for c in data.chunks(3) {
        let n = (u32::from(c[0]) << 16)
            | (u32::from(c.get(1).copied().unwrap_or(0)) << 8)
            | u32::from(c.get(2).copied().unwrap_or(0));
        for i in 0..4 {
            if i <= c.len() {
                out.push(B64[(n >> (18 - 6 * i) & 63) as usize] as char);
            } else {
                out.push('=');
            }
        }
    }
    out
}

/// MIME type from magic bytes, falling back to the file extension of `name`.
pub fn sniff_mime(bytes: &[u8], name: &str) -> Option<&'static str> {
    let by_magic = if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("image/png")
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("image/jpeg")
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        Some("image/gif")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("image/webp")
    } else if bytes.len() >= 12
        && &bytes[4..8] == b"ftyp"
        && matches!(&bytes[8..12], b"avif" | b"avis")
    {
        Some("image/avif")
    } else if bytes.starts_with(&[0, 0, 1, 0]) {
        Some("image/x-icon")
    } else if looks_like_svg(bytes) {
        Some("image/svg+xml")
    } else {
        None
    };
    by_magic.or_else(|| {
        let ext = name.rsplit_once('.')?.1.to_ascii_lowercase();
        match ext.as_str() {
            "png" => Some("image/png"),
            "jpg" | "jpeg" => Some("image/jpeg"),
            "gif" => Some("image/gif"),
            "webp" => Some("image/webp"),
            "avif" => Some("image/avif"),
            "ico" => Some("image/x-icon"),
            "svg" => Some("image/svg+xml"),
            _ => None,
        }
    })
}

fn looks_like_svg(bytes: &[u8]) -> bool {
    let head = &bytes[..bytes.len().min(2048)];
    let head = String::from_utf8_lossy(head);
    let t = head.trim_start_matches('\u{feff}').trim_start();
    t.starts_with('<') && t.to_ascii_lowercase().contains("<svg")
}

/// `data:` URI for raw bytes.
pub fn data_uri(mime: &str, bytes: &[u8]) -> String {
    format!("data:{mime};base64,{}", base64(bytes))
}

/// SVG elements that survive. Anything else (script, foreignObject, animate, set, HTML breakout
/// tags, …) is dropped together with its content.
fn element_allowed(lower: &str) -> bool {
    const OK: &[&str] = &[
        "svg",
        "g",
        "defs",
        "symbol",
        "use",
        "path",
        "rect",
        "circle",
        "ellipse",
        "line",
        "polyline",
        "polygon",
        "text",
        "tspan",
        "textpath",
        "image",
        "title",
        "desc",
        "lineargradient",
        "radialgradient",
        "stop",
        "pattern",
        "clippath",
        "mask",
        "marker",
        "filter",
        "style",
        "switch",
        "a",
        "view",
        "animatetransform",
        "animatemotion",
        "mpath",
    ];
    OK.contains(&lower)
        || (lower.starts_with("fe") && lower.bytes().all(|b| b.is_ascii_alphabetic()))
}

fn style_allowed(css: &str) -> bool {
    if css.contains('\\') || css.contains('&') {
        return false;
    }
    let l = css.to_ascii_lowercase();
    if l.contains("@import") || l.contains("javascript:") || l.contains("expression(") {
        return false;
    }
    let mut rest = l.as_str();
    while let Some(i) = rest.find("url(") {
        let arg = rest[i + 4..].trim_start().trim_start_matches(['\'', '"']);
        if !(arg.starts_with('#') || arg.starts_with("data:image/")) {
            return false;
        }
        rest = &rest[i + 4..];
    }
    true
}

fn href_allowed(v: &str) -> bool {
    let n: String = v.trim().chars().filter(|c| !c.is_ascii_control()).collect();
    n.starts_with('#') || n.to_ascii_lowercase().starts_with("data:image/")
}

enum Tok<'a> {
    Open {
        name: &'a str,
        attrs: &'a str,
        selfclose: bool,
    },
    Close(&'a str),
    Text(&'a str),
    Cdata(&'a str),
}

fn tokenize(s: &str) -> Result<Vec<Tok<'_>>, String> {
    let mut toks = Vec::new();
    let mut i = 0;
    while i < s.len() {
        let rest = &s[i..];
        if !rest.starts_with('<') {
            let n = rest.find('<').unwrap_or(rest.len());
            toks.push(Tok::Text(&rest[..n]));
            i += n;
        } else if rest.starts_with("<!--") {
            let n = rest.find("-->").ok_or("unterminated comment")?;
            i += n + 3;
        } else if rest.starts_with("<![CDATA[") {
            let n = rest.find("]]>").ok_or("unterminated CDATA")?;
            toks.push(Tok::Cdata(&rest[9..n]));
            i += n + 3;
        } else if rest.starts_with("<?") {
            let n = rest
                .find("?>")
                .ok_or("unterminated processing instruction")?;
            i += n + 2;
        } else if rest.len() >= 9 && rest[..9].eq_ignore_ascii_case("<!DOCTYPE") {
            // Skips an internal subset (`[ <!ENTITY …> ]`) too; entities are never expanded.
            let mut depth = 0i32;
            let mut end = None;
            for (j, c) in rest.char_indices() {
                match c {
                    '[' => depth += 1,
                    ']' => depth -= 1,
                    '>' if depth <= 0 => {
                        end = Some(j);
                        break;
                    }
                    _ => {}
                }
            }
            i += end.ok_or("unterminated DOCTYPE")? + 1;
        } else if rest.starts_with("<!") {
            return Err("unsupported <! declaration".into());
        } else {
            // A tag: find its end, skipping quoted attribute values.
            let mut quote = None;
            let mut end = None;
            for (j, c) in rest.char_indices().skip(1) {
                match (quote, c) {
                    (Some(q), c) if c == q => quote = None,
                    (Some(_), _) => {}
                    (None, '"' | '\'') => quote = Some(c),
                    (None, '>') => {
                        end = Some(j);
                        break;
                    }
                    _ => {}
                }
            }
            let end = end.ok_or("unterminated tag")?;
            let inner = &rest[1..end];
            i += end + 1;
            if let Some(name) = inner.strip_prefix('/') {
                toks.push(Tok::Close(name.trim()));
            } else {
                let (inner, selfclose) = match inner.strip_suffix('/') {
                    Some(x) => (x, true),
                    None => (inner, false),
                };
                let split = inner
                    .find(|c: char| c.is_ascii_whitespace())
                    .unwrap_or(inner.len());
                let name = &inner[..split];
                if name.is_empty()
                    || !name
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b"-_:.".contains(&b))
                {
                    return Err(format!("bad tag name '{name}'"));
                }
                toks.push(Tok::Open {
                    name,
                    attrs: &inner[split..],
                    selfclose,
                });
            }
        }
    }
    Ok(toks)
}

fn parse_attrs(s: &str) -> Result<Vec<(String, String)>, String> {
    let b = s.as_bytes();
    let mut i = 0;
    let mut out: Vec<(String, String)> = Vec::new();
    while i < b.len() {
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        if i >= b.len() {
            break;
        }
        let st = i;
        while i < b.len() && !b[i].is_ascii_whitespace() && b[i] != b'=' {
            i += 1;
        }
        let name = s[st..i].to_string();
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        let mut val = String::new();
        if i < b.len() && b[i] == b'=' {
            i += 1;
            while i < b.len() && b[i].is_ascii_whitespace() {
                i += 1;
            }
            if i < b.len() && (b[i] == b'"' || b[i] == b'\'') {
                let q = b[i];
                let vs = i + 1;
                let ve = s[vs..]
                    .bytes()
                    .position(|c| c == q)
                    .ok_or("unterminated attribute value")?
                    + vs;
                val = s[vs..ve].to_string();
                i = ve + 1;
            } else {
                let vs = i;
                while i < b.len() && !b[i].is_ascii_whitespace() {
                    i += 1;
                }
                val = s[vs..i].to_string();
            }
        }
        if name.is_empty() {
            return Err("malformed attribute".into());
        }
        if !out.iter().any(|(n, _)| *n == name) {
            out.push((name, val));
        }
    }
    Ok(out)
}

fn push_attr(out: &mut String, name: &str, raw: &str) {
    out.push(' ');
    out.push_str(name);
    out.push_str("=\"");
    // `raw` is already entity-encoded source text; only quotes and `<` need care.
    out.push_str(
        &tame_entities(raw)
            .replace('"', "&quot;")
            .replace('<', "&lt;"),
    );
    out.push('"');
}

/// What `sanitize_svg` should do to the root element.
pub struct SvgOpts<'a> {
    pub alt: Option<&'a str>,
    pub style: &'a str,
    pub fit: Option<&'a str>,
    /// Prefix for `id`s and `#id` references so two inlined files cannot collide.
    pub id_prefix: &'a str,
}

/// Strictly sanitized SVG markup safe to inline in HTML, or why it was rejected.
pub fn sanitize_svg(src: &str, o: &SvgOpts<'_>) -> Result<String, String> {
    let toks = tokenize(src)?;
    let mut out = String::new();
    let mut stack: Vec<(&str, bool)> = Vec::new(); // (name, emitted)
    let mut roots = 0;
    for (ti, t) in toks.iter().enumerate() {
        match t {
            Tok::Text(x) => {
                if stack.is_empty() {
                    if !x.trim().is_empty() {
                        return Err("text outside the <svg> element".into());
                    }
                } else if !dropped(&stack) {
                    out.push_str(&tame_entities(x));
                }
            }
            Tok::Cdata(x) => {
                if !dropped(&stack) && !stack.is_empty() {
                    esc_text(&mut out, x);
                }
            }
            Tok::Open {
                name,
                attrs,
                selfclose,
            } => {
                let lower = name.to_ascii_lowercase();
                if stack.is_empty() {
                    if lower != "svg" {
                        return Err(format!(
                            "expected <svg> as the root element, found <{name}>"
                        ));
                    }
                    roots += 1;
                    if roots > 1 {
                        return Err("more than one root element".into());
                    }
                }
                // A hostile <style> is dropped whole; its text is judged before the tag is written.
                let style_ok = lower != "style" || style_text_allowed(&toks[ti + 1..]);
                let keep = !dropped(&stack) && element_allowed(&lower) && style_ok;
                if keep {
                    let attrs = parse_attrs(attrs)?;
                    out.push('<');
                    out.push_str(name);
                    let is_root = stack.is_empty();
                    let mut style = String::new();
                    for (n, v) in &attrs {
                        let nl = n.to_ascii_lowercase();
                        let bad_name = !n
                            .bytes()
                            .all(|b| b.is_ascii_alphanumeric() || b"-_:.".contains(&b));
                        if bad_name || nl.starts_with("on") {
                            continue;
                        }
                        if is_root
                            && matches!(
                                nl.as_str(),
                                "role" | "aria-label" | "aria-hidden" | "preserveaspectratio"
                            )
                            && (nl != "preserveaspectratio" || o.fit.is_some())
                        {
                            continue;
                        }
                        match nl.as_str() {
                            "href" | "xlink:href" => {
                                if href_allowed(v) {
                                    let v = prefix_ref(v, o.id_prefix);
                                    push_attr(&mut out, n, &v);
                                }
                            }
                            "style" => {
                                if style_allowed(v) {
                                    style = prefix_urls(v, o.id_prefix);
                                }
                            }
                            "id" => push_attr(&mut out, n, &format!("{}{v}", o.id_prefix)),
                            _ => {
                                if v.to_ascii_lowercase().contains("javascript:") {
                                    continue;
                                }
                                push_attr(&mut out, n, &prefix_urls(v, o.id_prefix));
                            }
                        }
                    }
                    if is_root {
                        match o.alt {
                            Some(a) if !a.is_empty() => {
                                push_attr(&mut out, "role", "img");
                                let mut e = String::new();
                                esc(&mut e, a);
                                out.push_str(" aria-label=\"");
                                out.push_str(&e);
                                out.push('"');
                            }
                            _ => push_attr(&mut out, "aria-hidden", "true"),
                        }
                        match o.fit {
                            Some("cover") => {
                                push_attr(&mut out, "preserveAspectRatio", "xMidYMid slice")
                            }
                            Some(_) => push_attr(&mut out, "preserveAspectRatio", "xMidYMid meet"),
                            None => {}
                        }
                        if !o.style.is_empty() {
                            if !style.is_empty() && !style.trim_end().ends_with(';') {
                                style.push(';');
                            }
                            style.push_str(o.style);
                        }
                    }
                    if !style.is_empty() {
                        push_attr(&mut out, "style", &style);
                    }
                    if *selfclose {
                        out.push_str("/>");
                    } else {
                        out.push('>');
                    }
                }
                if !*selfclose {
                    stack.push((name, keep));
                }
            }
            Tok::Close(name) => {
                let Some((open, emitted)) = stack.pop() else {
                    return Err(format!("unexpected </{name}>"));
                };
                if !open.eq_ignore_ascii_case(name) {
                    return Err(format!("</{name}> closes <{open}>"));
                }
                if emitted {
                    out.push_str("</");
                    out.push_str(open);
                    out.push('>');
                }
            }
        }
    }
    if !stack.is_empty() {
        return Err("unclosed element".into());
    }
    if roots == 0 {
        return Err("no <svg> element".into());
    }
    Ok(out)
}

fn style_text_allowed(rest: &[Tok<'_>]) -> bool {
    let mut css = String::new();
    for t in rest {
        match t {
            Tok::Text(x) | Tok::Cdata(x) => css.push_str(x),
            _ => break,
        }
    }
    style_allowed(&css)
}

/// True while inside an element that was dropped, so its whole subtree goes with it.
fn dropped(stack: &[(&str, bool)]) -> bool {
    stack.iter().any(|(_, emitted)| !emitted)
}

/// Entity references other than the XML five and numeric ones would resolve against a DOCTYPE
/// we dropped (or to HTML-only names); make them literal text.
fn tame_entities(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut rest = s;
    while let Some(i) = rest.find('&') {
        out.push_str(&rest[..i]);
        let tail = &rest[i..];
        let ok = tail.find(';').is_some_and(|e| {
            let name = &tail[1..e];
            matches!(name, "amp" | "lt" | "gt" | "quot" | "apos")
                || name
                    .strip_prefix("#x")
                    .is_some_and(|h| !h.is_empty() && h.bytes().all(|b| b.is_ascii_hexdigit()))
                || name
                    .strip_prefix('#')
                    .is_some_and(|d| !d.is_empty() && d.bytes().all(|b| b.is_ascii_digit()))
        });
        out.push_str(if ok { "&" } else { "&amp;" });
        rest = &tail[1..];
    }
    out.push_str(rest);
    out
}

fn esc_text(out: &mut String, s: &str) {
    let mut t = String::new();
    esc(&mut t, s);
    out.push_str(&t.replace("&quot;", "\"").replace("&#x27;", "'"));
}

/// `#id` → `#prefix+id`.
fn prefix_ref(v: &str, p: &str) -> String {
    match v.trim().strip_prefix('#') {
        Some(id) => format!("#{p}{id}"),
        None => v.to_string(),
    }
}

/// `url(#id)` / `url('#id')` → prefixed.
fn prefix_urls(v: &str, p: &str) -> String {
    let mut out = String::new();
    let mut rest = v;
    while let Some(i) = rest.find("url(") {
        out.push_str(&rest[..i + 4]);
        rest = &rest[i + 4..];
        let ws = rest.len() - rest.trim_start().len();
        out.push_str(&rest[..ws]);
        rest = &rest[ws..];
        let q = rest.len() - rest.trim_start_matches(['\'', '"']).len();
        out.push_str(&rest[..q]);
        rest = &rest[q..];
        if let Some(r) = rest.strip_prefix('#') {
            out.push('#');
            out.push_str(p);
            rest = r;
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base64_rfc4648_vectors() {
        for (i, o) in [
            ("", ""),
            ("f", "Zg=="),
            ("fo", "Zm8="),
            ("foo", "Zm9v"),
            ("foob", "Zm9vYg=="),
            ("fooba", "Zm9vYmE="),
            ("foobar", "Zm9vYmFy"),
        ] {
            assert_eq!(base64(i.as_bytes()), o);
        }
        assert_eq!(base64(&[0xFB, 0xFF, 0xFE]), "+//+");
    }

    #[test]
    fn mime_from_magic_then_extension() {
        let cases: [(&[u8], &str); 6] = [
            (b"\x89PNG\r\n\x1a\n....", "image/png"),
            (b"\xFF\xD8\xFF\xE0..", "image/jpeg"),
            (b"GIF89a..", "image/gif"),
            (b"RIFF\0\0\0\0WEBPVP8 ", "image/webp"),
            (b"\0\0\0\x1cftypavif....", "image/avif"),
            (b"\0\0\x01\0\x01\0", "image/x-icon"),
        ];
        for (b, m) in cases {
            assert_eq!(sniff_mime(b, "x.bin"), Some(m));
        }
        assert_eq!(
            sniff_mime(b"  <?xml version='1.0'?><svg/>", "x"),
            Some("image/svg+xml")
        );
        // magic wins over a lying extension; the extension is only a fallback
        assert_eq!(sniff_mime(b"\x89PNG\r\n\x1a\n", "x.jpg"), Some("image/png"));
        assert_eq!(sniff_mime(b"????", "x.JPG"), Some("image/jpeg"));
        assert_eq!(sniff_mime(b"????", "x.txt"), None);
        assert_eq!(sniff_mime(b"????", "noext"), None);
    }

    fn clean(s: &str) -> Result<String, String> {
        sanitize_svg(
            s,
            &SvgOpts {
                alt: None,
                style: "",
                fit: None,
                id_prefix: "p-",
            },
        )
    }

    #[test]
    fn keeps_benign_svg_and_prefixes_ids() {
        let o = clean(r##"<?xml version="1.0"?><!DOCTYPE svg><svg viewBox="0 0 1 1"><defs><linearGradient id="a"/></defs><path fill="url(#a)" d="M0 0" stroke="currentColor"/><use href="#a"/></svg>"##).unwrap();
        assert!(
            o.starts_with(r#"<svg viewBox="0 0 1 1" aria-hidden="true">"#),
            "{o}"
        );
        assert!(
            o.contains(r#"id="p-a""#) && o.contains("url(#p-a)") && o.contains(r##"href="#p-a""##)
        );
        assert!(o.contains("currentColor") && !o.contains("DOCTYPE") && !o.contains("<?xml"));
    }

    #[test]
    fn drops_hostile_content() {
        let hostile = [
            r#"<svg><script>alert(1)</script><rect/></svg>"#,
            r#"<svg onload="alert(1)"><rect onclick="x()" ONMOUSEOVER="y"/></svg>"#,
            r#"<svg><a href="javascript:alert(1)"><text>x</text></a></svg>"#,
            r#"<svg><a xlink:href=" java&#9;script:alert(1)"><text>x</text></a></svg>"#,
            r#"<svg><a href="https://evil.example/x"><rect/></a></svg>"#,
            r#"<svg><foreignObject><iframe src="x"></iframe><div>hi</div></foreignObject></svg>"#,
            r#"<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg><text>&xxe;</text></svg>"#,
            r#"<svg><style>@import url(https://evil.example/x.css);</style></svg>"#,
            r#"<svg><style>a{background:url(javascript:alert(1))}</style></svg>"#,
            r#"<svg><rect style="fill:url(https://evil.example/x)"/></svg>"#,
            r#"<svg><set attributeName="href" to="javascript:alert(1)"/><animate/></svg>"#,
            r#"<svg><image href="https://evil.example/t.png"/></svg>"#,
        ];
        for h in hostile {
            let o = clean(h).unwrap_or_else(|e| e);
            for bad in [
                "script",
                "onload",
                "onclick",
                "onmouseover",
                "javascript",
                "foreignObject",
                "iframe",
                "ENTITY",
                "&xxe;",
                "evil.example",
                "<set",
                "<animate",
                "<div",
                "@import",
            ] {
                assert!(
                    !o.to_ascii_lowercase().contains(&bad.to_ascii_lowercase()),
                    "{bad} survived in {o} (from {h})"
                );
            }
        }
    }

    #[test]
    fn rejects_parse_trouble() {
        for bad in [
            "",
            "plain text",
            "<svg>",
            "<svg></g>",
            "<svg/><svg/>",
            "<div/>",
            "<svg><rect a=\"x></svg>",
            "x<svg/>",
            "<svg><!-- x</svg>",
        ] {
            assert!(clean(bad).is_err(), "{bad}");
        }
    }

    #[test]
    fn root_gets_a11y_size_and_fit() {
        let o = sanitize_svg(
            r#"<svg role="presentation" aria-label="old" preserveAspectRatio="none" style="fill:red"><rect/></svg>"#,
            &SvgOpts { alt: Some("A \"logo\""), style: "inline-size:4rem", fit: Some("cover"), id_prefix: "" },
        )
        .unwrap();
        assert_eq!(
            o,
            r#"<svg role="img" aria-label="A &quot;logo&quot;" preserveAspectRatio="xMidYMid slice" style="fill:red;inline-size:4rem"><rect/></svg>"#
        );
    }

    #[test]
    fn cdata_style_is_unwrapped() {
        let o = clean("<svg><style><![CDATA[.a{fill:red}]]></style></svg>").unwrap();
        assert!(o.contains("<style>.a{fill:red}</style>"), "{o}");
    }
}
