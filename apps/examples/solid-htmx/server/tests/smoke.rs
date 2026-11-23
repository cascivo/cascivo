//! Smoke test for the solid-htmx example (runs in the Rust CI job, so the JS job stays Rust-free):
//! page, htmx fragment route, island assets and the markup contract.

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use solid_htmx_server::router;
use tower::ServiceExt;

async fn call(req: Request<Body>) -> (StatusCode, axum::http::HeaderMap, String) {
    let assets = std::env::temp_dir().join("solid-htmx-smoke");
    std::fs::create_dir_all(&assets).unwrap();
    std::fs::write(assets.join("island.js"), "console.log(1)").unwrap();
    let res = router(&assets).oneshot(req).await.unwrap();
    let (status, headers) = (res.status(), res.headers().clone());
    let body = axum::body::to_bytes(res.into_body(), 1 << 20)
        .await
        .unwrap();
    (status, headers, String::from_utf8(body.to_vec()).unwrap())
}

fn get(path: &str) -> Request<Body> {
    Request::get(path).body(Body::empty()).unwrap()
}

fn htmx_post(path: &str) -> Request<Body> {
    Request::post(path)
        .header("hx-request", "true")
        .header("sec-fetch-site", "same-origin")
        .body(Body::empty())
        .unwrap()
}

/// Every `cv-*` class in the markup must exist in `@cascivo/css`'s contract.
fn assert_contract(html: &str) {
    let contract = include_str!("../../../../../packages/css/contract.json");
    for class in html
        .split(|c: char| c == '"' || c.is_whitespace())
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
    let (status, _, body) = call(htmx_post("/notes")).await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.contains("3 notes"), "{body}");
    assert!(
        !body.contains("<html") && !body.contains("<main"),
        "fragment, not a page"
    );
    assert_contract(&body);
}

#[tokio::test]
async fn serves_only_the_island_files() {
    assert_eq!(call(get("/assets/island.js")).await.0, StatusCode::OK);
    assert_eq!(
        call(get("/assets/island.css")).await.0,
        StatusCode::NOT_FOUND
    );
    assert_eq!(
        call(get("/assets/secret.txt")).await.0,
        StatusCode::NOT_FOUND
    );
}
