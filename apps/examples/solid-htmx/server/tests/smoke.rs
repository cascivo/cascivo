//! Smoke test for the solid-htmx example (runs in the Rust CI job, so the JS job stays Rust-free):
//! page, htmx fragment route, island assets and the markup contract.

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use solid_htmx_server::router;
use tower::ServiceExt;

fn app() -> axum::Router {
    let assets = std::env::temp_dir().join("solid-htmx-smoke");
    std::fs::create_dir_all(&assets).unwrap();
    std::fs::write(assets.join("island.js"), "console.log(1)").unwrap();
    router(&assets)
}

async fn call(req: Request<Body>) -> (StatusCode, axum::http::HeaderMap, String) {
    send(app(), req).await
}

async fn send(
    app: axum::Router,
    req: Request<Body>,
) -> (StatusCode, axum::http::HeaderMap, String) {
    let res = app.oneshot(req).await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    let body = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (status, headers, String::from_utf8(body.to_vec()).unwrap())
}

fn get(path: &str) -> Request<Body> {
    Request::get(path).body(Body::empty()).unwrap()
}

/// A same-origin htmx POST carrying the session cookie and the CSRF token the page handed out
/// (`hx-headers` on `<body>`).
async fn htmx_post(app: &axum::Router, path: &str) -> Request<Body> {
    let (_, headers, page) = send(app.clone(), get("/")).await;
    let cookie = headers[header::SET_COOKIE].to_str().unwrap();
    let cookie = cookie.split(';').next().unwrap().to_owned();
    let token = page
        .split("X-CSRF-Token\":\"")
        .nth(1)
        .and_then(|t| t.split('"').next())
        .expect("the page carries a CSRF token");
    Request::post(path)
        .header("hx-request", "true")
        .header("sec-fetch-site", "same-origin")
        .header(header::COOKIE, cookie)
        .header("x-csrf-token", token)
        .body(Body::empty())
        .unwrap()
}

/// Every `cv-*` class in the markup must exist in `@cascivo/css`'s contract (element tags and
/// ids such as `cv-toaster` are not classes).
fn assert_contract(html: &str) {
    let contract = include_str!("../../../../../packages/css/contract.json");
    for class in html
        .split("class=\"")
        .skip(1)
        .filter_map(|rest| rest.split('"').next())
        .flat_map(str::split_whitespace)
        .filter(|t| t.starts_with("cv-"))
    {
        assert!(
            contract.contains(&format!("\"{class}\"")),
            "{class} is not in contract.json"
        );
    }
}

#[tokio::test]
async fn page_has_island_mount_assets_and_strict_csp() {
    let (status, headers, body) = call(get("/")).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.contains(r#"id="save-bar""#) && body.contains("/assets/island.js"));
    assert!(body.contains("cv-card-card") && body.contains("2 notes"));
    // htmx's injected indicator <style> has no nonce: it must stay off under a strict CSP.
    assert!(body.contains(r#""includeIndicatorStyles":false"#));
    // Tokens come from the shipped theme (`light`/`dark`), not the poster pair.
    assert!(!body.contains("poster"));
    assert_contract(&body);
    let csp = headers[header::CONTENT_SECURITY_POLICY].to_str().unwrap();
    let nonce = csp
        .split("'nonce-")
        .nth(1)
        .unwrap()
        .split('\'')
        .next()
        .unwrap();
    assert!(
        body.contains(&format!(r#"nonce="{nonce}""#)),
        "script carries the CSP nonce"
    );
}

#[tokio::test]
async fn htmx_post_returns_only_the_fragment() {
    let app = app();
    let req = htmx_post(&app, "/notes").await;
    let (status, _, body) = send(app, req).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.contains("3 notes"), "{body}");
    assert!(
        !body.contains("<html") && !body.contains("<main"),
        "fragment, not a page"
    );
    assert_contract(&body);
}

#[tokio::test]
async fn serves_only_the_built_files() {
    assert_eq!(call(get("/assets/island.js")).await.0, StatusCode::OK);
    std::fs::write(std::env::temp_dir().join("solid-htmx-smoke/htmx.js"), "1").unwrap();
    assert_eq!(call(get("/assets/htmx.js")).await.0, StatusCode::OK);
    assert_eq!(
        call(get("/assets/island.css")).await.0,
        StatusCode::NOT_FOUND
    );
    assert_eq!(
        call(get("/assets/secret.txt")).await.0,
        StatusCode::NOT_FOUND
    );
}

#[tokio::test]
async fn an_htmx_post_without_the_csrf_token_is_refused() {
    let req = Request::post("/notes")
        .header("hx-request", "true")
        .header("sec-fetch-site", "same-origin")
        .body(Body::empty())
        .unwrap();
    assert_eq!(call(req).await.0, StatusCode::FORBIDDEN);
}

/// The fixture pages of the conformance harness (`scripts/checks/dynamic`) use only classes the
/// contract has, and each answers 200.
#[tokio::test]
async fn fixture_pages_render_and_stay_on_the_contract() {
    for path in [
        "/c/form",
        "/c/dialog",
        "/c/toast",
        "/c/island",
        "/c/sse",
        "/c/tabs",
    ] {
        let (status, _, body) = call(get(path)).await;
        assert_eq!(status, StatusCode::OK, "{path}");
        assert_contract(&body);
    }
}
