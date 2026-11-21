//! `css_bundle(hrefs, name="bundle")`: concatenates Vite CSS files (in the order given, which
//! `vite_css` makes dependencies-first) into one content-hashed `/_cw/<name>.<hash>.css`.
//!
//! Why: every render-blocking stylesheet costs a round trip on a cold HTTP/1.1 or slow link.
//! Bundling must not change the cascade, so top-level `@layer a, b;` order statements are
//! hoisted to the top (deduplicated, first occurrence wins): layer order is fixed by the first
//! statement that names a layer, and a later file must not be able to reorder it.

use std::path::{Path, PathBuf};

use crate::assets::hashed_name;
use crate::web::WebState;

/// Where the files named by a manifest live: the manifest's directory, or its parent when the
/// manifest sits in Vite's `.vite/` folder.
pub fn dist_dir(manifest: &Path) -> PathBuf {
    let dir = manifest.parent().unwrap_or(Path::new(""));
    if dir.file_name().is_some_and(|n| n == ".vite") {
        dir.parent().unwrap_or(dir).to_path_buf()
    } else {
        dir.to_path_buf()
    }
}

/// Splits `css` into (top-level `@layer …;` statements, everything else). Understands comments,
/// strings and nesting; anything it does not recognise stays where it was.
pub fn hoist_layer_statements(css: &str) -> (Vec<String>, String) {
    let b = css.as_bytes();
    let (mut stmts, mut rest) = (Vec::new(), String::new());
    let (mut depth, mut i, mut keep_from) = (0usize, 0usize, 0usize);
    while i < b.len() {
        match b[i] {
            b'/' if b.get(i + 1) == Some(&b'*') => {
                i = css[i + 2..].find("*/").map_or(b.len(), |e| i + 2 + e + 2);
                continue;
            }
            q @ (b'"' | b'\'') => {
                i += 1;
                while i < b.len() && b[i] != q {
                    i += if b[i] == b'\\' { 2 } else { 1 };
                }
            }
            b'{' => depth += 1,
            b'}' => depth = depth.saturating_sub(1),
            b'@' if depth == 0 && css[i..].starts_with("@layer") => {
                // A statement has `;` before any `{`; a block is left alone.
                let tail = &css[i..];
                if let (Some(semi), brace) = (tail.find(';'), tail.find('{'))
                    && brace.is_none_or(|b| semi < b)
                {
                    rest.push_str(&css[keep_from..i]);
                    stmts.push(tail[..=semi].trim().to_string());
                    i += semi;
                    keep_from = i + 1;
                }
            }
            _ => {}
        }
        i += 1;
    }
    rest.push_str(&css[keep_from.min(css.len())..]);
    (stmts, rest)
}

/// Relative `url()`s would resolve against `/_cw/` after bundling; refuse them.
fn first_relative_url(css: &str) -> Option<String> {
    let mut s = css;
    while let Some(p) = s.find("url(") {
        s = &s[p + 4..];
        let end = s.find(')').unwrap_or(s.len());
        let u = s[..end].trim().trim_matches(['"', '\'']);
        if !(u.is_empty()
            || u.starts_with('/')
            || u.starts_with('#')
            || u.starts_with("data:")
            || u.contains("://"))
        {
            return Some(u.to_string());
        }
    }
    None
}

pub fn bundle(state: &WebState, hrefs: &[String], name: &str) -> Result<String, String> {
    if hrefs.is_empty() {
        return Err("css_bundle(): no stylesheets given".into());
    }
    let dist = state
        .cfg
        .vite
        .manifest
        .as_ref()
        .map(|m| dist_dir(&state.root.join(m)))
        .ok_or("css_bundle(): needs `[vite] manifest` in site.toml")?;
    let (mut layers, mut body) = (Vec::<String>::new(), String::new());
    let mut seen = Vec::<&str>::new();
    for href in hrefs {
        if seen.contains(&href.as_str()) {
            continue;
        }
        seen.push(href);
        let rel = href.trim_start_matches('/');
        if !cascivo_html::path::is_safe_relative(rel) {
            return Err(format!("css_bundle(): unsafe path `{href}`"));
        }
        let css = std::fs::read_to_string(dist.join(rel)).map_err(|e| {
            format!(
                "css_bundle(): cannot read `{rel}` in {}: {e}",
                dist.display()
            )
        })?;
        if let Some(u) = first_relative_url(&css) {
            return Err(format!(
                "css_bundle(): `{rel}` has a relative url(`{u}`); it would break once moved to /_cw/"
            ));
        }
        let (stmts, rest) = hoist_layer_statements(&css);
        for s in stmts {
            if !layers.contains(&s) {
                layers.push(s);
            }
        }
        body.push_str(rest.trim());
        body.push('\n');
    }
    let mut out = layers.join("\n");
    if !out.is_empty() {
        out.push('\n');
    }
    out.push_str(&body);
    let file = hashed_name(&format!("{name}.css"), out.as_bytes());
    state.emit(file.clone(), out.into_bytes());
    Ok(format!("/{file}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hoists_statements_not_blocks() {
        let css = "@layer a,b;\n.x{c:d}\n@layer a{.y{z:1}}\n/* @layer no; */\n@media (x){@layer q;}\n@layer c ;.w{}";
        let (s, rest) = hoist_layer_statements(css);
        assert_eq!(s, ["@layer a,b;", "@layer c ;"]);
        assert!(rest.contains("@layer a{.y{z:1}}") && rest.contains("@media (x){@layer q;}"));
        assert!(rest.contains("/* @layer no; */") && !rest.contains("@layer a,b"));
    }

    #[test]
    fn strings_do_not_confuse_the_scanner() {
        let (s, rest) = hoist_layer_statements("a::after{content:\"{ @layer x;\"}\n@layer k;");
        assert_eq!(s, ["@layer k;"]);
        assert!(rest.contains("content:\"{ @layer x;\""));
    }

    #[test]
    fn dist_dir_skips_dot_vite() {
        assert_eq!(
            dist_dir(Path::new("/s/dist/.vite/m.json")),
            Path::new("/s/dist")
        );
        assert_eq!(dist_dir(Path::new("/s/vite/m.json")), Path::new("/s/vite"));
    }

    #[test]
    fn relative_urls_are_found() {
        assert_eq!(
            first_relative_url("a{b:url(x.png)}").as_deref(),
            Some("x.png")
        );
        assert_eq!(
            first_relative_url("a{b:url( \"../f.woff\")}").as_deref(),
            Some("../f.woff")
        );
        assert!(
            first_relative_url("a{b:url(/a.png) url(data:x) url(#i) url(https://h/x)}").is_none()
        );
    }
}
