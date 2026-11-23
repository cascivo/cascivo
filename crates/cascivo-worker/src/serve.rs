use axum::Router;
use axum::body::Body;
use axum::http::Response;
use tower_service::Service;
use worker::HttpRequest;

use crate::extract::{Bindings, EnvExt};

/// Runs `app(&env)` for one request. Building the router per request is simple but repeats
/// its setup (template compile, …); cache it with [`serve_router`] and a `OnceLock` instead.
///
/// # Errors
/// Never from the router itself (axum's `Router` is infallible); kept for the `fetch` signature.
pub async fn serve(
    req: HttpRequest,
    env: worker::Env,
    app: impl FnOnce(&worker::Env) -> Router,
) -> worker::Result<Response<Body>> {
    let router = app(&env);
    serve_with(req, env, Bindings::default(), &router).await
}

/// [`serve`] with a prebuilt (cached) router and the default [`Bindings`].
///
/// # Errors
/// As [`serve`].
pub async fn serve_router(
    req: HttpRequest,
    env: worker::Env,
    router: &Router,
) -> worker::Result<Response<Body>> {
    serve_with(req, env, Bindings::default(), router).await
}

/// [`serve_router`] with binding names other than the defaults.
///
/// # Errors
/// As [`serve`].
pub async fn serve_with(
    mut req: HttpRequest,
    env: worker::Env,
    bindings: Bindings,
    router: &Router,
) -> worker::Result<Response<Body>> {
    req.extensions_mut().insert(EnvExt(env));
    req.extensions_mut().insert(bindings);
    let mut r = router.clone();
    // `Router::call` is `Infallible`.
    let Ok(res) = r.call(req).await;
    Ok(res)
}
