**Live:** [cascivo.com/demos/track-lite-htmx/](https://cascivo.com/demos/track-lite-htmx/), your
own sandbox (see [Deploying to Cloudflare Workers](#deploying-to-cloudflare-workers)).

The htmx twin of [`track-lite`](../track-lite) (a slice of the React [Track](../track) example):
the same issue list, "New issue" dialog with validation, Advance and Delete, toasts and live
updates, rendered by an axum server on [`cascivo-server`](../../../crates/cascivo-server). The
browser gets htmx, the `@cascivo/elements` custom elements (dialog, form, toaster) and one Solid
island, the "Live · updated Ns ago" clock. Every mutation answers with the `issues` fragment and
publishes `changed` on an SSE hub, so every open tab refetches the list; a simulated teammate
advances an issue every 6 s (`TEAMMATE_MS`, 0 turns it off). Results and trade-offs:
[docs/COMPARE-REACT-VS-HTMX-SOLID.md](../../../docs/COMPARE-REACT-VS-HTMX-SOLID.md).

```sh
pnpm exec vp build                                   # island + elements + htmx into dist/
cargo run -p track-lite-htmx-server                  # from the repo root: http://127.0.0.1:3001
cargo test -p track-lite-htmx-server                 # create, 422, advance, delete, CSRF, SSE
```

Advance and Delete are real forms, so they also work without JavaScript (the server answers a
plain post with a redirect home). The dialog needs the elements script to open.

## Deploying to Cloudflare Workers

[`worker/`](worker) runs the same app (templates, validation, rendering: the target-agnostic core
of `server/src/lib.rs`, built with `--no-default-features --features workers`) as a Cloudflare
Worker at `/demos/track-lite-htmx/` (`Options::base`). The entry Worker rate-limits per IP, sets a
random `demo` cookie and forwards to the `Sandbox` Durable Object named by it: one visitor's
issues (seeded, kept in DO storage), the router, and the SSE fan-out to that visitor's tabs, so
public visitors can't vandalise each other and live updates across tabs still work. The teammate
runs on the DO alarm only while a tab is subscribed; a sandbox idle for 7 days deletes itself.
Sessions are encrypted cookies keyed by a per-sandbox secret. The Vite build is served by the
static-assets binding.

```sh
pnpm exec vp run --filter @cascivo/example-track-lite-htmx... build   # dist/ (from the repo root)
rustup target add wasm32-unknown-unknown && cargo install worker-build --version 0.9.0
cd apps/examples/track-lite-htmx/worker
npx wrangler@4 dev          # http://localhost:8787/demos/track-lite-htmx/
npx wrangler@4 deploy       # the cascivo.com route in wrangler.jsonc
```

CI deploys it (`deploy-track-lite-htmx` in `.github/workflows/cf-pages.yml`) when the example or
`cascivo-server`/`-worker`/`-web` change on `main`.
