//! Locales: `/de/...` routes, per-locale collections with fallback, message bundles and the
//! alternates behind `hreflang` links and the sitemap.
//!
//! ```toml
//! [i18n]
//! default = "en"            # served at `/`
//! locales = ["en", "de"]    # others at `/<locale>/`
//! fallback = true           # default: untranslated pages and entries reuse the default text
//! ```
//!
//! - Pages: `pages/about.md` is the default locale; `pages/de/about.md` translates it. With
//!   `fallback`, a page without a translation renders its default source at `/de/about/`.
//! - Collections: `content/posts/hello.md` is the default; `content/posts/de/hello.md` is its
//!   translation (same slug). Entries carry `locale`: the language their text is in.
//! - Messages: `i18n/<locale>.toml`, flat or nested string tables; `{{ t('nav.home') }}`, with
//!   `{name}` placeholders filled from keyword arguments: `t('hi', name=user)`.
//!
//! Bundles are plain TOML rather than Fluent: static pages need lookup and interpolation, not
//! runtime plural selection, and TOML is already the site's config format (no new dependency).

use std::collections::BTreeMap;
use std::path::Path;

use minijinja::value::{Kwargs, Value};
use serde::{Deserialize, Serialize};

use crate::content::{Collection, Entry, valid_slug};
use crate::error::{Error, Errors, Result};
use crate::routes::{Kind, list_files};
use crate::site::Site;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct I18n {
    pub default: String,
    pub locales: Vec<String>,
    #[serde(default = "yes")]
    pub fallback: bool,
}

fn yes() -> bool {
    true
}

/// Flattened message bundles: locale → `nav.home` → text.
pub type Messages = BTreeMap<String, BTreeMap<String, String>>;

fn flatten(
    prefix: &str,
    t: &toml::Table,
    out: &mut BTreeMap<String, String>,
    bad: &mut Vec<String>,
) {
    for (k, v) in t {
        let key = if prefix.is_empty() {
            k.clone()
        } else {
            format!("{prefix}.{k}")
        };
        match v {
            toml::Value::String(s) => {
                out.insert(key, s.clone());
            }
            toml::Value::Table(t) => flatten(&key, t, out, bad),
            _ => bad.push(key),
        }
    }
}

/// Reads `i18n/<locale>.toml`. A missing `i18n/` is no messages.
pub fn load_messages(root: &Path) -> Result<Messages> {
    let dir = root.join("i18n");
    let files = list_files(&dir).map_err(|e| Errors::one("i18n", None, e.to_string()))?;
    let mut out = Messages::new();
    let mut errs = Vec::new();
    for f in files {
        let rel = format!("i18n/{f}");
        let Some(loc) = f.strip_suffix(".toml").filter(|l| !l.contains('/')) else {
            errs.push(Error::new(
                &rel,
                None,
                "message bundles are i18n/<locale>.toml",
            ));
            continue;
        };
        let src = match std::fs::read_to_string(dir.join(&f)) {
            Ok(s) => s,
            Err(e) => {
                errs.push(Error::new(&rel, None, e.to_string()));
                continue;
            }
        };
        match toml::from_str::<toml::Table>(&src) {
            Ok(t) => {
                let (mut m, mut bad) = (BTreeMap::new(), Vec::new());
                flatten("", &t, &mut m, &mut bad);
                for k in bad {
                    errs.push(Error::new(
                        &rel,
                        None,
                        format!("message `{k}` must be a string"),
                    ));
                }
                out.insert(loc.to_string(), m);
            }
            Err(e) => {
                let line = e.span().map(|s| crate::config::line_of(&src, s.start));
                errs.push(Error::new(&rel, line, e.message().to_string()));
            }
        }
    }
    if errs.is_empty() {
        Ok(out)
    } else {
        Err(Errors(errs))
    }
}

/// Configuration and directory names that do not fit the configured locales.
pub fn validate(site: &Site) -> Vec<Error> {
    let mut errs = Vec::new();
    let cfg = &site.config;
    let known: Vec<&str> = match &cfg.i18n {
        Some(i) => {
            let mut seen = Vec::new();
            for l in &i.locales {
                if !valid_slug(l) {
                    errs.push(Error::new(
                        "site.toml",
                        None,
                        format!("[i18n] locale `{l}` must be lowercase a-z, 0-9, '-' (it is a URL segment)"),
                    ));
                }
                if seen.contains(&l.as_str()) {
                    errs.push(Error::new(
                        "site.toml",
                        None,
                        format!("[i18n] locale `{l}` is listed twice"),
                    ));
                }
                seen.push(l);
            }
            if !i.locales.contains(&i.default) {
                errs.push(Error::new(
                    "site.toml",
                    None,
                    format!("[i18n] default `{}` is not in locales", i.default),
                ));
            }
            seen
        }
        None => vec![cfg.lang.as_str()],
    };
    for (name, c) in &site.collections {
        for loc in c.locales.keys() {
            let msg = match &cfg.i18n {
                None => "locale directories need [i18n] in site.toml".to_string(),
                Some(i) if *loc == i.default => format!(
                    "`{loc}` is the default locale; its entries live directly in content/{name}/"
                ),
                Some(i) if !i.locales.contains(loc) => {
                    format!(
                        "`{loc}` is not a configured locale ({})",
                        i.locales.join(", ")
                    )
                }
                Some(_) => continue,
            };
            errs.push(Error::new(format!("content/{name}/{loc}"), None, msg));
        }
    }
    for loc in site.messages.keys() {
        if !known.contains(&loc.as_str()) {
            errs.push(Error::new(
                format!("i18n/{loc}.toml"),
                None,
                format!("`{loc}` is not a configured locale ({})", known.join(", ")),
            ));
        }
    }
    if let Some(i) = &cfg.i18n {
        for r in &site.routes {
            if r.file.starts_with(&format!("{}/", i.default)) {
                errs.push(Error::new(
                    format!("pages/{}", r.file),
                    None,
                    format!(
                        "`{}` is the default locale; its pages live directly in pages/",
                        i.default
                    ),
                ));
            }
        }
    }
    errs
}

/// One locale's slice of the site: routes and collections already resolved for that locale.
#[derive(Debug, Clone)]
pub struct View {
    pub locale: String,
    /// `""` for the default locale, else `/<locale>`.
    pub prefix: String,
    /// The site as this locale sees it: `config.lang` is the locale, `public` is empty.
    pub site: Site,
    /// (alternate key, URL): the key is the default-locale URL the page translates.
    pub keys: Vec<(String, String)>,
}

fn tag(e: &Entry, schema_has_locale: bool, loc: &str) -> Entry {
    let mut e = e.clone();
    if !schema_has_locale {
        e.data
            .insert("locale".into(), toml::Value::String(loc.into()));
    }
    e
}

fn localize(c: &Collection, i: &I18n, loc: Option<&str>) -> Collection {
    let own = c.schema.fields.contains_key("locale");
    let mut by_slug: BTreeMap<&str, Entry> = BTreeMap::new();
    if loc.is_none() || i.fallback {
        for e in &c.entries {
            by_slug.insert(&e.slug, tag(e, own, &i.default));
        }
    }
    if let Some(l) = loc {
        for e in c.locales.get(l).into_iter().flatten() {
            by_slug.insert(&e.slug, tag(e, own, l));
        }
    }
    Collection {
        name: c.name.clone(),
        schema: c.schema.clone(),
        entries: by_slug.into_values().collect(),
        locales: BTreeMap::new(),
    }
}

/// Every route URL and dynamic entry URL a view renders, keyed by its default-locale URL.
fn keys_of(site: &Site, default_urls: &BTreeMap<String, String>) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for r in &site.routes {
        let key = default_urls
            .get(&r.file)
            .cloned()
            .unwrap_or_else(|| r.url.clone());
        match &r.kind {
            Kind::Dynamic(c) => {
                for e in site.collections.get(c).map_or(&[][..], |c| &c.entries) {
                    out.push((format!("{key}{}/", e.slug), r.entry_url(&e.slug)));
                }
            }
            _ => out.push((key, r.url.clone())),
        }
    }
    out
}

/// The locale views to render, default locale first. Without `[i18n]`: the site as-is.
pub fn views(site: &Site) -> Vec<View> {
    let mut base = site.clone();
    base.public = BTreeMap::new();
    let Some(i) = &site.config.i18n else {
        let keys = keys_of(&base, &BTreeMap::new());
        return vec![View {
            locale: site.config.lang.clone(),
            prefix: String::new(),
            site: base,
            keys,
        }];
    };
    let others: Vec<&String> = i.locales.iter().filter(|l| **l != i.default).collect();
    let local_to = |file: &str| {
        others
            .iter()
            .find(|l| file.starts_with(&format!("{l}/")))
            .copied()
    };
    let defaults: Vec<_> = site
        .routes
        .iter()
        .filter(|r| local_to(&r.file).is_none())
        .collect();
    // Route source file (as rendered in any view) → the default URL it translates.
    let mut key_of: BTreeMap<String, String> = BTreeMap::new();
    for r in &defaults {
        key_of.insert(r.file.clone(), r.url.clone());
    }
    let mut out = Vec::new();
    for loc in std::iter::once(&i.default).chain(others.iter().copied()) {
        let mut v = base.clone();
        v.config.lang = loc.clone();
        let is_default = *loc == i.default;
        let prefix = if is_default {
            String::new()
        } else {
            format!("/{loc}")
        };
        v.collections = site
            .collections
            .iter()
            .map(|(n, c)| {
                (
                    n.clone(),
                    localize(c, i, (!is_default).then_some(loc.as_str())),
                )
            })
            .collect();
        let mut keys = BTreeMap::new();
        v.routes = if is_default {
            defaults.iter().map(|r| (*r).clone()).collect()
        } else {
            let mut rs = Vec::new();
            for d in &defaults {
                let file = format!("{loc}/{}", d.file);
                let own = site.routes.iter().find(|r| r.file == file);
                if let Some(r) = own {
                    keys.insert(r.file.clone(), d.url.clone());
                    rs.push(r.clone());
                } else if i.fallback {
                    let mut r = (*d).clone();
                    r.url = format!("{prefix}{}", d.url);
                    rs.push(r);
                }
            }
            for r in &site.routes {
                if local_to(&r.file) == Some(loc) && !rs.iter().any(|x| x.file == r.file) {
                    rs.push(r.clone());
                }
            }
            rs
        };
        for r in &v.routes {
            if !keys.contains_key(&r.file)
                && let Some(k) = key_of.get(&r.file)
            {
                keys.insert(r.file.clone(), k.clone());
            }
        }
        let keys = keys_of(&v, &keys);
        out.push(View {
            locale: loc.clone(),
            prefix,
            site: v,
            keys,
        });
    }
    out
}

/// URL → every (locale, URL) rendering the same page, the URL's own included, default first.
/// Empty for single-locale sites, so they render exactly as before.
pub fn alternates(views: &[View]) -> BTreeMap<String, Vec<(String, String)>> {
    if views.len() < 2 {
        return BTreeMap::new();
    }
    let mut groups: BTreeMap<&str, Vec<(String, String)>> = BTreeMap::new();
    for v in views {
        for (k, u) in &v.keys {
            groups
                .entry(k)
                .or_default()
                .push((v.locale.clone(), u.clone()));
        }
    }
    let mut out = BTreeMap::new();
    for g in groups.into_values() {
        for (_, u) in &g {
            out.insert(u.clone(), g.clone());
        }
    }
    out
}

/// The template value for `alternates`: a list of `{ locale, url, href }`; `href` is absolute
/// (`base_url` + `url`, HTML-escaped) for `<link rel="alternate" hreflang>`.
pub fn alternates_value(base: &str, alts: Option<&Vec<(String, String)>>) -> Value {
    let base = base.trim_end_matches('/');
    let items: Vec<Value> = alts
        .into_iter()
        .flatten()
        .map(|(l, u)| {
            let mut href = String::new();
            cascivo_html::html::esc(&mut href, &format!("{base}{u}"));
            Value::from(BTreeMap::from([
                ("locale", Value::from(l.as_str())),
                ("url", Value::from_safe_string(u.clone())),
                ("href", Value::from_safe_string(href)),
            ]))
        })
        .collect();
    Value::from(items)
}

/// Looks `key` up for `locale`, then (with fallback) the default locale; fills `{name}`.
pub fn translate(
    msgs: &Messages,
    cfg: &crate::config::Config,
    locale: &str,
    key: &str,
    args: &BTreeMap<String, String>,
) -> std::result::Result<String, String> {
    let fallback = cfg
        .i18n
        .as_ref()
        .filter(|i| i.fallback && i.default != locale)
        .map(|i| i.default.as_str());
    let text = msgs
        .get(locale)
        .and_then(|m| m.get(key))
        .or_else(|| fallback.and_then(|f| msgs.get(f)?.get(key)))
        .ok_or_else(|| format!("no message `{key}` in i18n/{locale}.toml"))?;
    let mut s = text.clone();
    for (k, v) in args {
        s = s.replace(&format!("{{{k}}}"), v);
    }
    Ok(s)
}

/// The `t(key, **args)` template function for one locale.
pub fn t_function(
    msgs: Messages,
    cfg: crate::config::Config,
    locale: String,
) -> impl Fn(String, Kwargs) -> std::result::Result<String, minijinja::Error> + Send + Sync + 'static
{
    move |key: String, kw: Kwargs| {
        let mut args = BTreeMap::new();
        for k in kw.args() {
            let v: Value = kw.get(k)?;
            args.insert(k.to_string(), v.to_string());
        }
        translate(&msgs, &cfg, &locale, &key, &args)
            .map_err(|m| minijinja::Error::new(minijinja::ErrorKind::InvalidOperation, m))
    }
}

/// Sitemap `<xhtml:link>` lines for one URL (with `x-default` → the default-locale URL).
pub fn sitemap_links(base: &str, alts: &[(String, String)], default: &str) -> String {
    let mut s = String::new();
    let mut link = |lang: &str, url: &str| {
        s.push_str("    <xhtml:link rel=\"alternate\" hreflang=\"");
        cascivo_html::html::esc(&mut s, lang);
        s.push_str("\" href=\"");
        cascivo_html::html::esc(&mut s, &format!("{base}{url}"));
        s.push_str("\"/>\n");
    };
    for (l, u) in alts {
        link(l, u);
    }
    if let Some((_, u)) = alts.iter().find(|(l, _)| l == default) {
        link("x-default", u);
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;

    fn cfg(fallback: bool) -> Config {
        let mut c = Config::parse("title = \"T\"").unwrap();
        c.i18n = Some(I18n {
            default: "en".into(),
            locales: vec!["en".into(), "de".into()],
            fallback,
        });
        c
    }

    fn msgs() -> Messages {
        let mut m = Messages::new();
        m.insert(
            "en".into(),
            BTreeMap::from([
                ("hi".into(), "Hi {name}".into()),
                ("only".into(), "EN".into()),
            ]),
        );
        m.insert(
            "de".into(),
            BTreeMap::from([("hi".into(), "Hallo {name}".into())]),
        );
        m
    }

    #[test]
    fn translate_interpolates_and_falls_back() {
        let args = BTreeMap::from([("name".into(), "Ada".into())]);
        assert_eq!(
            translate(&msgs(), &cfg(true), "de", "hi", &args).unwrap(),
            "Hallo Ada"
        );
        assert_eq!(
            translate(&msgs(), &cfg(true), "de", "only", &args).unwrap(),
            "EN"
        );
        let e = translate(&msgs(), &cfg(false), "de", "only", &args).unwrap_err();
        assert_eq!(e, "no message `only` in i18n/de.toml");
    }

    #[test]
    fn flatten_nested_tables_and_reject_non_strings() {
        let t: toml::Table = toml::from_str("a = \"1\"\n[nav]\nhome = \"Home\"\nn = 3").unwrap();
        let (mut m, mut bad) = (BTreeMap::new(), Vec::new());
        flatten("", &t, &mut m, &mut bad);
        assert_eq!(m.get("nav.home").map(String::as_str), Some("Home"));
        assert_eq!(bad, ["nav.n"]);
    }

    #[test]
    fn sitemap_links_add_x_default() {
        let alts = vec![
            ("en".to_string(), "/a/".to_string()),
            ("de".into(), "/de/a/".into()),
        ];
        let s = sitemap_links("https://x.dev", &alts, "en");
        assert!(
            s.contains("hreflang=\"de\" href=\"https://x.dev/de/a/\""),
            "{s}"
        );
        assert!(
            s.contains("hreflang=\"x-default\" href=\"https://x.dev/a/\""),
            "{s}"
        );
    }
}
