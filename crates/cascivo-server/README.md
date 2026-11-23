# cascivo-server

axum layer for dynamic [cascivo](https://github.com/cascivo/cascivo) apps: HTML first, htmx
for partial updates. Unpublished (`publish = false`); the API may change.

```rust
use axum::{Router, routing::get};
use cascivo_server::{App, View};

let engine = cascivo_web::Engine::from_bundle(include_bytes!("../app.bundle"))?;
let app = App::new(engine)
    .toaster("base.html", "toaster")
    .routes(Router::new().route("/todos", get(|| async {
        View::page("todos.html").ctx(todos()).fragment("todos")
    })));
app.serve("0.0.0.0:3000").await?; // feature `native`; or `into_router()`
```

- One template, two shapes: a plain request gets the page, a (non-boosted) htmx request gets
  block `todos`, which the page wraps in `id="todos"`. `check_fragment` asserts that the
  fragment is exactly that element's content; call it in your tests for every fragment.
- `View::oob`, `toast`, `trigger`, `status`, `push_url`; `see_other(&hx, &LocalPath)` is a
  303, or `HX-Location` for htmx. `LocalPath` rejects off-site targets.
- Every response gets a strict CSP with a per-request nonce (`Extension<Nonce>`,
  `request.nonce` in templates; `theme_script()`/`islands_script()` add it), HSTS, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options`. Configure with
  `App::security_headers(Headers { .. })`.
- `Hx` headers are untrusted facts and never select a template or block.

Features: `native` (default: tokio, `App::serve`), `workers` (Cloudflare Workers, wasm32, no
tokio; `MaybeSend` drops `Send` without `native`). Check:
`cargo check -p cascivo-server --target wasm32-unknown-unknown --no-default-features --features workers`.
