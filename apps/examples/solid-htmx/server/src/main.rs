#[tokio::main]
async fn main() {
    let assets =
        std::env::var("ASSETS_DIR").unwrap_or_else(|_| "apps/examples/solid-htmx/dist".into());
    let addr = std::env::var("ADDR").unwrap_or_else(|_| "127.0.0.1:3000".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    println!("http://{addr}");
    axum::serve(listener, solid_htmx_server::router(assets))
        .await
        .expect("serve");
}
