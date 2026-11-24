# cascivo-worker

Cloudflare Workers adapter for `cascivo-server` (Phase 3, workstream F). Unreleased
(`publish = false`).

```rust
static ROUTER: std::sync::OnceLock<axum::Router> = std::sync::OnceLock::new();

#[worker::event(fetch)]
async fn fetch(req: worker::HttpRequest, env: worker::Env, _: worker::Context)
    -> worker::Result<axum::http::Response<axum::body::Body>> {
    let router = ROUTER.get_or_init(|| {
        App::new(engine())
            .sessions(cascivo_worker::KvStore::new(&env, "SESSIONS").unwrap(), SessionConfig::default())
            .routes(routes())
            .into_router()
    });
    cascivo_worker::serve_router(req, env, router).await
}

#[worker::send] // binding futures are `!Send`; Workers is single-threaded
async fn list(cascivo_worker::D1(db): cascivo_worker::D1) -> Result<String, AppError> { … }
```

- `serve` / `serve_router` / `serve_with(Bindings)`: run the router, `worker::Env` in the
  request extensions.
- `KvStore` (`kv`): `SessionStore` on KV. Key = `SessionId::storage_key()` (sha256 hex), value =
  JSON `Record`, `expirationTtl` = session TTL (KV minimum 60 s).
- `Env`, `D1` (`d1`, binding `DB`), `R2` (`r2`, binding `BUCKET`) extractors; 500 when missing.
- `R2::upload(&Upload, content_type, bytes)`: size and type allowlist, server-generated key,
  `Content-Disposition: attachment`.

Build: `cargo build -p cascivo-worker --target wasm32-unknown-unknown`. Example and
measurements: `apps/bench/workers-spike`, `docs/plans/phase-3-x1-results.md`.
