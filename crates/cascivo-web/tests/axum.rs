#![cfg(all(feature = "fs", feature = "axum"))]

use std::path::Path;

use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode};
use tower::ServiceExt;

#[tokio::test]
async fn router_serves_rendered_site() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/mini");
    let site = cascivo_web::Site::load(&root).unwrap();
    let app = cascivo_web::router(&site).unwrap();

    let res = app
        .clone()
        .oneshot(Request::get("/blog/second/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(res.headers()["content-type"], "text/html; charset=utf-8");
    let body = to_bytes(res.into_body(), usize::MAX).await.unwrap();
    assert!(String::from_utf8_lossy(&body).contains("Second body."));

    let res = app
        .oneshot(Request::get("/missing/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}
