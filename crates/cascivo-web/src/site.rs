//! A loaded site (all sources read into memory) and its rendering to an [`Output`].
//! Loading and rendering are plain data transforms, so `dev` can redo both on every edit.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, PoisonError};

use minijinja::{Environment, Value};

use crate::config::Config;
use crate::content::{self, Collection, Entry, page_meta_error, split_front_matter};
use crate::error::{Error, Errors, Result};
use crate::i18n::{self, View};
use crate::markdown::{self, Rendered};
use crate::out::Output;
use crate::routes::{self, Kind, Route};

#[derive(Debug, Clone)]
pub struct Site {
    pub root: PathBuf,
    pub config: Config,
    pub collections: BTreeMap<String, Collection>,
    pub routes: Vec<Route>,
    /// `pages/`-relative file → source.
    pub pages: BTreeMap<String, String>,
    /// `layouts/`-relative file → source (template name is the file name, e.g. `default.html`).
    pub layouts: BTreeMap<String, String>,
    /// `public/`-relative file → bytes, copied verbatim (dot- and underscore-files included).
    pub public: BTreeMap<String, Vec<u8>>,
    /// `i18n/<locale>.toml` message bundles, flattened.
    pub messages: i18n::Messages,
}

type Lister = fn(&Path) -> std::io::Result<Vec<String>>;

fn read_tree(root: &Path, dir: &str, list: Lister) -> Result<BTreeMap<String, Vec<u8>>> {
    let base = root.join(dir);
    let io = |e: std::io::Error| Errors::one(dir, None, e.to_string());
    let mut out = BTreeMap::new();
    for f in list(&base).map_err(io)? {
        out.insert(f.clone(), std::fs::read(base.join(&f)).map_err(io)?);
    }
    Ok(out)
}

fn utf8(dir: &str, m: BTreeMap<String, Vec<u8>>) -> Result<BTreeMap<String, String>> {
    m.into_iter()
        .map(|(k, v)| {
            String::from_utf8(v)
                .map(|s| (k.clone(), s))
                .map_err(|_| Errors::one(format!("{dir}/{k}"), None, "not UTF-8"))
        })
        .collect()
}

impl Site {
    pub fn load(root: &Path) -> Result<Self> {
        let cfg_src = std::fs::read_to_string(root.join("site.toml"))
            .map_err(|e| Errors::one("site.toml", None, e.to_string()))?;
        let mut errs = Vec::new();
        let mut keep = |r: Result<()>| {
            if let Err(e) = r {
                errs.extend(e.0);
            }
        };
        let mut site = Site {
            root: root.to_path_buf(),
            config: Config::parse(&cfg_src)?,
            collections: BTreeMap::new(),
            routes: Vec::new(),
            pages: BTreeMap::new(),
            layouts: BTreeMap::new(),
            public: BTreeMap::new(),
            messages: i18n::Messages::new(),
        };
        keep(content::load(root).map(|c| site.collections = c));
        keep(routes::scan(root).map(|r| site.routes = r));
        keep(
            read_tree(root, "pages", routes::list_files)
                .and_then(|m| utf8("pages", m))
                .map(|m| site.pages = m),
        );
        keep(
            read_tree(root, "layouts", routes::list_files)
                .and_then(|m| utf8("layouts", m))
                .map(|m| site.layouts = m),
        );
        keep(read_tree(root, "public", routes::list_public).map(|m| site.public = m));
        keep(i18n::load_messages(root).map(|m| site.messages = m));
        for r in &site.routes {
            if let Kind::Dynamic(c) = &r.kind
                && !site.collections.contains_key(c)
            {
                errs.push(Error::new(
                    format!("pages/{}", r.file),
                    None,
                    format!("no collection `{c}` under content/"),
                ));
            }
        }
        errs.extend(i18n::validate(&site));
        if errs.is_empty() {
            Ok(site)
        } else {
            Err(Errors(errs))
        }
    }

    /// Renders every page, the shared stylesheet, public files and the sitemap.
    pub fn render(&self) -> Result<Output> {
        let views = i18n::views(self);
        let alts = Arc::new(i18n::alternates(&views));
        // One accumulator across locales: the shared stylesheet covers every locale's components.
        let acc = Arc::new(Mutex::new(Rendered::default()));
        let mut pages = Vec::new();
        let mut files = BTreeMap::new();
        let mut errs = Vec::new();
        for v in &views {
            match Renderer::new(&v.site, Arc::clone(&acc), &v.locale, Arc::clone(&alts))
                .and_then(Renderer::run)
            {
                Ok((p, f)) => {
                    pages.extend(p);
                    files.extend(f);
                }
                Err(e) => errs.extend(e.0),
            }
        }
        if !errs.is_empty() {
            return Err(Errors(errs));
        }
        finish(self, &views, &pages, &files, &acc, &alts)
    }
}

/// TOML → template value; dates become ISO strings so templates can print and sort them.
pub(crate) fn to_value(v: &toml::Value) -> Value {
    match v {
        toml::Value::String(s) => Value::from(s.as_str()),
        toml::Value::Integer(i) => Value::from(*i),
        toml::Value::Float(f) => Value::from(*f),
        toml::Value::Boolean(b) => Value::from(*b),
        toml::Value::Datetime(d) => Value::from(d.to_string()),
        toml::Value::Array(a) => Value::from(a.iter().map(to_value).collect::<Vec<_>>()),
        toml::Value::Table(t) => table_value(t, []),
    }
}

fn table_value<const N: usize>(t: &toml::Table, extra: [(&str, Value); N]) -> Value {
    let mut m: BTreeMap<String, Value> = t.iter().map(|(k, v)| (k.clone(), to_value(v))).collect();
    for (k, v) in extra {
        m.insert(k.to_string(), v);
    }
    Value::from(m)
}

/// One rendered page.
struct Page {
    /// Internal URL (`/about/`), before `build.trailing_slash`.
    url: String,
    html: String,
    /// Front matter `sitemap = false` leaves it out of `sitemap.xml`.
    sitemap: bool,
    /// Front matter `lastmod`, for `<lastmod>`.
    lastmod: Option<String>,
}

type Pages = Vec<Page>;

/// Parses `+++` TOML front matter of a page; `sitemap`/`lastmod` are type-checked.
fn front_matter(file: &str, fm: &str) -> Result<toml::Table> {
    let data: toml::Table = toml::from_str(fm).map_err(|e| {
        let line = e
            .span()
            .map_or(2, |s| crate::config::line_of(fm, s.start) + 1);
        Errors::one(file, Some(line), e.message().to_string())
    })?;
    let errs: Vec<Error> = data
        .iter()
        .filter_map(|(k, v)| page_meta_error(k, v))
        .map(|m| Error::new(file, Some(1), m))
        .collect();
    if errs.is_empty() {
        Ok(data)
    } else {
        Err(Errors(errs))
    }
}

/// A template page's front matter and its body, padded with newlines so template errors keep
/// the file's line numbers.
fn template_parts(file: &str, src: &str) -> Result<(toml::Table, String)> {
    let (fm, body, line) = split_front_matter(src).map_err(|m| Errors::one(file, Some(1), m))?;
    let data = front_matter(file, fm)?;
    let pad = "\n".repeat(usize::try_from(line).unwrap_or(1).saturating_sub(1));
    Ok((data, format!("{pad}{body}")))
}

/// `sitemap` and `lastmod` of a page value (front matter or entry data).
fn sitemap_meta(page: &Value, tpl: Option<&toml::Table>) -> (bool, Option<String>) {
    let off = |v: Option<Value>| {
        v.is_some_and(|v| v.kind() == minijinja::value::ValueKind::Bool && !v.is_true())
    };
    let listed = !off(page.get_attr("sitemap").ok())
        && tpl
            .and_then(|t| t.get("sitemap"))
            .and_then(toml::Value::as_bool)
            != Some(false);
    let lastmod = page
        .get_attr("lastmod")
        .ok()
        .filter(|v| !v.is_undefined() && !v.is_none())
        .map(|v| v.to_string());
    (listed, lastmod)
}
fn cv_options(cfg: &Config) -> cascivo_html::Options {
    cascivo_html::Options {
        inline_styles: cfg.build.inline_styles,
        ..cascivo_html::Options::default()
    }
}

/// Output path → bytes emitted by template functions (`asset()`, `img()`).
type Files = BTreeMap<String, Vec<u8>>;

struct Renderer<'a> {
    site: &'a Site,
    env: Environment<'static>,
    /// CSS units and scripts used anywhere, shared with the `cv()` template function.
    acc: Arc<Mutex<Rendered>>,
    collections: Value,
    locale: String,
    /// URL → its translations, from [`i18n::alternates`].
    alts: Arc<BTreeMap<String, Vec<(String, String)>>>,
    web: Arc<crate::web::WebState>,
    /// Template page file → its front matter.
    fronts: BTreeMap<String, toml::Table>,
}

fn tpl_err(file: &str, e: &minijinja::Error) -> Error {
    let mut msg = e.kind().to_string();
    if let Some(d) = e.detail() {
        msg = format!("{msg}: {d}");
    }
    let file = e.name().map_or_else(|| file.to_string(), |n| n.to_string());
    Error::new(file, e.line().and_then(|l| u32::try_from(l).ok()), msg)
}

impl<'a> Renderer<'a> {
    fn new(
        site: &'a Site,
        acc: Arc<Mutex<Rendered>>,
        locale: &str,
        alts: Arc<BTreeMap<String, Vec<(String, String)>>>,
    ) -> Result<Self> {
        let mut env = Environment::new();
        env.add_function(
            "t",
            i18n::t_function(
                site.messages.clone(),
                site.config.clone(),
                locale.to_string(),
            ),
        );
        let mut errs = Vec::new();
        let mut fronts = BTreeMap::new();
        for (name, src) in &site.layouts {
            if let Err(e) = env.add_template_owned(name.clone(), src.clone()) {
                errs.push(tpl_err(&format!("layouts/{name}"), &e));
            }
        }
        for r in &site.routes {
            let file = format!("pages/{}", r.file);
            let Some(src) = site.pages.get(&r.file).filter(|_| r.kind != Kind::Markdown) else {
                continue;
            };
            match template_parts(&file, src) {
                Ok((fm, body)) => {
                    if let Err(e) = env.add_template_owned(file.clone(), body) {
                        errs.push(tpl_err(&file, &e));
                    }
                    fronts.insert(r.file.clone(), fm);
                }
                Err(e) => errs.extend(e.0),
            }
        }
        let a = Arc::clone(&acc);
        let inline_styles = site.config.build.inline_styles;
        env.add_function(
            "cv",
            move |src: String| -> std::result::Result<Value, minijinja::Error> {
                let mut acc = a.lock().unwrap_or_else(PoisonError::into_inner);
                let opts = cascivo_html::Options {
                    inline_styles,
                    ..cascivo_html::Options::default()
                };
                markdown::cv(&src, "cv()", 1, &mut acc, &opts)
                    .map(Value::from_safe_string)
                    .map_err(|e| {
                        minijinja::Error::new(minijinja::ErrorKind::InvalidOperation, e.to_string())
                    })
            },
        );
        let web = crate::web::register(&mut env, site, &mut errs);

        let mut r = Renderer {
            site,
            env,
            acc,
            web,
            collections: Value::UNDEFINED,
            locale: locale.to_string(),
            alts,
            fronts,
        };
        let mut colls = BTreeMap::new();
        for (name, c) in &site.collections {
            let url = site
                .routes
                .iter()
                .find(|r| r.kind == Kind::Dynamic(name.clone()));
            let mut items = Vec::new();
            for e in &c.entries {
                match r.entry_value(e, url) {
                    Ok(v) => items.push(v),
                    Err(x) => errs.extend(x.0),
                }
            }
            colls.insert(name.clone(), Value::from(items));
        }
        r.collections = Value::from(colls);
        if errs.is_empty() {
            Ok(r)
        } else {
            Err(Errors(errs))
        }
    }

    fn markdown(&self, md: &str, file: &str, line: u32) -> Result<String> {
        let r = markdown::render_with(md, file, line, &cv_options(&self.site.config))?;
        let mut acc = self.acc.lock().unwrap_or_else(PoisonError::into_inner);
        acc.used.extend(&r.used);
        acc.used.insert("prose");
        acc.scripts.extend(&r.scripts);
        acc.styles.extend(r.styles);
        Ok(format!("<div class=\"cv-prose-prose\">{}</div>", r.html))
    }

    fn entry_value(&self, e: &Entry, route: Option<&Route>) -> Result<Value> {
        let html = self.markdown(&e.body, &e.file, e.body_line)?;
        // URLs come from validated slugs; marking them safe keeps `/` unescaped in attributes.
        let url = route.map_or(Value::UNDEFINED, |r| {
            Value::from_safe_string(self.site.config.url(&r.entry_url(&e.slug)))
        });
        Ok(table_value(
            &e.data,
            [
                ("slug", Value::from(e.slug.as_str())),
                ("url", url),
                ("content", Value::from_safe_string(html)),
            ],
        ))
    }

    /// Renders one page; `url` is its internal URL (for alternates and the output path).
    fn page(&self, tpl: &str, file: &str, url: &str, page: Value, content: Value) -> Result<Page> {
        let t = self
            .env
            .get_template(tpl)
            .map_err(|e| Errors(vec![tpl_err(file, &e)]))?;
        let (sitemap, lastmod) =
            sitemap_meta(&page, self.fronts.get(file.trim_start_matches("pages/")));
        let ctx = minijinja::context! {
            locale => self.locale.as_str(),
            alternates => i18n::alternates_value(&self.site.config, self.alts.get(url)),
            site => config_value(&self.site.config),
            collections => self.collections.clone(),
            page => page,
            content => content,
        };
        self.web.take_preloads();
        let html = t.render(ctx).map_err(|e| Errors(vec![tpl_err(file, &e)]))?;
        Ok(Page {
            url: url.to_string(),
            html: with_preloads(html, &self.web.take_preloads()),
            sitemap,
            lastmod,
        })
    }

    fn page_value(&self, data: &toml::Table, url: &str) -> Value {
        table_value(
            data,
            [("url", Value::from_safe_string(self.site.config.url(url)))],
        )
    }

    /// Renders this view's pages, (URL, HTML), and the files its template functions emitted.
    fn run(self) -> Result<(Pages, Files)> {
        let mut pages = Vec::new();
        let mut errs = Vec::new();
        for r in &self.site.routes {
            let file = format!("pages/{}", r.file);
            let src = self.site.pages.get(&r.file).map_or("", String::as_str);
            let res = match &r.kind {
                Kind::Markdown => self.md_page(r, &file, src).map(|p| vec![p]),
                Kind::Template => {
                    let empty = toml::Table::new();
                    let fm = self.fronts.get(&r.file).unwrap_or(&empty);
                    let page = self.page_value(fm, &r.url);
                    self.page(&file, &file, &r.url, page, Value::UNDEFINED)
                        .map(|p| vec![p])
                }
                Kind::Dynamic(c) => self.dynamic(r, &file, c),
            };
            match res {
                Ok(v) => pages.extend(v),
                Err(e) => errs.extend(e.0),
            }
        }
        if !errs.is_empty() {
            return Err(Errors(errs));
        }
        Ok((pages, self.web.take_files()))
    }

    fn md_page(&self, r: &Route, file: &str, src: &str) -> Result<Page> {
        let (fm, body, line) =
            split_front_matter(src).map_err(|m| Errors::one(file, Some(1), m))?;
        let data = front_matter(file, fm)?;
        let layout = data
            .get("layout")
            .and_then(toml::Value::as_str)
            .unwrap_or("default");
        let tpl = format!("{layout}.html");
        if !self.site.layouts.contains_key(&tpl) {
            return Err(Errors::one(
                file,
                Some(1),
                format!("no layout layouts/{tpl}"),
            ));
        }
        let html = self.markdown(body, file, line)?;
        let page = self.page_value(&data, &r.url);
        self.page(&tpl, file, &r.url, page, Value::from_safe_string(html))
    }

    fn dynamic(&self, r: &Route, file: &str, coll: &str) -> Result<Vec<Page>> {
        let items = self.collections.get_attr(coll).unwrap_or_default();
        let mut out = Vec::new();
        for e in items
            .try_iter()
            .map_err(|e| Errors(vec![tpl_err(file, &e)]))?
        {
            let slug = e
                .get_attr("slug")
                .map(|u| u.to_string())
                .unwrap_or_default();
            let content = e.get_attr("content").unwrap_or_default();
            out.push(self.page(file, file, &r.entry_url(&slug), e, content)?);
        }
        Ok(out)
    }
}

/// Writes pages, the shared stylesheet, public files, the sitemap and feeds.
fn finish(
    site: &Site,
    views: &[View],
    pages: &[Page],
    files: &BTreeMap<String, Vec<u8>>,
    acc: &Mutex<Rendered>,
    alts: &BTreeMap<String, Vec<(String, String)>>,
) -> Result<Output> {
    let acc = acc.lock().unwrap_or_else(PoisonError::into_inner).clone();
    let mut out = Output::default();
    let mut put = |rel: String, bytes: Vec<u8>| {
        out.insert(rel, bytes)
            .map_err(|m| Errors::one("dist", None, m))
    };
    let build = &site.config.build;
    let scripts = if acc.scripts.is_empty() {
        String::new()
    } else if build.external_scripts {
        let names: std::collections::BTreeSet<&str> = acc.scripts.iter().copied().collect();
        let js = cascivo_html::script_bundle(Some(&names));
        let rel = crate::assets::out_name(build, "cascivo.js", js.as_bytes());
        let mut tag = String::from("<script");
        cascivo_html::html::attr(&mut tag, "src", &format!("/{rel}"));
        tag.push_str(" defer></script>");
        put(rel, js.into_bytes())?;
        tag
    } else {
        acc.scripts
            .iter()
            .filter_map(|s| cascivo_html::script(s))
            .map(|js| format!("<script>{js}</script>"))
            .collect()
    };
    let css_href = if build.cascivo_css {
        let css = crate::theme::site_css(&site.config, &acc.used, &acc.styles);
        let rel = crate::assets::out_name(build, "cascivo.css", css.as_bytes());
        put(rel.clone(), css.into_bytes())?;
        Some(format!("/{rel}"))
    } else {
        None
    };
    let slash = build.trailing_slash;
    for p in pages {
        let rel = routes::out_path(&p.url, slash);
        put(
            rel,
            finish_html(&p.html, &scripts, css_href.as_deref()).into_bytes(),
        )?;
    }
    for (rel, bytes) in files {
        put(rel.clone(), bytes.clone())?;
    }
    for (rel, bytes) in &site.public {
        put(rel.clone(), bytes.clone())?;
    }
    if !site.config.base_url.is_empty() {
        // `/404.html` and other non-directory pages are never listed.
        let listed: Vec<&Page> = pages
            .iter()
            .filter(|p| p.sitemap && p.url.ends_with('/'))
            .collect();
        let default = site.config.i18n.as_ref().map_or("", |i| i.default.as_str());
        put(
            "sitemap.xml".into(),
            sitemap(&site.config, &listed, alts, default).into_bytes(),
        )?;
    }
    for v in views {
        for f in &site.config.feeds {
            let localized = !v.prefix.is_empty();
            let routed = v
                .site
                .routes
                .iter()
                .any(|r| r.kind == Kind::Dynamic(f.collection.clone()));
            // A locale without that collection's pages (no fallback, no translation) has no feed.
            if localized && !routed {
                continue;
            }
            let xml = crate::rss::render(
                &v.site.config,
                f,
                v.site.collections.get(&f.collection),
                &v.site.routes,
                &v.prefix,
            )?;
            // `/de` → `de/rss.xml`; the default locale writes `rss.xml`.
            let rel = format!("{}/{}", v.prefix, f.path);
            put(rel.trim_start_matches('/').to_string(), xml.into_bytes())?;
        }
    }
    Ok(out)
}

fn config_value(c: &Config) -> Value {
    Value::from(BTreeMap::from([
        ("title", Value::from(c.title.as_str())),
        ("base_url", Value::from(c.base_url.as_str())),
        ("lang", Value::from(c.lang.as_str())),
        ("theme", Value::from(c.theme.as_str())),
    ]))
}

/// Puts `img(priority=true)` preloads at the top of `<head>`: before its first `<link>`,
/// `<script>` or `<style>`, so the image is requested no later than the stylesheet.
fn with_preloads(mut html: String, links: &[String]) -> String {
    if links.is_empty() {
        return html;
    }
    let tags = links.concat();
    let head_end = html.find("</head>");
    let first = ["<link", "<script", "<style"]
        .iter()
        .filter_map(|t| html.find(t))
        .filter(|i| head_end.is_none_or(|h| *i < h))
        .min();
    match first.or(head_end) {
        Some(i) => html.insert_str(i, &tags),
        None => html.insert_str(0, &tags),
    }
    html
}

/// Links the shared stylesheet and appends component scripts, so layouts need neither.
fn finish_html(html: &str, scripts: &str, css_href: Option<&str>) -> String {
    let link = css_href.map_or_else(String::new, |h| {
        let mut l = String::from("<link rel=\"stylesheet\"");
        cascivo_html::html::attr(&mut l, "href", h);
        l.push('>');
        l
    });
    let mut s = match html.find("</head>") {
        Some(i) => format!("{}{link}{}", &html[..i], &html[i..]),
        None => format!("{link}{html}"),
    };
    if !scripts.is_empty() {
        match s.rfind("</body>") {
            Some(i) => s.insert_str(i, scripts),
            None => s.push_str(scripts),
        }
    }
    s
}

fn sitemap(
    cfg: &Config,
    pages: &[&Page],
    alts: &BTreeMap<String, Vec<(String, String)>>,
    default: &str,
) -> String {
    let base = cfg.base_url.trim_end_matches('/');
    let mut s = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"",
    );
    if !alts.is_empty() {
        s.push_str(" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\"");
    }
    s.push_str(">\n");
    let set: BTreeMap<&str, Option<&str>> = pages
        .iter()
        .map(|p| (p.url.as_str(), p.lastmod.as_deref()))
        .collect();
    for (u, lastmod) in set {
        s.push_str("  <url><loc>");
        cascivo_html::html::esc(&mut s, &format!("{base}{}", cfg.url(u)));
        s.push_str("</loc>");
        if let Some(d) = lastmod {
            s.push_str("<lastmod>");
            cascivo_html::html::esc(&mut s, d);
            s.push_str("</lastmod>");
        }
        match alts.get(u).filter(|g| g.len() > 1) {
            Some(g) => {
                s.push('\n');
                s.push_str(&i18n::sitemap_links(cfg, g, default));
                s.push_str("  </url>\n");
            }
            None => s.push_str("</url>\n"),
        }
    }
    s.push_str("</urlset>\n");
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finish_injects_css_and_scripts() {
        let h = finish_html(
            "<html><head></head><body>x</body></html>",
            "<script>1</script>",
            Some("/cascivo.css"),
        );
        assert_eq!(
            h,
            "<html><head><link rel=\"stylesheet\" href=\"/cascivo.css\"></head><body>x<script>1</script></body></html>"
        );
    }

    #[test]
    fn finish_without_cascivo_css_adds_no_link() {
        let h = finish_html("<html><head></head><body></body></html>", "", None);
        assert_eq!(h, "<html><head></head><body></body></html>");
    }

    #[test]
    fn preloads_go_before_the_first_head_resource() {
        let p = vec!["<P1>".to_string(), "<P2>".to_string()];
        assert_eq!(
            with_preloads(
                "<html><head><title>t</title><link rel=\"stylesheet\"></head><body><link></body></html>".into(),
                &p
            ),
            "<html><head><title>t</title><P1><P2><link rel=\"stylesheet\"></head><body><link></body></html>"
        );
        assert_eq!(
            with_preloads(
                "<head><title>t</title></head><body><script></script>".into(),
                &p
            ),
            "<head><title>t</title><P1><P2></head><body><script></script>"
        );
        assert_eq!(with_preloads("<p>x</p>".into(), &p), "<P1><P2><p>x</p>");
        assert_eq!(with_preloads("<p>x</p>".into(), &[]), "<p>x</p>");
    }

    #[test]
    fn sitemap_is_sorted_absolute_and_escaped() {
        let page = |u: &str, lastmod: Option<&str>| Page {
            url: u.into(),
            html: String::new(),
            sitemap: true,
            lastmod: lastmod.map(Into::into),
        };
        let ps = [
            page("/b/", Some("2026-01-02")),
            page("/", None),
            page("/a&b/", None),
        ];
        let refs: Vec<&Page> = ps.iter().collect();
        let mut cfg = Config::parse("title = \"x\"\nbase_url = \"https://x.dev/\"").unwrap();
        let s = sitemap(&cfg, &refs, &BTreeMap::new(), "");
        let locs: Vec<&str> = s.lines().filter(|l| l.contains("<loc>")).collect();
        assert_eq!(locs[0], "  <url><loc>https://x.dev/</loc></url>");
        assert!(locs[1].contains("https://x.dev/a&amp;b/"), "{s}");
        assert_eq!(
            locs[2],
            "  <url><loc>https://x.dev/b/</loc><lastmod>2026-01-02</lastmod></url>"
        );
        cfg.build.trailing_slash = false;
        let s = sitemap(&cfg, &refs, &BTreeMap::new(), "");
        assert!(
            s.contains("<loc>https://x.dev/b</loc>") && s.contains("<loc>https://x.dev/</loc>"),
            "{s}"
        );
    }
}
