//! `KvStore` behind `App::sessions`: the record lands in KV under the hashed id, and a second
//! request with the cookie reads it back (same CSRF token).

use std::collections::{BTreeMap, HashMap};
use std::sync::{Arc, Mutex};

use axum::Router;
use axum::body::{Body, to_bytes};
use axum::http::{Request, header};
use axum::routing::get;
use cascivo_server::{App, Headers, SessionConfig, View};
use cascivo_web::{Bundle, Config, Engine};
use cascivo_worker::{KvBackend, KvStore};
use tower::ServiceExt;

#[derive(Clone, Default)]
struct Mem(Arc<Mutex<HashMap<String, (String, u64)>>>);

impl KvBackend for Mem {
    async fn get(&self, key: &str) -> Result<Option<String>, String> {
        Ok(self.0.lock().unwrap().get(key).map(|(v, _)| v.clone()))
    }
    async fn put(&self, key: &str, value: String, ttl: u64) -> Result<(), String> {
        self.0.lock().unwrap().insert(key.to_owned(), (value, ttl));
        Ok(())
    }
    async fn delete(&self, key: &str) -> Result<(), String> {
        self.0.lock().unwrap().remove(key);
        Ok(())
    }
}

fn app(kv: Mem) -> Router {
    let engine = Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"T\"").unwrap(),
        templates: BTreeMap::from([("p.html".into(), "<i>{{ request.csrf }}</i>".into())]),
        messages: BTreeMap::new(),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .unwrap();
    App::new(engine)
        .security_headers(Headers::none())
        .sessions(KvStore::with_backend(kv), SessionConfig::default())
        .routes(Router::new().route("/", get(|| async { View::page("p.html") })))
        .into_router()
}

async fn get_page(app: Router, cookie: Option<&str>) -> (Option<String>, String) {
    let mut req = Request::get("/");
    if let Some(c) = cookie {
        req = req.header(header::COOKIE, c);
    }
    let res = app.oneshot(req.body(Body::empty()).unwrap()).await.unwrap();
    let set = res
        .headers()
        .get(header::SET_COOKIE)
        .map(|v| v.to_str().unwrap().split(';').next().unwrap().to_owned());
    let body = to_bytes(res.into_body(), 1 << 16).await.unwrap();
    (set, String::from_utf8(body.to_vec()).unwrap())
}

#[tokio::test]
async fn sessions_round_trip_through_kv() {
    let kv = Mem::default();
    let (cookie, first) = get_page(app(kv.clone()), None).await;
    let cookie = cookie.expect("new session sets a cookie");
    {
        let m = kv.0.lock().unwrap();
        assert_eq!(m.len(), 1, "one record in KV");
        let (key, (json, ttl)) = m.iter().next().unwrap();
        assert_eq!(key.len(), 64, "sha256 hex key, never the cookie value");
        assert!(!cookie.contains(key.as_str()));
        assert!(json.contains("\"csrf\""));
        assert_eq!(*ttl, 24 * 3600, "idle TTL");
    }
    let (_, second) = get_page(app(kv), Some(&cookie)).await;
    assert!(first.starts_with("<i>") && first.len() > "<i></i>".len());
    assert_eq!(first, second, "same session, same CSRF token");
}
