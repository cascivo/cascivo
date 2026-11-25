//! Gate G4: emitters take classes from the generated contract consts, never from literals.

use cascivo_html::contract::button;
use std::path::Path;

/// String-literal contents of Rust source (comments, chars and lifetimes skipped).
fn literals(src: &str) -> Vec<String> {
    let b = src.as_bytes();
    let (mut i, mut out) = (0, Vec::new());
    while i < b.len() {
        match b[i] {
            b'/' if b.get(i + 1) == Some(&b'/') => {
                while i < b.len() && b[i] != b'\n' {
                    i += 1;
                }
            }
            b'/' if b.get(i + 1) == Some(&b'*') => {
                i += 2;
                while i + 1 < b.len() && !(b[i] == b'*' && b[i + 1] == b'/') {
                    i += 1;
                }
                i += 2;
            }
            b'\'' => {
                // A char literal ('x', '\n', '"'); otherwise a lifetime.
                if b.get(i + 1) == Some(&b'\\') {
                    i += 2;
                    while i < b.len() && b[i] != b'\'' {
                        i += 1;
                    }
                } else if b.get(i + 2) == Some(&b'\'') {
                    i += 2;
                } else if let Some(n) = src[i + 1..].chars().next()
                    && src[i + 1 + n.len_utf8()..].starts_with('\'')
                {
                    i += n.len_utf8() + 1;
                }
                i += 1;
            }
            b'r' if matches!(b.get(i + 1), Some(b'#' | b'"'))
                && (i == 0 || !(b[i - 1].is_ascii_alphanumeric() || b[i - 1] == b'_')) =>
            {
                let hashes = b[i + 1..].iter().take_while(|&&c| c == b'#').count();
                let start = i + 2 + hashes;
                if b.get(start - 1) != Some(&b'"') {
                    i += 1;
                    continue;
                }
                let close = format!("\"{}", "#".repeat(hashes));
                let end = src[start..].find(&close).map_or(b.len(), |e| start + e);
                out.push(src[start..end].to_string());
                i = end + close.len();
            }
            b'"' => {
                let start = i + 1;
                i += 1;
                while i < b.len() && b[i] != b'"' {
                    i += if b[i] == b'\\' { 2 } else { 1 };
                }
                out.push(src[start..i.min(b.len())].to_string());
                i += 1;
            }
            _ => i += 1,
        }
    }
    out
}

fn rs_files(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
    for e in std::fs::read_dir(dir).unwrap() {
        let p = e.unwrap().path();
        if p.is_dir() {
            rs_files(&p, out);
        } else if p.extension().is_some_and(|x| x == "rs") {
            out.push(p);
        }
    }
}

#[test]
fn literal_scanner_skips_comments_and_reads_raw_strings() {
    let l = literals(
        "// \"cv-a\"\nlet x = 'a'; fn f<'a>() {} let y = r#\"cv-b\"#; let z = \"q\\\"cv-c\";",
    );
    assert_eq!(l, vec!["cv-b", "q\\\"cv-c"]);
}

#[test]
fn no_class_literals_in_emitters() {
    let mut files = Vec::new();
    rs_files(
        &Path::new(env!("CARGO_MANIFEST_DIR")).join("src/emit"),
        &mut files,
    );
    let mut bad = Vec::new();
    for f in files
        .iter()
        .filter(|f| !f.to_string_lossy().ends_with("_gen.rs"))
    {
        let src = std::fs::read_to_string(f).unwrap();
        // Unit tests assert on rendered HTML, which carries the classes by design.
        let src = src.split("#[cfg(test)]").next().unwrap_or_default();
        for lit in literals(src) {
            if lit.contains("cv-") {
                bad.push(format!("{}: {lit:?}", f.display()));
            }
        }
    }
    assert!(
        bad.is_empty(),
        "use crate::contract consts, not literals:\n{}",
        bad.join("\n")
    );
}

#[test]
fn contract_consts_and_enums() {
    assert_eq!(button::ROOT, "cv-button-button");
    assert_eq!(button::ALIAS, "cv-button");
    assert_eq!(button::LABEL, "cv-button-label");
    assert_eq!(button::Variant::Primary.as_str(), "primary");
    assert_eq!(button::Size::parse("lg"), Some(button::Size::Lg));
    assert_eq!(button::State::parse("nope"), None);
    assert_eq!(cascivo_html::contract::CONTRACT_FORMAT, 1);
}
