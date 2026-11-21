//! The `cascivo-web new` starter site, embedded in the binary.
//!
//! Files use `__NAME__` (not `{{ }}`, which minijinja layouts own) as the project-name
//! placeholder, substituted only in the files listed in [`NAMED`].

use std::path::Path;

/// Files whose `__NAME__` placeholder is replaced with the project name.
const NAMED: &[&str] = &["wrangler.jsonc", "README.md", "site.toml"];

macro_rules! starter {
    ($($p:literal),* $(,)?) => {
        &[$(($p, include_str!(concat!("../starter/", $p)))),*]
    };
}

const FILES: &[(&str, &str)] = starter![
    "site.toml",
    "wrangler.jsonc",
    "README.md",
    ".gitignore",
    "layouts/default.html",
    "layouts/post.html",
    "content/posts/_schema.toml",
    "content/posts/hello-world.md",
    "content/posts/components-in-markdown.md",
    "pages/index.md",
    "pages/about.md",
    "pages/blog/index.html",
    "pages/blog/[posts].html",
    "public/favicon.svg",
    "public/404.html",
];

/// Relative path → contents of the starter, with `name` substituted where it applies.
pub fn files(name: &str) -> Vec<(&'static str, String)> {
    FILES
        .iter()
        .map(|(p, c)| {
            let body = if NAMED.contains(p) {
                c.replace("__NAME__", name)
            } else {
                (*c).to_string()
            };
            (*p, body)
        })
        .collect()
}

/// Lowercases and reduces to `[a-z0-9-]`; falls back to `site`.
fn slug(raw: &str) -> String {
    let mut out = String::new();
    for c in raw.chars().flat_map(char::to_lowercase) {
        if c.is_ascii_alphanumeric() {
            out.push(c);
        } else if !out.ends_with('-') {
            out.push('-');
        }
    }
    let s = out.trim_matches('-');
    if s.is_empty() {
        "site".into()
    } else {
        s.into()
    }
}

/// Writes the starter into `dir` (which must not exist or be empty) and returns the written paths.
pub fn create(dir: &Path) -> Result<Vec<String>, String> {
    if dir.exists() {
        let mut entries = std::fs::read_dir(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
        if entries.next().is_some() {
            return Err(format!("{} already exists and is not empty", dir.display()));
        }
    }
    let abs = std::path::absolute(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let name = slug(
        &abs.file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
    );
    let mut written = Vec::new();
    for (rel, body) in files(&name) {
        let target = dir.join(rel);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
        }
        std::fs::write(&target, body).map_err(|e| format!("{}: {e}", target.display()))?;
        written.push(rel.to_string());
    }
    Ok(written)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(tag: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("cvweb-starter-{tag}-{}", std::process::id()))
    }

    #[test]
    fn slug_sanitises() {
        assert_eq!(slug("My Site!"), "my-site");
        assert_eq!(slug("___"), "site");
        assert_eq!(slug(""), "site");
    }

    #[test]
    fn name_only_in_named_files_and_layouts_untouched() {
        let f = files("demo");
        let get = |p: &str| f.iter().find(|(r, _)| *r == p).unwrap().1.clone();
        assert!(get("wrangler.jsonc").contains("\"name\": \"demo\""));
        assert!(get("site.toml").contains("title = \"demo\""));
        assert!(get("layouts/default.html").contains("{{ page.title }} · {{ site.title }}"));
        assert!(f.iter().all(|(_, c)| !c.contains("__NAME__")));
    }

    #[test]
    fn create_writes_and_refuses_non_empty() {
        let d = tmp("create").join("My Blog");
        let _ = std::fs::remove_dir_all(tmp("create"));
        let written = create(&d).unwrap();
        assert!(written.iter().any(|p| p == "pages/blog/[posts].html"));
        let w = std::fs::read_to_string(d.join("wrangler.jsonc")).unwrap();
        assert!(w.contains("\"name\": \"my-blog\""));
        assert!(create(&d).unwrap_err().contains("not empty"));
        let _ = std::fs::remove_dir_all(tmp("create"));
    }

    #[test]
    fn starter_builds() {
        let d = tmp("build").join("site");
        let _ = std::fs::remove_dir_all(tmp("build"));
        create(&d).unwrap();
        let site = crate::Site::load(&d).unwrap();
        let out = site.render().unwrap();
        for f in [
            "index.html",
            "blog/hello-world/index.html",
            "cascivo.css",
            "404.html",
        ] {
            assert!(out.files.contains_key(f), "missing {f}");
        }
        let _ = std::fs::remove_dir_all(tmp("build"));
    }
}
