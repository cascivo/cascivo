//! Template functions for sites that bring their own build (Vite) and assets: `head`, `asset`,
//! `vite`, `vite_css`, `css_bundle`, `m`, `island`, `islands_script`, `theme_script`, `img`, the `highlight`
//! filter and the `data` global. Each lives in its own module; this one holds the shared state
//! (files the functions produce, the loaded Vite manifest, the image cache) and the wiring.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, PoisonError};

use minijinja::value::{Kwargs, Rest};
use minijinja::{Environment, ErrorKind, State, Value};

use crate::config::Config;
use crate::error::Error;
#[cfg(feature = "images")]
use crate::images;
use crate::site::{Site, to_value};
use crate::{assets, bundle, data, head, highlight, islands, theme, vite};

pub(crate) type FnResult = std::result::Result<Value, minijinja::Error>;

pub fn err(msg: impl Into<String>) -> minijinja::Error {
    minijinja::Error::new(ErrorKind::InvalidOperation, msg.into())
}

fn safe(r: std::result::Result<String, String>) -> FnResult {
    r.map(Value::from_safe_string).map_err(err)
}

/// Positional and keyword arguments of one call, bound to the function's parameter names.
pub struct Args {
    vals: BTreeMap<&'static str, Value>,
}

impl Args {
    pub fn parse(
        fname: &str,
        names: &[&'static str],
        pos: &[Value],
        kw: Option<Kwargs>,
    ) -> std::result::Result<Self, minijinja::Error> {
        let mut vals = BTreeMap::new();
        if pos.len() > names.len() {
            return Err(err(format!(
                "{fname}() takes at most {} arguments ({}) but {} were given",
                names.len(),
                names.join(", "),
                pos.len()
            )));
        }
        for (n, v) in names.iter().zip(pos) {
            vals.insert(*n, v.clone());
        }
        if let Some(k) = kw {
            for key in k.args() {
                let Some(n) = names.iter().find(|n| **n == key) else {
                    return Err(err(format!(
                        "{fname}() has no argument `{key}` (arguments: {})",
                        names.join(", ")
                    )));
                };
                if vals.contains_key(n) {
                    return Err(err(format!("{fname}() got `{key}` twice")));
                }
                vals.insert(n, k.peek::<Value>(key)?);
            }
        }
        vals.retain(|_, v| !v.is_none() && !v.is_undefined());
        Ok(Self { vals })
    }

    pub fn value(&self, n: &str) -> Option<&Value> {
        self.vals.get(n)
    }

    pub fn str(&self, n: &str) -> std::result::Result<Option<String>, minijinja::Error> {
        match self.vals.get(n) {
            None => Ok(None),
            Some(v) => v
                .as_str()
                .map(|s| Some(s.to_string()))
                .or_else(|| v.as_i64().map(|i| Some(i.to_string())))
                .ok_or_else(|| err(format!("`{n}` must be a string"))),
        }
    }

    pub fn req(&self, n: &str) -> std::result::Result<String, minijinja::Error> {
        self.str(n)?
            .ok_or_else(|| err(format!("missing required argument `{n}`")))
    }

    pub fn or(&self, n: &str, d: &str) -> std::result::Result<String, minijinja::Error> {
        Ok(self.str(n)?.unwrap_or_else(|| d.to_string()))
    }

    pub fn strings(&self, n: &str) -> std::result::Result<Option<Vec<String>>, minijinja::Error> {
        let Some(v) = self.vals.get(n) else {
            return Ok(None);
        };
        let bad = || err(format!("`{n}` must be a list of strings"));
        v.try_iter()
            .map_err(|_| bad())?
            .map(|x| x.as_str().map(str::to_string).ok_or_else(bad))
            .collect::<std::result::Result<_, _>>()
            .map(Some)
    }

    pub fn ints(&self, n: &str) -> std::result::Result<Option<Vec<u32>>, minijinja::Error> {
        let Some(v) = self.vals.get(n) else {
            return Ok(None);
        };
        let bad = || err(format!("`{n}` must be a list of positive integers"));
        v.try_iter()
            .map_err(|_| bad())?
            .map(|x| {
                x.as_i64()
                    .and_then(|i| u32::try_from(i).ok())
                    .filter(|i| *i > 0)
                    .ok_or_else(bad)
            })
            .collect::<std::result::Result<_, _>>()
            .map(Some)
    }
}

/// What the functions share during one render.
pub struct WebState {
    pub(crate) root: PathBuf,
    pub(crate) cfg: Config,
    /// Output files made by `asset()` / `img()`, written by `Renderer::run`.
    files: Mutex<BTreeMap<String, Vec<u8>>>,
    pub(crate) vite: vite::Vite,
    #[cfg(feature = "images")]
    pub(crate) images: Mutex<images::Cache>,
    /// `<link rel=preload>` tags queued by `img(priority=true)` while one page renders.
    preloads: Mutex<Vec<String>>,
}

impl WebState {
    #[cfg(feature = "images")]
    pub(crate) fn preload(&self, link: String) {
        let mut p = self.preloads.lock().unwrap_or_else(PoisonError::into_inner);
        if !p.contains(&link) {
            p.push(link);
        }
    }

    /// The preloads queued since the last call (pages render one at a time per state).
    pub fn take_preloads(&self) -> Vec<String> {
        std::mem::take(&mut *self.preloads.lock().unwrap_or_else(PoisonError::into_inner))
    }

    /// `<script{attrs}>js</script>`, or with `[build] external_scripts` a `<script{attrs} src>`
    /// to `js` written as `<name>.js` (hashed with `hash_assets`). Unhashed, one name holds one
    /// script: a second, different body is an error.
    pub(crate) fn script(&self, name: &str, js: &str, attrs: &str) -> Result<String, String> {
        if !self.cfg.build.external_scripts {
            return Ok(format!("<script{attrs}>{}</script>", head::script_json(js)));
        }
        let rel = assets::out_name(&self.cfg.build, &format!("{name}.js"), js.as_bytes());
        {
            let mut files = self.files.lock().unwrap_or_else(PoisonError::into_inner);
            if files.get(&rel).is_some_and(|b| b != js.as_bytes()) {
                return Err(format!(
                    "`/{rel}` would get two different scripts; use the same arguments on every page or set `[build] hash_assets = true`"
                ));
            }
            files.insert(rel.clone(), js.as_bytes().to_vec());
        }
        let mut s = format!("<script{attrs}");
        cascivo_html::html::attr(&mut s, "src", &format!("/{rel}"));
        s.push_str("></script>");
        Ok(s)
    }

    pub(crate) fn emit(&self, rel: String, bytes: Vec<u8>) {
        self.files
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .insert(rel, bytes);
    }

    pub(crate) fn new(root: PathBuf, cfg: Config, vite: vite::Vite) -> Self {
        Self {
            root,
            cfg,
            files: Mutex::default(),
            vite,
            #[cfg(feature = "images")]
            images: Mutex::default(),
            preloads: Mutex::default(),
        }
    }

    #[cfg(test)]
    pub(crate) fn for_tests(cfg: Config, vite: vite::Vite) -> Self {
        Self::new(PathBuf::new(), cfg, vite)
    }

    pub fn take_files(&self) -> BTreeMap<String, Vec<u8>> {
        std::mem::take(&mut *self.files.lock().unwrap_or_else(PoisonError::into_inner))
    }
}

/// Registers every function, the `highlight` filter and the `data` global. Problems found while
/// loading the configured Vite files or data go to `errs` (the build then fails with them).
pub(crate) fn register(
    env: &mut Environment<'static>,
    site: &Site,
    errs: &mut Vec<Error>,
) -> Arc<WebState> {
    let c = &site.config.vite;
    let mut read = |what: &str, p: &Option<String>| -> Option<String> {
        let p = p.as_ref()?;
        match std::fs::read_to_string(site.root.join(p)) {
            Ok(s) => Some(s),
            Err(e) => {
                errs.push(Error::new("site.toml", None, format!("{what} `{p}`: {e}")));
                None
            }
        }
    };
    let manifest = read("vite.manifest", &c.manifest);
    let modules = read("vite.css_modules", &c.css_modules);
    let vite = vite::Vite::parse(manifest.as_deref(), modules.as_deref()).unwrap_or_else(|m| {
        errs.push(Error::new("site.toml", None, m));
        vite::Vite::default()
    });
    let state = Arc::new(WebState::new(site.root.clone(), site.config.clone(), vite));

    match data::load(&site.root, &site.config.data, to_value) {
        Ok(v) => env.add_global("data", v),
        Err(m) => errs.push(Error::new("site.toml", None, m)),
    }

    let s = Arc::clone(&state);
    env.add_function("asset", move |path: String| safe(assets::asset(&s, &path)));
    let s = Arc::clone(&state);
    env.add_function("css_bundle", move |rest: Rest<Value>, kw: Kwargs| {
        let a = Args::parse("css_bundle", &["hrefs", "name"], &rest, Some(kw))?;
        let hrefs = a
            .strings("hrefs")?
            .ok_or_else(|| err("css_bundle(): missing `hrefs`"))?;
        safe(bundle::bundle(&s, &hrefs, &a.or("name", "bundle")?))
    });
    #[cfg(feature = "images")]
    let s = Arc::clone(&state);
    #[cfg(feature = "images")]
    env.add_function("img", move |rest: Rest<Value>, kw: Kwargs| {
        let a = Args::parse("img", images::PARAMS, &rest, Some(kw))?;
        safe(images::render(&s, &a))
    });
    #[cfg(not(feature = "images"))]
    env.add_function("img", |_: Rest<Value>, _: Kwargs| -> FnResult {
        Err(err(
            "img(): cascivo-web was built without the `images` feature",
        ))
    });
    register_pure(env, &state);
    state
}

/// ` nonce="…"` from `request.nonce` (set per request by [`crate::engine::Engine`]), so a strict
/// `script-src 'nonce-…'` CSP admits the script inline or as a file; empty in the static build.
fn nonce_attr(st: &State) -> String {
    let nonce = st
        .lookup("request")
        .and_then(|r| r.get_attr("nonce").ok())
        .and_then(|n| n.as_str().map(str::to_string))
        .unwrap_or_default();
    let mut s = String::new();
    if !nonce.is_empty() {
        cascivo_html::html::attr(&mut s, "nonce", &nonce);
    }
    s
}

/// The functions that need no file access: `head`, `vite`, `vite_css`, `m`, `island`,
/// `islands_script`, `theme_script` and the `highlight` filter. Shared by the static build and
/// [`crate::engine::Engine`].
pub(crate) fn register_pure(env: &mut Environment<'static>, state: &Arc<WebState>) {
    let s = Arc::clone(state);
    env.add_function("head", move |st: &State, rest: Rest<Value>, kw: Kwargs| {
        let a = Args::parse("head", head::PARAMS, &rest, Some(kw))?;
        let page_url = st
            .lookup("page")
            .and_then(|p| p.get_attr("url").ok())
            .and_then(|u| u.as_str().map(str::to_string))
            .unwrap_or_default();
        safe(head::render(&s.cfg, &page_url, &a))
    });
    let s = Arc::clone(state);
    env.add_function("vite", move |entry: String| safe(s.vite.url(&entry)));
    let s = Arc::clone(state);
    env.add_function("vite_css", move |entry: String| {
        s.vite.css(&entry).map_err(err).map(|v| {
            Value::from(
                v.into_iter()
                    .map(Value::from_safe_string)
                    .collect::<Vec<_>>(),
            )
        })
    });
    let s = Arc::clone(state);
    env.add_function("m", move |module: String, class: String| {
        s.vite.class(&module, &class).map(Value::from).map_err(err)
    });
    let s = Arc::clone(state);
    env.add_function("island", move |rest: Rest<Value>, kw: Kwargs| {
        let a = Args::parse("island", islands::PARAMS, &rest, Some(kw))?;
        safe(islands::attrs(&s, &a))
    });
    let s = Arc::clone(state);
    env.add_function("islands_script", move |st: &State| {
        let attrs = format!("{} type=\"module\"", nonce_attr(st));
        safe(s.script("cascivo-islands", islands::LOADER, &attrs))
    });
    let s = Arc::clone(state);
    // Stays blocking (no `defer`) even as a file: it must set `data-theme` before first paint.
    env.add_function(
        "theme_script",
        move |st: &State, rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("theme_script", theme::PARAMS, &rest, Some(kw))?;
            let attrs = nonce_attr(st);
            safe(theme::body(&a).and_then(|js| s.script("cascivo-theme", &js, &attrs)))
        },
    );
    let s = Arc::clone(state);
    env.add_filter("highlight", move |code: String, lang: String| {
        safe(highlight::render(
            &code,
            &lang,
            s.vite.class("code-snippet", "code").ok().as_deref(),
        ))
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use minijinja::context;

    fn call(src: &str) -> std::result::Result<String, minijinja::Error> {
        let mut env = Environment::new();
        env.add_function("f", |rest: Rest<Value>, kw: Kwargs| {
            let a = Args::parse("f", &["a", "b"], &rest, Some(kw))?;
            Ok::<_, minijinja::Error>(format!("{:?}/{:?}", a.str("a")?, a.str("b")?))
        });
        env.render_str(src, context! {})
    }

    #[test]
    fn positional_and_keyword_bind_by_name() {
        assert_eq!(
            call("{{ f('x', b='y') }}").unwrap(),
            "Some(\"x\")/Some(\"y\")"
        );
        assert_eq!(
            call("{{ f(b='y', a='x') }}").unwrap(),
            "Some(\"x\")/Some(\"y\")"
        );
        assert_eq!(call("{{ f('x', none) }}").unwrap(), "Some(\"x\")/None");
    }

    #[test]
    fn unknown_duplicate_and_extra_arguments_are_errors() {
        assert!(
            call("{{ f(c=1) }}")
                .unwrap_err()
                .to_string()
                .contains("no argument `c`")
        );
        assert!(
            call("{{ f('x', a='y') }}")
                .unwrap_err()
                .to_string()
                .contains("twice")
        );
        assert!(
            call("{{ f(1, 2, 3) }}")
                .unwrap_err()
                .to_string()
                .contains("at most 2")
        );
    }
}
