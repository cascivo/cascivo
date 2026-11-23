//! `asset(path)`: copies a file from `[assets] dir` into `_cw/` under a content-hashed name.

use cascivo_html::path::is_safe_relative;

use crate::web::WebState;

/// FNV-1a 64 → 8 hex chars. Stable across runs and platforms; not cryptographic.
pub fn hash8(bytes: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in bytes {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    format!("{:08x}", h >> 32)
}

/// A stem and extension safe to put in a URL and an HTML attribute.
pub fn split_name(rel: &str) -> (String, String) {
    let file = rel.rsplit('/').next().unwrap_or(rel);
    let (stem, ext) = match file.rsplit_once('.') {
        Some((s, e)) if !s.is_empty() => (s, e),
        _ => (file, ""),
    };
    let clean = |s: &str| {
        s.chars()
            .map(|c| {
                if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                    c
                } else {
                    '-'
                }
            })
            .collect::<String>()
    };
    (clean(stem), clean(ext))
}

/// `_cw/<stem>.<hash8>[.<ext>]`
pub fn hashed_name(rel: &str, bytes: &[u8]) -> String {
    let (stem, ext) = split_name(rel);
    let h = hash8(bytes);
    if ext.is_empty() {
        format!("_cw/{stem}.{h}")
    } else {
        format!("_cw/{stem}.{h}.{ext}")
    }
}

/// Output path of a generated file (`cascivo.css`, `cascivo.js`): `_cw/<stem>.<hash8>.<ext>`
/// with `[build] hash_assets`, else `file` itself.
pub fn out_name(build: &crate::config::BuildConfig, file: &str, bytes: &[u8]) -> String {
    if build.hash_assets {
        hashed_name(file, bytes)
    } else {
        file.to_string()
    }
}

pub fn asset(state: &WebState, path: &str) -> Result<String, String> {
    let rel = path.trim_start_matches('/');
    if !is_safe_relative(rel) {
        return Err(format!("asset(): unsafe path `{path}`"));
    }
    let dir = &state.cfg.assets.dir;
    let full = state.root.join(dir).join(rel);
    let bytes = std::fs::read(&full).map_err(|e| {
        format!(
            "asset(): cannot read `{dir}/{rel}` ({}): {e}",
            full.display()
        )
    })?;
    let name = hashed_name(rel, &bytes);
    state.emit(name.clone(), bytes);
    Ok(format!("/{name}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_is_stable_and_content_sensitive() {
        assert_eq!(hash8(b""), "cbf29ce4");
        assert_eq!(hash8(b"a"), hash8(b"a"));
        assert_ne!(hash8(b"a"), hash8(b"b"));
        assert_eq!(hash8(b"x").len(), 8);
    }

    #[test]
    fn out_name_hashes_only_when_asked() {
        let mut b = crate::config::BuildConfig::default();
        assert_eq!(out_name(&b, "cascivo.css", b""), "cascivo.css");
        b.hash_assets = true;
        assert_eq!(out_name(&b, "cascivo.css", b""), "_cw/cascivo.cbf29ce4.css");
    }

    #[test]
    fn names_keep_stem_and_extension() {
        assert_eq!(hashed_name("js/copy.js", b""), "_cw/copy.cbf29ce4.js");
        assert_eq!(hashed_name("LICENSE", b""), "_cw/LICENSE.cbf29ce4");
        assert_eq!(hashed_name(".env", b""), "_cw/-env.cbf29ce4");
        assert_eq!(
            hashed_name("a b\"c.tar.gz", b""),
            "_cw/a-b-c-tar.cbf29ce4.gz"
        );
    }
}
