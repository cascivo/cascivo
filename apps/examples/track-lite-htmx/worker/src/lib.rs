//! track-lite-htmx on Cloudflare Workers, at `/demos/track-lite-htmx/`.
//!
//! The entry Worker rate-limits per IP, reads (or sets) a random `demo` cookie and forwards the
//! request to the [`Sandbox`] Durable Object named by it. Each sandbox is one visitor's copy of
//! the app: its issues (seeded, kept in DO storage), the shared router from `../server`, and the
//! SSE fan-out to that visitor's tabs. Public visitors can't vandalise each other's list, and
//! live updates across one visitor's tabs still work. The simulated teammate runs on the DO
//! alarm, only while a tab is subscribed; an idle sandbox deletes itself after [`IDLE_TTL`].
//! The Vite build (`/demos/track-lite-htmx/assets/*`) is served by the static-assets binding
//! before the Worker runs (`wrangler.jsonc`).

use std::cell::RefCell;
use std::sync::{Arc, Mutex, PoisonError};
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::{HeaderValue, Method, StatusCode, header};
use cascivo_server::{AppError, CookieStore, Fragment, SessionConfig};
use futures_channel::mpsc;
use futures_util::StreamExt;
use futures_util::stream::BoxStream;
use track_lite_htmx_server::{Bus, Options, Store, Tracker};
use worker::{
    Context, Date, DurableObject, Env, HttpRequest, Request, Response, Result, State,
    durable_object, event,
};

/// Every route and link lives under this prefix (the cascivo.com route).
pub const BASE: &str = "/demos/track-lite-htmx";
/// The teammate's pace (the native binary's default `TEAMMATE_MS`).
const TEAMMATE: Duration = Duration::from_secs(6);
/// A sandbox nobody has opened for this long wipes its storage.
const IDLE_TTL: Duration = Duration::from_secs(7 * 24 * 3600);
/// Open streams per sandbox, and per page session (the native [`Hub`] allows 4 per key).
const MAX_STREAMS: usize = 16;
const MAX_PER_KEY: usize = 4;
/// Undelivered events per stream; a stream that falls this far behind (a tab that went away
/// without the cancel reaching us) is dropped.
const BACKLOG: usize = 8;
const COOKIE: &str = "demo";

// ── Entry Worker ────────────────────────────────────────────────────────────────────────────

#[event(start)]
fn start() {
    console_error_panic_hook::set_once();
}

#[event(fetch)]
async fn fetch(req: HttpRequest, env: Env, _ctx: Context) -> Result<axum::http::Response<Body>> {
    let path = req.uri().path();
    if path == "/" || path == BASE {
        return Ok(redirect(&format!("{BASE}/")));
    }
    if !path.starts_with(&format!("{BASE}/")) {
        return Ok(status(StatusCode::NOT_FOUND));
    }
    let ip = header_str(&req, "cf-connecting-ip")
        .unwrap_or("local")
        .to_owned();
    if !env
        .rate_limiter("REQUESTS")?
        .limit(ip.clone())
        .await?
        .success
    {
        return Ok(status(StatusCode::TOO_MANY_REQUESTS));
    }
    let (id, fresh) = match demo_cookie(&req) {
        Some(id) => (id, false),
        // A new sandbox only for a page load: a form post without one has no session to pass
        // the CSRF check anyway.
        None if req.method() == Method::GET => {
            if !env.rate_limiter("SANDBOXES")?.limit(ip).await?.success {
                return Ok(status(StatusCode::TOO_MANY_REQUESTS));
            }
            (new_id()?, true)
        }
        None => return Ok(status(StatusCode::FORBIDDEN)),
    };
    let stub = env.durable_object("SANDBOX")?.get_by_name(&id)?;
    let res = stub.fetch_with_request(Request::try_from(req)?).await?;
    let mut res: axum::http::Response<Body> = res.into();
    if fresh {
        let cookie = format!(
            "{COOKIE}={id}; Path={BASE}/; Max-Age={}; HttpOnly; Secure; SameSite=Lax",
            IDLE_TTL.as_secs()
        );
        if let Ok(v) = HeaderValue::from_str(&cookie) {
            res.headers_mut().append(header::SET_COOKIE, v);
        }
    }
    Ok(res)
}

fn header_str<'a>(req: &'a HttpRequest, name: &str) -> Option<&'a str> {
    req.headers().get(name).and_then(|v| v.to_str().ok())
}

/// The visitor's sandbox name: 32 lowercase hex characters, anything else is ignored.
fn demo_cookie(req: &HttpRequest) -> Option<String> {
    req.headers()
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|kv| kv.trim().split_once('='))
        .find(|(k, _)| *k == COOKIE)
        .map(|(_, v)| v)
        .filter(|v| valid_id(v))
        .map(str::to_owned)
}

pub fn valid_id(v: &str) -> bool {
    v.len() == 32 && v.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

fn new_id() -> Result<String> {
    let mut b = [0u8; 16];
    getrandom::fill(&mut b).map_err(|e| worker::Error::RustError(e.to_string()))?;
    Ok(b.iter().map(|x| format!("{x:02x}")).collect())
}

fn status(s: StatusCode) -> axum::http::Response<Body> {
    let mut r = axum::http::Response::new(Body::from(s.canonical_reason().unwrap_or("")));
    *r.status_mut() = s;
    r
}

fn redirect(to: &str) -> axum::http::Response<Body> {
    let mut r = status(StatusCode::PERMANENT_REDIRECT);
    if let Ok(v) = HeaderValue::from_str(to) {
        r.headers_mut().insert(header::LOCATION, v);
    }
    r
}

// ── The per-visitor sandbox ─────────────────────────────────────────────────────────────────

/// One visitor's open `/events` streams. Publishing also marks the store dirty, so the sandbox
/// persists it once the request (or alarm) that changed it is done.
#[derive(Default)]
pub struct Streams(Mutex<StreamsInner>);

#[derive(Default)]
struct StreamsInner {
    subs: Vec<(String, mpsc::Sender<Fragment>)>,
    dirty: bool,
}

impl Streams {
    fn lock(&self) -> std::sync::MutexGuard<'_, StreamsInner> {
        self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// Open streams, after dropping the ones whose tab went away.
    pub fn active(&self) -> usize {
        let mut s = self.lock();
        s.subs.retain(|(_, tx)| !tx.is_closed());
        s.subs.len()
    }

    pub fn take_dirty(&self) -> bool {
        std::mem::take(&mut self.lock().dirty)
    }
}

impl Bus for Streams {
    fn publish(&self, event: Fragment) {
        let mut s = self.lock();
        s.dirty = true;
        // A full or closed stream is dropped (its tab reconnects and refetches).
        s.subs
            .retain_mut(|(_, tx)| tx.try_send(event.clone()).is_ok());
    }

    fn subscribe(&self, key: &str) -> std::result::Result<BoxStream<'static, Fragment>, AppError> {
        let mut s = self.lock();
        s.subs.retain(|(_, tx)| !tx.is_closed());
        let per_key = s.subs.iter().filter(|(k, _)| k == key).count();
        if s.subs.len() >= MAX_STREAMS || per_key >= MAX_PER_KEY {
            return Err(AppError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "too many open streams",
            ));
        }
        let (tx, rx) = mpsc::channel(BACKLOG);
        s.subs.push((key.to_owned(), tx));
        Ok(rx.boxed())
    }
}

struct Loaded {
    router: Router,
    tracker: Tracker,
}

#[durable_object]
pub struct Sandbox {
    state: State,
    env: Env,
    streams: Arc<Streams>,
    app: RefCell<Option<Arc<Loaded>>>,
}

impl Sandbox {
    /// The router, built once per instance from storage (seeded on first use). The session
    /// secret is per sandbox and stored with it, so sessions survive the DO being evicted.
    async fn load(&self) -> Result<Arc<Loaded>> {
        if let Some(app) = self.app.borrow().as_ref() {
            return Ok(Arc::clone(app));
        }
        let storage = self.state.storage();
        let store = storage
            .get::<Store>("store")
            .await?
            .unwrap_or_else(Store::seeded);
        let secret = match storage.get::<Vec<u8>>("secret").await? {
            Some(s) if s.len() >= 32 => s,
            _ => {
                let mut s = vec![0u8; 32];
                getrandom::fill(&mut s).map_err(|e| worker::Error::RustError(e.to_string()))?;
                storage.put("secret", &s).await?;
                s
            }
        };
        let sessions = CookieStore::new(&[&secret]).map_err(|e| worker::Error::RustError(e.0))?;
        let (router, tracker) = track_lite_htmx_server::build(
            Options {
                base: BASE.to_owned(),
            },
            store,
            Arc::clone(&self.streams) as Arc<dyn Bus>,
            sessions,
            SessionConfig::default(),
        );
        let loaded = Arc::new(Loaded { router, tracker });
        // Another event may have loaded it while this one awaited storage; keep the first.
        let mut slot = self.app.borrow_mut();
        Ok(Arc::clone(slot.get_or_insert(loaded)))
    }

    async fn persist(&self, app: &Loaded) -> Result<()> {
        if self.streams.take_dirty() {
            self.state
                .storage()
                .put("store", app.tracker.snapshot())
                .await?;
        }
        Ok(())
    }
}

impl DurableObject for Sandbox {
    fn new(state: State, env: Env) -> Self {
        Self {
            state,
            env,
            streams: Arc::new(Streams::default()),
            app: RefCell::new(None),
        }
    }

    async fn fetch(&self, req: Request) -> Result<Response> {
        let app = self.load().await?;
        let res = cascivo_worker::serve_router(
            HttpRequest::try_from(req)?,
            self.env.clone(),
            &app.router,
        )
        .await?;
        self.persist(&app).await?;
        let storage = self.state.storage();
        storage.put("seen", Date::now().as_millis()).await?;
        // A subscribed tab starts the teammate; otherwise the alarm is the idle expiry.
        let next = if self.streams.active() > 0 {
            TEAMMATE
        } else {
            IDLE_TTL
        };
        let due = storage.get_alarm().await?;
        let soon =
            i64::try_from(Date::now().as_millis() + next.as_millis() as u64).unwrap_or(i64::MAX);
        if due.is_none_or(|d| d > soon) {
            storage.set_alarm(next).await?;
        }
        Response::try_from(res)
    }

    async fn alarm(&self) -> Result<Response> {
        let storage = self.state.storage();
        if self.streams.active() > 0 {
            let app = self.load().await?;
            app.tracker.teammate_step();
            self.persist(&app).await?;
            storage.set_alarm(TEAMMATE).await?;
            return Response::empty();
        }
        let seen = storage.get::<u64>("seen").await?.unwrap_or(0);
        let idle = Date::now().as_millis().saturating_sub(seen);
        let ttl = IDLE_TTL.as_millis() as u64;
        if idle >= ttl {
            storage.delete_all().await?;
            self.app.borrow_mut().take();
        } else {
            storage.set_alarm(Duration::from_millis(ttl - idle)).await?;
        }
        Response::empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sandbox_ids_are_32_hex() {
        assert!(valid_id("0123456789abcdef0123456789abcdef"));
        assert!(!valid_id("0123456789ABCDEF0123456789abcdef"));
        assert!(!valid_id("../../x"));
        assert!(!valid_id(""));
    }

    #[test]
    fn streams_cap_per_key_and_drop_closed() {
        let s = Streams::default();
        let tabs: Vec<_> = (0..MAX_PER_KEY)
            .map(|_| s.subscribe("k").unwrap())
            .collect();
        assert!(s.subscribe("k").is_err());
        assert_eq!(s.active(), MAX_PER_KEY);
        drop(tabs);
        assert_eq!(s.active(), 0);
        assert!(s.subscribe("k").is_ok());
    }

    #[test]
    fn publish_marks_dirty_and_drops_full_streams() {
        let s = Streams::default();
        let _rx = s.subscribe("k").unwrap();
        // `mpsc::channel(n)` holds n plus one slot per sender.
        for _ in 0..BACKLOG + 2 {
            s.publish(Fragment::new("changed", "-"));
        }
        assert!(s.take_dirty());
        assert!(!s.take_dirty());
        assert_eq!(s.active(), 0);
    }
}
