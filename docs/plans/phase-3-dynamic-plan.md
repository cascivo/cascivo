# Rust + HTML-first stack: Phase 3 (Dynamic) plan

Status: done (2026-11-23) except S0/K, which wait for the owner's app (see rust-html-stack-plan.md § Status). Parent: [rust-html-stack-plan.md](rust-html-stack-plan.md)
("Later phases", item 3). Inputs: results W1–W5, `crates/cascivo-web` (`axum.rs`, `islands.rs`,
`dev.rs`, `deploy.rs`), `packages/elements`.

**Owner goal.** Port a dynamic app that the owner built in React to plain HTML/CSS + htmx + Solid
islands. Rust (axum) serves it, and it deploys to Cloudflare. It keeps the cascivo look (the
`cv-*` contract) and WCAG 2.2 AA.

**Assumed from Phase 1.** `@cascivo/css`: unhashed `cv-*` classes and `data-*` attributes,
generated from `.meta.ts`. The Rust emitters come from `anatomy`, and parity covers every
presentational component, including `field`, `input`, `select`, `checkbox`, `table`, `dialog`,
`toast` and `tabs`. If a field is missing from `anatomy`, the dependent task stops. Workaround:
add it to `anatomy` in Phase 1. Do not hand-write markup.

**Assumptions to confirm (see Open questions).** The owner's app is CRUD with forms, tables,
dialogs and toasts, and has a few rich widgets. Those widgets are the Solid islands. Auth is
session-based. The data fits D1/SQLite.

## Principles

1. **One template, two shapes.** A full page and its htmx fragment come from the same template.
   The fragment is a named minijinja block (`State::render_block`), never a copy. A test proves
   that the fragment equals the same subtree of the full page.
2. **Progressive enhancement.** Every form and link works without JS (POST → 303 or 422
   re-render). htmx (`hx-boost`, targeted swaps) only makes them faster.
3. **Runtime-agnostic core.** Rendering, htmx helpers, forms, CSRF and sessions compile to
   `wasm32-unknown-unknown` without tokio. Only the native adapter pulls in tokio/tower-http.
4. **Untrusted at the boundary** (CLAUDE.md "never `as`"). Form, query, `HX-*` headers, island
   props and SSE topics are deserialized into typed structs, then validated. They never select a
   template, block or path directly. Use allowlists.
5. **Behaviour is elements, not frameworks.** Use `@cascivo/elements` for widgets and Solid only
   for app-specific rich islands. There are no React islands in Phase 3.

## Crate and feature layout

| Crate | New? | Role | Features |
|---|---|---|---|
| `cascivo-web` | split | Adds `Engine`: request-time render of pages/blocks from a loaded or embedded template bundle; `build --bundle` | `default = ["cli", "images", "fs"]`; `axum` (existing static router, unchanged); wasm uses `default-features = false` (drops `image`, fs walk) |
| `cascivo-server` | new | axum layer: `App`, `Hx` extractor, `View` responder + render layer, forms/validation, CSRF, sessions, auth hooks, security headers, server islands, SSE fragments | `native` (default: tokio, tower-http compression/fs, `Hub` broadcast), `workers` (no tokio, `?Send` futures), `datastar` (SSE event format), `sqlite` (session store via sqlx) |
| `cascivo-worker` | new | workers-rs adapter: `serve()`, KV session store, `D1`/`R2`/`Env` extractors | `d1`, `r2`, `kv` (all default) |
| `crates/cascivo-web/starter-dynamic/` | new | embedded template for `cascivo-web new --dynamic --target native\|workers\|containers` | — |
| `@cascivo/elements` | extend | `cv-dialog`, `cv-toaster`, `cv-tabs`, `cv-form` + `@cascivo/elements/htmx` glue | per-element entry points (existing pattern) |
| `@cascivo/solid` | new, private | `defineIsland`, `cv-*` JSX typings from the Custom Elements Manifest, Vite preset | — |

Why a new crate and not more `cascivo-web` features: `cascivo-web` carries the CLI, `image` and
`pulldown-cmark`, and wasm size is a kill criterion. `cascivo-server` depends on `cascivo-web`
with `default-features = false`.

## API sketches (Rust)

```rust
// cascivo-web::engine — no axum, no tokio, no fs on wasm
pub struct Engine { /* Arc<minijinja::Environment>, Vite manifest, theme, i18n, css accumulator */ }
pub struct Bundle { /* templates, messages, vite manifest, config; serialized at build time */ }
impl Engine {
    pub fn load(root: &Path) -> Result<Self>;                 // native, dev
    pub fn from_bundle(bytes: &'static [u8]) -> Result<Self>; // workers: include_bytes!("../dist/app.bundle")
    pub fn render(&self, tpl: &str, ctx: &Value, req: &ReqCtx) -> Result<String>;
    pub fn render_block(&self, tpl: &str, block: &str, ctx: &Value, req: &ReqCtx) -> Result<String>;
    pub fn reload(&self) -> Result<()>;                       // dev: ArcSwap on fingerprint change (dev.rs)
}
pub struct ReqCtx<'a> { pub path: &'a str, pub locale: &'a str, pub csrf: Option<&'a str>,
                        pub nonce: &'a str, pub user: Option<&'a Value>, pub flash: &'a [Flash] }
```

```rust
// cascivo-server — App builder
pub struct App<S = ()> { /* engine, layers, islands, static fallback */ }
impl App<()> { pub fn new(engine: Engine) -> Self; }
impl<S: Clone + Send + Sync + 'static> App<S> {
    pub fn with_state<T: Clone + Send + Sync + 'static>(self, s: T) -> App<T>;
    pub fn routes(self, r: axum::Router<S>) -> Self;
    pub fn static_site(self, site: &Site) -> Result<Self>;   // existing cascivo_web::router as fallback
    pub fn sessions(self, store: impl SessionStore, cfg: SessionConfig) -> Self;
    pub fn auth<A: Authenticator>(self, a: A) -> Self;
    pub fn csrf(self, cfg: Csrf) -> Self;                     // on by default; opt-out per route only
    pub fn security_headers(self, cfg: Headers) -> Self;      // CSP with per-request nonce, etc.
    pub fn server_island<P, F, Fut>(self, name: &'static str, f: F) -> Self
        where P: DeserializeOwned + Serialize, F: Fn(P, Parts) -> Fut + Clone + Send + 'static,
              Fut: Future<Output = Result<View, AppError>>;
    pub fn into_router(self) -> axum::Router;
}

// htmx request facts (all optional, all untrusted)
pub struct Hx { pub request: bool, pub boosted: bool, pub history_restore: bool,
                pub target: Option<String>, pub trigger: Option<String>, pub current_url: Option<Url> }

// Handler returns data; RenderLayer (holding Engine + ReqCtx) turns it into HTML.
// It picks the block only for a non-boosted htmx request, otherwise the full page.
pub struct View { /* tpl, ctx, fragment, oob, status, triggers, push_url */ }
impl View {
    pub fn page(tpl: &'static str) -> Self;
    pub fn ctx(self, ctx: impl Serialize) -> Self;
    pub fn fragment(self, block: &'static str) -> Self;
    pub fn oob(self, tpl: &'static str, block: &'static str, ctx: impl Serialize) -> Self; // hx-swap-oob
    pub fn toast(self, kind: ToastKind, msg_key: &'static str) -> Self; // OOB into #cv-toaster, or a flash without JS
    pub fn trigger(self, event: &'static str, detail: impl Serialize) -> Self; // HX-Trigger
    pub fn status(self, s: StatusCode) -> Self;
}
pub fn see_other(hx: &Hx, to: &LocalPath) -> Response; // 303, or HX-Location for htmx
pub struct LocalPath(/* validated same-origin path; rejects `//`, schemes, `\` */);

// Forms
pub trait Validate { fn validate(&self, e: &mut FormErrors); }
pub struct FormErrors { /* field -> Vec<Msg{key, args}>, form-level Vec<Msg> */ }
pub enum Submission<T> { Valid(T), Invalid { values: Value, errors: FormErrors } }
pub struct Form<T>(pub Submission<T>); // FromRequest: urlencoded | multipart (size-capped),
                                       // serde → T, then T::validate; serde errors become field errors.
// Template side (Phase 1 emitter): {{ field("title", label=t("todo.title"), values=values, errors=errors) }}
// sets aria-invalid, aria-describedby → cv-field__error, and keeps the value.

// Sessions and auth
pub trait SessionStore: MaybeSend + Sync + 'static {         // MaybeSend = Send on native, nothing on wasm
    fn load(&self, id: &SessionId) -> impl Future<Output = Result<Option<Record>>> + MaybeSend;
    fn save(&self, id: &SessionId, r: &Record, ttl: Duration) -> impl Future<Output = Result<()>> + MaybeSend;
    fn delete(&self, id: &SessionId) -> impl Future<Output = Result<()>> + MaybeSend;
}
// Implementations: CookieStore (encrypted, stateless, the default, works on every target),
// MemoryStore (tests), SqliteStore (feature), cascivo_worker::KvStore.
pub struct Session; // extractor: get/insert/remove/flash/rotate_id (call rotate_id on login)
pub trait Authenticator: Clone + MaybeSend + Sync + 'static {
    type User: Serialize + Clone;
    fn user(&self, s: &Session, p: &Parts) -> impl Future<Output = Option<Self::User>> + MaybeSend;
}
pub struct User<U>(pub U);            // 303 to login (HX-Redirect for htmx), with `next` as LocalPath
pub struct MaybeUser<U>(pub Option<U>);
pub struct Csrf { pub check_origin: bool, pub header: &'static str, pub field: &'static str }

// Server islands: {{ server_island("cart", props={"id": 3}, fallback="cart_skeleton") }} emits
// <div hx-get="/_island/cart?p=<b64>.<hmac>" hx-trigger="load" hx-swap="outerHTML">…fallback…</div>.
// The HMAC (key from the APP_SECRET env var) stops clients changing the props; a bad MAC returns 400.

// SSE: htmx sse extension, or Datastar with the `datastar` feature
pub struct Fragment { pub event: Cow<'static, str>, pub html: String }
pub fn sse<S: Stream<Item = Fragment> + MaybeSend + 'static>(s: S) -> impl IntoResponse; // keep-alive
#[cfg(feature = "datastar")] pub fn patch_elements(html: String, selector: Option<&str>, mode: PatchMode) -> Fragment;
#[cfg(feature = "native")] pub struct Hub<T: Clone>; // tokio broadcast by topic; topic names allowlisted
```

```rust
// cascivo-worker
#[event(fetch)]
async fn fetch(req: HttpRequest, env: Env, _: Context) -> worker::Result<axum::http::Response<Body>> {
    cascivo_worker::serve(req, env, |env| app(env)).await // Env in request extensions
}
pub struct KvStore; impl KvStore { pub fn new(env: &Env, binding: &str) -> worker::Result<Self>; }
pub struct D1(pub worker::D1Database); // FromRequestParts via Env extension, binding from config
pub struct R2(pub worker::Bucket);     // plus `upload(…)` with size/type limits
```

Static assets on Workers stay in Workers Static Assets (the existing `wrangler.jsonc`). The Worker
handles only dynamic routes (`run_worker_first` patterns).

**Containers template.** It builds the same native binary into a distroless Dockerfile. A thin
Worker front holds a `Container` Durable Object binding and proxies to it. Static assets stay at
the edge. Choose it when the app needs tokio, native SQLite, long SSE or more than the wasm size
limit.

## Solid islands

- The loader is the existing `islands.rs` loader, unchanged. The module contract is
  `export default (el, props) => void`. `@cascivo/solid` provides
  `defineIsland(Component) = (el, props) => render(() => <Component {...props} />, el)` and
  disposes it on `htmx:beforeCleanupElement`.
- There is no Solid SSR from Rust (this stays a non-goal). The fallback is Rust-rendered `cv-*`
  markup of the same shape, so the page has no layout shift and has content without JS.
- Styling: Solid components use the `@cascivo/css` classes, not CSS modules. A component that
  reuses a widget uses the custom element (`<cv-combobox>`) and does not re-implement it.
- Typings: generate a `solid-js` `JSX.IntrinsicElements` augmentation from
  `custom-elements.json`. Events use `on:cv-value-change` (detail `{ value }`).
- State: Solid signals stay inside the island. Islands talk to htmx and the server only through
  DOM events and forms (a form-associated element or a hidden input). There is no shared global
  store.
- Budget: each island ≤ 10 KB gz, Solid runtime included (about 7 KB). An island over this
  budget needs a written reason.

## Minimal Phase 4 slice (elements the typical app needs first)

These already exist: `cv-menu`, `cv-combobox`, `cv-date-picker`.

| Need | Decision | Element | Size |
|---|---|---|---|
| Dialog / sheet / confirm | Native `<dialog>`; open from a server fragment; closes on `HX-Trigger: cv-dialog-close`; returns focus | `cv-dialog` | S |
| Toast | `role=status`/`alert` region, filled by OOB swap or `cv-toast` trigger; pause on hover/focus; no-JS flash fallback | `cv-toaster` | S |
| Tabs | Resolve the W1 divergence: APG tablist element, CSS-radio markup as no-JS fallback; server-driven tabs = links + `hx-target` | `cv-tabs` | M |
| Form fields | Native inputs + CSS; server errors from `field` emitter; element only for: focus first invalid after swap, `aria-busy` on submit, disable double submit | `cv-form` | S |
| Table | Markup + CSS only; sort/filter/paginate = links with `hx-get` + `hx-push-url`; `aria-sort` server-rendered. Row selection deferred | none | — |
| Disclosure / accordion | `<details>` | none | — |
| Tooltip / popover | `popover` + CSS anchor positioning; static fallback | none (CSS) | — |
| htmx glue | `@cascivo/elements/htmx`: re-`define()` safety, focus restore after swap, `cv-toast`/`cv-dialog-*` trigger wiring, idiomorph config | module | S |

The owner's inventory (task S0) can add one or two elements, for example a file upload.
Everything else is Phase 4.

## Testing

- **Rust integration** (`tower::ServiceExt::oneshot`, already a dev-dependency): full page vs
  `HX-Request` fragment; the fragment equals the page subtree (normalised with the parity
  normaliser); OOB present; 422 re-render keeps values and shows errors; 303 vs `HX-Location`;
  CSRF missing, wrong or cross-origin → 403; session id rotates on login; tampered island MAC →
  400; SSE framing (htmx and Datastar); `LocalPath` rejects `//evil`, `https:`, `\\`.
- **Conformance suite** (TS, black-box HTTP + Playwright), run against three targets: native
  `cargo run`, `wrangler dev` (Miniflare with local KV/D1) and the container image. A target not
  run in CI must say so.
- **Playwright flows on the starter:** create, edit and delete with a validation error; JS
  disabled (full-page POST/redirect/GET); history back/forward with `hx-push-url`; after a swap
  the dialog returns focus and the toast is announced (`aria-live` text asserted); element state
  survives an idiomorph morph; a Solid island mounts, emits `cv-value-change` and submits with
  the form; the server island loads.
- **A11y** in every state, not only on first load (after a swap, dialog open, error, toast): axe
  WCAG 2.2 AA, APG keyboard suites for new elements, the 320/360/390/414 overflow and ≥ 44 px
  touch sweep, reduced motion, forced colors.
- **Budgets in CI:** element ≤ 3 KB gz; cascivo page JS ≤ 15 KB gz without htmx (counted
  separately, see Risks); Solid island ≤ 10 KB gz; Worker wasm ≤ 3 MB gz after `wasm-opt -Oz`.
- **Gates:** `cargo clippy --all-features -D warnings`, `cargo build -p cascivo-worker --target
  wasm32-unknown-unknown`, `cargo test --workspace`, `pnpm ready` (elements, solid), and
  `isolated:check`/`pack:check` for a published package.

## Security

- **Escaping:** force minijinja autoescape on for every template (do not rely on the file
  extension). Test that `{{ "<x>" }}` escapes in `.html`, `.cv` and blocks; a lint lists every
  `|safe`.
- **CSRF:** a synchronizer token in the session, sent as a hidden field and as `X-CSRF-Token`
  (`hx-headers` on `<body>`), plus a `Sec-Fetch-Site`/`Origin` check on unsafe methods.
  `SameSite=Lax` is defence in depth only.
- **Sessions:** `__Host-` cookie, `HttpOnly; Secure; SameSite=Lax; Path=/`; id rotated on login
  and privilege change; idle and absolute TTLs; a key list for rotation; logout deletes the
  server record.
- **Auth:** hooks only; no password storage in the crate. The starter shows an OAuth (or
  Cloudflare Access) hook; Argon2 on Workers is slow and memory-capped. Authed pages send
  `Vary: HX-Request` and `Cache-Control: private`.
- **Untrusted htmx headers:** `HX-Target`/`HX-Trigger` never choose a block (handlers name blocks
  statically); `HX-Current-URL` is informational only.
- **CSP:** strict with a per-request nonce (`script-src 'nonce-…' 'strict-dynamic'`, no
  `unsafe-eval`); htmx with `allowEval=false`, `includeIndicatorStyles=false`, no `hx-on` or
  `hx-vals="js:"`. Datastar expressions need `unsafe-eval`: its guide and starter variant say so
  and ship the weaker CSP knowingly.
- **Vendored scripts:** htmx, idiomorph and Datastar pinned, self-hosted, hashed; no CDN.
- **Input:** body limits (form 64 KB, multipart configurable); typed serde parsing, then
  `Validate`. R2 uploads: size and type limits, server-generated keys,
  `Content-Disposition: attachment` for user files. Redirects and `next` only via `LocalPath`.
- **Server islands and SSE:** props HMAC-signed with a TTL; topics allowlisted; SSE needs a
  session when the page does; connection cap per session in `Hub`.
- **Headers:** HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`,
  `Permissions-Policy`.
- **Secrets:** `APP_SECRET` from env or a wrangler secret; the starter refuses to start in release
  without it; never in `site.toml`.
- **Review:** a `security-review` pass on `cascivo-server` before the checkpoint; `cargo-deny`
  (advisories, licenses) for the new crates.

## Workstreams (child sessions) and order

Sizes: S ≤ 3 days, M ≈ 1 week, L ≈ 2 weeks (one child session each, unless split). "P1" =
dependency on Phase 1.

| ID | Workstream | Size | Depends on | P1 dependency |
|---|---|---|---|---|
| S0 | Owner app inventory: screens, forms, widgets, data, auth → route map + element list | S | owner input | none |
| X1 | Spike: `minijinja` + `axum` + `Engine::from_bundle` on workers-rs; measure wasm size and cold start | S | — | none |
| A | `cascivo-web` split (`default-features`), `Engine`, `render_block`, `build --bundle`, dev reload | M | — | soft (uses emitters as they are) |
| B1 | `cascivo-server` core: `App`, `Hx`, `View` + RenderLayer, OOB, `see_other`, headers/CSP nonce | M | A | none |
| B2 | Forms + validation + `field` error re-render, i18n messages | M | B1 | **hard**: `field`/`input`/`select` anatomy |
| B3 | Sessions (Cookie/Memory/Sqlite), CSRF, auth hooks, `LocalPath`, flash | M | B1 | none |
| C | Server islands + SSE (`Hub`, htmx sse, `datastar` feature) | M | B1, B3 | none |
| D1 | `cv-dialog`, `cv-toaster`, `@cascivo/elements/htmx` | M | — | **hard**: dialog/toast contract |
| D2 | `cv-tabs` (contract decision), `cv-form` | M | — | **hard**: tabs/field contract |
| E | `@cascivo/solid`: `defineIsland`, CEM typings, Vite preset, sample island | M | D1 (typings) | **hard**: `@cascivo/css` package |
| F | `cascivo-worker`: serve, KvStore, D1/R2 extractors, wasm CI build | L | A, B3, X1 go | none |
| G | Containers template (Dockerfile + Worker/DO front) | S | B1 | none |
| H | `cascivo-web new --dynamic --target …` starter (CRUD + auth + island + SSE demo) | M | B2, B3, C, D1, E, F or G | via B2/D |
| T | Conformance + Playwright + axe harness, budgets in CI (start the skeleton early) | M | B1, then H | none |
| I | Guides: `USING-CASCIVO-SERVER.md` (htmx), Datastar guide, skill `skills/cascivo-server`, llms/guides registration | M | B2, C, H | none |
| K | Port the owner's app, vertical slice (3 screens incl. one form-heavy, one table, one island) | L | H, S0 | all |

**Waves** (about 8–10 weeks of calendar time with 3–4 parallel children; matches the parent
plan's 6–10 weeks):

1. **Week 1–2.** S0, X1, A and the T skeleton. D1 and D2 can start as soon as Phase 1 has frozen
   those components' contracts.
2. **Week 2–4.** B1, then B2 ∥ B3. Also C, E, G.
   - **Checkpoint α (end of week 3):** go/no-go on Workers from X1 (see below).
3. **Week 4–7.** F, H, I, and T completed.
4. **Week 7–10.** K, then the criterion 6 checkpoint.

Product-only work, dropped if the owner chooses "tool" at criterion 6: I (beyond a README), the
Datastar feature, the polish of the `--target` matrix, crates.io release of
`cascivo-server`/`cascivo-worker`, publishing `@cascivo/solid`.

## Kill and checkpoint criteria

| # | Checkpoint | Pass | On fail |
|---|---|---|---|
| α | Workers viability (X1, week 1–3) | wasm ≤ 3 MB gz, p50 cold start ≤ 50 ms, a template render works from the bundle | Drop F. Cloudflare = Containers (G) + static assets only. Keep `MaybeSend`, but do not test wasm in CI |
| β | Fragment discipline (B1) | the fragment ≡ page-subtree test holds for all starter views without hand-written fragments | Rethink the fragment model before B2 (e.g. per-component partial templates) |
| γ | a11y after swaps (D, H) | axe 0 violations in every swapped state; focus never lost to `<body>` after a swap | Fix in the elements and htmx glue; block H |
| δ | Weight (H) | cascivo JS ≤ 15 KB gz/page, without htmx (htmx counted and reported); islands ≤ 10 KB gz each | Split the elements, or move a widget from Solid to an element |
| **6** | **Tool vs product (after K)** | Owner decides from: (a) the vertical slice is equal or better than React on a11y (axe 0, keyboard parity), on Lighthouse (≥ 95 perf/a11y) and on JS bytes (≥ 50 % less); (b) authored LOC ≤ the React slice; (c) time to build each screen recorded; (d) a second adopter exists, or not | **Tool:** keep the crates unpublished/0.x, the starter is internal, drop the product-only list. **Product:** publish, finish the guides, add a semver policy and a support matrix. **Kill:** if (a) or (b) fails clearly, stop at the static stack (Phase 2) and keep React for dynamic apps |

## Risks

- **htmx error swaps.** htmx 2 does not swap 4xx by default. The starter ships the
  `htmx-config` meta tag with `responseHandling` that swaps 422. Without it, validation
  re-render fails silently. Test it.
- **wasm and `Send`.** workers-rs futures are `!Send`, while axum on native needs `Send`.
  `MaybeSend` across every trait adds complexity and can split the API. X1 tests this first.
- **Size.** wasm (minijinja + axum + serde) may exceed the free-tier 3 MB limit. The fallback is
  checkpoint α.
- **htmx weight.** htmx is about 16 KB gz, more than the parent criterion 3 page budget alone.
  The plan counts it separately. The owner must accept that, or choose Datastar (about 11 KB, but
  it needs `unsafe-eval`).
- **Two client models** (elements on preact signals-core, islands on Solid) mean two reactive
  runtimes on one page. Mitigation: islands stay rare, and they talk only through DOM events.
- **Long-lived SSE.** On Workers it needs Durable Objects for fan-out, which this plan does not
  cover. On native, `Hub` is single-process only.
- **Phase 1 slip.** It blocks B2, D, E and K. A, B1, B3, C, F, G and X1 can proceed without it.
- **Template errors at request time** become 500s in production. Mitigation: render every route
  with sample context at `build --bundle` (fail the build), and give the dev server a
  rich error page.

## Open questions for the owner

1. Can you share the React app (repo or route/screen list)? S0 and the element slice depend on
   it.
2. Which data and auth does it use (Postgres? an external API? OAuth provider? passwords)? This
   decides D1 vs Containers and whether Argon2 is needed.
3. Is the Cloudflare target Workers (wasm) or Containers, or both? Is a paid plan acceptable
   (10 MB wasm, Containers)?
4. htmx only, or Datastar too (and accept `unsafe-eval` in its CSP)?
5. Does the app need real-time features (SSE fan-out, presence)? If yes, add a Durable Objects
   workstream.
6. Criterion 6: should the plan be scoped as tool or product from the start? Product doubles I
   and adds release work.
7. Is Solid the only island framework, with React islands staying Phase 4 and optional? Please
   confirm, so the "no mixed-framework islands" non-goal holds.
8. `cv-tabs` contract: is the APG tablist element with a CSS fallback acceptable, given the W1
   divergence?

### Owner decisions (2026-11-23)

Owner accepted the recommendations. S0 and K still wait for the app itself. Decisions: session auth with
passwords (Argon2) plus OAuth hooks; data on D1/SQLite; Cloudflare = Workers if X1 passes
checkpoint α, else Containers; htmx first, Datastar as an optional feature later; no Durable
Objects fan-out; Solid is the only island framework.
