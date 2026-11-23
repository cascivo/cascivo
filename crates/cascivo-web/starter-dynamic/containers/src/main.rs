//! One page (`/`) and one htmx fragment route (`/visits`). The same template serves both: a
//! plain request gets the page, an htmx request gets the `visits` block.

use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use axum::Router;
use axum::extract::State;
use axum::routing::get;
use cascivo_server::{App, Engine, View};
use serde::Serialize;

#[derive(Serialize)]
struct Ctx {
    visits: u64,
}

fn page(visits: u64) -> View {
    View::page("index.html").ctx(Ctx { visits }).fragment("visits")
}

async fn index(State(n): State<Arc<AtomicU64>>) -> View {
    page(n.load(Ordering::Relaxed))
}

async fn visits(State(n): State<Arc<AtomicU64>>) -> View {
    page(n.fetch_add(1, Ordering::Relaxed) + 1)
}

/// Cloudflare probes the port the Worker names; a cheap route that renders nothing.
async fn health() -> &'static str {
    "ok"
}

fn router(engine: Engine) -> Router {
    App::new(engine)
        .with_state(Arc::new(AtomicU64::new(0)))
        .routes(
            Router::new()
                .route("/", get(index))
                .route("/visits", get(visits)),
        )
        .into_router()
        .route("/healthz", get(health))
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let site = std::env::var("SITE_DIR").unwrap_or_else(|_| "site".into());
    let engine = Engine::load(std::path::Path::new(&site)).unwrap_or_else(|e| {
        eprintln!("cannot load site `{site}`: {e:?}");
        std::process::exit(1);
    });
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    // 0.0.0.0: the container's only client is the Worker, through the Durable Object.
    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("listening on {addr}");
    axum::serve(listener, router(engine)).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{Body, to_bytes};
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    fn app() -> Router {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        router(Engine::load(root).expect("site loads"))
    }

    async fn get_body(uri: &str, htmx: bool) -> (StatusCode, String) {
        let mut req = Request::get(uri);
        if htmx {
            req = req.header("HX-Request", "true");
        }
        let res = app().oneshot(req.body(Body::empty()).unwrap()).await.unwrap();
        let status = res.status();
        let bytes = to_bytes(res.into_body(), usize::MAX).await.unwrap();
        (status, String::from_utf8(bytes.to_vec()).unwrap())
    }

    #[tokio::test]
    async fn page_is_a_full_document() {
        let (s, body) = get_body("/", false).await;
        assert_eq!(s, StatusCode::OK);
        assert!(body.contains("<!doctype html>") && body.contains("Visits: 0"));
    }

    #[tokio::test]
    async fn htmx_gets_only_the_fragment() {
        let (s, body) = get_body("/visits", true).await;
        assert_eq!(s, StatusCode::OK);
        assert_eq!(body.trim(), "Visits: 1");
    }
}
