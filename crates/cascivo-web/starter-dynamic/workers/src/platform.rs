//! Workers: the clock the SSE demo sleeps on. `Delay` is `!Send`; Workers run one thread, and
//! axum's body needs `Send`.

pub async fn sleep(d: std::time::Duration) {
    worker::send::SendFuture::new(worker::Delay::from(d)).await;
}
