//! Server islands: a page ships a placeholder whose `hx-get` loads the fragment after the
//! page, with props the server signed. The MAC binds island name, expiry and props, so a
//! client can neither change props nor replay them on another island or after the TTL.

use std::fmt;
use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::extract::Request;
use axum::http::StatusCode;
use axum::http::request::Parts;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use hmac::{Hmac, KeyInit, Mac};
use serde::Serialize;
use serde::de::DeserializeOwned;
use sha2::Sha256;

use crate::util::{b64, encode_component, now, send, unb64};
use crate::{AppError, MaybeSend, View};

/// URL prefix of island routes: `GET /_island/<name>?p=<token>`.
pub const ISLAND_PREFIX: &str = "/_island/";

/// Longest accepted token; anything longer is rejected before decoding.
const MAX_TOKEN: usize = 8192;

/// Why a token was refused. Every variant answers 400; the detail is never sent.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IslandError {
    /// Missing, oversized or not `<b64>.<b64>`.
    Malformed,
    /// No key produced this MAC.
    BadMac,
    /// Signed for another island.
    WrongIsland,
    Expired,
    /// The props do not deserialize into the handler's type.
    Props(String),
    /// Signing side: props did not serialize, or no key.
    Sign(String),
}

impl fmt::Display for IslandError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Malformed => f.write_str("malformed island token"),
            Self::BadMac => f.write_str("island token MAC mismatch"),
            Self::WrongIsland => f.write_str("island token is for another island"),
            Self::Expired => f.write_str("island token expired"),
            Self::Props(e) => write!(f, "island props: {e}"),
            Self::Sign(e) => write!(f, "island signing: {e}"),
        }
    }
}

impl std::error::Error for IslandError {}

/// Signs and verifies island props. Cheap to clone; keep one in your state to build
/// placeholders, and give one to [`App::islands`](crate::App::islands).
#[derive(Clone)]
pub struct IslandKey {
    keys: Arc<[[u8; 32]]>,
    ttl: Duration,
}

impl fmt::Debug for IslandKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("IslandKey")
            .field("ttl", &self.ttl)
            .finish_non_exhaustive()
    }
}

#[derive(Serialize, serde::Deserialize)]
struct Claims<N, P> {
    n: N,
    e: u64,
    p: P,
}

impl IslandKey {
    /// `secrets`: the current one first, then older ones that still verify (rotation). Each
    /// at least 32 bytes, e.g. `APP_SECRET`. The key is derived with its own label, so it
    /// never equals the session-cookie key from the same secret. TTL defaults to one hour.
    pub fn new(secrets: &[&[u8]]) -> Result<Self, IslandError> {
        if secrets.is_empty() || secrets.iter().any(|s| s.len() < 32) {
            return Err(IslandError::Sign(
                "IslandKey needs secrets of 32 bytes or more".into(),
            ));
        }
        let keys = secrets
            .iter()
            .map(|s| {
                let mut m = <Hmac<Sha256> as KeyInit>::new_from_slice(s)
                    .map_err(|e| IslandError::Sign(e.to_string()))?;
                m.update(b"cascivo-server/island/v1");
                let mut k = [0u8; 32];
                k.copy_from_slice(&m.finalize().into_bytes());
                Ok(k)
            })
            .collect::<Result<Vec<_>, IslandError>>()?;
        Ok(Self {
            keys: keys.into(),
            ttl: Duration::from_secs(3600),
        })
    }

    /// How long a signed placeholder stays loadable (cached pages need it to outlive them).
    #[must_use]
    pub fn ttl(mut self, ttl: Duration) -> Self {
        self.ttl = ttl;
        self
    }

    fn mac(key: &[u8; 32]) -> Hmac<Sha256> {
        // A 32-byte key is always valid for HMAC.
        <Hmac<Sha256> as KeyInit>::new_from_slice(key).unwrap_or_else(|_| unreachable!())
    }

    /// `<b64url(json {n, e, p})>.<b64url(hmac)>`.
    pub fn sign<P: Serialize>(&self, name: &str, props: &P) -> Result<String, IslandError> {
        let claims = Claims {
            n: name,
            e: now().saturating_add(self.ttl.as_secs()),
            p: props,
        };
        let json = serde_json::to_vec(&claims).map_err(|e| IslandError::Sign(e.to_string()))?;
        let body = b64(&json);
        let key = self
            .keys
            .first()
            .ok_or_else(|| IslandError::Sign("no key".into()))?;
        let mut m = Self::mac(key);
        m.update(body.as_bytes());
        Ok(format!("{body}.{}", b64(&m.finalize().into_bytes())))
    }

    /// Checks MAC (any key), then expiry and island name, then parses the props.
    pub fn verify<P: DeserializeOwned>(&self, name: &str, token: &str) -> Result<P, IslandError> {
        if token.len() > MAX_TOKEN {
            return Err(IslandError::Malformed);
        }
        let (body, sig) = token.split_once('.').ok_or(IslandError::Malformed)?;
        let sig = unb64(sig).ok_or(IslandError::Malformed)?;
        let ok = self.keys.iter().any(|k| {
            let mut m = Self::mac(k);
            m.update(body.as_bytes());
            m.verify_slice(&sig).is_ok()
        });
        if !ok {
            return Err(IslandError::BadMac);
        }
        let json = unb64(body).ok_or(IslandError::Malformed)?;
        let c: Claims<String, serde_json::Value> =
            serde_json::from_slice(&json).map_err(|_| IslandError::Malformed)?;
        if c.e <= now() {
            return Err(IslandError::Expired);
        }
        if c.n != name {
            return Err(IslandError::WrongIsland);
        }
        serde_json::from_value(c.p).map_err(|e| IslandError::Props(e.to_string()))
    }

    /// `/_island/<name>?p=<token>`.
    pub fn url<P: Serialize>(&self, name: &str, props: &P) -> Result<String, IslandError> {
        check_name(name).map_err(IslandError::Sign)?;
        let token = self.sign(name, props)?;
        Ok(format!(
            "{ISLAND_PREFIX}{name}?p={}",
            encode_component(&token)
        ))
    }

    /// `<div hx-get="…" hx-trigger="load" hx-swap="outerHTML">fallback</div>` as a safe
    /// template value: put it in a [`View`] context and write `{{ cart }}`, no `|safe`.
    /// `fallback_html` is inserted as is: pass template-authored markup (a skeleton), never
    /// user input.
    pub fn placeholder<P: Serialize>(
        &self,
        name: &str,
        props: &P,
        fallback_html: &str,
    ) -> Result<minijinja::Value, IslandError> {
        // The URL is base64url + percent-encoding only: nothing to escape in the attribute.
        let url = self.url(name, props)?;
        Ok(minijinja::Value::from_safe_string(format!(
            "<div hx-get=\"{url}\" hx-trigger=\"load\" hx-swap=\"outerHTML\">{fallback_html}</div>"
        )))
    }
}

/// `[a-z0-9_-]{1,64}`: an island name is a path segment and appears in markup.
pub(crate) fn check_name(name: &str) -> Result<(), String> {
    let ok = !name.is_empty()
        && name.len() <= 64
        && name
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-' || b == b'_');
    if ok {
        Ok(())
    } else {
        Err(format!("island name {name:?} is not [a-z0-9_-]{{1,64}}"))
    }
}

/// Adds the island route once [`App::into_router`](crate::App::into_router) knows the key.
pub(crate) type Mount = Box<dyn FnOnce(&IslandKey, Router) -> Router>;

pub(crate) fn mount<P, F, Fut>(name: &'static str, f: F) -> Mount
where
    P: DeserializeOwned + Send + 'static,
    F: Fn(P, Parts) -> Fut + Clone + Send + Sync + 'static,
    Fut: Future<Output = Result<View, AppError>> + MaybeSend + 'static,
{
    if let Err(e) = check_name(name) {
        panic!("cascivo-server: {e}");
    }
    Box::new(move |key: &IslandKey, r: Router| {
        let key = key.clone();
        let handler = move |req: Request| {
            let (parts, _) = req.into_parts();
            let props = token(parts.uri.query()).and_then(|t| key.verify::<P>(name, &t));
            let f = f.clone();
            send(async move {
                match props {
                    Ok(p) => f(p, parts).await.into_response(),
                    Err(e) => bad_request(&e),
                }
            })
        };
        r.route(&format!("{ISLAND_PREFIX}{name}"), get(handler))
    })
}

fn token(query: Option<&str>) -> Result<String, IslandError> {
    let q = query.ok_or(IslandError::Malformed)?;
    if q.len() > MAX_TOKEN * 3 {
        return Err(IslandError::Malformed);
    }
    form_urlencoded::parse(q.as_bytes())
        .find(|(k, _)| k == "p")
        .map(|(_, v)| v.into_owned())
        .ok_or(IslandError::Malformed)
}

fn bad_request(e: &IslandError) -> Response {
    AppError::new(StatusCode::BAD_REQUEST, e).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names() {
        assert!(check_name("cart-2_x").is_ok());
        for bad in ["", "Cart", "a/b", "a?b", "a b", &"x".repeat(65)] {
            assert!(check_name(bad).is_err(), "{bad:?}");
        }
    }

    #[test]
    fn query_token() {
        assert_eq!(token(Some("x=1&p=a%2Eb")).unwrap(), "a.b");
        assert_eq!(token(None), Err(IslandError::Malformed));
        assert_eq!(token(Some("q=1")), Err(IslandError::Malformed));
    }
}
