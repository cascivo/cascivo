//! HTTP-level behaviour of `App` through `tower::ServiceExt::oneshot`.

use std::collections::BTreeMap;

use axum::Router;
use axum::body::Body;
use axum::extract::Extension;
use axum::http::{HeaderMap, Request, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use cascivo_server::{
    App, Facts, Headers, Hx, LocalPath, Nonce, ToastKind, View, check_fragment, see_other,
};
use cascivo_web::{Bundle, Config, Engine, Flash, ReqCtx};
use serde::Serialize;
use tower::ServiceExt;

const LAYOUT: &str = r#"<!doctype html><html><head>{{ theme_script() }}</head><body><main>{% block main %}{% endblock %}</main><div id="cv-toaster">{% block toaster %}{% for f in flash %}<p data-kind="{{ f.kind }}">{{ f.message }}</p>{% endfor %}{% endblock %}</div>{{ islands_script() }}</body></html>"#;
const TODOS: &str = r#"{% extends "base.html" %}{% block main %}<h1>Todos</h1><span id="count">{% block count %}{{ todos|length }}{% endblock %}</span><ul id="todos">{% block todos %}{% for t in todos %}<li>{{ t }}</li>{% endfor %}{% endblock %}</ul>{% endblock %}"#;

fn engine() -> Engine {
    let templates = BTreeMap::from([
        ("base.html".to_string(), LAYOUT.to_string()),
        ("todos.html".to_string(), TODOS.to_string()),
        (
            "who.html".to_string(),
            "{{ request.path }}|{{ request.locale }}|{{ user.name }}|{{ request.nonce|length }}"
                .to_string(),
        ),
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

#[derive(Serialize)]
struct Todos {
    todos: Vec<&'static str>,
}

fn todos() -> View {
    View::page("todos.html")
        .ctx(Todos {
            todos: vec!["a", "<b>"],
        })
        .fragment("todos")
}

fn app() -> Router {
    App::new(engine())
        .routes(
            Router::new()
                .route("/todos", get(|| async { todos() }))
                .route(
                    "/todos/new",
                    post(|| async {
                        todos()
                            .oob(
                                "todos.html",
                                "count",
                                Todos {
                                    todos: vec!["a", "<b>"],
                                },
                            )
                            .toast(ToastKind::Success, "todo.saved")
                            .trigger("todo-added", serde_json::json!({ "id": 3 }))
                            .status(StatusCode::CREATED)
                    }),
                )
                .route(
                    "/done",
                    post(|hx: Hx| async move {
                        see_other(&hx, &LocalPath::parse("/todos?x=1").unwrap())
                    }),
                )
                .route(
                    "/nonce",
                    get(|Extension(n): Extension<Nonce>| async move { n.as_str().to_owned() }),
                )
                .route(
                    "/own-csp",
                    get(|| async {
                        (
                            [(header::CONTENT_SECURITY_POLICY, "default-src 'none'")],
                            "x",
                        )
                    }),
                )
                .route(
                    "/who",
                    get(|| async {
                        let facts = Facts {
                            locale: String::new(),
                            user: Some(minijinja::context! { name => "Ann" }),
                            ..Facts::default()
                        };
                        (Extension(facts), View::page("who.html"))
                    }),
                )
                .route("/broken", get(|| async { View::page("missing.html") })),
        )
        .toaster("base.html", "toaster")
        .into_router()
}

async fn send(req: Request<Body>) -> (StatusCode, HeaderMap, String) {
    send_to(app(), req).await
}

async fn send_to(app: Router, req: Request<Body>) -> (StatusCode, HeaderMap, String) {
    let res: Response = app.oneshot(req).await.unwrap();
    let (parts, body) = res.into_parts();
    let bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();
    (
        parts.status,
        parts.headers,
        String::from_utf8(bytes.to_vec()).unwrap(),
    )
}

fn get_req(uri: &str) -> Request<Body> {
    Request::get(uri).body(Body::empty()).unwrap()
}

fn hx(method: &str, uri: &str) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(uri)
        .header("HX-Request", "true")
        .header("HX-Target", "base.html")
        .body(Body::empty())
        .unwrap()
}

fn nonce_of(headers: &HeaderMap) -> String {
    let csp = headers[header::CONTENT_SECURITY_POLICY].to_str().unwrap();
    let start = csp.find("'nonce-").unwrap() + "'nonce-".len();
    csp[start..].split('\'').next().unwrap().to_owned()
}

#[tokio::test]
async fn plain_request_gets_the_full_page() {
    let (status, headers, body) = send(get_req("/todos")).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.starts_with("<!doctype html>"), "{body}");
    assert!(body.contains("<ul id=\"todos\"><li>a</li><li>&lt;b&gt;</li></ul>"));
    assert_eq!(headers[header::CONTENT_TYPE], "text/html; charset=utf-8");
    assert_eq!(headers[header::VARY], "HX-Request");
}

#[tokio::test]
async fn htmx_request_gets_the_fragment_and_ignores_hx_target() {
    let (status, _, body) = send(hx("GET", "/todos")).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, "<li>a</li><li>&lt;b&gt;</li>");
}

#[tokio::test]
async fn boosted_and_history_restore_requests_get_the_full_page() {
    for extra in ["HX-Boosted", "HX-History-Restore-Request"] {
        let req = Request::get("/todos")
            .header("HX-Request", "true")
            .header(extra, "true")
            .body(Body::empty())
            .unwrap();
        let (_, _, body) = send(req).await;
        assert!(body.starts_with("<!doctype html>"), "{extra}: {body}");
    }
}

#[tokio::test]
async fn fragment_equals_the_page_subtree() {
    // Checkpoint β, over HTTP: the same handler, with and without `HX-Request`.
    let (_, _, page) = send(get_req("/todos")).await;
    let (_, _, frag) = send(hx("GET", "/todos")).await;
    assert!(
        page.contains(&format!("id=\"todos\">{frag}</ul>")),
        "{page}"
    );
    // And through the helper starter views use.
    let ctx = minijinja::Value::from(minijinja::value::Serde(Todos {
        todos: vec!["a", "<b>"],
    }));
    for block in ["todos", "count"] {
        check_fragment(&engine(), "todos.html", block, &ctx, &ReqCtx::default()).unwrap();
    }
    let err =
        check_fragment(&engine(), "todos.html", "main", &ctx, &ReqCtx::default()).unwrap_err();
    assert!(err.contains("id=\"main\""), "{err}");
}

#[tokio::test]
async fn htmx_post_adds_oob_swaps_toasts_triggers_and_status() {
    let (status, headers, body) = send(hx("POST", "/todos/new")).await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(
        body,
        "<li>a</li><li>&lt;b&gt;</li>\
         <div hx-swap-oob=\"innerHTML:#count\">2</div>\
         <div hx-swap-oob=\"beforeend:#cv-toaster\"><p data-kind=\"success\">todo.saved</p></div>"
    );
    let trigger: serde_json::Value =
        serde_json::from_str(headers["HX-Trigger"].to_str().unwrap()).unwrap();
    assert_eq!(trigger, serde_json::json!({ "todo-added": { "id": 3 } }));
}

#[tokio::test]
async fn plain_post_renders_toasts_in_the_page_without_oob() {
    let (status, headers, body) =
        send(Request::post("/todos/new").body(Body::empty()).unwrap()).await;
    assert_eq!(status, StatusCode::CREATED);
    assert!(!body.contains("hx-swap-oob"), "{body}");
    assert!(body.contains("<div id=\"cv-toaster\"><p data-kind=\"success\">todo.saved</p></div>"));
    assert!(headers.contains_key("HX-Trigger"));
}

#[tokio::test]
async fn toasts_without_a_toaster_become_a_cv_toast_trigger() {
    let app = App::new(engine())
        .routes(Router::new().route(
            "/t",
            post(|| async { todos().toast(ToastKind::Danger, "todo.failed") }),
        ))
        .into_router();
    let (_, headers, body) = send_to(app, hx("POST", "/t")).await;
    assert!(!body.contains("hx-swap-oob"), "{body}");
    let trigger: serde_json::Value =
        serde_json::from_str(headers["HX-Trigger"].to_str().unwrap()).unwrap();
    assert_eq!(
        trigger,
        serde_json::json!({ "cv-toast": [{ "kind": "danger", "message": "todo.failed" }] })
    );
}

#[tokio::test]
async fn see_other_is_303_or_hx_location() {
    let (status, headers, _) = send(Request::post("/done").body(Body::empty()).unwrap()).await;
    assert_eq!(status, StatusCode::SEE_OTHER);
    assert_eq!(headers[header::LOCATION], "/todos?x=1");
    assert_eq!(headers[header::VARY], "HX-Request");
    let (status, headers, _) = send(hx("POST", "/done")).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers["HX-Location"], "/todos?x=1");
    assert!(!headers.contains_key(header::LOCATION));
}

#[tokio::test]
async fn security_headers_and_a_fresh_nonce_per_request() {
    let (_, h1, page) = send(get_req("/todos")).await;
    let (_, h2, _) = send(get_req("/todos")).await;
    let (n1, n2) = (nonce_of(&h1), nonce_of(&h2));
    assert_ne!(n1, n2);
    assert_eq!(n1.len(), 32);
    let csp = h1[header::CONTENT_SECURITY_POLICY].to_str().unwrap();
    for part in [
        "'strict-dynamic'",
        "object-src 'none'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
    ] {
        assert!(csp.contains(part), "{csp}");
    }
    assert!(
        !csp.contains("unsafe-eval") && !csp.contains("unsafe-inline"),
        "{csp}"
    );
    // Both cascivo-web scripts carry the nonce the header announced.
    assert_eq!(
        page.matches(&format!("<script nonce=\"{n1}\"")).count(),
        2,
        "{page}"
    );
    assert_eq!(h1[header::X_CONTENT_TYPE_OPTIONS], "nosniff");
    assert_eq!(h1[header::X_FRAME_OPTIONS], "DENY");
    assert!(h1.contains_key(header::STRICT_TRANSPORT_SECURITY));
    assert!(h1.contains_key(header::REFERRER_POLICY));
    assert!(h1.contains_key("permissions-policy"));
    // Non-view responses (and 404s) get them too; the handler sees the same nonce.
    let (_, h, body) = send(get_req("/nonce")).await;
    assert_eq!(body, nonce_of(&h));
    let (status, h, _) = send(get_req("/nope")).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert!(h.contains_key(header::CONTENT_SECURITY_POLICY));
}

#[tokio::test]
async fn handler_headers_win_and_headers_are_configurable() {
    let (_, h, _) = send(get_req("/own-csp")).await;
    assert_eq!(h[header::CONTENT_SECURITY_POLICY], "default-src 'none'");
    let app = App::new(engine())
        .security_headers(Headers {
            hsts: None,
            csp: Some("script-src 'nonce-{nonce}'".into()),
            ..Headers::default()
        })
        .routes(Router::new().route("/todos", get(|| async { todos() })))
        .into_router();
    let (_, h, _) = send_to(app, get_req("/todos")).await;
    assert!(!h.contains_key(header::STRICT_TRANSPORT_SECURITY));
    let csp = h[header::CONTENT_SECURITY_POLICY].to_str().unwrap();
    assert_eq!(csp, format!("script-src 'nonce-{}'", nonce_of(&h)));
}

#[tokio::test]
async fn facts_reach_the_template() {
    let (_, _, body) = send(get_req("/who")).await;
    assert_eq!(body, "&#x2f;who||Ann|32");
}

#[tokio::test]
async fn render_errors_are_a_bare_500() {
    let (status, h, body) = send(get_req("/broken")).await;
    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(body, "Internal Server Error");
    assert!(h.contains_key(header::CONTENT_SECURITY_POLICY));
}

#[tokio::test]
async fn a_view_outside_an_app_is_a_500() {
    let res = View::page("todos.html").into_response();
    assert_eq!(res.status(), StatusCode::INTERNAL_SERVER_ERROR);
}

#[tokio::test]
async fn state_and_stateless_routes_merge() {
    #[derive(Clone)]
    struct S(&'static str);
    let app = App::new(engine())
        .routes(Router::new().route("/a", get(|| async { "a" })))
        .with_state(S("b"))
        .routes(Router::new().route(
            "/b",
            get(|axum::extract::State(s): axum::extract::State<S>| async move { s.0 }),
        ))
        .into_router();
    assert_eq!(send_to(app.clone(), get_req("/a")).await.2, "a");
    assert_eq!(send_to(app, get_req("/b")).await.2, "b");
}

#[test]
fn flash_type_is_shared_with_the_engine() {
    let f: Flash = Flash {
        kind: ToastKind::Info.as_str().into(),
        message: "m".into(),
    };
    assert_eq!(f.kind, "info");
}
