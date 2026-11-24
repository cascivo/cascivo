//! The solid-htmx example server: a page, one htmx fragment route and the island assets.
//! Everything dynamic is HTML from `cascivo-server`; the Solid island ships as `/assets/island.js`.

mod conformance;

use std::collections::BTreeMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};

use axum::Router;
use axum::extract::{Path, State};
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use cascivo_server::{App, Csrf, IslandKey, MemoryStore, SessionConfig, View};
use cascivo_web::{Bundle, Config, Engine};
use serde::Serialize;

#[derive(Clone)]
struct Notes {
    count: Arc<AtomicU32>,
    assets: Arc<std::path::PathBuf>,
}

#[derive(Serialize)]
struct Ctx {
    count: u32,
}

fn engine() -> Engine {
    let mut templates = BTreeMap::from([
        (
            "base.html".to_string(),
            include_str!("../templates/base.html").to_string(),
        ),
        (
            "home.html".to_string(),
            include_str!("../templates/home.html").to_string(),
        ),
    ]);
    templates.extend(conformance::TEMPLATES.map(|(k, v)| (k.to_string(), v.to_string())));
    let en = conformance::MESSAGES.map(|(k, v)| (k.to_string(), v.to_string()));
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"solid-htmx\"\nlang = \"en\"").expect("static config"),
        templates,
        messages: BTreeMap::from([("en".to_string(), en.into_iter().collect())]),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .expect("static templates compile")
}

fn home(count: u32) -> View {
    View::page("home.html").ctx(Ctx { count }).fragment("count")
}

/// Serves only files the Vite build emits: a flat `.js`/`.css` name, never a request-chosen path.
async fn asset(State(s): State<Notes>, Path(name): Path<String>) -> Response {
    let safe = !name.starts_with('.')
        && name
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'));
    let ctype = match name.rsplit_once('.') {
        Some((_, "js")) if safe => "text/javascript; charset=utf-8",
        Some((_, "css")) if safe => "text/css; charset=utf-8",
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    match std::fs::read(s.assets.join(&name)) {
        Ok(body) => (
            [(header::CONTENT_TYPE, HeaderValue::from_static(ctype))],
            body,
        )
            .into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

/// `assets` is the Vite output directory (`apps/examples/solid-htmx/dist`).
pub fn router(assets: impl Into<std::path::PathBuf>) -> Router {
    let state = Notes {
        count: Arc::new(AtomicU32::new(2)),
        assets: Arc::new(assets.into()),
    };
    let key = IslandKey::new(&[conformance::ISLAND_SECRET]).expect("island key");
    App::new(engine())
        .sessions(MemoryStore::new(), SessionConfig::default())
        .csrf(Csrf::default())
        .islands(key.clone())
        .server_island("stats", conformance::stats_island)
        .toaster("base.html", "toaster")
        .with_state(state)
        .routes(
            Router::new()
                .route("/", get(|State(s): State<Notes>| async move { home(s.count.load(Ordering::Relaxed)) }))
                // The htmx fragment: a partial request gets only block `count`.
                .route(
                    "/notes",
                    post(|State(s): State<Notes>| async move { home(s.count.fetch_add(1, Ordering::Relaxed) + 1) }),
                )
                .route("/assets/{name}", get(asset))
                .merge(conformance::routes(key)),
        )
        .into_router()
}
