use axum::http::response::Parts;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use cascivo_web::{Engine, Flash, ReqCtx};
use minijinja::Value;
use serde::Serialize;

use crate::{AppError, Hx, LocalPath};

/// What a handler returns: a template, its context and how htmx should receive it. The
/// [`App`](crate::App) layer renders it: the whole page, or for a partial htmx request
/// ([`Hx::is_partial`]) only [`fragment`](Self::fragment) plus the [`oob`](Self::oob) swaps.
///
/// Block names are static, chosen by the handler, never by a request header.
#[derive(Debug, Clone)]
#[must_use]
pub struct View {
    tpl: &'static str,
    ctx: Value,
    fragment: Option<&'static str>,
    oob: Vec<(&'static str, &'static str, Value)>,
    toasts: Vec<Flash>,
    triggers: serde_json::Map<String, serde_json::Value>,
    status: StatusCode,
    push_url: Option<LocalPath>,
}

/// A toast's `kind` (the `Flash::kind` string).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToastKind {
    Info,
    Success,
    Warning,
    Danger,
}

impl ToastKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Info => "info",
            Self::Success => "success",
            Self::Warning => "warning",
            Self::Danger => "danger",
        }
    }
}

impl View {
    pub fn page(tpl: &'static str) -> Self {
        Self {
            tpl,
            ctx: Value::UNDEFINED,
            fragment: None,
            oob: Vec::new(),
            toasts: Vec::new(),
            triggers: serde_json::Map::new(),
            status: StatusCode::OK,
            push_url: None,
        }
    }

    /// The template context (replaces an earlier one). `request`, `user` and `flash` are the
    /// request's and cannot be set here.
    pub fn ctx(mut self, ctx: impl Serialize) -> Self {
        self.ctx = Value::from(minijinja::value::Serde(ctx));
        self
    }

    /// The block a partial htmx request gets instead of the page. By convention the page wraps
    /// it in an element with `id="<block>"` (see [`check_fragment`]), the swap target.
    pub fn fragment(mut self, block: &'static str) -> Self {
        self.fragment = Some(block);
        self
    }

    /// Also swap `block` of `tpl` (rendered with `ctx`) into `#<block>` on a partial htmx
    /// request (`hx-swap-oob="innerHTML:#<block>"`). A full page already contains it.
    /// The wrapper is a `<div>`, so table rows need a block around their `<table>`.
    pub fn oob(mut self, tpl: &'static str, block: &'static str, ctx: impl Serialize) -> Self {
        self.oob
            .push((tpl, block, Value::from(minijinja::value::Serde(ctx))));
        self
    }

    /// A toast, `msg_key` being an i18n key the template passes to `t()`. A full page renders
    /// it with the request's `flash`; a partial htmx request appends the toaster block
    /// ([`App::toaster`](crate::App::toaster)) to `#cv-toaster` out of band, or without a
    /// toaster sends `HX-Trigger: {"cv-toast": [{kind, message}]}`.
    pub fn toast(mut self, kind: ToastKind, msg_key: &'static str) -> Self {
        self.toasts.push(Flash {
            kind: kind.as_str().into(),
            message: msg_key.into(),
        });
        self
    }

    /// An `HX-Trigger` event (`{"<event>": detail}`); the last detail per event wins.
    pub fn trigger(mut self, event: &'static str, detail: impl Serialize) -> Self {
        let v = serde_json::to_value(detail).unwrap_or(serde_json::Value::Null);
        self.triggers.insert(event.into(), v);
        self
    }

    pub fn status(mut self, s: StatusCode) -> Self {
        self.status = s;
        self
    }

    /// `HX-Push-Url`: the URL htmx puts in the address bar and history.
    pub fn push_url(mut self, to: LocalPath) -> Self {
        self.push_url = Some(to);
        self
    }
}

impl IntoResponse for View {
    /// A placeholder the [`App`](crate::App) layer replaces; without the layer it stays a 500.
    fn into_response(self) -> Response {
        let mut r = (
            StatusCode::INTERNAL_SERVER_ERROR,
            "cascivo-server: View returned outside an App router",
        )
            .into_response();
        r.extensions_mut().insert(self);
        r
    }
}

/// Request facts the layer passes to [`View::render`].
pub(crate) struct Req<'a> {
    pub hx: &'a Hx,
    pub path: &'a str,
    pub nonce: &'a str,
    pub facts: crate::Facts,
}

impl View {
    pub(crate) fn render(
        mut self,
        engine: &Engine,
        toaster: Option<(&'static str, &'static str)>,
        req: Req<'_>,
        parts: &mut Parts,
    ) -> Result<String, AppError> {
        let partial = req.hx.is_partial();
        let facts = req.facts;
        let mut flash = facts.flash;
        let toasts = std::mem::take(&mut self.toasts);
        let mut toast_html = None;
        if !partial {
            flash.extend(toasts);
        } else if !toasts.is_empty() {
            match toaster {
                Some((tpl, block)) => {
                    let ctx = ReqCtx {
                        path: req.path,
                        locale: &facts.locale,
                        csrf: facts.csrf.as_deref(),
                        nonce: req.nonce,
                        user: facts.user.as_ref(),
                        flash: &toasts,
                    };
                    toast_html = Some(engine.render_block(tpl, block, &self.ctx, &ctx)?);
                }
                None => {
                    let v = serde_json::to_value(&toasts).unwrap_or_default();
                    self.triggers.insert("cv-toast".into(), v);
                }
            }
        }
        let ctx = ReqCtx {
            path: req.path,
            locale: &facts.locale,
            csrf: facts.csrf.as_deref(),
            nonce: req.nonce,
            user: facts.user.as_ref(),
            flash: &flash,
        };
        let mut html = match self.fragment {
            Some(block) if partial => engine.render_block(self.tpl, block, &self.ctx, &ctx)?,
            _ => engine.render(self.tpl, &self.ctx, &ctx)?,
        };
        if partial {
            for (tpl, block, octx) in &self.oob {
                if !is_id(block) {
                    return Err(AppError::internal(format!(
                        "oob block `{block}` is not an id"
                    )));
                }
                let inner = engine.render_block(tpl, block, octx, &ctx)?;
                html.push_str(&format!(
                    "<div hx-swap-oob=\"innerHTML:#{block}\">{inner}</div>"
                ));
            }
            if let Some(t) = toast_html {
                html.push_str(&format!(
                    "<div hx-swap-oob=\"beforeend:#cv-toaster\">{t}</div>"
                ));
            }
        }
        parts.status = self.status;
        let h = &mut parts.headers;
        h.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("text/html; charset=utf-8"),
        );
        // The same URL answers with a page or a fragment: caches must key on it.
        h.append(header::VARY, HeaderValue::from_static("HX-Request"));
        h.remove(header::CONTENT_LENGTH);
        if !self.triggers.is_empty() {
            let json = ascii_json(&serde_json::Value::Object(self.triggers));
            if let Ok(v) = HeaderValue::from_str(&json) {
                h.insert("hx-trigger", v);
            }
        }
        if let Some(p) = &self.push_url
            && let Ok(v) = HeaderValue::from_str(p.as_str())
        {
            h.insert("hx-push-url", v);
        }
        Ok(html)
    }
}

/// A CSS identifier that needs no escaping in `#<id>`.
fn is_id(s: &str) -> bool {
    let mut b = s.bytes();
    b.next().is_some_and(|c| c.is_ascii_alphabetic())
        && b.all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_')
}

/// JSON with non-ASCII escaped as `\uXXXX`, so it is a valid header value.
fn ascii_json(v: &serde_json::Value) -> String {
    let s = v.to_string();
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if c.is_ascii() {
            out.push(c);
        } else {
            let mut buf = [0u16; 2];
            for u in c.encode_utf16(&mut buf) {
                out.push_str(&format!("\\u{u:04x}"));
            }
        }
    }
    out
}

/// Checkpoint β: the fragment a partial request gets for `block` is, byte for byte, the
/// content of the page's element with `id="<block>"`. Starter views call this for every
/// fragment they declare, so no fragment is ever written by hand.
pub fn check_fragment(
    engine: &Engine,
    tpl: &str,
    block: &str,
    ctx: &Value,
    req: &ReqCtx,
) -> Result<(), String> {
    let page = engine.render(tpl, ctx, req).map_err(|e| e.to_string())?;
    let frag = engine
        .render_block(tpl, block, ctx, req)
        .map_err(|e| e.to_string())?;
    let marker = format!("id=\"{block}\"");
    let at = page.find(&marker).ok_or_else(|| {
        format!("{tpl}: the page has no element with {marker} around block `{block}`")
    })?;
    let open_end = page[at..]
        .find('>')
        .map(|i| at + i + 1)
        .ok_or_else(|| format!("{tpl}: unterminated tag with {marker}"))?;
    if page[open_end..].starts_with(&format!("{frag}</")) {
        Ok(())
    } else {
        Err(format!(
            "{tpl}: block `{block}` is not the whole content of the element with {marker}\nfragment: {frag}\npage: {page}"
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_and_ascii_json() {
        assert!(is_id("todos") && is_id("a-b_c1"));
        assert!(!is_id("") && !is_id("1a") && !is_id("a b") && !is_id("a\"]"));
        let v = serde_json::json!({ "e": "ü😀\n" });
        assert_eq!(ascii_json(&v), r#"{"e":"\u00fc\ud83d\ude00\n"}"#);
    }
}
