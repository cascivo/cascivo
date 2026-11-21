//! File-based routes under `pages/`: `index.md` → `/`, `about.md` → `/about/`,
//! `blog/index.html` → `/blog/`, `blog/[posts].html` → `/blog/<slug>/` per `posts` entry.

use std::path::Path;

use crate::content::valid_slug;
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
        s if valid_slug(s) => format!("{prefix}/{s}/"),
        s => return Err(format!("`{s}` must be a slug (a-z, 0-9, '-') or `index`")),
    };
    Ok(Route {
        file: file.into(),
        url,
        kind,
    })
}

fn walk(dir: &Path, rel: &str, out: &mut Vec<String>) -> std::io::Result<()> {
    let mut items: Vec<_> = std::fs::read_dir(dir)?.flatten().collect();
    items.sort_by_key(std::fs::DirEntry::file_name);
    for e in items {
        let name = e.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') || name.starts_with('_') {
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
            walk(&e.path(), &r, out)?;
        } else if ft.is_file() {
            out.push(r);
        }
    }
    Ok(())
}

/// Every file below `dir` (sorted, `/`-separated); dot- and underscore-files skipped.
pub fn list_files(dir: &Path) -> std::io::Result<Vec<String>> {
    let mut out = Vec::new();
    if dir.is_dir() {
        walk(dir, "", &mut out)?;
    }
    Ok(out)
}

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
