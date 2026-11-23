//! Vite build output as template data: `manifest.json` (entry → hashed file, css, imports) and
//! the CSS-modules map (`x.module.css` → local class → hashed class).

use std::collections::{BTreeMap, BTreeSet};

use cascivo_html::html::esc;
use serde::Deserialize;

#[derive(Debug, Default, Deserialize)]
struct Chunk {
    file: String,
    #[serde(default)]
    css: Vec<String>,
    #[serde(default)]
    imports: Vec<String>,
}

type Classes = BTreeMap<String, String>;

#[derive(Debug, Default)]
pub struct Vite {
    manifest: Option<BTreeMap<String, Chunk>>,
    modules: Option<BTreeMap<String, Classes>>,
}

/// Up to `n` keys, for "did you mean" lists in errors.
fn listing<'a>(keys: impl Iterator<Item = &'a String>, n: usize) -> String {
    let all: Vec<&String> = keys.collect();
    let mut s = all
        .iter()
        .take(n)
        .map(|k| format!("`{k}`"))
        .collect::<Vec<_>>()
        .join(", ");
    if all.len() > n {
        s.push_str(&format!(", … ({} more)", all.len() - n));
    }
    s
}

fn url(path: &str) -> String {
    let mut s = String::from("/");
    esc(&mut s, path);
    s
}

impl Vite {
    pub fn parse(manifest: Option<&str>, modules: Option<&str>) -> Result<Self, String> {
        Ok(Self {
            manifest: manifest
                .map(|s| serde_json::from_str(s).map_err(|e| format!("vite.manifest: {e}")))
                .transpose()?,
            modules: modules
                .map(|s| serde_json::from_str(s).map_err(|e| format!("vite.css_modules: {e}")))
                .transpose()?,
        })
    }

    fn chunks(&self) -> Result<&BTreeMap<String, Chunk>, String> {
        self.manifest
            .as_ref()
            .ok_or_else(|| "no `[vite] manifest` in site.toml".to_string())
    }

    fn chunk(&self, entry: &str) -> Result<&Chunk, String> {
        let m = self.chunks()?;
        m.get(entry).ok_or_else(|| {
            format!(
                "unknown vite entry `{entry}`; manifest has {}",
                listing(m.keys(), 12)
            )
        })
    }

    /// `/` + the entry's output file (HTML-escaped; `/` is kept).
    pub fn url(&self, entry: &str) -> Result<String, String> {
        self.chunk(entry).map(|c| url(&c.file))
    }

    /// CSS of an entry and of its static imports, dependencies first, each file once.
    pub fn css(&self, entry: &str) -> Result<Vec<String>, String> {
        let mut out = Vec::new();
        self.walk(entry, &mut BTreeSet::new(), &mut out)?;
        Ok(out.iter().map(|f| url(f)).collect())
    }

    fn walk<'a>(
        &'a self,
        key: &'a str,
        seen: &mut BTreeSet<&'a str>,
        out: &mut Vec<&'a str>,
    ) -> Result<(), String> {
        if !seen.insert(key) {
            return Ok(());
        }
        let c = self.chunk(key)?;
        for i in &c.imports {
            self.walk(i, seen, out)?;
        }
        for f in &c.css {
            if !out.contains(&f.as_str()) {
                out.push(f);
            }
        }
        Ok(())
    }

    /// Hashed class for `class` of the CSS module whose file stem is `module`
    /// (`stat` → `…/stat.module.css`; a path tail like `stat/stat` also works).
    pub fn class(&self, module: &str, class: &str) -> Result<String, String> {
        let mods = self
            .modules
            .as_ref()
            .ok_or_else(|| "no `[vite] css_modules` in site.toml".to_string())?;
        let stem = module.trim_start_matches('/');
        let stem = stem.strip_suffix(".module.css").unwrap_or(stem);
        let tail = format!("/{stem}.module.css");
        let hits: Vec<(&String, &Classes)> = mods
            .iter()
            .filter(|(p, _)| p.ends_with(&tail) || p.as_str() == &tail[1..])
            .collect();
        match hits.as_slice() {
            [] => Err(format!(
                "no CSS module `{module}`; known: {}",
                listing(mods.keys(), 12)
            )),
            [(_, classes)] => classes.get(class).cloned().ok_or_else(|| {
                format!(
                    "CSS module `{module}` has no class `{class}`; classes: {}",
                    listing(classes.keys(), 24)
                )
            }),
            many => Err(format!(
                "CSS module `{module}` is ambiguous; candidates: {}",
                many.iter()
                    .map(|(p, _)| format!("`{p}`"))
                    .collect::<Vec<_>>()
                    .join(", ")
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MANIFEST: &str = r#"{
      "src/a.tsx": {"file":"assets/a-1.js","isEntry":true,"css":["assets/a-1.css"],"imports":["_shared.js","_other.js"]},
      "_shared.js": {"file":"assets/shared-2.js","css":["assets/shared-2.css"],"imports":["_other.js"]},
      "_other.js": {"file":"assets/other-3.js","css":["assets/other-3.css","assets/a-1.css"]},
      "src/b.tsx": {"file":"assets/b&b.js"}
    }"#;
    const MODULES: &str = r#"{
      "packages/components/src/stat/stat.module.css": {"value":"_value_x_1","label":"_label_x_2"},
      "apps/site/src/a/card.module.css": {"title":"_t_a"},
      "apps/site/src/b/card.module.css": {"title":"_t_b"},
      "button.module.css": {"root":"_root_b"}
    }"#;

    fn v() -> Vite {
        Vite::parse(Some(MANIFEST), Some(MODULES)).unwrap()
    }

    #[test]
    fn url_and_unknown_entry() {
        assert_eq!(v().url("src/a.tsx").unwrap(), "/assets/a-1.js");
        assert_eq!(v().url("src/b.tsx").unwrap(), "/assets/b&amp;b.js");
        let e = v().url("src/zzz.tsx").unwrap_err();
        assert!(
            e.contains("unknown vite entry `src/zzz.tsx`") && e.contains("`src/a.tsx`"),
            "{e}"
        );
    }

    #[test]
    fn css_is_recursive_deduped_dependencies_first() {
        assert_eq!(
            v().css("src/a.tsx").unwrap(),
            [
                "/assets/other-3.css",
                "/assets/a-1.css",
                "/assets/shared-2.css"
            ]
        );
        assert!(v().css("src/b.tsx").unwrap().is_empty());
        assert!(v().css("nope").is_err());
    }

    #[test]
    fn class_matches_by_suffix() {
        assert_eq!(v().class("stat", "value").unwrap(), "_value_x_1");
        assert_eq!(v().class("stat.module.css", "label").unwrap(), "_label_x_2");
        assert_eq!(v().class("stat/stat", "label").unwrap(), "_label_x_2");
        assert_eq!(v().class("button", "root").unwrap(), "_root_b");
    }

    #[test]
    fn class_errors_list_candidates() {
        let e = v().class("card", "title").unwrap_err();
        assert!(
            e.contains("ambiguous") && e.contains("src/a/card") && e.contains("src/b/card"),
            "{e}"
        );
        let e = v().class("stat", "nope").unwrap_err();
        assert!(e.contains("`value`") && e.contains("`label`"), "{e}");
        let e = v().class("zzz", "x").unwrap_err();
        assert!(
            e.contains("no CSS module `zzz`") && e.contains("stat.module.css"),
            "{e}"
        );
    }

    #[test]
    fn unconfigured_and_malformed() {
        assert!(
            Vite::default()
                .url("x")
                .unwrap_err()
                .contains("[vite] manifest")
        );
        assert!(
            Vite::default()
                .class("x", "y")
                .unwrap_err()
                .contains("css_modules")
        );
        assert!(
            Vite::parse(Some("{"), None)
                .unwrap_err()
                .starts_with("vite.manifest")
        );
    }
}
