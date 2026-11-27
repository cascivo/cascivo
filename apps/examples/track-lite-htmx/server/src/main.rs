use std::time::Duration;

#[tokio::main]
async fn main() {
    let assets =
        std::env::var("ASSETS_DIR").unwrap_or_else(|_| "apps/examples/track-lite-htmx/dist".into());
    let addr = std::env::var("ADDR").unwrap_or_else(|_| "127.0.0.1:3001".into());
    // TEAMMATE_MS=0 turns the simulated teammate off (deterministic benchmarks).
    let every = std::env::var("TEAMMATE_MS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(6000u64);
    let (router, tracker) = track_lite_htmx_server::app(assets);
    if every > 0 {
        tracker.spawn_teammate(Duration::from_millis(every));
    }
    let listener = tokio::net::TcpListener::bind(&addr).await.expect("bind");
    println!("http://{addr}");
    axum::serve(listener, router).await.expect("serve");
}
