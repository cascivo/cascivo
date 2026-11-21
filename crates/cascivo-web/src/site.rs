//! A loaded site (all sources read into memory) and its rendering to an [`Output`].
//! Loading and rendering are plain data transforms, so `dev` can redo both on every edit.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, PoisonError};

use minijinja::{Environment, Value};

use crate::config::Config;
use crate::content::{self, Collection, Entry, split_front_matter};
use crate::error::{Error, Errors, Result};
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
    /// `public/`-relative file → bytes, copied verbatim.
    pub public: BTreeMap<String, Vec<u8>>,
}

fn read_tree(root: &Path, dir: &str) -> Result<BTreeMap<String, Vec<u8>>> {
    let base = root.join(dir);
    let io = |e: std::io::Error| Errors::one(dir, None, e.to_string());
    let mut out = BTreeMap::new();
    for f in routes::list_files(&base).map_err(io)? {
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
        };
        keep(content::load(root).map(|c| site.collections = c));
        keep(routes::scan(root).map(|r| site.routes = r));
        keep(
            read_tree(root, "pages")
                .and_then(|m| utf8("pages", m))
                .map(|m| site.pages = m),
        );
        keep(
            read_tree(root, "layouts")
                .and_then(|m| utf8("layouts", m))
                .map(|m| site.layouts = m),
        );
        keep(read_tree(root, "public").map(|m| site.public = m));
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
        if errs.is_empty() {
            Ok(site)
        } else {
            Err(Errors(errs))
        }
    }

    /// Renders every page, the shared stylesheet, public files and the sitemap.
    pub fn render(&self) -> Result<Output> {
        Renderer::new(self)?.run()
    }
}

/// TOML → template value; dates become ISO strings so templates can print and sort them.
fn to_value(v: &toml::Value) -> Value {
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

struct Renderer<'a> {
    site: &'a Site,
    env: Environment<'static>,
    /// CSS units and scripts used anywhere, shared with the `cv()` template function.
    acc: Arc<Mutex<Rendered>>,
    collections: Value,
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
    fn new(site: &'a Site) -> Result<Self> {
        let acc = Arc::new(Mutex::new(Rendered::default()));
        let mut env = Environment::new();
        let mut errs = Vec::new();
        for (name, src) in &site.layouts {
            if let Err(e) = env.add_template_owned(name.clone(), src.clone()) {
                errs.push(tpl_err(&format!("layouts/{name}"), &e));
            }
        }
        for r in &site.routes {
            if r.kind != Kind::Markdown
                && let Some(src) = site.pages.get(&r.file)
                && let Err(e) = env.add_template_owned(format!("pages/{}", r.file), src.clone())
            {
                errs.push(tpl_err(&format!("pages/{}", r.file), &e));
            }
        }
        let a = Arc::clone(&acc);
        env.add_function(
            "cv",
            move |src: String| -> std::result::Result<Value, minijinja::Error> {
                let mut acc = a.lock().unwrap_or_else(PoisonError::into_inner);
                markdown::cv(&src, "cv()", 1, &mut acc)
                    .map(Value::from_safe_string)
                    .map_err(|e| {
                        minijinja::Error::new(minijinja::ErrorKind::InvalidOperation, e.to_string())
                    })
            },
        );

        let mut r = Renderer {
            site,
            env,
            acc,
            collections: Value::UNDEFINED,
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
        let r = markdown::render(md, file, line)?;
        let mut acc = self.acc.lock().unwrap_or_else(PoisonError::into_inner);
        acc.used.extend(&r.used);
        acc.used.insert("prose");
        acc.scripts.extend(&r.scripts);
        Ok(format!("<div class=\"cv-prose-prose\">{}</div>", r.html))
    }

    fn entry_value(&self, e: &Entry, route: Option<&Route>) -> Result<Value> {
        let html = self.markdown(&e.body, &e.file, e.body_line)?;
        // URLs come from validated slugs; marking them safe keeps `/` unescaped in attributes.
        let url = route.map_or(Value::UNDEFINED, |r| {
            Value::from_safe_string(r.entry_url(&e.slug))
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

    fn page(&self, tpl: &str, file: &str, page: Value, content: Value) -> Result<String> {
        let t = self
            .env
            .get_template(tpl)
            .map_err(|e| Errors(vec![tpl_err(file, &e)]))?;
        let ctx = minijinja::context! {
            site => config_value(&self.site.config),
            collections => self.collections.clone(),
            page => page,
            content => content,
        };
        t.render(ctx).map_err(|e| Errors(vec![tpl_err(file, &e)]))
    }

    fn run(self) -> Result<Output> {
        let mut pages: Vec<(String, String)> = Vec::new();
        let mut errs = Vec::new();
        for r in &self.site.routes {
            let file = format!("pages/{}", r.file);
            let src = self.site.pages.get(&r.file).map_or("", String::as_str);
            let res = match &r.kind {
                Kind::Markdown => self
                    .md_page(r, &file, src)
                    .map(|h| vec![(r.url.clone(), h)]),
                Kind::Template => {
                    let page = Value::from(BTreeMap::from([(
                        "url",
                        Value::from_safe_string(r.url.clone()),
                    )]));
                    self.page(&file, &file, page, Value::UNDEFINED)
                        .map(|h| vec![(r.url.clone(), h)])
                }
                Kind::Dynamic(c) => self.dynamic(&file, c),
            };
            match res {
                Ok(v) => pages.extend(v),
                Err(e) => errs.extend(e.0),
            }
        }
        if !errs.is_empty() {
            return Err(Errors(errs));
        }
        let acc = self
            .acc
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .clone();
        let mut out = Output::default();
        let mut put = |rel: String, bytes: Vec<u8>| {
            out.insert(rel, bytes)
                .map_err(|m| Errors::one("dist", None, m))
        };
        let scripts: String = acc
            .scripts
            .iter()
            .filter_map(|s| cascivo_html::script(s))
            .map(|js| format!("<script>{js}</script>"))
            .collect();
        for (url, html) in &pages {
            let rel = format!("{}index.html", url.trim_start_matches('/'));
            put(rel, finish_html(html, &scripts).into_bytes())?;
        }
        put(
            "cascivo.css".into(),
            cascivo_html::stylesheet(&self.site.config.theme, &acc.used).into_bytes(),
        )?;
        for (rel, bytes) in &self.site.public {
            put(rel.clone(), bytes.clone())?;
        }
        if !self.site.config.base_url.is_empty() {
            let urls: Vec<&str> = pages.iter().map(|(u, _)| u.as_str()).collect();
            put(
                "sitemap.xml".into(),
                sitemap(&self.site.config.base_url, &urls).into_bytes(),
            )?;
        }
        Ok(out)
    }

    fn md_page(&self, r: &Route, file: &str, src: &str) -> Result<String> {
        let (fm, body, line) =
            split_front_matter(src).map_err(|m| Errors::one(file, Some(1), m))?;
        let data: toml::Table =
            toml::from_str(fm).map_err(|e| Errors::one(file, Some(2), e.message().to_string()))?;
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
        let page = table_value(&data, [("url", Value::from_safe_string(r.url.clone()))]);
        self.page(&tpl, file, page, Value::from_safe_string(html))
    }

    fn dynamic(&self, file: &str, coll: &str) -> Result<Vec<(String, String)>> {
        let items = self.collections.get_attr(coll).unwrap_or_default();
        let mut out = Vec::new();
        for e in items
            .try_iter()
            .map_err(|e| Errors(vec![tpl_err(file, &e)]))?
        {
            let url = e.get_attr("url").map(|u| u.to_string()).unwrap_or_default();
            let content = e.get_attr("content").unwrap_or_default();
            out.push((url, self.page(file, file, e, content)?));
        }
        Ok(out)
    }
}

fn config_value(c: &Config) -> Value {
    Value::from(BTreeMap::from([
        ("title", Value::from(c.title.as_str())),
        ("base_url", Value::from(c.base_url.as_str())),
        ("lang", Value::from(c.lang.as_str())),
        ("theme", Value::from(c.theme.as_str())),
    ]))
}

/// Links the shared stylesheet and appends component scripts, so layouts need neither.
fn finish_html(html: &str, scripts: &str) -> String {
    let link = "<link rel=\"stylesheet\" href=\"/cascivo.css\">";
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

fn sitemap(base: &str, urls: &[&str]) -> String {
    let base = base.trim_end_matches('/');
    let mut s = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n",
    );
    let set: BTreeSet<&&str> = urls.iter().collect();
    for u in set {
        s.push_str("  <url><loc>");
        cascivo_html::html::esc(&mut s, &format!("{base}{u}"));
        s.push_str("</loc></url>\n");
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
        );
        assert_eq!(
            h,
            "<html><head><link rel=\"stylesheet\" href=\"/cascivo.css\"></head><body>x<script>1</script></body></html>"
        );
    }

    #[test]
    fn sitemap_is_sorted_absolute_and_escaped() {
        let s = sitemap("https://x.dev/", &["/b/", "/", "/a&b/"]);
        let locs: Vec<&str> = s.lines().filter(|l| l.contains("<loc>")).collect();
        assert_eq!(locs[0], "  <url><loc>https://x.dev/</loc></url>");
        assert!(locs[1].contains("https://x.dev/a&amp;b/"), "{s}");
    }
}
