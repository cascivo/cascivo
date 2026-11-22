//! Render cascivo `.cv` text in a native [Blitz](https://github.com/DioxusLabs/blitz) window.
//!
//! [`document_from_cv`] builds a Blitz [`HtmlDocument`] and works headless (no GPU, no window).
//! With the default `window` feature, [`launch_cv`] opens it.
//!
//! For interactivity use [`App`]: Rust handlers by selector, [`Signal`] bindings, and native
//! replacements for what Blitz lacks (table sort, tabs, `<dialog>`, `<select>`).
//!
//! ```
//! # fn main() -> Result<(), cascivo_blitz::Error> {
//! let src = "h1 \"Hello\"\nbutton \"Go\" primary\n";
//! let mut doc = cascivo_blitz::document_from_cv(src, &cascivo_blitz::Options::default())?;
//! doc.resolve(0.0);
//! let button = doc.query_selector("button").unwrap().unwrap();
//! assert_eq!(doc.resolved_style_value(button, "background-color"), "oklch(0.205 0 0)");
//! # #[cfg(feature = "window")]
//! # if false {
//! cascivo_blitz::launch_cv(src, cascivo_blitz::Options::default())?;
//! # }
//! # Ok(()) }
//! ```

use std::fmt;
use std::sync::Once;

use blitz_dom::DocumentConfig;
pub use blitz_html::HtmlDocument;
pub use blitz_traits::shell::{ColorScheme, Viewport};
pub use cascivo_html::{Diagnostic, Target};
pub use keyboard_types::{Key, Modifiers, NamedKey};

mod app;
pub mod behaviors;
mod dom;
pub mod reactive;

pub use app::{App, Ctx, Event, InteractiveDocument};
pub use behaviors::Behaviors;
pub use dom::Dom;
pub use reactive::{Computed, Effect, Signal, batch, computed, effect, untracked};

/// How to build the document.
#[derive(Clone)]
pub struct Options {
    /// Built-in cascivo theme name (`light`, `dark`, `midnight`, …). `None` follows the `.cv`
    /// file: its `@brand` directive (`theme=`, `light`/`dark`), default `light`. `Some` overrides the theme and
    /// drops other `@brand` overrides.
    pub theme: Option<String>,
    /// Drives `@media (prefers-color-scheme)` and `light-dark()`.
    pub color_scheme: ColorScheme,
    /// Initial size in physical pixels. A window overrides it with its own size.
    pub viewport: Viewport,
    /// Passed to `cascivo_html`: assets, brand files. The target defaults to [`Target::Blitz`].
    pub html: cascivo_html::Options,
    /// Collect `cascivo_html::lint` warnings for [`App`] (see [`InteractiveDocument::warnings`]).
    pub lint: bool,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            theme: None,
            color_scheme: ColorScheme::Light,
            viewport: Viewport::new(1024, 768, 1.0, ColorScheme::Light),
            html: cascivo_html::Options {
                target: Target::Blitz,
                ..cascivo_html::Options::default()
            },
            lint: true,
        }
    }
}

/// Why a document could not be built or shown.
#[derive(Debug)]
pub enum Error {
    /// The `.cv` text did not parse or check.
    Cv(Vec<Diagnostic>),
    /// The window event loop failed.
    Window(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Cv(diags) => {
                for (i, d) in diags.iter().enumerate() {
                    if i > 0 {
                        writeln!(f)?;
                    }
                    write!(f, "{d}")?;
                }
                Ok(())
            }
            Error::Window(e) => write!(f, "window: {e}"),
        }
    }
}

impl std::error::Error for Error {}

impl From<Vec<Diagnostic>> for Error {
    fn from(d: Vec<Diagnostic>) -> Self {
        Error::Cv(d)
    }
}

/// Turn on the Stylo preferences cascivo CSS relies on (`:has()`). Process-wide and idempotent;
/// [`document_from_cv`] calls it. Call it yourself before building any other Blitz document.
pub fn enable_prefs() {
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        style_config::set_pref!("layout.css.has-selector.enabled", true);
    });
}

/// The HTML cascivo would write for `src`, in the form Blitz is given. Scripts are dropped:
/// Blitz runs none.
pub fn html_from_cv(src: &str, opts: &Options) -> Result<String, Error> {
    let Some(theme) = &opts.theme else {
        return Ok(cascivo_html::render(src, &opts.html)?);
    };
    let frag = cascivo_html::render_parts(src, &opts.html)?;
    let mut css = cascivo_html::stylesheet(theme, &frag.used);
    if opts.html.target == Target::Blitz {
        css = cascivo_html::lower_css(&css);
    }
    let theme = escape_attr(theme);
    Ok(format!(
        "<!doctype html><html lang=\"en\" data-theme=\"{theme}\"><head><meta charset=\"utf-8\">\
         <style>{css}</style></head><body><main class=\"cv-doc\">{}</main></body></html>",
        frag.html
    ))
}

/// Compatibility warnings for `src` on `opts.html.target` (see `cascivo_html::lint`).
pub fn lint_cv(src: &str, opts: &Options) -> Result<Vec<Diagnostic>, Error> {
    Ok(cascivo_html::lint(src, opts.html.target)?)
}

/// Build a Blitz document from `.cv` text. Headless: nothing is drawn, call
/// `doc.resolve(0.0)` to compute styles and layout.
pub fn document_from_cv(src: &str, opts: &Options) -> Result<HtmlDocument, Error> {
    enable_prefs();
    let html = html_from_cv(src, opts)?;
    let viewport = Viewport {
        color_scheme: opts.color_scheme,
        ..opts.viewport.clone()
    };
    Ok(HtmlDocument::from_html(
        &html,
        DocumentConfig {
            viewport: Some(viewport),
            ..Default::default()
        },
    ))
}

/// Open `src` in a native window and block until it closes.
#[cfg(feature = "window")]
pub fn launch_cv(src: &str, opts: Options) -> Result<(), Error> {
    let doc = document_from_cv(src, &opts)?;
    launch_document(doc)
}

/// Open any Blitz document in a native window and block until it closes.
#[cfg(feature = "window")]
pub fn launch_document(doc: impl blitz_dom::Document) -> Result<(), Error> {
    use blitz_shell::{BlitzApplication, BlitzShellProxy, WindowConfig, create_default_event_loop};

    let event_loop = create_default_event_loop();
    let (proxy, events) = BlitzShellProxy::new(event_loop.create_proxy());
    let mut app = BlitzApplication::new(proxy, events);
    app.add_window(WindowConfig::new(
        Box::new(doc) as _,
        anyrender_vello::VelloWindowRenderer::new(),
    ));
    event_loop
        .run_app(app)
        .map_err(|e| Error::Window(e.to_string()))
}

fn escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
}
