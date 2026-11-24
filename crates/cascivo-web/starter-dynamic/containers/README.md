# **NAME** (Cloudflare Containers)

A dynamic [cascivo](https://github.com/cascivo/cascivo) app (axum + tokio) in a distroless
container behind a Worker + Durable Object: notes CRUD behind sign-in, a Solid island, a server
island, server-sent events and the `/c/*` interaction demos. Pick this target for tokio, native
SQLite, long SSE, or a bundle too big for wasm.

    cd web && pnpm install && pnpm build && cd ..   # /assets/*.js|css → web/dist
    cargo run                                        # http://127.0.0.1:3000 (assets from web/dist)
    cargo test
    docker build -t __NAME__ . && docker run -e APP_SECRET=$(openssl rand -hex 32) -p 8080:8080 __NAME__
    cd worker && npm i && npx wrangler secret put APP_SECRET && npx wrangler deploy

- `src/app.rs`: templates, messages, router. `src/notes.rs`: CRUD. `src/auth.rs`: sign-in
  (demo: any name; swap in OAuth or Cloudflare Access). `src/demo.rs`: `/c/*` demos.
- `templates/`: one template per page; each `{% block %}` is the htmx fragment of the element
  with the same `id`, so fragments are never written by hand (`tests/views.rs` checks it).
- `worker/`: the `App` Container class (port 8080) and the `fetch` proxy; `web/dist` is served
  at the edge. `/healthz` answers `ok`.
- Notes live in memory (one container); swap `Notes` for SQLite on a volume or D1.
- `@cascivo/elements` and `@cascivo/solid` are unpublished: `web/package.json` links them
  from a cascivo checkout (built with `pnpm build`).
