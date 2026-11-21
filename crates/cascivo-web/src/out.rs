//! The rendered site as an in-memory file map, and the only code that writes it to disk.

use std::collections::BTreeMap;
use std::io;
use std::path::{Path, PathBuf};

use cascivo_html::path::is_safe_relative;

/// `about/index.html` → bytes. Keys are always safe relative paths (checked on insert).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Output {
    pub files: BTreeMap<String, Vec<u8>>,
}

pub fn mime(path: &str) -> &'static str {
    match path.rsplit('.').next().unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "xml" => "application/xml",
        "json" => "application/json",
        "txt" => "text/plain; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        _ => "application/octet-stream",
    }
}

impl Output {
    /// Adds a file; refuses unsafe paths and collisions.
    pub fn insert(&mut self, rel: String, bytes: Vec<u8>) -> Result<(), String> {
        if !is_safe_relative(&rel) || rel.starts_with("./") {
            return Err(format!("refusing output path '{rel}'"));
        }
        if self.files.contains_key(&rel) {
            return Err(format!("two sources write '{rel}'"));
        }
        self.files.insert(rel, bytes);
        Ok(())
    }

    /// Looks up a request path (`/about/`, `/cascivo.css`); `None` for traversal attempts.
    pub fn get(&self, url: &str) -> Option<(&str, &[u8])> {
        let path = url.split(['?', '#']).next().unwrap_or("");
        let rel = path.trim_start_matches('/');
        let key = if rel.is_empty() || rel.ends_with('/') {
            format!("{rel}index.html")
        } else {
            rel.to_string()
        };
        self.files
            .get_key_value(&key)
            .or_else(|| self.files.get_key_value(&format!("{key}/index.html")))
            .map(|(k, v)| (mime(k), v.as_slice()))
    }

    /// Writes every file below `dist`, creating it. Each target's parent is canonicalised and
    /// must stay inside `dist`, and an existing symlink is never written through.
    pub fn write(&self, dist: &Path) -> io::Result<()> {
        std::fs::create_dir_all(dist)?;
        let base = dist.canonicalize()?;
        for (rel, bytes) in &self.files {
            let target = checked_target(&base, rel)?;
            std::fs::write(target, bytes)?;
        }
        Ok(())
    }
}

fn checked_target(base: &Path, rel: &str) -> io::Result<PathBuf> {
    let deny = |m: String| io::Error::new(io::ErrorKind::PermissionDenied, m);
    if !is_safe_relative(rel) {
        return Err(deny(format!("refusing to write '{rel}'")));
    }
    let target = base.join(rel);
    let parent = target.parent().unwrap_or(base);
    std::fs::create_dir_all(parent)?;
    if !parent.canonicalize()?.starts_with(base) {
        return Err(deny(format!(
            "'{rel}' resolves outside the output directory"
        )));
    }
    if std::fs::symlink_metadata(&target).is_ok_and(|m| m.file_type().is_symlink()) {
        return Err(deny(format!(
            "'{rel}' is a symlink; not writing through it"
        )));
    }
    Ok(target)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn insert_rejects_escapes_and_collisions() {
        let mut o = Output::default();
        assert!(o.insert("../x".into(), vec![]).is_err());
        assert!(o.insert("/etc/x".into(), vec![]).is_err());
        o.insert("a/index.html".into(), vec![1]).unwrap();
        assert!(o.insert("a/index.html".into(), vec![]).is_err());
    }

    #[test]
    fn get_resolves_pretty_urls() {
        let mut o = Output::default();
        o.insert("index.html".into(), b"home".to_vec()).unwrap();
        o.insert("about/index.html".into(), b"about".to_vec())
            .unwrap();
        o.insert("cascivo.css".into(), b"css".to_vec()).unwrap();
        assert_eq!(o.get("/").unwrap().1, b"home");
        assert_eq!(o.get("/about/?x=1").unwrap().1, b"about");
        assert_eq!(o.get("/about").unwrap().1, b"about");
        assert_eq!(o.get("/cascivo.css").unwrap().0, "text/css; charset=utf-8");
        assert!(o.get("/../etc/passwd").is_none());
    }

    #[cfg(unix)]
    #[test]
    fn write_never_follows_symlinked_dirs_out_of_dist() {
        let tmp = std::env::temp_dir().join(format!("cvweb-out-{}", std::process::id()));
        let dist = tmp.join("dist");
        let outside = tmp.join("outside");
        std::fs::create_dir_all(&dist).unwrap();
        std::fs::create_dir_all(&outside).unwrap();
        std::os::unix::fs::symlink(&outside, dist.join("evil")).unwrap();
        let mut o = Output::default();
        o.insert("evil/index.html".into(), b"x".to_vec()).unwrap();
        let err = o.write(&dist).unwrap_err();
        let leaked = outside.join("index.html").exists();
        std::fs::remove_dir_all(&tmp).unwrap();
        assert!(err.to_string().contains("outside"), "{err}");
        assert!(!leaked);
    }
}
