# **NAME** (Cloudflare Containers)

A `cascivo-server` app in a distroless container, behind a Worker + Durable Object.
Pick this target for tokio, native SQLite, long SSE, or a bundle too big for wasm.

- `src/main.rs`: `/` page, `/visits` htmx fragment (same template, block `visits`).
- `Dockerfile`: `docker build -t __NAME__ .`, `docker run -p 8080:8080 __NAME__`.
- `worker/`: `App` Container class (port 8080) + `fetch` proxy. Files in `worker/public/`
  are served at the edge. Put `htmx.min.js` there (`npm i htmx.org`, copy
  `node_modules/htmx.org/dist/htmx.min.js`); the layout loads it with the CSP nonce.
- Local: `cargo run` (reads `./site`: `SITE_DIR=. cargo run`). Deploy: `cd worker && npm i && npx wrangler deploy`.
