//! `cargo run`: http://127.0.0.1:3000. `ADDR` and `ASSETS_DIR` (the Vite output, `web/dist`)
//! override the defaults; release builds need `APP_SECRET`.

use axum::extract::Path;
use axum::http::{HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;

/// Serves only files the Vite build emits: a flat `.js`/`.css` name, never a request path.
async fn asset(dir: std::sync::Arc<std::path::PathBuf>, name: &str) -> Response {
    let safe = !name.starts_with('.')
        && name
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'));
    let ctype = match name.rsplit_once('.') {
        Some((_, "js")) if safe => "text/javascript; charset=utf-8",
        Some((_, "css")) if safe => "text/css; charset=utf-8",
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    match tokio::fs::read(dir.join("assets").join(name)).await {
        Ok(body) => (
            [(header::CONTENT_TYPE, HeaderValue::from_static(ctype))],
            body,
        )
            .into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

#[tokio::main]
async fn main() {
    let secret = __NAME_SNAKE__::secret(std::env::var("APP_SECRET").ok()).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });
    let dir = std::sync::Arc::new(std::path::PathBuf::from(
        std::env::var("ASSETS_DIR").unwrap_or_else(|_| "web/dist".into()),
    ));
    let app = __NAME_SNAKE__::router(&secret)
        .unwrap_or_else(|e| {
            eprintln!("{e}");
            std::process::exit(1);
        })
        .route(
            "/assets/{name}",
            get(move |Path(name): Path<String>| {
                let dir = dir.clone();
                async move { asset(dir, &name).await }
            }),
        );
    let addr = std::env::var("ADDR").unwrap_or_else(|_| "127.0.0.1:3000".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    println!("http://{addr}");
    axum::serve(listener, app).await.expect("serve");
}
