//! Document assembly: parse → brand → emit → one self-contained HTML string.

use std::collections::BTreeSet;

use crate::ast::{Directive, Doc};
use crate::brand::{Brand, document_brand};
use crate::css_gen::{BASE_CSS, COMPONENT_CSS, THEMES};
use crate::diag::Diagnostic;
use crate::emit::emit;
use crate::html::esc;
use crate::parse::parse;

/// Resolves `@brand-file` paths. The library itself never touches the filesystem.
pub type BrandResolver = &'static dyn Fn(&str) -> Result<String, String>;

/// Loads the bytes of an image/SVG source (a path or URL). Never called for `data:` URIs.
pub type AssetResolver = &'static dyn Fn(&str) -> Result<Vec<u8>, String>;

#[derive(Clone, Default)]
pub struct Options {
    pub brand: Option<Brand>,
    pub brand_resolver: Option<BrandResolver>,
    pub minify_html: bool,
    /// Pre-supplied bytes keyed by the exact `src` written in the `.cv`; looked up first, so a
    /// web server can pass uploads without a `'static` resolver.
    pub assets: Vec<(String, Vec<u8>)>,
    pub asset_resolver: Option<AssetResolver>,
    /// Also send `http(s)://` sources to `asset_resolver`; otherwise they stay plain references.
    pub embed_urls: bool,
    /// Largest embeddable asset in bytes (default 2 MiB).
    pub max_asset_bytes: Option<usize>,
}

/// Per-document emit state. Ids come from a counter so output is deterministic.
#[derive(Default)]
pub struct Cx<'a> {
    next_id: u32,
    pub(crate) opts: Option<&'a Options>,
    pub(crate) diags: Vec<Diagnostic>,
    pub used: BTreeSet<&'static str>,
    pub scripts: BTreeSet<&'static str>,
}

impl Cx<'_> {
    /// `cv-1`, `cv-2`, …
    pub fn id(&mut self) -> String {
        self.next_id += 1;
        format!("cv-{}", self.next_id)
    }
}

/// CSS that only some emitters need beyond the per-component module (inside `@layer cascivo.component`).
// Static output has no load handler, so the image must not stay hidden behind its placeholder.
const EXTRA_CSS: &[(&str, &str)] = &[
    ("image", include_str!("../assets/extra/image.css")),
    ("tabs", include_str!("../assets/extra/tabs.css")),
];

/// Inline scripts, keyed by the name emitters put in `Cx::scripts`.
const SCRIPTS: &[(&str, &str)] = &[("table-sort", include_str!("../assets/extra/table-sort.js"))];

/// Page shell: inline padding and a vertical rhythm from the brand's `gap` (default space-4).
/// Mobile-first, no max-width: the document fills the viewport like a dashboard.
const DOC_CSS: &str = "@layer cascivo.component{.cv-doc{display:flex;flex-direction:column;gap:var(--cascivo-gap-default,var(--cascivo-space-4));padding:var(--cascivo-space-4);min-inline-size:0}@media (min-width:40rem){.cv-doc{padding:var(--cascivo-space-6)}}@media (min-width:64rem){.cv-doc{padding:var(--cascivo-space-8)}}}";

fn emit_body(doc: &Doc, cx: &mut Cx<'_>) -> String {
    let mut body = String::new();
    for node in &doc.nodes {
        emit(node, cx, &mut body);
    }
    body
}

/// Body markup only (no document shell); used by conformance snapshots.
pub fn render_fragment(src: &str) -> Result<String, Vec<Diagnostic>> {
    let doc = parse(src)?;
    let mut cx = Cx::default();
    let body = emit_body(&doc, &mut cx);
    if cx.diags.is_empty() {
        Ok(body)
    } else {
        Err(cx.diags)
    }
}

pub fn render(src: &str, opts: &Options) -> Result<String, Vec<Diagnostic>> {
    let doc = parse(src)?;
    let (theme, brand_css) = document_brand(&doc, opts)?;
    let mut cx = Cx {
        opts: Some(opts),
        ..Cx::default()
    };
    let body = emit_body(&doc, &mut cx);
    if !cx.diags.is_empty() {
        return Err(cx.diags);
    }

    let mut title = "";
    let mut lang = "en";
    for d in &doc.directives {
        match d {
            Directive::Title(t) => title = t,
            Directive::Lang(l) => lang = l,
            _ => {}
        }
    }
    let theme = theme.as_deref().unwrap_or("light");

    let mut css = String::from(BASE_CSS);
    if let Some((_, c)) = THEMES.iter().find(|(n, _)| *n == theme) {
        css.push_str(c);
    }
    css.push_str(&brand_css);
    css.push_str(DOC_CSS);
    for (unit, c) in COMPONENT_CSS {
        if cx.used.contains(unit) {
            css.push_str(c);
        }
    }
    for (unit, c) in EXTRA_CSS {
        if cx.used.contains(unit) {
            css.push_str(c);
        }
    }

    let nl = if opts.minify_html { "" } else { "\n" };
    let mut out = String::with_capacity(css.len() + body.len() + 256);
    out.push_str("<!doctype html>");
    out.push_str(nl);
    out.push_str("<html lang=\"");
    esc(&mut out, lang);
    out.push_str("\" data-theme=\"");
    esc(&mut out, theme);
    out.push_str("\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>");
    esc(&mut out, title);
    out.push_str("</title><style>");
    out.push_str(&css);
    out.push_str("</style></head>");
    out.push_str(nl);
    out.push_str("<body><main class=\"cv-doc\">");
    out.push_str(&body);
    out.push_str("</main></body>");
    for (name, js) in SCRIPTS {
        if cx.scripts.contains(name) {
            out.push_str("<script>");
            out.push_str(js);
            out.push_str("</script>");
        }
    }
    out.push_str("</html>");
    out.push_str(nl);
    Ok(out)
}

/// A resolved `src`: bytes to embed, or a string to use as-is.
pub(crate) enum Asset {
    Bytes {
        mime: &'static str,
        bytes: Vec<u8>,
    },
    /// A `data:` URI or an `http(s)` URL left as a reference.
    Passthrough(String),
}

impl Cx<'_> {
    pub(crate) fn error(&mut self, node: &crate::ast::Node, msg: impl Into<String>) {
        self.diags.push(Diagnostic::new(node.line, node.col, msg));
    }

    /// Turns a `src` into bytes or a passthrough string; on failure records a diagnostic.
    /// `allow_ref` lets an unfetched `http(s)` URL stay a plain reference (images only).
    pub(crate) fn load_asset(
        &mut self,
        node: &crate::ast::Node,
        src: &str,
        allow_ref: bool,
    ) -> Option<Asset> {
        let src = src.trim();
        let opts = self.opts;
        // Fragment mode (no Options) is the conformance path: sources stay untouched references.
        if opts.is_none() && allow_ref {
            return Some(Asset::Passthrough(src.to_string()));
        }
        let lower = src.to_ascii_lowercase();
        if lower.starts_with("data:") {
            // Only inert image types; `data:image/svg+xml` is safe in <img>, never inlined.
            let ok = ["png", "jpeg", "gif", "webp", "avif", "svg+xml", "x-icon"]
                .iter()
                .any(|m| {
                    lower.starts_with(&format!("data:image/{m};"))
                        || lower.starts_with(&format!("data:image/{m},"))
                });
            if ok && allow_ref {
                return Some(Asset::Passthrough(src.to_string()));
            }
            self.error(node, "data: URIs are only accepted for raster/svg images in `image`; give `svg` a file path or inline markup");
            return None;
        }
        let is_url = lower.starts_with("http://") || lower.starts_with("https://");
        let found = opts.and_then(|o| {
            o.assets
                .iter()
                .find(|(k, _)| k == src)
                .map(|(_, b)| b.clone())
        });
        let bytes = match found {
            Some(b) => b,
            None => {
                let resolver = opts
                    .and_then(|o| o.asset_resolver)
                    .filter(|_| !is_url || opts.is_some_and(|o| o.embed_urls));
                match resolver {
                    Some(r) => match r(src) {
                        Ok(b) => b,
                        Err(e) => {
                            self.error(node, format!("cannot load '{src}': {e}"));
                            return None;
                        }
                    },
                    None if is_url && allow_ref => {
                        return Some(Asset::Passthrough(src.to_string()));
                    }
                    None if is_url => {
                        self.error(node, format!("cannot inline '{src}': URLs are fetched only with the CLI's --fetch (or Options::assets); give `svg` a file path or inline markup"));
                        return None;
                    }
                    None => {
                        self.error(node, format!("cannot load '{src}': no asset source configured; use the cascivo-html CLI (paths relative to the .cv file, more roots via --assets) or pass the bytes in Options::assets"));
                        return None;
                    }
                }
            }
        };
        let max = opts
            .and_then(|o| o.max_asset_bytes)
            .unwrap_or(crate::asset::DEFAULT_MAX_ASSET_BYTES);
        if bytes.len() > max {
            self.error(node, format!("'{src}' is {} bytes, over the {max}-byte embed limit (raise it with --max-asset or Options::max_asset_bytes)", bytes.len()));
            return None;
        }
        let Some(mime) = crate::asset::sniff_mime(&bytes, src) else {
            self.error(
                node,
                format!(
                    "'{src}': unknown image type (expected png, jpeg, gif, webp, avif, svg or ico)"
                ),
            );
            return None;
        };
        Some(Asset::Bytes { mime, bytes })
    }
}
