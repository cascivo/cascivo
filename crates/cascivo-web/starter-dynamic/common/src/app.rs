//! The app every target shares: templates, messages and the router. `platform` (per target)
//! holds only what differs: the clock the SSE demo sleeps on.

use std::collections::BTreeMap;

use axum::Router;
use axum::routing::get;
use cascivo_server::{App, CookieStore, Csrf, IslandKey, SessionConfig, View};
use cascivo_web::{Bundle, Config, Engine};

use crate::{auth, demo, notes};

/// Templates are compiled into the binary, so the same code runs natively, in a container
/// and on Workers (no filesystem there).
pub const TEMPLATES: &[(&str, &str)] = &[
    ("base.html", include_str!("../templates/base.html")),
    ("home.html", include_str!("../templates/home.html")),
    ("login.html", include_str!("../templates/login.html")),
    ("notes.html", include_str!("../templates/notes.html")),
    ("note.html", include_str!("../templates/note.html")),
    ("c/form.html", include_str!("../templates/c/form.html")),
    ("c/dialog.html", include_str!("../templates/c/dialog.html")),
    ("c/toast.html", include_str!("../templates/c/toast.html")),
    ("c/island.html", include_str!("../templates/c/island.html")),
    ("c/sse.html", include_str!("../templates/c/sse.html")),
    ("c/tabs.html", include_str!("../templates/c/tabs.html")),
];

/// English messages; `t("key")` in templates, toast and validation keys in handlers.
pub const MESSAGES: &[(&str, &str)] = &[
    ("auth.in", "Signed in"),
    ("notes.created", "Note added"),
    ("notes.updated", "Note saved"),
    ("notes.deleted", "Note deleted"),
    ("c.saved", "Profile saved"),
    ("c.dialog", "Name updated"),
    ("c.taken", "{name} is taken"),
    ("c.fix", "Fix the errors below"),
];

/// Dev-only fallback so `cargo run` works out of the box; release builds refuse to start
/// without `APP_SECRET` (`secret`).
const DEV_SECRET: &str = "dev-only-secret-change-me-0123456789abcdef";

/// `APP_SECRET` (32+ bytes) signs session cookies and island props. Debug builds fall back to
/// a fixed dev secret; release builds have no fallback.
pub fn secret(from_env: Option<String>) -> Result<Vec<u8>, String> {
    match from_env {
        Some(s) if s.len() >= 32 => Ok(s.into_bytes()),
        Some(_) => Err("APP_SECRET must be 32 bytes or more".into()),
        None if cfg!(debug_assertions) => Ok(DEV_SECRET.as_bytes().to_vec()),
        None => Err("APP_SECRET is not set (32+ bytes, e.g. `openssl rand -hex 32`)".into()),
    }
}

pub fn engine() -> Engine {
    let templates = TEMPLATES
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
        .collect();
    let en = MESSAGES
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
        .collect();
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse(include_str!("../site.toml")).expect("site.toml parses"),
        templates,
        messages: BTreeMap::from([("en".to_owned(), en)]),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .expect("templates compile")
}

async fn home() -> View {
    View::page("home.html")
}

/// The whole app. Sessions live in an encrypted cookie, so no target needs a session store;
/// swap in `SqliteStore` (native) or `cascivo_worker::KvStore` for server-side sessions.
pub fn router(secret: &[u8]) -> Result<Router, String> {
    let key = IslandKey::new(&[secret]).map_err(|e| e.to_string())?;
    let store = CookieStore::new(&[secret]).map_err(|e| e.to_string())?;
    Ok(App::new(engine())
        .sessions(store, SessionConfig::default())
        .auth(auth::DemoAuth)
        .csrf(Csrf::default())
        .islands(key.clone())
        .server_island("stats", demo::stats_island)
        .toaster("base.html", "toaster")
        .with_state(notes::Notes::default())
        .routes(
            Router::new()
                .route("/", get(home))
                // Health probe for containers and load balancers.
                .route("/healthz", get(|| async { "ok" }))
                .merge(auth::routes())
                .merge(notes::routes())
                .merge(demo::routes(key)),
        )
        .into_router())
}
