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

#[derive(Clone, Default)]
pub struct Options {
    pub brand: Option<Brand>,
    pub brand_resolver: Option<BrandResolver>,
    pub minify_html: bool,
}

/// Per-document emit state. Ids come from a counter so output is deterministic.
#[derive(Default)]
pub struct Cx {
    next_id: u32,
    pub used: BTreeSet<&'static str>,
    pub scripts: BTreeSet<&'static str>,
}

impl Cx {
    /// `cv-1`, `cv-2`, …
    pub fn id(&mut self) -> String {
        self.next_id += 1;
        format!("cv-{}", self.next_id)
    }
}

/// CSS that only some emitters need beyond the per-component module (inside `@layer cascivo.component`).
const EXTRA_CSS: &[(&str, &str)] = &[("tabs", include_str!("../assets/extra/tabs.css"))];

/// Inline scripts, keyed by the name emitters put in `Cx::scripts`.
const SCRIPTS: &[(&str, &str)] = &[("table-sort", include_str!("../assets/extra/table-sort.js"))];

fn emit_body(doc: &Doc, cx: &mut Cx) -> String {
    let mut body = String::new();
    for node in &doc.nodes {
        emit(node, cx, &mut body);
    }
    body
}

/// Body markup only (no document shell); used by conformance snapshots.
pub fn render_fragment(src: &str) -> Result<String, Vec<Diagnostic>> {
    let doc = parse(src)?;
    Ok(emit_body(&doc, &mut Cx::default()))
}

pub fn render(src: &str, opts: &Options) -> Result<String, Vec<Diagnostic>> {
    let doc = parse(src)?;
    let (theme, brand_css) = document_brand(&doc, opts)?;
    let mut cx = Cx::default();
    let body = emit_body(&doc, &mut cx);

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
    out.push_str("<body>");
    out.push_str(&body);
    out.push_str("</body>");
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
