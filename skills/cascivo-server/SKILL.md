---
name: cascivo-server
description: Build a dynamic, server-rendered app (htmx partial swaps, forms with validation, sessions, CSRF, sign-in, D1/SQLite, SSE, Solid islands) with the `cascivo-server` axum crate, scaffolded by `cascivo-web new --dynamic`, on native, Cloudflare Workers or Containers. Use for apps that read and write data and need no React.
---

# cascivo-server

Handlers return a `View`; the `App` layer renders the page, or only a block for an htmx request.

## Steps

1. Scaffold: `cascivo-web new my-app --dynamic [--target native|workers|containers] [--checkout <dir>]`.
   Do not run it in a folder with files you care about. Targets: `native` (axum + tokio, default),
   `workers` (wasm, KV/D1/R2, no `Hub`), `containers` (native app in a container behind a Worker; pick it
   for tokio, native SQLite or long SSE on Cloudflare).
2. Build assets: `cd web && pnpm install && pnpm build` (`--checkout` links the unpublished
   `@cascivo/elements` and `@cascivo/solid`). Run: `cargo run` (native), `npx wrangler dev` (workers).
   Release builds need `APP_SECRET` (32+ bytes).
3. Add a page: a template in `templates/` plus a route. Wrap each swappable block in an element with
   `id="<block>"` that opens/closes exactly at the block tags, return
   `View::page("x.html").fragment("block").ctx(context!{..})`, and add the view to `tests/views.rs`
   with `check_fragment`. Never write a fragment twice.
4. Add a form: `#[derive(Deserialize, Serialize)]` struct + `impl Validate` (`RULES` with `Rule::text().required()`,
   `validate` for server-only checks); handler takes `Form<T>` and matches `Submission::Valid/Invalid`;
   `Invalid` renders the form block with **422**. Template: `<cv-form><form method="post" action hx-post>`,
   `{{ form.csrf() }}`, `{{ form.field("name", label="…") }}`.
5. Finish with `cargo test`, `cargo clippy --all-features -D warnings`, and (workers)
   `cargo build --target wasm32-unknown-unknown`. `pnpm dynamic:check:starter` in the cascivo repo checks
   a fresh starter.

Full guide: <https://cascivo.com/docs/guides/using-cascivo-server>.

## Facts

- `View`: `page`, `ctx`, `fragment`, `oob(tpl, block, ctx)`, `toast(ToastKind, key)`, `trigger(event, detail)`, `status`, `push_url`.
  Redirect with `see_other(&hx, &LocalPath)` (303, or `HX-Location` for htmx). `Hx` headers are untrusted: never pick
  a block from them. Block names are static strings.
- Sessions: `.sessions(CookieStore::new(&[secret])?, SessionConfig::default())` (also `MemoryStore`, `SqliteStore`,
  `cascivo_worker::KvStore`). `rotate_id()` at login, `destroy()` at logout. Auth: `impl Authenticator`, extractors
  `User<U>` / `MaybeUser<U>`; passwords `hash_password` / `verify_password(pw, Option<&str>)` (Argon2id);
  OAuth `Session::oauth_begin` / `oauth_callback`.
- CSRF is on for every unsafe method: `<body hx-headers='{"X-CSRF-Token":"{{ request.csrf }}"}'>`, `form.csrf()` in forms.
  After login answer htmx with `HX-Redirect` (full reload) so the new token reaches `<body>`.
- Strict CSP with a nonce (`request.nonce`; `theme_script()`/`islands_script()` add it). No inline scripts, no `hx-on`,
  htmx `allowEval:false`. No response compression (BREACH with CSRF tokens).
- Workers: `cascivo_worker::{serve_router, KvStore, D1, R2, Env}`; handlers awaiting bindings need `#[worker::send]`.
- Toasts/dialogs/tabs: `<cv-toaster id="cv-toaster">` + `.toaster("base.html","toaster")`; `<cv-dialog>` closed by
  `.trigger("cv-dialog-close", ())`; `<cv-tabs>` lazy panels with `hx-trigger="focus once"`. Give controls stable ids so
  focus returns after a swap.
- Solid islands: `data-island` markup + `defineIsland(Component)` from `@cascivo/solid`; server fallback in the same shape.
  Server islands: `IslandKey`, `.islands`, `.server_island`, `key.placeholder(..)`.
- SSE: `sse(stream of Fragment::new(event, html))` + `hx-ext="sse" sse-connect sse-swap`; `Hub` is native only.
- Datastar is optional and wire-only (feature `datastar`: `patch_elements`, `patch_signals`); it needs `unsafe-eval` in
  the CSP. htmx is the supported path.
- JS budgets (gz): 3 KB per element, 15 KB cascivo JS per page (htmx separate), 10 KB per Solid island.
