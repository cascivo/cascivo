//! Sessions: an id in a `__Host-` cookie, the record in a [`SessionStore`], CSRF token and
//! flash messages in the record. The layer fills [`Facts`] for templates.

use std::fmt;
use std::sync::{Arc, Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use axum::extract::{FromRequestParts, Request, State};
use axum::http::request::Parts;
use axum::http::{HeaderMap, HeaderValue, header};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use cascivo_web::Flash;
use minijinja::Value;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::stores::CookieStore;
use crate::util::{Local, ct_eq, now, send, token};
use crate::{AppError, Facts, MaybeSend, ToastKind, View};

/// A session id: 256 random bits, base64url. The server never adopts an id a client made up:
/// an unknown id starts a new session under a fresh id.
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct SessionId(String);

impl fmt::Debug for SessionId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SessionId(..)")
    }
}

impl SessionId {
    pub fn generate() -> Result<Self, getrandom::Error> {
        token().map(Self)
    }

    /// A cookie value of the right shape (43 base64url characters), or `None`.
    pub fn parse(s: &str) -> Option<Self> {
        (s.len() == 43
            && s.bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_'))
        .then(|| Self(s.to_owned()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// SHA-256 of the id, hex: the key a store persists, so a leaked table or KV namespace
    /// holds no usable session ids.
    pub fn storage_key(&self) -> String {
        Sha256::digest(self.0.as_bytes())
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect()
    }
}

/// What a store persists for one session (serde: JSON in every built-in store).
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct Record {
    #[serde(default)]
    pub data: serde_json::Map<String, serde_json::Value>,
    /// The synchronizer CSRF token; a new one on every id rotation.
    pub csrf: String,
    /// Messages for the next rendered page.
    #[serde(default)]
    pub flash: Vec<Flash>,
    /// Unix seconds: creation (absolute TTL) and last save (idle TTL).
    pub created: u64,
    pub touched: u64,
}

impl Record {
    pub fn new(now: u64) -> Result<Self, getrandom::Error> {
        Ok(Self {
            data: serde_json::Map::new(),
            csrf: token()?,
            flash: Vec::new(),
            created: now,
            touched: now,
        })
    }
}

/// A store failure; the request fails with 500 (the detail is logged, never sent).
#[derive(Debug)]
pub struct StoreError(pub String);

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "session store: {}", self.0)
    }
}

impl std::error::Error for StoreError {}

impl From<StoreError> for AppError {
    fn from(e: StoreError) -> Self {
        Self::internal(e)
    }
}

/// Where records live. Built in: [`CookieStore`](crate::CookieStore) (stateless, every
/// target), [`MemoryStore`](crate::MemoryStore) (tests, one process),
/// `SqliteStore` (`sqlite`). A Workers KV store implements this with `MaybeSend` futures,
/// keyed by [`SessionId::storage_key`] with `ttl` as the KV expiration.
pub trait SessionStore: MaybeSend + Sync + 'static {
    fn load(
        &self,
        id: &SessionId,
    ) -> impl Future<Output = Result<Option<Record>, StoreError>> + MaybeSend;
    /// `ttl`: when the record may be dropped (the idle or absolute limit, whichever is first).
    fn save(
        &self,
        id: &SessionId,
        r: &Record,
        ttl: Duration,
    ) -> impl Future<Output = Result<(), StoreError>> + MaybeSend;
    fn delete(&self, id: &SessionId) -> impl Future<Output = Result<(), StoreError>> + MaybeSend;
    /// Stateless stores only: the record travels sealed in the cookie. Leave the default.
    fn cookie_store(&self) -> Option<&CookieStore> {
        None
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SameSite {
    Lax,
    Strict,
}

/// Cookie and lifetime settings. The cookie is `HttpOnly; Path=/` always, `Secure` with a
/// `__Host-` name prefix (no `Domain`, so a sibling subdomain cannot set it) unless `secure` is
/// off for plain-HTTP development.
#[derive(Debug, Clone)]
pub struct SessionConfig {
    pub cookie: &'static str,
    pub secure: bool,
    /// Defence in depth only; CSRF protection is the token and the origin check.
    pub same_site: SameSite,
    /// Dropped after this long without a request.
    pub idle: Duration,
    /// Dropped this long after creation (login rotates the id, not this clock).
    pub absolute: Duration,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            cookie: "cv-session",
            secure: true,
            same_site: SameSite::Lax,
            idle: Duration::from_secs(24 * 3600),
            absolute: Duration::from_secs(7 * 24 * 3600),
        }
    }
}

/// An unchanged session is re-saved (sliding the idle TTL) at most this often.
const REFRESH: u64 = 60;

impl SessionConfig {
    pub(crate) fn cookie_name(&self) -> String {
        if self.secure {
            format!("__Host-{}", self.cookie)
        } else {
            self.cookie.to_owned()
        }
    }

    pub(crate) fn expired(&self, r: &Record, now: u64) -> bool {
        now.saturating_sub(r.touched) > self.idle.as_secs()
            || now.saturating_sub(r.created) > self.absolute.as_secs()
    }

    fn ttl(&self, r: &Record, now: u64) -> u64 {
        let left = self
            .absolute
            .as_secs()
            .saturating_sub(now.saturating_sub(r.created));
        left.min(self.idle.as_secs())
    }
}

/// The request's session (extractor; needs [`App::sessions`](crate::App::sessions)). A session
/// starts lazily: on the first write, [`csrf_token`](Self::csrf_token), or a [`View`] response.
#[derive(Clone)]
pub struct Session(Arc<Mutex<Inner>>);

impl fmt::Debug for Session {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Session(..)")
    }
}

#[derive(Default)]
struct Inner {
    id: Option<SessionId>,
    record: Record,
    live: bool,
    dirty: bool,
    /// A persisted id to delete at commit (rotated away or destroyed).
    old: Option<SessionId>,
    user: Option<Value>,
    now: u64,
    err: Option<String>,
}

impl Inner {
    fn ensure(&mut self) -> bool {
        if !self.live {
            match SessionId::generate().and_then(|id| Ok((id, Record::new(self.now)?))) {
                Ok((id, r)) => {
                    self.id = Some(id);
                    self.record = r;
                    self.live = true;
                    self.dirty = true;
                }
                Err(e) => {
                    self.err = Some(e.to_string());
                    return false;
                }
            }
        }
        true
    }
}

impl Session {
    fn new(loaded: Option<(Option<SessionId>, Record)>, now: u64) -> Self {
        let mut i = Inner {
            now,
            ..Inner::default()
        };
        if let Some((id, r)) = loaded {
            i.id = id;
            i.record = r;
            i.live = true;
        }
        Self(Arc::new(Mutex::new(i)))
    }

    fn lock(&self) -> MutexGuard<'_, Inner> {
        self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }

    pub fn get<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        let i = self.lock();
        let v = i.record.data.get(key)?;
        serde_json::from_value(v.clone()).ok()
    }

    pub fn insert(&self, key: &str, value: impl Serialize) -> Result<(), AppError> {
        let v = serde_json::to_value(value).map_err(AppError::internal)?;
        let mut i = self.lock();
        if !i.ensure() {
            return Err(AppError::internal("no randomness for a session id"));
        }
        i.record.data.insert(key.to_owned(), v);
        i.dirty = true;
        Ok(())
    }

    pub fn remove(&self, key: &str) -> Option<serde_json::Value> {
        let mut i = self.lock();
        let v = i.record.data.remove(key)?;
        i.dirty = true;
        Some(v)
    }

    /// A message for the next rendered page (it survives redirects and non-page responses).
    /// `msg_key` is an i18n key, like [`View::toast`].
    pub fn flash(&self, kind: ToastKind, msg_key: impl Into<String>) {
        let mut i = self.lock();
        if i.ensure() {
            i.record.flash.push(Flash {
                kind: kind.as_str().into(),
                message: msg_key.into(),
            });
            i.dirty = true;
        }
    }

    /// A new id and CSRF token, same data. Call it on login and on any privilege change, so an
    /// id planted or seen before (session fixation) is worthless afterwards.
    pub fn rotate_id(&self) {
        let mut i = self.lock();
        if !i.live {
            i.ensure();
            return;
        }
        if i.old.is_none() {
            i.old = i.id.take();
        }
        match SessionId::generate().and_then(|id| Ok((id, token()?))) {
            Ok((id, csrf)) => {
                i.id = Some(id);
                i.record.csrf = csrf;
                i.dirty = true;
            }
            Err(e) => i.err = Some(e.to_string()),
        }
    }

    /// Logout: deletes the stored record and expires the cookie. A later write in the same
    /// request (a "signed out" flash) starts a fresh session.
    pub fn destroy(&self) {
        let mut i = self.lock();
        if i.old.is_none() {
            i.old = i.id.take();
        }
        i.id = None;
        i.record = Record::default();
        i.live = false;
        i.dirty = false;
        i.user = None;
    }

    /// The CSRF token (starts the session): for responses that are not a [`View`], which get
    /// it as `request.csrf` anyway.
    pub fn csrf_token(&self) -> Result<String, AppError> {
        let mut i = self.lock();
        if !i.ensure() {
            return Err(AppError::internal("no randomness for a session id"));
        }
        Ok(i.record.csrf.clone())
    }

    pub(crate) fn csrf_matches(&self, t: &str) -> bool {
        let i = self.lock();
        i.live && !i.record.csrf.is_empty() && ct_eq(i.record.csrf.as_bytes(), t.as_bytes())
    }

    pub(crate) fn set_user(&self, u: Value) {
        self.lock().user = Some(u);
    }

    /// `take_flash` empties the record's flash (a page is about to show it).
    fn facts(&self, take_flash: bool) -> Facts {
        let mut i = self.lock();
        let flash = if take_flash {
            let f = std::mem::take(&mut i.record.flash);
            i.dirty |= !f.is_empty();
            f
        } else {
            i.record.flash.clone()
        };
        Facts {
            locale: i
                .record
                .data
                .get("locale")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
            csrf: i.live.then(|| i.record.csrf.clone()),
            user: i.user.clone(),
            flash,
        }
    }
}

impl<S: Sync> FromRequestParts<S> for Session {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<Self>()
            .cloned()
            .ok_or_else(|| AppError::internal("Session needs App::sessions"))
    }
}

pub(crate) struct SessionRt<St> {
    pub(crate) store: St,
    pub(crate) cfg: SessionConfig,
    pub(crate) name: String,
}

pub(crate) fn layer<St: SessionStore>(
    State(rt): State<Local<Arc<SessionRt<St>>>>,
    req: Request,
    next: Next,
) -> impl Future<Output = Response> + Send {
    send(async move {
        match run(&rt.0, req, next).await {
            Ok(r) | Err(r) => r,
        }
    })
}

fn fail(e: impl Into<AppError>) -> Response {
    e.into().into_response()
}

async fn run<St: SessionStore>(
    rt: &SessionRt<St>,
    mut req: Request,
    next: Next,
) -> Result<Response, Response> {
    let now = now();
    let codec = rt.store.cookie_store();
    let raw = read_cookie(req.headers(), &rt.name);
    let mut loaded = None;
    if let Some(v) = raw.as_deref() {
        if let Some(c) = codec {
            loaded = c.open(v, &rt.name).map(|r| (None, r));
        } else if let Some(id) = SessionId::parse(v) {
            if let Some(r) = rt.store.load(&id).await.map_err(fail)? {
                loaded = Some((Some(id), r));
            }
        }
    }
    if let Some((id, r)) = &loaded {
        if rt.cfg.expired(r, now) {
            if let Some(id) = id {
                rt.store.delete(id).await.map_err(fail)?;
            }
            loaded = None;
        }
    }
    let session = Session::new(loaded, now);
    req.extensions_mut().insert(session.clone());
    req.extensions_mut().insert(session.facts(false));

    let mut res = next.run(req).await;

    if res.extensions().get::<View>().is_some() {
        session.lock().ensure();
        let f = session.facts(true);
        match res.extensions_mut().get_mut::<Facts>() {
            Some(h) => {
                h.csrf = h.csrf.take().or(f.csrf);
                h.user = h.user.take().or(f.user);
                h.flash.extend(f.flash);
                if h.locale.is_empty() {
                    h.locale = f.locale;
                }
            }
            None => {
                res.extensions_mut().insert(f);
            }
        }
    }

    let (old, save, live) = {
        let mut i = session.lock();
        if let Some(e) = i.err.take() {
            return Err(fail(AppError::internal(e)));
        }
        let save = i.live && (i.dirty || now.saturating_sub(i.record.touched) >= REFRESH);
        if save {
            i.record.touched = now;
        }
        (
            i.old.take(),
            save.then(|| (i.id.clone(), i.record.clone())),
            i.live,
        )
    };
    if codec.is_none() {
        if let Some(old) = old {
            rt.store.delete(&old).await.map_err(fail)?;
        }
    }
    let h = res.headers_mut();
    if let Some((id, rec)) = save {
        let ttl = rt.cfg.ttl(&rec, now);
        let value = match (codec, id) {
            (Some(c), _) => c.seal(&rec, &rt.name).map_err(fail)?,
            (None, Some(id)) => {
                rt.store
                    .save(&id, &rec, Duration::from_secs(ttl))
                    .await
                    .map_err(fail)?;
                id.0
            }
            (None, None) => return Err(fail(AppError::internal("live session without an id"))),
        };
        set_cookie(h, &rt.name, &value, ttl, &rt.cfg);
    } else if !live && raw.is_some() {
        set_cookie(h, &rt.name, "", 0, &rt.cfg);
    }
    if live || raw.is_some() {
        h.entry(header::CACHE_CONTROL)
            .or_insert(HeaderValue::from_static("private"));
    }
    Ok(res)
}

/// The first `name=value` pair for `name`; oversized or non-ASCII values read as absent.
fn read_cookie(h: &HeaderMap, name: &str) -> Option<String> {
    h.get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|kv| kv.trim().split_once('='))
        .find(|(k, _)| *k == name)
        .map(|(_, v)| v.to_owned())
        .filter(|v| !v.is_empty() && v.len() <= 4096)
}

fn set_cookie(h: &mut HeaderMap, name: &str, value: &str, max_age: u64, cfg: &SessionConfig) {
    let ss = match cfg.same_site {
        SameSite::Lax => "Lax",
        SameSite::Strict => "Strict",
    };
    let secure = if cfg.secure { "; Secure" } else { "" };
    let c = format!("{name}={value}; Path=/; Max-Age={max_age}; HttpOnly{secure}; SameSite={ss}");
    match HeaderValue::from_str(&c) {
        Ok(v) => {
            h.append(header::SET_COOKIE, v);
        }
        Err(_) => eprintln!("cascivo-server: unencodable session cookie"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_and_ttls() {
        let id = SessionId::generate().unwrap();
        assert_eq!(SessionId::parse(id.as_str()), Some(id.clone()));
        assert_eq!(id.storage_key().len(), 64);
        assert_ne!(id.storage_key(), id.as_str());
        assert!(format!("{id:?}").contains(".."), "ids are not logged");
        for bad in [
            "",
            "short",
            &"a".repeat(44),
            &format!("{}=", "a".repeat(42)),
        ] {
            assert_eq!(SessionId::parse(bad), None, "{bad}");
        }

        let cfg = SessionConfig {
            idle: Duration::from_secs(100),
            absolute: Duration::from_secs(1000),
            ..SessionConfig::default()
        };
        let mut r = Record::new(0).unwrap();
        assert!(!cfg.expired(&r, 100));
        assert!(cfg.expired(&r, 101), "idle");
        r.touched = 950;
        assert!(!cfg.expired(&r, 1000));
        assert!(cfg.expired(&r, 1001), "absolute, though active");
        assert_eq!(cfg.ttl(&r, 950), 50, "capped by the absolute limit");
        r.created = 900;
        assert_eq!(cfg.ttl(&r, 950), 100);
    }

    #[test]
    fn reads_the_first_cookie_only() {
        let mut h = HeaderMap::new();
        h.append(header::COOKIE, "a=1; s=first".parse().unwrap());
        h.append(header::COOKIE, "s=second".parse().unwrap());
        assert_eq!(read_cookie(&h, "s").as_deref(), Some("first"));
        assert_eq!(read_cookie(&h, "x"), None);
    }
}
