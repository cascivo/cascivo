//! track-lite on cascivo-server: the same issue list, dialog form, toasts and live updates as the
//! React `apps/examples/track-lite`, rendered as HTML. Every mutation answers with the `issues`
//! fragment and publishes `changed` on a [`Bus`], so every open tab refetches that fragment.
//!
//! The core here is target-agnostic: the native binary (feature `native`) runs it on tokio with
//! a [`Hub`], and `../worker` runs it in a Cloudflare Durable Object per visitor, under a path
//! prefix ([`Options::base`]) and with its own SSE fan-out, storage and teammate alarm.

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex, PoisonError};

use axum::Router;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
#[cfg(feature = "native")]
pub use cascivo_server::Hub;
use cascivo_server::{
    App, AppError, Csrf, Form, FormErrors, FormState, Fragment, Hx, LocalPath, Msg, Rule, Session,
    SessionConfig, SessionStore, Submission, ToastKind, Validate, View, see_other, sse,
};
use cascivo_web::{Bundle, Config, Engine};
use futures_util::stream::BoxStream;
use minijinja::value::Serde;
use minijinja::{Value, context};
use serde::{Deserialize, Serialize};

pub const STATUSES: [(&str, &str, &str); 5] = [
    ("backlog", "Backlog", "outline"),
    ("todo", "Todo", "secondary"),
    ("in-progress", "In Progress", "warning"),
    ("in-review", "In Review", "info"),
    ("done", "Done", "success"),
];
pub const PRIORITIES: [(&str, &str, &str); 4] = [
    ("urgent", "Urgent", "destructive"),
    ("high", "High", "warning"),
    ("medium", "Medium", "secondary"),
    ("low", "Low", "outline"),
];
pub const USERS: [&str; 5] = [
    "Alice Kim",
    "Bob Chen",
    "Carol Diaz",
    "David Osei",
    "Eva Novak",
];

#[derive(Clone, Serialize, Deserialize)]
pub struct Issue {
    pub id: u32,
    pub title: String,
    pub status: usize,
    pub priority: usize,
    pub assignee: Option<usize>,
}

/// The seed both apps start from (`track-lite/src/store.ts` holds the same rows).
fn seed() -> Vec<Issue> {
    let row = |id, title: &str, status, priority, assignee| Issue {
        id,
        title: title.into(),
        status,
        priority,
        assignee,
    };
    vec![
        row(1, "Fix login redirect loop", 2, 0, Some(0)),
        row(2, "Add dark mode toggle", 1, 2, Some(1)),
        row(3, "Write onboarding docs", 0, 3, None),
        row(4, "Cache search results", 3, 1, Some(2)),
        row(5, "Rate-limit the public API", 1, 1, Some(3)),
        row(6, "Upgrade the build toolchain", 4, 2, Some(4)),
    ]
}

/// The whole mutable state: the issues, the next id and the teammate's turn. Serializable so
/// the Worker can keep it in Durable Object storage.
#[derive(Clone, Serialize, Deserialize)]
pub struct Store {
    pub issues: Vec<Issue>,
    pub next: u32,
    pub tick: usize,
}

impl Store {
    pub fn seeded() -> Self {
        let issues = seed();
        let next = issues.iter().map(|i| i.id).max().unwrap_or(0) + 1;
        Self {
            issues,
            next,
            tick: 0,
        }
    }
}

/// Where `changed` events go and where `/events` streams come from: the tokio [`Hub`] natively,
/// a Durable Object's own subscriber list on Workers.
pub trait Bus: Send + Sync + 'static {
    /// Tells every open page of this store that the list changed. No subscriber is not an error.
    fn publish(&self, event: Fragment);
    /// One stream per open page; `key` is the session's CSRF token (per-visitor caps).
    ///
    /// # Errors
    /// The cap is reached (answered as 429).
    fn subscribe(&self, key: &str) -> Result<BoxStream<'static, Fragment>, AppError>;
}

#[cfg(feature = "native")]
impl Bus for Hub<Fragment> {
    fn publish(&self, event: Fragment) {
        // No subscriber is not an error; "issues" is on the allowlist.
        let _ = Hub::publish(self, "issues", event);
    }

    fn subscribe(&self, key: &str) -> Result<BoxStream<'static, Fragment>, AppError> {
        use futures_util::StreamExt;
        Hub::subscribe(self, "issues", key)
            .map(StreamExt::boxed)
            .map_err(|e| AppError::new(StatusCode::TOO_MANY_REQUESTS, e.to_string()))
    }
}

/// Shared app state: the issues and the bus that tells every open page to refetch them.
#[derive(Clone)]
pub struct Tracker {
    store: Arc<Mutex<Store>>,
    bus: Arc<dyn Bus>,
    base: Arc<str>,
}

impl Tracker {
    fn with<R>(&self, f: impl FnOnce(&mut Store) -> R) -> R {
        f(&mut self.store.lock().unwrap_or_else(PoisonError::into_inner))
    }

    /// `origin` is the mutating tab's `X-Client-Id` ("-" for none); that tab already has the
    /// fresh list in its response, so its client drops the event (`src/htmx.ts`).
    fn changed(&self, origin: &str) {
        self.bus
            .publish(Fragment::new("changed", origin.to_owned()));
    }

    /// A copy of the state (the Worker persists it after every change).
    pub fn snapshot(&self) -> Store {
        self.with(|s| s.clone())
    }

    /// One move of the simulated teammate: advance the next issue in turn (the React app's
    /// `setInterval` makes the same moves, so both demos stay in step) and tell every page.
    pub fn teammate_step(&self) {
        self.with(|s| {
            if !s.issues.is_empty() {
                let i = s.tick % s.issues.len();
                s.tick += 1;
                if let Some(issue) = s.issues.get_mut(i) {
                    issue.status = (issue.status + 1) % STATUSES.len();
                }
            }
        });
        self.changed("-");
    }

    /// The teammate on tokio: one [`teammate_step`](Self::teammate_step) every `every`.
    #[cfg(feature = "native")]
    pub fn spawn_teammate(&self, every: std::time::Duration) {
        let t = self.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(every).await;
                t.teammate_step();
            }
        });
    }

    fn home(&self) -> LocalPath {
        LocalPath::parse_or_root(Some(&format!("{}/", self.base)))
    }
}

#[derive(Serialize)]
struct Row {
    id: u32,
    title: String,
    status: &'static str,
    status_variant: &'static str,
    priority: &'static str,
    priority_variant: &'static str,
    assignee: Option<&'static str>,
}

fn rows(t: &Tracker) -> Vec<Row> {
    t.with(|s| {
        s.issues
            .iter()
            .map(|i| {
                let st = STATUSES[i.status % STATUSES.len()];
                let pr = PRIORITIES[i.priority % PRIORITIES.len()];
                Row {
                    id: i.id,
                    title: i.title.clone(),
                    status: st.1,
                    status_variant: st.2,
                    priority: pr.1,
                    priority_variant: pr.2,
                    assignee: i.assignee.and_then(|a| USERS.get(a).copied()),
                }
            })
            .collect()
    })
}

#[derive(Debug, Deserialize, Serialize)]
struct IssueInput {
    title: String,
    status: String,
    priority: String,
    assignee: Option<String>,
}

fn index(table: &[(&str, &str, &str)], v: &str) -> Option<usize> {
    table.iter().position(|(k, _, _)| *k == v)
}

impl Validate for IssueInput {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("title", Rule::text().required().min_len(3).max_len(80)),
        ("status", Rule::text().required()),
        ("priority", Rule::text().required()),
    ];

    // Select values come from the client: only listed ones pass.
    fn validate(&self, e: &mut FormErrors) {
        if index(&STATUSES, &self.status).is_none() {
            e.add("status", Msg::new("issue.pick"));
        }
        if index(&PRIORITIES, &self.priority).is_none() {
            e.add("priority", Msg::new("issue.pick"));
        }
        if let Some(a) = &self.assignee
            && !USERS.contains(&a.as_str())
        {
            e.add("assignee", Msg::new("issue.pick"));
        }
    }
}

fn empty_form() -> FormState {
    FormState::new::<IssueInput>().values(IssueInput {
        title: String::new(),
        status: "backlog".into(),
        priority: "medium".into(),
        assignee: None,
    })
}

fn options() -> Value {
    let pairs = |t: &[(&'static str, &'static str, &'static str)]| {
        t.iter().map(|(k, l, _)| [*k, *l]).collect::<Vec<_>>()
    };
    let mut users = vec![["", "Unassigned"]];
    users.extend(USERS.iter().map(|u| [*u, *u]));
    context! { statuses => pairs(&STATUSES), priorities => pairs(&PRIORITIES), users }
}

fn ctx(t: &Tracker, form: FormState) -> Value {
    context! {
        issues => Value::from(Serde(rows(t))), form, options => options(), // Checked plain in `build`; unescaped so links read `/demos/x`, not `&#x2f;demos&#x2f;x`.
        base => Value::from_safe_string(t.base.to_string()),
    }
}

fn page(t: &Tracker, form: FormState) -> View {
    View::page("issues.html").ctx(ctx(t, form))
}

fn list(t: &Tracker) -> View {
    page(t, empty_form()).fragment("issues")
}

async fn create(
    State(t): State<Tracker>,
    hx: Hx,
    headers: HeaderMap,
    Form(f): Form<IssueInput>,
) -> Response {
    match f {
        Submission::Valid(i) => {
            t.with(|s| {
                let id = s.next;
                s.next += 1;
                s.issues.push(Issue {
                    id,
                    title: i.title.trim().to_owned(),
                    status: index(&STATUSES, &i.status).unwrap_or(0),
                    priority: index(&PRIORITIES, &i.priority).unwrap_or(0),
                    assignee: i.assignee.and_then(|a| USERS.iter().position(|u| *u == a)),
                });
            });
            t.changed(&origin(&headers));
            if !hx.is_partial() {
                return see_other(&hx, &t.home());
            }
            // A fresh form for the next issue, the list out of band, the dialog closed.
            page(&t, empty_form())
                .fragment("issue_form")
                .oob("issues.html", "issues", ctx(&t, empty_form()))
                .trigger("cv-dialog-close", ())
                .toast(ToastKind::Success, "issue.created")
                .into_response()
        }
        Submission::Invalid(form) => page(&t, form)
            .fragment("issue_form")
            .status(StatusCode::UNPROCESSABLE_ENTITY)
            .into_response(),
    }
}

/// Applies `f` (false: no such issue), tells every page, answers with the list fragment
/// (htmx) or a redirect home (no JavaScript).
fn origin(h: &HeaderMap) -> String {
    h.get("x-client-id")
        .and_then(|v| v.to_str().ok())
        .filter(|v| {
            !v.is_empty()
                && v.len() <= 64
                && v.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
        })
        .unwrap_or("-")
        .to_owned()
}

fn mutate(
    t: &Tracker,
    hx: &Hx,
    origin: &str,
    toast: Option<&'static str>,
    f: impl FnOnce(&mut Vec<Issue>) -> bool,
) -> Response {
    if !t.with(|s| f(&mut s.issues)) {
        return StatusCode::NOT_FOUND.into_response();
    }
    t.changed(origin);
    if !hx.is_partial() {
        return see_other(hx, &t.home());
    }
    match toast {
        Some(key) => list(t).toast(ToastKind::Success, key).into_response(),
        None => list(t).into_response(),
    }
}

async fn advance(
    State(t): State<Tracker>,
    hx: Hx,
    headers: HeaderMap,
    Path(id): Path<u32>,
) -> Response {
    mutate(&t, &hx, &origin(&headers), None, |v| {
        v.iter_mut().find(|i| i.id == id).is_some_and(|i| {
            i.status = (i.status + 1) % STATUSES.len();
            true
        })
    })
}

async fn delete(
    State(t): State<Tracker>,
    hx: Hx,
    headers: HeaderMap,
    Path(id): Path<u32>,
) -> Response {
    mutate(&t, &hx, &origin(&headers), Some("issue.deleted"), |v| {
        let before = v.len();
        v.retain(|i| i.id != id);
        v.len() < before
    })
}

/// One stream per open page; the session's CSRF token is the per-subscriber key (4 tabs max).
async fn events(State(t): State<Tracker>, session: Session) -> Result<Response, AppError> {
    let key = session.csrf_token()?;
    Ok(sse(t.bus.subscribe(&key)?))
}

/// Serves only files the Vite build emits: a flat `.js`/`.css` name, never a request-chosen path.
#[cfg(feature = "native")]
async fn asset(State(dir): State<Arc<std::path::PathBuf>>, Path(name): Path<String>) -> Response {
    use axum::http::{HeaderValue, header};
    let safe = !name.starts_with('.')
        && name
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'));
    let ctype = match name.rsplit_once('.') {
        Some((_, "js")) if safe => "text/javascript; charset=utf-8",
        Some((_, "css")) if safe => "text/css; charset=utf-8",
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    match std::fs::read(dir.join(&name)) {
        Ok(body) => (
            [(header::CONTENT_TYPE, HeaderValue::from_static(ctype))],
            body,
        )
            .into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

fn engine() -> Engine {
    let templates = BTreeMap::from([
        (
            "base.html".to_string(),
            include_str!("../templates/base.html").to_string(),
        ),
        (
            "issues.html".to_string(),
            include_str!("../templates/issues.html").to_string(),
        ),
    ]);
    let en = [
        ("issue.created", "Issue created"),
        ("issue.deleted", "Issue deleted"),
        ("issue.pick", "Pick one of the listed values"),
    ]
    .map(|(k, v)| (k.to_string(), v.to_string()));
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"track-lite\"\nlang = \"en\"").expect("static config"),
        templates,
        messages: BTreeMap::from([("en".to_string(), en.into_iter().collect())]),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .expect("static templates compile")
}

/// How [`build`] mounts the app.
pub struct Options {
    /// Path prefix of every route and link: `""` (native) or `/demos/track-lite-htmx` (no
    /// trailing slash; letters, digits, `/`, `-`, `_` only, else [`build`] panics). The page
    /// itself is `{base}/`.
    pub base: String,
    /// The Vite output directory served at `{base}/assets/` (`None`: something else serves it,
    /// such as the Workers static-assets binding).
    #[cfg(feature = "native")]
    pub assets: Option<std::path::PathBuf>,
}

/// The router plus its state, on any target: `store` is the starting state ([`Store::seeded`]
/// or what the Worker loaded from storage), `sessions` the session store.
pub fn build(
    opts: Options,
    store: Store,
    bus: Arc<dyn Bus>,
    sessions: impl SessionStore,
    session_cfg: SessionConfig,
) -> (Router, Tracker) {
    let base = opts.base.trim_end_matches('/').to_owned();
    assert!(
        base.is_empty()
            || (base.starts_with('/')
                && base
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'/' | b'-' | b'_'))),
        "Options::base must be empty or a plain absolute path"
    );
    let tracker = Tracker {
        store: Arc::new(Mutex::new(store)),
        bus,
        base: base.clone().into(),
    };
    #[allow(unused_mut)]
    let mut routes = Router::new()
        .route(
            &format!("{base}/"),
            get(|State(t): State<Tracker>| async move { page(&t, empty_form()) }),
        )
        .route(
            &format!("{base}/issues"),
            get(|State(t): State<Tracker>| async move { list(&t) }).post(create),
        )
        .route(&format!("{base}/issues/{{id}}/advance"), post(advance))
        .route(&format!("{base}/issues/{{id}}/delete"), post(delete))
        .route(&format!("{base}/events"), get(events));
    #[cfg(feature = "native")]
    if let Some(dir) = opts.assets {
        routes = routes.route(
            &format!("{base}/assets/{{name}}"),
            get(asset).with_state(Arc::new(dir)),
        );
    }
    let router = App::new(engine())
        .sessions(sessions, session_cfg)
        .csrf(Csrf::default())
        .toaster("base.html", "toaster")
        .with_state(tracker.clone())
        .routes(routes)
        .into_router();
    (router, tracker)
}

/// The native app at `/`: seeded, in-memory sessions, a [`Hub`], assets from `assets`
/// (`apps/examples/track-lite-htmx/dist`). `main` starts the teammate on it; tests leave it off.
#[cfg(feature = "native")]
pub fn app(assets: impl Into<std::path::PathBuf>) -> (Router, Tracker) {
    build(
        Options {
            base: String::new(),
            assets: Some(assets.into()),
        },
        Store::seeded(),
        Arc::new(Hub::<Fragment>::new(&["issues"])),
        cascivo_server::MemoryStore::new(),
        SessionConfig::default(),
    )
}
