//! Native (tokio): the clock the SSE demo sleeps on.

pub async fn sleep(d: std::time::Duration) {
    tokio::time::sleep(d).await;
}
