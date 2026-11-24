//! X1 on `cascivo-worker`: `App` + `Engine` bundle + KV sessions + a D1 route.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use axum::Router;
use axum::extract::Path;
use axum::routing::get;
use cascivo_server::{App, AppError, Headers, Session, SessionConfig, View};
use cascivo_web::{Bundle, Config, Engine};
use cascivo_worker::{D1, KvStore};
use worker::{Context, HttpRequest, event};

pub fn engine() -> Engine {
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"Spike\"").expect("config"),
        templates: BTreeMap::from([(
            "index.html".to_owned(),
            include_str!("../templates/index.html").to_owned(),
        )]),
        messages: BTreeMap::new(),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .expect("bundle")
}

fn page(s: &Session, title: &str) -> View {
    let visits = s.get::<u64>("visits").unwrap_or(0) + 1;
    let _ = s.insert("visits", visits);
    View::page("index.html").ctx(serde_json::json!({ "title": title, "visits": visits }))
}

pub fn routes() -> Router {
    Router::new()
        .route(
            "/",
            get(|s: Session| async move { page(&s, "Hello from a Worker") }),
        )
        .route("/db", get(db))
        .route(
            "/{name}",
            get(|s: Session, Path(n): Path<String>| async move { page(&s, &n) }),
        )
}

#[worker::send]
async fn db(D1(db): D1) -> Result<String, AppError> {
    let one: Option<u32> = db
        .prepare("select 1 as one")
        .first(Some("one"))
        .await
        .map_err(AppError::internal)?;
    Ok(format!("d1: {}", one.unwrap_or(0)))
}

fn app(env: &worker::Env) -> Router {
    let kv = KvStore::new(env, "SESSIONS").expect("SESSIONS KV binding");
    App::new(engine())
        .security_headers(Headers::default())
        .sessions(kv, SessionConfig::default())
        .routes(routes())
        .into_router()
}

static ROUTER: OnceLock<Router> = OnceLock::new();

#[event(start)]
fn start() {
    console_error_panic_hook::set_once();
}

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    env: worker::Env,
    _ctx: Context,
) -> worker::Result<axum::http::Response<axum::body::Body>> {
    let router = ROUTER.get_or_init(|| app(&env));
    cascivo_worker::serve_router(req, env, router).await
}

#[cfg(test)]
mod tests {
    #[test]
    fn renders() {
        let req = cascivo_web::ReqCtx::default();
        let ctx = minijinja_ctx();
        let h = super::engine().render("index.html", &ctx, &req).unwrap();
        assert!(h.contains("<h1>Hi</h1>") && h.contains("visits"));
    }

    fn minijinja_ctx() -> minijinja::Value {
        minijinja::context! { title => "Hi", visits => 1 }
    }
}
