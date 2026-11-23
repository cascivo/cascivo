//! Request-time rendering for dynamic apps: [`Engine`] renders a whole page, or one named block
//! of it (the htmx fragment), from a [`Bundle`] of templates, messages, Vite files and data.
//!
//! A bundle is read from a site folder ([`Bundle::load`], [`Engine::load`]; feature `fs`) or
//! from the bytes `cascivo-web build --bundle` wrote ([`Engine::from_bundle`], e.g. embedded with
//! `include_bytes!`), which needs no file system and so works on `wasm32-unknown-unknown`.
//!
//! Templates are `layouts/*` (named by file, as in the static build) and `templates/**` (named
//! by their path below `templates/`). Every template is HTML-escaped, whatever its extension.
//! Each render sees the [`ReqCtx`] as `request` (`path`, `locale`, `csrf`, `nonce`), `user` and
//! `flash`, and a default `page.url` (the request path, for `head()`), next to the caller's
//! context. `theme_script()` and `islands_script()` carry `request.nonce` for a strict CSP.
//! `t()` uses the request locale; `asset()`, `css_bundle()` and `img()` are not available
//! (they write files): link the static build's or `@cascivo/css`'s stylesheet.

use std::collections::BTreeMap;
#[cfg(feature = "fs")]
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, PoisonError, RwLock};

use minijinja::value::merge_maps;
use minijinja::{AutoEscape, Environment, Value, context};
use serde::{Deserialize, Serialize};

use crate::config::Config;
#[cfg(feature = "fs")]
use crate::error::Error;
use crate::error::{Errors, Result};
use crate::i18n::{self, Messages};
use crate::markdown::{self, Rendered};
use crate::site::{config_value, tpl_err};
use crate::vite::Vite;
use crate::web::{WebState, register_pure};

/// Bumped whenever [`Bundle`]'s serialized shape changes; an old bundle is rejected, not misread.
pub const BUNDLE_FORMAT: u32 = 1;

/// Everything [`Engine`] needs, in memory. Serialized (JSON) by `build --bundle`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Bundle {
    pub format: u32,
    pub config: Config,
    /// Template name → source.
    pub templates: BTreeMap<String, String>,
    pub messages: Messages,
    /// Contents of `[vite] manifest` and `[vite] css_modules`.
    pub vite_manifest: Option<String>,
    pub css_modules: Option<String>,
    /// The `data` global (`[data]` files, already parsed).
    pub data: serde_json::Value,
}

impl Bundle {
    /// Reads `site.toml`, `layouts/`, `templates/`, `i18n/`, the Vite files and `[data]`.
    #[cfg(feature = "fs")]
    pub fn load(root: &Path) -> Result<Self> {
        let cfg_src = std::fs::read_to_string(root.join("site.toml"))
            .map_err(|e| Errors::one("site.toml", None, e.to_string()))?;
        let config = Config::parse(&cfg_src)?;
        let mut errs = Vec::new();
        let mut templates = BTreeMap::new();
        for dir in ["layouts", "templates"] {
            let files = crate::routes::list_files(&root.join(dir))
                .map_err(|e| Errors::one(dir, None, e.to_string()))?;
            for f in files {
                match std::fs::read_to_string(root.join(dir).join(&f)) {
                    Ok(src) => {
                        if templates.insert(f.clone(), src).is_some() {
                            errs.push(Error::new(
                                format!("{dir}/{f}"),
                                None,
                                format!("`{f}` is also in layouts/; template names must be unique"),
                            ));
                        }
                    }
                    Err(e) => errs.push(Error::new(format!("{dir}/{f}"), None, e.to_string())),
                }
            }
        }
        let messages = i18n::load_messages(root).unwrap_or_else(|e| {
            errs.extend(e.0);
            Messages::new()
        });
        let mut read = |what: &str, p: &Option<String>| {
            let p = p.as_ref()?;
            std::fs::read_to_string(root.join(p))
                .map_err(|e| errs.push(Error::new("site.toml", None, format!("{what} `{p}`: {e}"))))
                .ok()
        };
        let vite_manifest = read("vite.manifest", &config.vite.manifest);
        let css_modules = read("vite.css_modules", &config.vite.css_modules);
        let data = crate::data::load(root, &config.data, crate::site::to_value)
            .and_then(|v| serde_json::to_value(&v).map_err(|e| e.to_string()))
            .unwrap_or_else(|m| {
                errs.push(Error::new("site.toml", None, m));
                serde_json::Value::Null
            });
        if !errs.is_empty() {
            return Err(Errors(errs));
        }
        Ok(Self {
            format: BUNDLE_FORMAT,
            config,
            templates,
            messages,
            vite_manifest,
            css_modules,
            data,
        })
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        // A derived `Serialize` of maps, strings and JSON values cannot fail.
        serde_json::to_vec(self).unwrap_or_default()
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let bad = |m: String| Errors::one("bundle", None, m);
        let b: Self = serde_json::from_slice(bytes).map_err(|e| bad(e.to_string()))?;
        if b.format != BUNDLE_FORMAT {
            return Err(bad(format!(
                "format {} is not {BUNDLE_FORMAT}; rebuild it with this cascivo-web",
                b.format
            )));
        }
        Ok(b)
    }
}

/// A one-time message carried to the next page (set by the session layer).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Flash {
    /// `info`, `success`, `warning` or `danger` by convention.
    pub kind: String,
    pub message: String,
}

/// Request facts every template sees. `locale` empty means the default locale.
#[derive(Debug, Clone, Copy, Default)]
pub struct ReqCtx<'a> {
    pub path: &'a str,
    pub locale: &'a str,
    pub csrf: Option<&'a str>,
    pub nonce: &'a str,
    pub user: Option<&'a Value>,
    pub flash: &'a [Flash],
}

/// One environment per locale, so `t()` needs no per-request state.
struct Inner {
    envs: BTreeMap<String, Environment<'static>>,
    default_locale: String,
}

impl Inner {
    fn new(b: &Bundle) -> Result<Self> {
        let cfg = &b.config;
        let vite = Vite::parse(b.vite_manifest.as_deref(), b.css_modules.as_deref())
            .map_err(|m| Errors::one("site.toml", None, m))?;
        let web = Arc::new(WebState::new(Default::default(), cfg.clone(), vite));
        let data = Value::from(minijinja::value::Serde(&b.data));
        let (default_locale, locales) = match &cfg.i18n {
            Some(i) => (i.default.clone(), i.locales.clone()),
            None => (cfg.lang.clone(), vec![cfg.lang.clone()]),
        };
        // `cv()` output needs its CSS from a stylesheet the app links; the units are dropped.
        let acc = Arc::new(Mutex::new(Rendered::default()));
        let mut envs = BTreeMap::new();
        let mut errs = Vec::new();
        for (i, locale) in locales.iter().enumerate() {
            let mut env = Environment::new();
            env.set_auto_escape_callback(|_| AutoEscape::Html);
            env.add_function(
                "t",
                i18n::t_function(b.messages.clone(), cfg.clone(), locale.clone()),
            );
            let (a, inline_styles) = (Arc::clone(&acc), cfg.build.inline_styles);
            env.add_function("cv", move |src: String| {
                let mut acc = a.lock().unwrap_or_else(PoisonError::into_inner);
                *acc = Rendered::default();
                let opts = cascivo_html::Options {
                    inline_styles,
                    ..cascivo_html::Options::default()
                };
                markdown::cv(&src, "cv()", 1, &mut acc, &opts)
                    .map(Value::from_safe_string)
                    .map_err(|e| crate::web::err(e.to_string()))
            });
            register_pure(&mut env, &web);
            env.add_global("data", data.clone());
            env.add_global("site", config_value(cfg));
            env.add_global("locale", locale.as_str());
            for (name, src) in &b.templates {
                // Syntax errors are the same in every locale: report them once.
                if let Err(e) = env.add_template_owned(name.clone(), src.clone())
                    && i == 0
                {
                    errs.push(tpl_err(name, &e));
                }
            }
            envs.insert(locale.clone(), env);
        }
        if errs.is_empty() {
            Ok(Self {
                envs,
                default_locale,
            })
        } else {
            Err(Errors(errs))
        }
    }

    fn template(&self, tpl: &str, req: &ReqCtx) -> Result<minijinja::Template<'_, '_>> {
        let locale = if req.locale.is_empty() {
            self.default_locale.as_str()
        } else {
            req.locale
        };
        let env = self.envs.get(locale).ok_or_else(|| {
            Errors::one(tpl, None, format!("locale `{locale}` is not configured"))
        })?;
        env.get_template(tpl)
            .map_err(|e| Errors(vec![tpl_err(tpl, &e)]))
    }
}

/// The caller's context under the request facts; `request`, `user` and `flash` cannot be
/// overridden, `page` can.
fn full_ctx(ctx: &Value, req: &ReqCtx) -> Value {
    let fixed = context! {
        request => context! { path => req.path, locale => req.locale, csrf => req.csrf, nonce => req.nonce },
        user => req.user.cloned(),
        flash => Value::from(minijinja::value::Serde(req.flash)),
    };
    // The last map that has a key wins.
    merge_maps([
        context! { page => context! { url => req.path } },
        ctx.clone(),
        fixed,
    ])
}

#[cfg(feature = "fs")]
struct Watch {
    root: PathBuf,
    fingerprint: Mutex<u64>,
}

struct Shared {
    inner: RwLock<Arc<Inner>>,
    version: AtomicU64,
    #[cfg(feature = "fs")]
    watch: Option<Watch>,
}

/// Request-time renderer. Cheap to clone; `Send + Sync`.
#[derive(Clone)]
pub struct Engine(Arc<Shared>);

impl Engine {
    pub fn new(bundle: &Bundle) -> Result<Self> {
        Ok(Self(Arc::new(Shared {
            inner: RwLock::new(Arc::new(Inner::new(bundle)?)),
            version: AtomicU64::new(1),
            #[cfg(feature = "fs")]
            watch: None,
        })))
    }

    /// From `build --bundle` output, e.g. `include_bytes!("../app.bundle")`.
    pub fn from_bundle(bytes: &[u8]) -> Result<Self> {
        Self::new(&Bundle::from_bytes(bytes)?)
    }

    /// From a site folder; [`reload`](Self::reload) picks up later edits.
    #[cfg(feature = "fs")]
    pub fn load(root: &Path) -> Result<Self> {
        let fingerprint = fingerprint(root);
        let mut e = Self::new(&Bundle::load(root)?)?;
        if let Some(s) = Arc::get_mut(&mut e.0) {
            s.watch = Some(Watch {
                root: root.to_path_buf(),
                fingerprint: Mutex::new(fingerprint),
            });
        }
        Ok(e)
    }

    fn inner(&self) -> Arc<Inner> {
        Arc::clone(&self.0.inner.read().unwrap_or_else(PoisonError::into_inner))
    }

    /// Renders template `tpl` as a whole page.
    pub fn render(&self, tpl: &str, ctx: &Value, req: &ReqCtx) -> Result<String> {
        let inner = self.inner();
        inner
            .template(tpl, req)?
            .render(full_ctx(ctx, req))
            .map_err(|e| Errors(vec![tpl_err(tpl, &e)]))
    }

    /// Renders only `{% block <block> %}` of `tpl` (inherited blocks included), with the same
    /// context as [`render`](Self::render), so the fragment equals that part of the page.
    pub fn render_block(
        &self,
        tpl: &str,
        block: &str,
        ctx: &Value,
        req: &ReqCtx,
    ) -> Result<String> {
        let inner = self.inner();
        let t = inner.template(tpl, req)?;
        let err = |e: minijinja::Error| Errors(vec![tpl_err(tpl, &e)]);
        let mut cap = t.render_captured(full_ctx(ctx, req)).map_err(err)?;
        cap.with_state_mut(|s| s.render_block(block)).map_err(err)
    }

    /// The locales a [`ReqCtx`] may name, the default first.
    pub fn locales(&self) -> Vec<String> {
        let inner = self.inner();
        let mut v = vec![inner.default_locale.clone()];
        v.extend(
            inner
                .envs
                .keys()
                .filter(|l| **l != inner.default_locale)
                .cloned(),
        );
        v
    }

    /// Starts at 1 and grows with every successful reload (for a dev live-reload stream).
    pub fn version(&self) -> u64 {
        self.0.version.load(Ordering::Acquire)
    }

    /// For an engine from [`load`](Self::load): when a source changed since the last check,
    /// re-reads the site and swaps it in, returning `true`. On an error the previous templates
    /// stay live. Engines from a bundle never reload (`Ok(false)`).
    pub fn reload(&self) -> Result<bool> {
        #[cfg(feature = "fs")]
        if let Some(w) = &self.0.watch {
            let fp = fingerprint(&w.root);
            {
                let mut last = w.fingerprint.lock().unwrap_or_else(PoisonError::into_inner);
                if *last == fp {
                    return Ok(false);
                }
                // Recorded even when the reload fails, so a broken file is reported once.
                *last = fp;
            }
            let inner = Inner::new(&Bundle::load(&w.root)?)?;
            *self.0.inner.write().unwrap_or_else(PoisonError::into_inner) = Arc::new(inner);
            self.0.version.fetch_add(1, Ordering::AcqRel);
            return Ok(true);
        }
        Ok(false)
    }

    /// Dev: calls [`reload`](Self::reload) every `poll` on a background thread, logging
    /// reloads and errors to stderr.
    #[cfg(feature = "fs")]
    pub fn watch(&self, poll: std::time::Duration) -> std::thread::JoinHandle<()> {
        let e = self.clone();
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(poll);
                match e.reload() {
                    Ok(true) => eprintln!("templates reloaded (v{})", e.version()),
                    Ok(false) => {}
                    Err(x) => eprintln!("template reload failed:\n{x}"),
                }
            }
        })
    }
}

/// Changes when a file the bundle reads is added, removed, resized or touched.
#[cfg(feature = "fs")]
pub fn fingerprint(root: &Path) -> u64 {
    use std::hash::{DefaultHasher, Hash, Hasher};
    let mut h = DefaultHasher::new();
    let mut add = |rel: &str| {
        rel.hash(&mut h);
        if let Ok(m) = std::fs::metadata(root.join(rel)) {
            m.len().hash(&mut h);
            m.modified().ok().hash(&mut h);
        }
    };
    add("site.toml");
    for dir in ["layouts", "templates", "i18n"] {
        for f in crate::routes::list_files(&root.join(dir)).unwrap_or_default() {
            add(&format!("{dir}/{f}"));
        }
    }
    let cfg = std::fs::read_to_string(root.join("site.toml"))
        .ok()
        .and_then(|s| Config::parse(&s).ok());
    if let Some(c) = cfg {
        for p in [&c.vite.manifest, &c.vite.css_modules]
            .into_iter()
            .flatten()
        {
            add(p);
        }
        for p in c.data.values() {
            add(p);
        }
    }
    h.finish()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bundle(templates: &[(&str, &str)]) -> Bundle {
        Bundle {
            format: BUNDLE_FORMAT,
            config: Config::parse(
                "title = \"T\"\n[i18n]\ndefault = \"en\"\nlocales = [\"en\", \"de\"]",
            )
            .unwrap(),
            templates: templates
                .iter()
                .map(|(n, s)| (n.to_string(), s.to_string()))
                .collect(),
            messages: BTreeMap::from([
                (
                    "en".into(),
                    BTreeMap::from([("hi".into(), "Hello {name}".into())]),
                ),
                (
                    "de".into(),
                    BTreeMap::from([("hi".into(), "Hallo {name}".into())]),
                ),
            ]),
            vite_manifest: None,
            css_modules: None,
            data: serde_json::json!({ "n": 3 }),
        }
    }

    const LAYOUT: &str = "<html><body>{% block main %}{% endblock %}</body></html>";
    const PAGE: &str = "{% extends \"base.html\" %}{% block main %}<ul id=\"todos\">{% block todos %}{% for t in todos %}<li>{{ t }}</li>{% endfor %}{% endblock %}</ul>{% endblock %}";

    fn engine() -> Engine {
        Engine::new(&bundle(&[("base.html", LAYOUT), ("todos.html", PAGE)])).unwrap()
    }

    #[test]
    fn fragment_is_the_same_subtree_of_the_page() {
        let e = engine();
        let ctx = context! { todos => vec!["a", "<b>"] };
        let req = ReqCtx {
            path: "/todos",
            ..ReqCtx::default()
        };
        let page = e.render("todos.html", &ctx, &req).unwrap();
        let frag = e.render_block("todos.html", "todos", &ctx, &req).unwrap();
        assert_eq!(frag, "<li>a</li><li>&lt;b&gt;</li>");
        assert!(
            page.contains(&format!("<ul id=\"todos\">{frag}</ul>")),
            "{page}"
        );
        let main = e.render_block("todos.html", "main", &ctx, &req).unwrap();
        assert!(page.contains(&main) && main.starts_with("<ul"));
    }

    #[test]
    fn every_template_escapes_whatever_its_extension() {
        let e = Engine::new(&bundle(&[
            ("x.cv", "{{ v }}"),
            ("y", "{{ v }}"),
            ("z.txt", "{{ v }}"),
        ]))
        .unwrap();
        for t in ["x.cv", "y", "z.txt"] {
            let out = e
                .render(t, &context! { v => "<x>" }, &ReqCtx::default())
                .unwrap();
            assert_eq!(out, "&lt;x&gt;", "{t}");
        }
    }

    #[test]
    fn request_facts_locale_data_and_t() {
        let e = Engine::new(&bundle(&[(
            "p.html",
            "{{ t('hi', name=user.name) }}|{{ request.path }}|{{ request.csrf }}|{{ request.nonce }}|{{ flash[0].message }}|{{ data.n }}|{{ locale }}|{{ site.title }}|{{ page.url }}",
        )]))
        .unwrap();
        let user = context! { name => "Ann" };
        let flash = [Flash {
            kind: "success".into(),
            message: "Saved".into(),
        }];
        let req = ReqCtx {
            path: "/p",
            locale: "de",
            csrf: Some("tok"),
            nonce: "n1",
            user: Some(&user),
            flash: &flash,
        };
        // The caller cannot override `request`.
        let ctx = context! { request => "spoof" };
        assert_eq!(
            e.render("p.html", &ctx, &req).unwrap(),
            "Hallo Ann|&#x2f;p|tok|n1|Saved|3|de|T|&#x2f;p"
        );
        let req = ReqCtx { locale: "", ..req };
        assert!(
            e.render("p.html", &ctx, &req)
                .unwrap()
                .starts_with("Hello Ann|")
        );
        assert_eq!(e.locales(), ["en", "de"]);
    }

    #[test]
    fn unknown_locale_template_and_block_are_errors() {
        let e = engine();
        let ctx = context! { todos => Vec::<String>::new() };
        let req = ReqCtx {
            locale: "xx",
            ..ReqCtx::default()
        };
        assert!(
            e.render("todos.html", &ctx, &req)
                .unwrap_err()
                .to_string()
                .contains("locale `xx`")
        );
        let req = ReqCtx::default();
        assert!(e.render("nope.html", &ctx, &req).is_err());
        assert!(e.render_block("todos.html", "nope", &ctx, &req).is_err());
    }

    #[test]
    fn bundle_round_trips_and_rejects_other_formats() {
        let b = bundle(&[("a.html", "x")]);
        let bytes = b.to_bytes();
        assert_eq!(Bundle::from_bytes(&bytes).unwrap(), b);
        assert_eq!(
            Engine::from_bundle(&bytes)
                .unwrap()
                .render("a.html", &Value::UNDEFINED, &ReqCtx::default())
                .unwrap(),
            "x"
        );
        let mut old = b.clone();
        old.format = 0;
        assert!(
            Bundle::from_bytes(&old.to_bytes())
                .unwrap_err()
                .to_string()
                .contains("format 0")
        );
        assert!(Bundle::from_bytes(b"{").is_err());
    }

    #[test]
    fn syntax_errors_are_reported_once_with_the_template_name() {
        let Err(e) = Engine::new(&bundle(&[("bad.html", "{% if %}")])) else {
            panic!("expected an error");
        };
        assert_eq!(e.0.len(), 1);
        assert_eq!(e.0[0].file, "bad.html");
    }

    #[test]
    fn engine_is_send_sync_and_page_is_overridable() {
        fn send_sync<T: Send + Sync + Clone>() {}
        send_sync::<Engine>();
        let e = Engine::new(&bundle(&[("p", "{{ page.url }}")])).unwrap();
        let ctx = context! { page => context! { url => "x" } };
        assert_eq!(e.render("p", &ctx, &ReqCtx::default()).unwrap(), "x");
    }

    #[test]
    fn scripts_carry_the_request_nonce() {
        let e = Engine::new(&bundle(&[(
            "p.html",
            "{{ theme_script() }}{{ islands_script() }}",
        )]))
        .unwrap();
        let req = ReqCtx {
            nonce: "abc123",
            ..ReqCtx::default()
        };
        let out = e.render("p.html", &Value::UNDEFINED, &req).unwrap();
        assert_eq!(out.matches("<script nonce=\"abc123\"").count(), 2, "{out}");
        // No request nonce (the static build): no attribute.
        let out = e
            .render("p.html", &Value::UNDEFINED, &ReqCtx::default())
            .unwrap();
        assert!(!out.contains("nonce"), "{out}");
    }

    #[test]
    fn bundle_engines_never_reload() {
        let e = engine();
        assert!(!e.reload().unwrap());
        assert_eq!(e.version(), 1);
    }
}
