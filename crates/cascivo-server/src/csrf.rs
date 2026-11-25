//! CSRF: a `Sec-Fetch-Site`/`Origin` check plus the session's synchronizer token on every
//! unsafe method.

use std::sync::Arc;

use axum::body::{Body, to_bytes};
use axum::extract::{Request, State};
use axum::http::{HeaderMap, Method, StatusCode, Uri, header};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::{AppError, Session};

/// CSRF settings ([`App::csrf`](crate::App::csrf)). On by default for every unsafe method
/// (anything but GET, HEAD, OPTIONS, TRACE). The token is checked when the app has sessions;
/// templates send it as `request.csrf`, in the `field` of a form and in the `header` of htmx
/// requests (`hx-headers` on `<body>`).
#[derive(Debug, Clone)]
pub struct Csrf {
    /// Reject a request whose `Sec-Fetch-Site` is not `same-origin`, or (older browsers) whose
    /// `Origin` is not this origin. Requests with neither rely on the token alone.
    pub check_origin: bool,
    pub header: &'static str,
    /// The form field of an `application/x-www-form-urlencoded` body. Multipart forms send the
    /// header (htmx) instead.
    pub field: &'static str,
    /// The origins this app is served from (`https://app.example`). Empty: the `Host` header.
    pub origins: Vec<String>,
    /// Routes without any CSRF check (webhooks with their own signatures): exact paths, or a
    /// prefix ending in `/*`.
    pub exempt: Vec<&'static str>,
    /// The largest form body buffered to find the token (413 beyond it).
    pub body_limit: usize,
}

impl Default for Csrf {
    fn default() -> Self {
        Self {
            check_origin: true,
            header: "x-csrf-token",
            field: "csrf",
            origins: Vec::new(),
            exempt: Vec::new(),
            body_limit: 64 * 1024,
        }
    }
}

pub(crate) struct CsrfRt {
    pub(crate) cfg: Csrf,
    pub(crate) tokens: bool,
}

fn forbid(why: &str) -> Response {
    AppError::new(StatusCode::FORBIDDEN, format!("csrf: {why}")).into_response()
}

pub(crate) async fn layer(State(rt): State<Arc<CsrfRt>>, req: Request, next: Next) -> Response {
    let cfg = &rt.cfg;
    if matches!(
        *req.method(),
        Method::GET | Method::HEAD | Method::OPTIONS | Method::TRACE
    ) || exempt(&cfg.exempt, req.uri().path())
    {
        return next.run(req).await;
    }
    if cfg.check_origin && !same_origin(req.headers(), req.uri(), &cfg.origins) {
        return forbid("cross-origin request");
    }
    if !rt.tokens {
        return next.run(req).await;
    }
    let Some(session) = req.extensions().get::<Session>().cloned() else {
        return forbid("no session");
    };
    if let Some(t) = req.headers().get(cfg.header) {
        return if t.to_str().is_ok_and(|t| session.csrf_matches(t)) {
            next.run(req).await
        } else {
            forbid("bad token header")
        };
    }
    let form = req
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(';').next())
        .is_some_and(|v| {
            v.trim()
                .eq_ignore_ascii_case("application/x-www-form-urlencoded")
        });
    if !form {
        return forbid("no token");
    }
    let (parts, body) = req.into_parts();
    let Ok(bytes) = to_bytes(body, cfg.body_limit).await else {
        return StatusCode::PAYLOAD_TOO_LARGE.into_response();
    };
    let ok = form_urlencoded::parse(&bytes)
        .find(|(k, _)| k == cfg.field)
        .is_some_and(|(_, v)| session.csrf_matches(&v));
    if !ok {
        return forbid("bad token field");
    }
    next.run(Request::from_parts(parts, Body::from(bytes)))
        .await
}

fn exempt(list: &[&str], path: &str) -> bool {
    list.iter().any(|p| match p.strip_suffix('*') {
        Some(prefix) if prefix.ends_with('/') => path.starts_with(prefix),
        _ => *p == path,
    })
}

fn same_origin(h: &HeaderMap, uri: &Uri, origins: &[String]) -> bool {
    if let Some(site) = h.get("sec-fetch-site") {
        return site == "same-origin";
    }
    let Some(origin) = h.get(header::ORIGIN) else {
        return true;
    };
    let Ok(origin) = origin.to_str() else {
        return false;
    };
    if !origins.is_empty() {
        return origins.iter().any(|o| o == origin);
    }
    let host = h
        .get(header::HOST)
        .and_then(|v| v.to_str().ok())
        .or_else(|| uri.authority().map(|a| a.as_str()));
    let authority = origin
        .strip_prefix("https://")
        .or_else(|| origin.strip_prefix("http://"));
    matches!((authority, host), (Some(a), Some(h)) if a.eq_ignore_ascii_case(h))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exempt_matches_exact_or_slash_prefix() {
        let l = ["/hooks/*", "/ping"];
        assert!(exempt(&l, "/hooks/x") && exempt(&l, "/ping"));
        assert!(!exempt(&l, "/hooksx") && !exempt(&l, "/hooks") && !exempt(&l, "/ping/x"));
        assert!(!exempt(&["/a*"], "/ab"), "a prefix must end at a segment");
    }
}
