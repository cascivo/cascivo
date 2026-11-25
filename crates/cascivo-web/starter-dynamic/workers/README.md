# **NAME** (Cloudflare Workers)

A dynamic [cascivo](https://github.com/cascivo/cascivo) app on Workers (Rust → wasm): notes
CRUD behind sign-in, a Solid island, a server island, server-sent events and the `/c/*`
interaction demos.

    cd web && pnpm install && pnpm build && cd ..   # /assets/*.js|css → web/dist
    echo "APP_SECRET=$(openssl rand -hex 32)" > .dev.vars
    npx wrangler dev                                 # http://localhost:8787
    npx wrangler secret put APP_SECRET && npx wrangler deploy

- `src/app.rs`: templates, messages, router. `src/notes.rs`: CRUD. `src/auth.rs`: sign-in
  (demo: any name; swap in OAuth or Cloudflare Access). `src/demo.rs`: `/c/*` demos.
- `templates/`: one template per page; each `{% block %}` is the htmx fragment of the element
  with the same `id`, so fragments are never written by hand.
- Notes live in isolate memory; use `cascivo_worker::D1` for real data, `KvStore` for
  server-side sessions (today: encrypted cookie).
- `@cascivo/elements` and `@cascivo/solid` are unpublished: `web/package.json` links them
  from a cascivo checkout (built with `pnpm build`).
