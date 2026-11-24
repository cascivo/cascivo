//! B3 security behaviour: sessions, CSRF, auth hooks, flash, open redirects, cookie flags.

use std::collections::BTreeMap;

use axum::Router;
use axum::body::{Body, to_bytes};
use axum::extract::{Extension, Query};
use axum::http::{Request, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use cascivo_server::{
    App, Authenticator, CookieStore, Csrf, Facts, Headers, Hx, LocalPath, MaybeUser, MemoryStore,
    Session, SessionConfig, SessionStore, ToastKind, User, View, see_other,
};
use cascivo_web::{Bundle, Config, Engine};
use serde::{Deserialize, Serialize};
use tower::ServiceExt;

fn engine() -> Engine {
    let templates = BTreeMap::from([(
        "form.html".to_string(),
        "<i>{{ request.csrf }}</i>{% for f in flash %}<p>{{ f.kind }}:{{ f.message }}</p>{% endfor %}<u>{{ user.name }}</u>"
            .to_string(),
    )]);
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

#[derive(Clone, Serialize)]
struct Name {
    name: String,
}

#[derive(Clone)]
struct Auth;

impl Authenticator for Auth {
    type User = Name;
    async fn user(&self, s: &Session, _: &axum::http::request::Parts) -> Option<Name> {
        s.get::<String>("uid").map(|name| Name { name })
    }
}

#[derive(Deserialize)]
struct Next {
    next: Option<String>,
}

fn app<St: SessionStore>(store: St) -> Router {
    App::new(engine())
        .security_headers(Headers::none())
        .sessions(store, SessionConfig::default())
        .auth(Auth)
        .csrf(Csrf {
            exempt: vec!["/hooks/*"],
            ..Csrf::default()
        })
        .routes(
            Router::new()
                .route("/form", get(|| async { View::page("form.html") }))
                .route("/plain", get(|| async { "plain" }))
                .route(
                    "/login",
                    post(|s: Session, hx: Hx| async move {
                        s.rotate_id();
                        s.insert("uid", "ada").unwrap();
                        see_other(&hx, &LocalPath::parse("/form").unwrap())
                    }),
                )
                .route(
                    "/logout",
                    post(|s: Session, hx: Hx| async move {
                        s.destroy();
                        see_other(&hx, &LocalPath::parse("/form").unwrap())
                    }),
                )
                .route(
                    "/flash",
                    post(|s: Session, hx: Hx| async move {
                        s.flash(ToastKind::Success, "saved");
                        see_other(&hx, &LocalPath::parse("/form").unwrap())
                    }),
                )
                .route("/echo", post(|body: String| async move { body }))
                .route("/hooks/x", post(|| async { "hook" }))
                .route("/me", get(|User(u): User<Name>| async move { u.name }))
                .route(
                    "/maybe",
                    get(|MaybeUser(u): MaybeUser<Name>| async move {
                        u.map_or("anon".into(), |u| u.name)
                    }),
                )
                .route(
                    "/facts",
                    get(|Extension(f): Extension<Facts>| async move {
                        format!("{}", f.csrf.is_some())
                    }),
                )
                .route(
                    "/go",
                    get(|hx: Hx, Query(q): Query<Next>| async move {
                        match LocalPath::parse(q.next.as_deref().unwrap_or("/")) {
                            Ok(to) => see_other(&hx, &to),
                            Err(_) => StatusCode::BAD_REQUEST.into_response(),
                        }
                    }),
                ),
        )
        .into_router()
}

async fn send(app: &Router, req: Request<Body>) -> Response {
    app.clone().oneshot(req).await.unwrap()
}

async fn body(r: Response) -> String {
    String::from_utf8(to_bytes(r.into_body(), 1 << 20).await.unwrap().to_vec()).unwrap()
}

const NAME: &str = "__Host-cv-session";

fn set_cookie(r: &Response) -> Option<String> {
    r.headers()
        .get(header::SET_COOKIE)
        .map(|v| v.to_str().unwrap().to_owned())
}

fn cookie_value(r: &Response) -> String {
    let c = set_cookie(r).expect("Set-Cookie");
    c.split(';')
        .next()
        .unwrap()
        .split_once('=')
        .unwrap()
        .1
        .to_owned()
}

fn get_req(path: &str, cookie: Option<&str>) -> Request<Body> {
    let mut b = Request::get(path);
    if let Some(c) = cookie {
        b = b.header(header::COOKIE, format!("{NAME}={c}"));
    }
    b.body(Body::empty()).unwrap()
}

fn post_req(path: &str, cookie: Option<&str>, token: Option<&str>) -> Request<Body> {
    let mut b = Request::post(path);
    if let Some(c) = cookie {
        b = b.header(header::COOKIE, format!("{NAME}={c}"));
    }
    if let Some(t) = token {
        b = b.header("x-csrf-token", t);
    }
    b.body(Body::empty()).unwrap()
}

fn token_of(html: &str) -> String {
    html.split("<i>")
        .nth(1)
        .unwrap()
        .split("</i>")
        .next()
        .unwrap()
        .to_owned()
}

/// A fresh session: (cookie value, CSRF token).
async fn start(app: &Router) -> (String, String) {
    let r = send(app, get_req("/form", None)).await;
    let c = cookie_value(&r);
    (c, token_of(&body(r).await))
}

#[tokio::test]
async fn cookie_flags_and_lazy_creation() {
    let app = app(MemoryStore::new());
    let r = send(&app, get_req("/plain", None)).await;
    assert!(
        set_cookie(&r).is_none(),
        "no session for a non-page response"
    );

    let r = send(&app, get_req("/form", None)).await;
    let c = set_cookie(&r).unwrap();
    assert!(c.starts_with(&format!("{NAME}=")), "{c}");
    for flag in ["HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age="] {
        assert!(c.contains(flag), "{flag} missing in {c}");
    }
    assert!(!c.contains("Domain"), "__Host- forbids Domain: {c}");
    assert_eq!(r.headers()[header::CACHE_CONTROL], "private");
    let tok = token_of(&body(r).await);
    assert!(tok.len() >= 43, "token {tok:?}");
}

#[tokio::test]
async fn insecure_dev_cookie_drops_host_prefix() {
    let app = App::new(engine())
        .sessions(
            MemoryStore::new(),
            SessionConfig {
                secure: false,
                ..SessionConfig::default()
            },
        )
        .routes(Router::new().route("/form", get(|| async { View::page("form.html") })))
        .into_router();
    let c = set_cookie(&send(&app, get_req("/form", None)).await).unwrap();
    assert!(c.starts_with("cv-session=") && !c.contains("Secure"), "{c}");
}

async fn fixation<St: SessionStore>(store: St) {
    let app = app(store);
    // An id the attacker made up is never adopted.
    let planted = "A".repeat(43);
    let r = send(&app, get_req("/form", Some(&planted))).await;
    assert_ne!(cookie_value(&r), planted);

    // Login rotates the id and the CSRF token; the old id is dead.
    let (before, tok) = start(&app).await;
    let r = send(&app, post_req("/login", Some(&before), Some(&tok))).await;
    assert_eq!(r.status(), StatusCode::SEE_OTHER);
    let after = cookie_value(&r);
    assert_ne!(after, before);
    let r = send(&app, get_req("/me", Some(&after))).await;
    assert_eq!(body(r).await, "ada");
    let r = send(&app, get_req("/form", Some(&after))).await;
    assert_ne!(token_of(&body(r).await), tok, "CSRF token rotates on login");
    let r = send(&app, get_req("/me", Some(&before))).await;
    assert_eq!(
        r.status(),
        StatusCode::SEE_OTHER,
        "old id must not be logged in"
    );
}

#[tokio::test]
async fn session_fixation_memory() {
    fixation(MemoryStore::new()).await;
}

#[tokio::test]
async fn session_fixation_old_id_dead_in_server_store() {
    // Stateless cookies cannot revoke the old value; the server store must.
    let store = MemoryStore::new();
    let app = app(store.clone());
    let (before, tok) = start(&app).await;
    let _ = send(&app, post_req("/login", Some(&before), Some(&tok))).await;
    let id = cascivo_server::SessionId::parse(&before).unwrap();
    assert!(store.load(&id).await.unwrap().is_none());
}

#[tokio::test]
async fn session_fixation_cookie_store() {
    fixation(CookieStore::new(&[&[7u8; 32]]).unwrap()).await;
}

#[tokio::test]
async fn logout_deletes_the_record_and_expires_the_cookie() {
    let store = MemoryStore::new();
    let app = app(store.clone());
    let (c, tok) = start(&app).await;
    let r = send(&app, post_req("/login", Some(&c), Some(&tok))).await;
    let c = cookie_value(&r);
    let r = send(&app, get_req("/form", Some(&c))).await;
    let tok = token_of(&body(r).await);
    let r = send(&app, post_req("/logout", Some(&c), Some(&tok))).await;
    assert!(set_cookie(&r).unwrap().contains("Max-Age=0"));
    let id = cascivo_server::SessionId::parse(&c).unwrap();
    assert!(store.load(&id).await.unwrap().is_none());
    let r = send(&app, get_req("/maybe", Some(&c))).await;
    assert_eq!(body(r).await, "anon");
}

#[tokio::test]
async fn csrf_token_required_on_unsafe_methods() {
    let app = app(MemoryStore::new());
    let (c, tok) = start(&app).await;
    let st = |r: Response| r.status();
    assert_eq!(
        st(send(&app, post_req("/echo", None, None)).await),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        st(send(&app, post_req("/echo", None, Some(&tok))).await),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        st(send(&app, post_req("/echo", Some(&c), None)).await),
        StatusCode::FORBIDDEN
    );
    let wrong = format!("{}x", &tok[..tok.len() - 1]);
    assert_eq!(
        st(send(&app, post_req("/echo", Some(&c), Some(&wrong))).await),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        st(send(&app, post_req("/echo", Some(&c), Some(""))).await),
        StatusCode::FORBIDDEN
    );
    // Another session's token is not this session's.
    let (_, other) = start(&app).await;
    assert_eq!(
        st(send(&app, post_req("/echo", Some(&c), Some(&other))).await),
        StatusCode::FORBIDDEN
    );
    for m in ["PUT", "PATCH", "DELETE"] {
        let r = Request::builder()
            .method(m)
            .uri("/echo")
            .header(header::COOKIE, format!("{NAME}={c}"))
            .body(Body::empty())
            .unwrap();
        assert_eq!(st(send(&app, r).await), StatusCode::FORBIDDEN, "{m}");
    }
    assert_eq!(
        st(send(&app, post_req("/echo", Some(&c), Some(&tok))).await),
        StatusCode::OK
    );
    // Safe methods and exempt routes pass.
    assert_eq!(
        st(send(&app, get_req("/plain", None)).await),
        StatusCode::OK
    );
    assert_eq!(
        st(send(&app, post_req("/hooks/x", None, None)).await),
        StatusCode::OK
    );
}

#[tokio::test]
async fn csrf_form_field_keeps_the_body() {
    let app = app(MemoryStore::new());
    let (c, tok) = start(&app).await;
    let form = format!("title=a+b&csrf={tok}");
    let r = Request::post("/echo")
        .header(header::COOKIE, format!("{NAME}={c}"))
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from(form.clone()))
        .unwrap();
    let r = send(&app, r).await;
    assert_eq!(r.status(), StatusCode::OK);
    assert_eq!(body(r).await, form);

    let r = Request::post("/echo")
        .header(header::COOKIE, format!("{NAME}={c}"))
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from("csrf=nope"))
        .unwrap();
    assert_eq!(send(&app, r).await.status(), StatusCode::FORBIDDEN);

    // A token in a non-form body (JSON, text) does not count.
    let r = Request::post("/echo")
        .header(header::COOKIE, format!("{NAME}={c}"))
        .header(header::CONTENT_TYPE, "text/plain")
        .body(Body::from(format!("csrf={tok}")))
        .unwrap();
    assert_eq!(send(&app, r).await.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn csrf_rejects_cross_origin_even_with_a_token() {
    let app = app(MemoryStore::new());
    let (c, tok) = start(&app).await;
    let with = |k: &'static str, v: &'static str| {
        Request::post("/echo")
            .header(header::HOST, "app.example")
            .header(header::COOKIE, format!("{NAME}={c}"))
            .header("x-csrf-token", tok.clone())
            .header(k, v)
            .body(Body::empty())
            .unwrap()
    };
    for (k, v) in [
        ("sec-fetch-site", "cross-site"),
        ("sec-fetch-site", "same-site"),
        ("sec-fetch-site", "none"),
        ("origin", "https://evil.example"),
        ("origin", "https://app.example.evil.example"),
        ("origin", "null"),
    ] {
        assert_eq!(
            send(&app, with(k, v)).await.status(),
            StatusCode::FORBIDDEN,
            "{k}: {v}"
        );
    }
    for (k, v) in [
        ("sec-fetch-site", "same-origin"),
        ("origin", "https://app.example"),
    ] {
        assert_eq!(
            send(&app, with(k, v)).await.status(),
            StatusCode::OK,
            "{k}: {v}"
        );
    }
}

#[tokio::test]
async fn csrf_origin_check_works_without_sessions() {
    let app = App::new(engine())
        .routes(Router::new().route("/x", post(|| async { "ok" })))
        .into_router();
    let r = Request::post("/x")
        .header("sec-fetch-site", "cross-site")
        .body(Body::empty())
        .unwrap();
    assert_eq!(send(&app, r).await.status(), StatusCode::FORBIDDEN);
    let r = Request::post("/x").body(Body::empty()).unwrap();
    assert_eq!(send(&app, r).await.status(), StatusCode::OK);
}

#[tokio::test]
async fn flash_survives_a_redirect_and_shows_once() {
    let app = app(MemoryStore::new());
    let (c, tok) = start(&app).await;
    let r = send(&app, post_req("/flash", Some(&c), Some(&tok))).await;
    assert_eq!(r.status(), StatusCode::SEE_OTHER);
    // A non-page response does not consume it.
    let _ = send(&app, get_req("/plain", Some(&c))).await;
    let html = body(send(&app, get_req("/form", Some(&c))).await).await;
    assert!(html.contains("<p>success:saved</p>"), "{html}");
    let html = body(send(&app, get_req("/form", Some(&c))).await).await;
    assert!(!html.contains("saved"), "{html}");
}

#[tokio::test]
async fn facts_fill_request_extensions_and_templates() {
    let app = app(MemoryStore::new());
    assert_eq!(
        body(send(&app, get_req("/facts", None)).await).await,
        "false"
    );
    let (c, tok) = start(&app).await;
    assert_eq!(
        body(send(&app, get_req("/facts", Some(&c))).await).await,
        "true"
    );
    let r = send(&app, post_req("/login", Some(&c), Some(&tok))).await;
    let c = cookie_value(&r);
    let html = body(send(&app, get_req("/form", Some(&c))).await).await;
    assert!(html.contains("<u>ada</u>"), "user in templates: {html}");
}

#[tokio::test]
async fn login_redirect_keeps_next_as_a_local_path() {
    let app = app(MemoryStore::new());
    let r = send(&app, get_req("/me?a=1&b=/x", None)).await;
    assert_eq!(r.status(), StatusCode::SEE_OTHER);
    assert_eq!(
        r.headers()[header::LOCATION],
        "/login?next=%2Fme%3Fa%3D1%26b%3D%2Fx"
    );
    let r = Request::get("/me")
        .header("hx-request", "true")
        .body(Body::empty())
        .unwrap();
    let r = send(&app, r).await;
    assert_eq!(r.headers()["hx-redirect"], "/login?next=%2Fme");
}

#[tokio::test]
async fn open_redirects_are_refused() {
    let app = app(MemoryStore::new());
    for bad in [
        "//evil.example",
        "/%2F/evil.example",
        "/%5cevil.example",
        "%2F%2Fevil.example",
        "https://evil.example",
        "/\\evil.example",
        "\\\\evil.example",
        "javascript:alert(1)",
        "/\t/evil.example",
    ] {
        let q = url_encode(bad);
        let r = send(&app, get_req(&format!("/go?next={q}"), None)).await;
        assert_eq!(r.status(), StatusCode::BAD_REQUEST, "{bad}");
    }
    let r = send(&app, get_req("/go?next=%2Ftodos%3Fx%3D1", None)).await;
    assert_eq!(r.headers()[header::LOCATION], "/todos?x=1");
}

fn url_encode(s: &str) -> String {
    s.bytes()
        .map(|b| {
            if b.is_ascii_alphanumeric() {
                (b as char).to_string()
            } else {
                format!("%{b:02X}")
            }
        })
        .collect()
}

#[tokio::test]
async fn cookie_store_rejects_tampering_and_rotates_keys() {
    let old = CookieStore::new(&[&[1u8; 32]]).unwrap();
    let app_old = app(old);
    let (c, tok) = start(&app_old).await;
    let r = send(&app_old, post_req("/login", Some(&c), Some(&tok))).await;
    let c = cookie_value(&r);
    assert_eq!(
        body(send(&app_old, get_req("/me", Some(&c))).await).await,
        "ada"
    );

    // Flip one character: the cookie no longer opens.
    let mut t = c.clone().into_bytes();
    let i = t.len() / 2;
    t[i] = if t[i] == b'A' { b'B' } else { b'A' };
    let t = String::from_utf8(t).unwrap();
    assert_eq!(
        send(&app_old, get_req("/me", Some(&t))).await.status(),
        StatusCode::SEE_OTHER
    );

    // A new key first, the old one still opens existing cookies.
    let rotated = app(CookieStore::new(&[&[2u8; 32], &[1u8; 32]]).unwrap());
    assert_eq!(
        body(send(&rotated, get_req("/me", Some(&c))).await).await,
        "ada"
    );
    // Without the old key the cookie is anonymous.
    let fresh = app(CookieStore::new(&[&[2u8; 32]]).unwrap());
    assert_eq!(
        send(&fresh, get_req("/me", Some(&c))).await.status(),
        StatusCode::SEE_OTHER
    );
    assert!(
        CookieStore::new(&[&[0u8; 8]]).is_err(),
        "short keys are refused"
    );
    assert!(CookieStore::new(&[]).is_err());
}

#[cfg(feature = "password")]
#[test]
fn argon2_hash_and_verify() {
    let h = cascivo_server::hash_password("correct horse").unwrap();
    assert!(h.starts_with("$argon2id$"), "{h}");
    assert!(cascivo_server::verify_password("correct horse", Some(&h)));
    assert!(!cascivo_server::verify_password("wrong", Some(&h)));
    assert!(!cascivo_server::verify_password("x", Some("not a hash")));
    // Unknown user: still does the work, still false.
    assert!(!cascivo_server::verify_password("x", None));
    assert_ne!(
        h,
        cascivo_server::hash_password("correct horse").unwrap(),
        "salted"
    );
}

#[tokio::test]
async fn oauth_state_is_one_shot_and_pkce_s256() {
    use base64::Engine as _;
    use sha2::Digest as _;
    let app = App::new(engine())
        .sessions(MemoryStore::new(), SessionConfig::default())
        .csrf(Csrf {
            exempt: vec!["/cb"],
            ..Csrf::default()
        })
        .routes(
            Router::new()
                .route(
                    "/begin",
                    get(|s: Session| async move {
                        let start = s
                            .oauth_begin("gh", Some(LocalPath::parse("/after").unwrap()))
                            .unwrap();
                        let url = start.authorize_url(
                            "https://idp.example/authorize",
                            "client id",
                            "https://app.example/cb",
                            "read:user",
                        );
                        View::page("form.html").ctx(()).trigger(
                            "x",
                            serde_json::json!({
                                "state": start.state, "challenge": start.code_challenge, "url": url
                            }),
                        )
                    }),
                )
                .route(
                    "/cb",
                    get(
                        |s: Session, Query(q): Query<BTreeMap<String, String>>| async move {
                            match s.oauth_callback("gh", q.get("state").map_or("", String::as_str))
                            {
                                Some(cb) => format!("{}|{}", cb.code_verifier, cb.next.unwrap()),
                                None => "bad".into(),
                            }
                        },
                    ),
                ),
        )
        .into_router();
    let begin = |c: Option<String>| {
        let app = app.clone();
        async move {
            let r = send(&app, get_req("/begin", c.as_deref())).await;
            let c = c.unwrap_or_else(|| cookie_value(&r));
            let t: serde_json::Value =
                serde_json::from_str(r.headers()["hx-trigger"].to_str().unwrap()).unwrap();
            (c, t["x"].clone())
        }
    };
    let (c, x) = begin(None).await;
    let url = x["url"].as_str().unwrap();
    assert!(url.starts_with("https://idp.example/authorize?response_type=code&client_id=client%20id&redirect_uri=https%3A%2F%2Fapp.example%2Fcb&scope=read%3Auser&state="), "{url}");
    assert!(url.contains("&code_challenge_method=S256"), "{url}");
    let state = x["state"].as_str().unwrap();
    let ok = body(send(&app, get_req(&format!("/cb?state={state}"), Some(&c))).await).await;
    let (verifier, next) = ok.split_once('|').unwrap();
    assert_eq!(next, "/after");
    let want = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .encode(sha2::Sha256::digest(verifier.as_bytes()));
    assert_eq!(x["challenge"].as_str().unwrap(), want);
    let again = body(send(&app, get_req(&format!("/cb?state={state}"), Some(&c))).await).await;
    assert_eq!(again, "bad", "state is one-shot");

    // A forged state burns the flow: the real one fails afterwards too.
    let (c, x) = begin(Some(c)).await;
    let bad = body(send(&app, get_req("/cb?state=forged", Some(&c))).await).await;
    assert_eq!(bad, "bad");
    let state = x["state"].as_str().unwrap();
    let late = body(send(&app, get_req(&format!("/cb?state={state}"), Some(&c))).await).await;
    assert_eq!(late, "bad");
}

#[cfg(feature = "sqlite")]
#[tokio::test]
async fn sqlite_store_roundtrip_and_fixation() {
    // One connection: every `sqlite::memory:` connection is its own database.
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();
    let store = cascivo_server::SqliteStore::new(pool);
    store.migrate().await.unwrap();
    fixation(store.clone()).await;
    let id = cascivo_server::SessionId::generate().unwrap();
    let rec = cascivo_server::Record::new(1).unwrap();
    store
        .save(&id, &rec, std::time::Duration::from_secs(60))
        .await
        .unwrap();
    assert_eq!(store.load(&id).await.unwrap(), Some(rec));
    store.delete(&id).await.unwrap();
    assert_eq!(store.load(&id).await.unwrap(), None);
}
