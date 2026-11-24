//! A dynamic cascivo app on Cloudflare Workers: notes CRUD behind sign-in, a Solid island, a
//! server island, SSE. `app` is the router every target shares; this file is the entry point.
//! Static files (`web/dist`) are served by Workers assets before this code runs.

pub mod app;
pub mod auth;
pub mod demo;
pub mod notes;
mod platform;

use std::sync::OnceLock;

use axum::Router;
use axum::body::Body;
use axum::http::Response;

/// Built once per isolate; `APP_SECRET` is a Worker secret (`wrangler secret put APP_SECRET`,
/// locally `.dev.vars`).
static ROUTER: OnceLock<Result<Router, String>> = OnceLock::new();

#[worker::event(fetch)]
async fn fetch(
    req: worker::HttpRequest,
    env: worker::Env,
    _: worker::Context,
) -> worker::Result<Response<Body>> {
    let router = ROUTER.get_or_init(|| {
        let secret = env.secret("APP_SECRET").ok().map(|s| s.to_string());
        // wasm builds are release builds: no dev fallback, a missing secret is a 500.
        app::secret(secret).and_then(|s| app::router(&s))
    });
    match router {
        Ok(r) => cascivo_worker::serve_router(req, env, r).await,
        Err(e) => Err(worker::Error::RustError(e.clone())),
    }
}
