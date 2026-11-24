# **NAME**

A dynamic [cascivo](https://github.com/cascivo/cascivo) app (axum + tokio): notes CRUD behind
sign-in, a Solid island, a server island, server-sent events and the `/c/*` interaction demos.

    cd web && pnpm install && pnpm build && cd ..   # /assets/*.js|css → web/dist
    cargo run                                        # http://127.0.0.1:3000
    cargo test                                       # fragments + the CRUD flow

- `src/app.rs`: templates, messages, router. `src/notes.rs`: CRUD. `src/auth.rs`: sign-in
  (demo: any name; swap in OAuth or Cloudflare Access). `src/demo.rs`: `/c/*` demos.
- `templates/`: one template per page; each `{% block %}` is the htmx fragment of the element
  with the same `id`, so fragments are never written by hand (`tests/views.rs` checks it).
- Release builds need `APP_SECRET` (32+ bytes); `ADDR` and `ASSETS_DIR` override defaults.
- Notes live in memory; swap `Notes` for SQLite. Sessions are an encrypted cookie
  (`SqliteStore` with the `sqlite` feature for server-side sessions).
- `@cascivo/elements` and `@cascivo/solid` are unpublished: `web/package.json` links them
  from a cascivo checkout (built with `pnpm build`).
