//! File-based routes under `pages/`: `index.md` → `/`, `about.md` → `/about/`,
//! `blog/index.html` → `/blog/`, `blog/[posts].html` → `/blog/<slug>/` per `posts` entry,
//! `404.md`/`404.html` → `/404.html` (`de/404.html` → `/de/404.html`).

#[cfg(feature = "fs")]
use std::path::Path;

use crate::content::valid_slug;
#[cfg(feature = "fs")]
use crate::error::{Error, Errors, Result};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Kind {
    /// Markdown page rendered into its front-matter `layout`.
    Markdown,
    /// minijinja template page.
    Template,
    /// Template rendered once per entry of the named collection.
    Dynamic(String),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Route {
    /// Path relative to `pages/`, `/`-separated.
    pub file: String,
    /// `/`, `/about/`, or for dynamic routes the prefix before the slug (`/blog/`).
    pub url: String,
    pub kind: Kind,
}

impl Route {
    /// The URL a dynamic route gives an entry.
    pub fn entry_url(&self, slug: &str) -> String {
        format!("{}{slug}/", self.url)
    }
}

/// Maps one `pages/`-relative file to its route, or explains why the name is not routable.
pub fn route_for(file: &str) -> std::result::Result<Route, String> {
    let (stem, kind) = if let Some(s) = file.strip_suffix(".md") {
        (s, Kind::Markdown)
    } else if let Some(s) = file.strip_suffix(".html") {
        (s, Kind::Template)
    } else {
        return Err("pages are `.md` or `.html`".into());
    };
    let mut segs: Vec<&str> = stem.split('/').collect();
    let last = segs.pop().unwrap_or_default();
    for s in &segs {
        if !valid_slug(s) {
            return Err(format!("directory `{s}` must be a slug (a-z, 0-9, '-')"));
        }
    }
    let prefix: String = segs.iter().map(|s| format!("/{s}")).collect();
    if let Some(coll) = last.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
        if kind != Kind::Template {
            return Err("a dynamic route `[collection]` must be an `.html` template".into());
        }
        if !valid_slug(coll) {
            return Err(format!("`[{coll}]` must name a collection"));
        }
        return Ok(Route {
            file: file.into(),
            url: format!("{prefix}/"),
            kind: Kind::Dynamic(coll.into()),
        });
    }
    let url = match last {
        "index" => format!("{prefix}/"),
        "404" => format!("{prefix}/404.html"),
        s if valid_slug(s) => format!("{prefix}/{s}/"),
        s => return Err(format!("`{s}` must be a slug (a-z, 0-9, '-') or `index`")),
    };
    Ok(Route {
        file: file.into(),
        url,
        kind,
    })
}

/// `/about/` as served: unchanged with trailing slashes, else `/about` (`/` and `/x.html` stay).
pub fn public_url(internal: &str, trailing_slash: bool) -> String {
    if trailing_slash || internal == "/" || !internal.ends_with('/') {
        internal.to_string()
    } else {
        internal.trim_end_matches('/').to_string()
    }
}

/// The output file of an internal URL: `/about/` → `about/index.html` (or `about.html`).
pub fn out_path(internal: &str, trailing_slash: bool) -> String {
    let rel = internal.trim_start_matches('/');
    if rel.is_empty() {
        return "index.html".into();
    }
    if rel.ends_with(".html") {
        return rel.into();
    }
    if trailing_slash {
        format!("{rel}index.html")
    } else {
        format!("{}.html", rel.trim_end_matches('/'))
    }
}

#[cfg(feature = "fs")]
/// Which names a walk skips.
#[derive(Clone, Copy)]
enum Skip {
    /// `.` and `_` names (drafts, partials).
    Private,
    /// Only OS and VCS clutter, for `public/` (`_headers`, `.well-known/` are copied).
    Junk,
}

#[cfg(feature = "fs")]
const JUNK: &[&str] = &[".DS_Store", ".git", "Thumbs.db", "desktop.ini"];

#[cfg(feature = "fs")]
fn walk(dir: &Path, rel: &str, skip: Skip, out: &mut Vec<String>) -> std::io::Result<()> {
    let mut items: Vec<_> = std::fs::read_dir(dir)?.flatten().collect();
    items.sort_by_key(std::fs::DirEntry::file_name);
    for e in items {
        let name = e.file_name().to_string_lossy().into_owned();
        let skipped = match skip {
            Skip::Private => name.starts_with('.') || name.starts_with('_'),
            Skip::Junk => JUNK.contains(&name.as_str()) || name.starts_with("._"),
        };
        if skipped {
            continue;
        }
        let r = if rel.is_empty() {
            name
        } else {
            format!("{rel}/{name}")
        };
        let ft = e.file_type()?;
        // Symlinks are skipped so a page can never pull in a file from outside the site.
        if ft.is_dir() {
            walk(&e.path(), &r, skip, out)?;
        } else if ft.is_file() {
            out.push(r);
        }
    }
    Ok(())
}

#[cfg(feature = "fs")]
/// Every file below `dir` (sorted, `/`-separated); dot- and underscore-files skipped.
pub fn list_files(dir: &Path) -> std::io::Result<Vec<String>> {
    list(dir, Skip::Private)
}

#[cfg(feature = "fs")]
/// Every file below `dir` except OS/VCS clutter (`.DS_Store`, `.git`, `Thumbs.db`, `._*`).
pub fn list_public(dir: &Path) -> std::io::Result<Vec<String>> {
    list(dir, Skip::Junk)
}

#[cfg(feature = "fs")]
fn list(dir: &Path, skip: Skip) -> std::io::Result<Vec<String>> {
    let mut out = Vec::new();
    if dir.is_dir() {
        walk(dir, "", skip, &mut out)?;
    }
    Ok(out)
}

#[cfg(feature = "fs")]
/// Every route under `root/pages`; duplicates (`about.md` + `about/index.md`) are errors.
pub fn scan(root: &Path) -> Result<Vec<Route>> {
    let files =
        list_files(&root.join("pages")).map_err(|e| Errors::one("pages", None, e.to_string()))?;
    let mut routes: Vec<Route> = Vec::new();
    let mut errs = Vec::new();
    for f in files {
        match route_for(&f) {
            Ok(r) => {
                if let Some(o) = routes.iter().find(|o| o.url == r.url && o.kind == r.kind) {
                    errs.push(Error::new(
                        format!("pages/{f}"),
                        None,
                        format!("route {} is also produced by pages/{}", r.url, o.file),
                    ));
                } else {
                    routes.push(r);
                }
            }
            Err(m) => errs.push(Error::new(format!("pages/{f}"), None, m)),
        }
    }
    if errs.is_empty() {
        Ok(routes)
    } else {
        Err(Errors(errs))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_files_to_urls() {
        let u = |f: &str| route_for(f).unwrap().url;
        assert_eq!(u("index.md"), "/");
        assert_eq!(u("about.md"), "/about/");
        assert_eq!(u("blog/index.html"), "/blog/");
        assert_eq!(u("docs/intro.md"), "/docs/intro/");
        let d = route_for("blog/[posts].html").unwrap();
        assert_eq!(d.kind, Kind::Dynamic("posts".into()));
        assert_eq!(d.entry_url("hello"), "/blog/hello/");
        assert_eq!(u("404.html"), "/404.html");
        assert_eq!(u("404.md"), "/404.html");
        assert_eq!(u("de/404.html"), "/de/404.html");
    }

    #[test]
    fn trailing_slash_styles() {
        assert_eq!(public_url("/a/b/", true), "/a/b/");
        assert_eq!(public_url("/a/b/", false), "/a/b");
        assert_eq!(public_url("/", false), "/");
        assert_eq!(public_url("/404.html", false), "/404.html");
        assert_eq!(out_path("/", false), "index.html");
        assert_eq!(out_path("/a/b/", true), "a/b/index.html");
        assert_eq!(out_path("/a/b/", false), "a/b.html");
        assert_eq!(out_path("/de/404.html", true), "de/404.html");
    }

    #[cfg(feature = "fs")]
    #[test]
    fn public_listing_keeps_dot_and_underscore_files() {
        let dir = std::env::temp_dir().join(format!("cvweb-public-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join(".well-known")).unwrap();
        std::fs::create_dir_all(dir.join(".git")).unwrap();
        for f in [
            "_headers",
            "_redirects",
            ".well-known/security.txt",
            ".DS_Store",
            ".git/HEAD",
            "a.txt",
        ] {
            std::fs::write(dir.join(f), "x").unwrap();
        }
        let all = list_public(&dir).unwrap();
        let private = list_files(&dir).unwrap();
        std::fs::remove_dir_all(&dir).unwrap();
        assert_eq!(
            all,
            [
                ".well-known/security.txt",
                "_headers",
                "_redirects",
                "a.txt"
            ]
        );
        assert_eq!(private, ["a.txt"]);
    }

    #[test]
    fn rejects_unroutable_names() {
        for f in [
            "About.md",
            "a b.md",
            "x.txt",
            "[posts].md",
            "../x.md",
            "a/../b.md",
        ] {
            assert!(route_for(f).is_err(), "{f}");
        }
    }

    #[cfg(feature = "fs")]
    #[test]
    fn duplicate_routes_are_errors() {
        let dir = std::env::temp_dir().join(format!("cvweb-routes-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("pages/about")).unwrap();
        std::fs::write(dir.join("pages/about.md"), "").unwrap();
        std::fs::write(dir.join("pages/about/index.md"), "").unwrap();
        let e = scan(&dir).unwrap_err();
        std::fs::remove_dir_all(&dir).unwrap();
        assert!(
            e.to_string().contains("route /about/ is also produced"),
            "{e}"
        );
    }
}
