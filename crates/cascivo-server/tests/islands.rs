//! Server islands: signing, verification and the `/_island/<name>` route.

use std::collections::BTreeMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::routing::get;
use base64::Engine as _;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use cascivo_server::{App, AppError, IslandError, IslandKey, View};
use cascivo_web::{Bundle, Config, Engine};
use hmac::{Hmac, KeyInit, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tower::ServiceExt;

const SECRET: &[u8] = b"0123456789abcdef0123456789abcdef-current";
const OLD: &[u8] = b"0123456789abcdef0123456789abcdef-previous";

const PAGE: &str = r"<main>{{ cart }}</main>";
const CART: &str =
    r#"<p>page</p><div id="cart">{% block cart %}cart {{ id }} {{ note }}{% endblock %}</div>"#;

fn engine() -> Engine {
    let templates = BTreeMap::from([
        ("page.html".to_string(), PAGE.to_string()),
        ("cart.html".to_string(), CART.to_string()),
    ]);
    Engine::new(&Bundle {
        format: cascivo_web::engine::BUNDLE_FORMAT,
        config: Config::parse("title = \"T\"").unwrap(),
        templates,
        messages: BTreeMap::new(),
        vite_manifest: None,
        css_modules: None,
        data: serde_json::Value::Null,
    })
    .unwrap()
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct Cart {
    id: u32,
    note: String,
}

fn key() -> IslandKey {
    IslandKey::new(&[SECRET]).unwrap()
}

fn app(calls: Arc<AtomicUsize>) -> Router {
    let k = key();
    App::new(engine())
        .islands(key())
        .server_island("cart", move |p: Cart, _parts| {
            let calls = Arc::clone(&calls);
            async move {
                calls.fetch_add(1, Ordering::SeqCst);
                Ok::<_, AppError>(View::page("cart.html").ctx(p).fragment("cart"))
            }
        })
        .routes(Router::new().route(
            "/",
            get(move || {
                let k = k.clone();
                async move {
                    let cart = k
                        .placeholder(
                            "cart",
                            &Cart {
                                id: 3,
                                note: "\"><script>".into(),
                            },
                            "<i>loading</i>",
                        )
                        .unwrap();
                    View::page("page.html").ctx(minijinja::context! { cart })
                }
            }),
        ))
        .into_router()
}

async fn get_hx(app: Router, uri: &str) -> (StatusCode, String) {
    let req = Request::get(uri)
        .header("hx-request", "true")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    let status = res.status();
    let body = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (status, String::from_utf8(body.to_vec()).unwrap())
}

fn url_for(name: &str, token: &str) -> String {
    let enc: String = form_urlencoded::byte_serialize(token.as_bytes()).collect();
    format!("/_island/{name}?p={enc}")
}

#[tokio::test]
async fn placeholder_loads_fragment() {
    let calls = Arc::new(AtomicUsize::new(0));
    let (s, page) = get_hx(app(Arc::clone(&calls)), "/").await;
    assert_eq!(s, StatusCode::OK);
    // Safe value: rendered without `|safe`, props never appear in clear text.
    assert!(
        page.starts_with("<main><div hx-get=\"/_island/cart?p="),
        "{page}"
    );
    assert!(
        page.ends_with("\" hx-trigger=\"load\" hx-swap=\"outerHTML\"><i>loading</i></div></main>")
    );
    assert!(!page.contains("<script>"));
    let url = page.split('"').nth(1).unwrap();
    let (s, frag) = get_hx(app(Arc::clone(&calls)), url).await;
    assert_eq!(s, StatusCode::OK);
    assert_eq!(frag, "cart 3 &quot;&gt;&lt;script&gt;");
    assert_eq!(calls.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn tampered_tokens_are_400_and_skip_the_handler() {
    let calls = Arc::new(AtomicUsize::new(0));
    let good = key()
        .sign(
            "cart",
            &Cart {
                id: 3,
                note: String::new(),
            },
        )
        .unwrap();
    let (body, mac) = good.split_once('.').unwrap();

    // Props changed, MAC kept.
    let forged_body = URL_SAFE_NO_PAD.encode(
        String::from_utf8(URL_SAFE_NO_PAD.decode(body).unwrap())
            .unwrap()
            .replace("\"id\":3", "\"id\":4"),
    );
    // MAC made with the raw secret (not the derived island key).
    let mut m = <Hmac<Sha256> as KeyInit>::new_from_slice(SECRET).unwrap();
    m.update(forged_body.as_bytes());
    let raw_mac = URL_SAFE_NO_PAD.encode(m.finalize().into_bytes());
    // MAC made with the session-cookie derivation of the same secret.
    let mut c = <Hmac<Sha256> as KeyInit>::new_from_slice(SECRET).unwrap();
    c.update(b"cascivo-server/session-cookie/v1");
    let cookie_key = c.finalize().into_bytes();
    let mut m = <Hmac<Sha256> as KeyInit>::new_from_slice(&cookie_key).unwrap();
    m.update(forged_body.as_bytes());
    let cookie_mac = URL_SAFE_NO_PAD.encode(m.finalize().into_bytes());

    let other = IslandKey::new(&[b"another-secret-another-secret-another"])
        .unwrap()
        .sign(
            "cart",
            &Cart {
                id: 3,
                note: String::new(),
            },
        )
        .unwrap();
    let wrong_island = key()
        .sign(
            "menu",
            &Cart {
                id: 3,
                note: String::new(),
            },
        )
        .unwrap();
    let expired = key()
        .ttl(Duration::ZERO)
        .sign(
            "cart",
            &Cart {
                id: 3,
                note: String::new(),
            },
        )
        .unwrap();
    let wrong_shape = key()
        .sign("cart", &serde_json::json!({ "id": "x" }))
        .unwrap();

    let cases = [
        url_for("cart", &format!("{forged_body}.{mac}")),
        url_for("cart", &format!("{forged_body}.{raw_mac}")),
        url_for("cart", &format!("{forged_body}.{cookie_mac}")),
        url_for("cart", &format!("{body}.")),
        url_for("cart", body),
        url_for("cart", &format!("{body}.{mac}A")),
        url_for("cart", &other),
        url_for("cart", &wrong_island),
        url_for("cart", &expired),
        url_for("cart", &wrong_shape),
        url_for("cart", &"A".repeat(9000)),
        "/_island/cart".to_owned(),
        "/_island/cart?q=1".to_owned(),
    ];
    for uri in &cases {
        let (s, body) = get_hx(app(Arc::clone(&calls)), uri).await;
        assert_eq!(s, StatusCode::BAD_REQUEST, "{uri}");
        assert_eq!(body, "Bad Request", "detail must not leak: {uri}");
    }
    assert_eq!(calls.load(Ordering::SeqCst), 0);
}

#[test]
fn verify_reports_why() {
    let k = key();
    let t = k.sign("cart", &1u8).unwrap();
    assert_eq!(k.verify::<u8>("cart", &t), Ok(1));
    assert_eq!(k.verify::<u8>("menu", &t), Err(IslandError::WrongIsland));
    assert!(matches!(
        k.verify::<String>("cart", &t),
        Err(IslandError::Props(_))
    ));
    assert_eq!(k.verify::<u8>("cart", "nodot"), Err(IslandError::Malformed));
    let (b, _) = t.split_once('.').unwrap();
    assert_eq!(
        k.verify::<u8>("cart", &format!("{b}.AAAA")),
        Err(IslandError::BadMac)
    );
    let exp = k.clone().ttl(Duration::ZERO).sign("cart", &1u8).unwrap();
    assert_eq!(k.verify::<u8>("cart", &exp), Err(IslandError::Expired));
    // Tokens are not deterministic across names; the URL refuses bad names.
    assert!(k.url("Cart/../x", &1u8).is_err());
}

#[test]
fn rotation_and_secret_length() {
    let old = IslandKey::new(&[OLD]).unwrap();
    let t = old.sign("cart", &7u32).unwrap();
    let rotated = IslandKey::new(&[SECRET, OLD]).unwrap();
    assert_eq!(rotated.verify::<u32>("cart", &t), Ok(7));
    assert_eq!(key().verify::<u32>("cart", &t), Err(IslandError::BadMac));
    // New tokens use the first key only.
    let t2 = rotated.sign("cart", &7u32).unwrap();
    assert_eq!(key().verify::<u32>("cart", &t2), Ok(7));
    assert!(IslandKey::new(&[b"short"]).is_err());
    assert!(IslandKey::new(&[]).is_err());
}

#[test]
#[should_panic(expected = "needs App::islands")]
fn island_without_key_panics() {
    let _ = App::new(engine())
        .server_island("cart", |_: u8, _| async { Ok(View::page("cart.html")) })
        .into_router();
}

#[test]
#[should_panic(expected = "is not [a-z0-9_-]")]
fn bad_island_name_panics() {
    let _ = App::new(engine())
        .islands(key())
        .server_island("../x", |_: u8, _| async { Ok(View::page("cart.html")) });
}
