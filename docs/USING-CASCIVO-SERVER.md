# Dynamic apps with cascivo-server

`cascivo-server` is an axum layer for HTML-first apps. Handlers return a `View` (a template plus
data); the layer renders the whole page, or, for an htmx request, only the part that changed.
Sessions, CSRF, forms with validation, sign-in, server islands and SSE are built in, with a strict
CSP by default. `cascivo-worker` runs the same app on Cloudflare Workers.

Both crates are unreleased (`publish = false`), so the API may change. You get them from
`cascivo-web new --dynamic`, which writes a working app that already uses everything below. It
builds on [`cascivo-web`](USING-CASCIVO-WEB.md): the templates are minijinja, and the engine is
`cascivo_web::Engine`.

## When to use it

| You want | Use |
| -------- | --- |
| A static site (blog, docs, marketing) | `cascivo-web` ([USING-CASCIVO-WEB.md](USING-CASCIVO-WEB.md)) |
| Pages that read and write data, with sign-in, forms and live updates, mostly server-rendered | `cascivo-server` (this guide) |
| A client-heavy React app | `@cascivo/react` ([GETTING-STARTED.md](GETTING-STARTED.md)) |

## Scaffold an app

```sh
cascivo-web new my-app --dynamic                    # native (default)
cascivo-web new my-app --dynamic --target workers
cascivo-web new my-app --dynamic --target containers
cd my-app/web && pnpm install && pnpm build && cd ..   # /assets/*.js|css → web/dist
```

`new` refuses to overwrite files. `@cascivo/elements` and `@cascivo/solid` are not published yet,
so `web/package.json` links them from a cascivo checkout: pass `--checkout <dir>` to point at one.

| Target | Runs on | Pick it when |
| ------ | ------- | ------------ |
| `native` | axum + tokio, `cargo run` | A VPS, a container platform, local work. Full tokio: `SqliteStore`, `Hub` fan-out for SSE, long streams. |
| `workers` | Cloudflare Workers (Rust → wasm) | Edge latency and no servers. KV sessions, D1, R2. No tokio, no `Hub`; keep the wasm small. |
| `containers` | The native app in a distroless container behind a Worker + Durable Object | You want Cloudflare but need tokio, native SQLite, long SSE or a bundle too big for wasm. |

The three share `src/{app,auth,notes,demo}.rs` and the templates; only `platform.rs` (the clock the
SSE demo sleeps on) and the entry point differ. Templates are compiled into the binary
(`include_str!`), so there is no filesystem at runtime, and Workers work the same way.

```text
src/app.rs        templates, messages, router (App::new(...).routes(...))
src/notes.rs      CRUD: the pattern to copy
src/auth.rs       sign-in (demo: any name)
src/demo.rs       /c/* interaction demos (form, dialog, toast, island, SSE, tabs)
templates/        one template per page; each {% block %} is an htmx fragment
web/              Vite: htmx.js, elements.js, island.js/css → web/dist
```

Run it: native `cargo run` (port 3000), Workers `npx wrangler dev` (8787), Containers `docker build`
then `wrangler deploy` from `worker/`. Release builds need `APP_SECRET` (32+ bytes, for example
`openssl rand -hex 32`); debug builds fall back to a fixed dev secret.

## App, View and Hx

```rust
use axum::{Router, routing::get};
use cascivo_server::{App, View};

let app = App::new(engine)               // cascivo_web::Engine
    .sessions(store, SessionConfig::default())
    .auth(MyAuth)
    .csrf(Csrf::default())
    .toaster("base.html", "toaster")
    .routes(Router::new().route("/todos", get(|| async {
        View::page("todos.html").ctx(todos()).fragment("todos")
    })));
app.serve("0.0.0.0:3000").await?;        // feature `native`; or app.into_router()
```

`App` is a builder: `new`, `with_state(S)`, `routes`, `security_headers`, `toaster(tpl, block)`,
`sessions`, `auth`, `csrf`, `islands`, `server_island`, then `into_router()` or `serve`. The layers
run outer to inner: render, session, auth, CSRF, your routes.

`View` is what a handler returns. The App layer renders it:

| Method | Effect |
| ------ | ------ |
| `View::page(tpl)` | The template. A plain request gets the whole page. |
| `.ctx(value)` | Template data (any `Serialize`). `request`, `user` and `flash` are the request's and cannot be set. |
| `.fragment(block)` | The block a partial htmx request gets instead of the page. |
| `.oob(tpl, block, ctx)` | Also swap that block into `#<block>` out of band. |
| `.toast(ToastKind, key)` | A toast; `key` is an i18n key. `ToastKind` is `Info`, `Success`, `Warning`, `Danger`. |
| `.trigger(event, detail)` | An `HX-Trigger` event. |
| `.status(StatusCode)` | The status (422 for a form with errors). |
| `.push_url(LocalPath)` | `HX-Push-Url`. |

Responses carry `Vary: HX-Request`, so a cache never serves a fragment as a page. A request counts as
partial (`Hx::is_partial()`) when it is an htmx request that is not boosted and not a history
restore: boosted links and history cache misses want the whole page.

`Hx` is an extractor of request facts: `request`, `boosted`, `history_restore`, `target`, `trigger`,
`current_url`. They are untrusted. A handler names its blocks in code and never picks a template or a
block from a header.

`see_other(&hx, &LocalPath)` redirects: a 303 for a plain request, `HX-Location` for htmx.
`LocalPath::parse(s)` accepts only same-origin paths (`/x`, not `//evil` or `\x`);
`LocalPath::parse_or_root(opt)` falls back to `/`. A `LocalPath` field in a form struct is
validated on deserialize, so `?next=` is never an open redirect.

## Fragments

A fragment is the same markup as the matching part of the page. You do not write it twice: you wrap a
block in an element whose `id` is the block name, and the block is both the page content and the
swap payload.

```html
<div id="notes">{% block notes %}
  <ul>{% for n in notes %}<li>{{ n.title }}</li>{% endfor %}</ul>
{% endblock %}</div>
```

```rust
View::page("notes.html").fragment("notes").ctx(context! { notes })
```

```html
<form hx-post="/notes/1/delete" hx-target="#notes" hx-swap="innerHTML">…</form>
```

Rule: the block opens right after the start tag with `id="<block>"` and closes right before its end
tag. `check_fragment(&engine, tpl, block, &ctx, &req)` asserts exactly that, byte for byte. Call it in a
test for every fragment (see the starter's `tests/views.rs`, which covers 15 view states).

Without JavaScript the same route returns the page, so forms use `method="post" action="…"` plus
`hx-post`, and the handler answers a non-partial request with `see_other` (post/redirect/get).

## Forms, validation and cv-form

Declare rules on the type once; they are checked on the server and rendered as constraint attributes
for the browser.

```rust
#[derive(Deserialize, Serialize)]
struct NoteInput { title: String, body: Option<String> }

impl Validate for NoteInput {
    const RULES: &'static [(&'static str, Rule)] = &[
        ("title", Rule::text().required().max_len(80)),
        ("body", Rule::text().max_len(2000)),
    ];
    // Server-only checks, run after the declared rules pass.
    fn validate(&self, e: &mut FormErrors) {
        if self.title == "taken" { e.add("title", Msg::new("note.taken").arg("name", &self.title)); }
    }
}

async fn create(hx: Hx, Form(f): Form<NoteInput>) -> Response {
    match f {
        Submission::Valid(n) => { save(n); see_other(&hx, &LocalPath::parse_or_root(Some("/notes"))) }
        Submission::Invalid(form) => View::page("notes.html").fragment("note_form")
            .ctx(context! { form }).status(StatusCode::UNPROCESSABLE_ENTITY).into_response(),
    }
}
```

`Rule` constructors: `text()`, `email()`, `url()`, `number()`, `checkbox()`; modifiers `required()`,
`min_len()`, `max_len()`, `min()`, `max()`. Only urlencoded bodies are accepted (415 otherwise, 413
over 64 KB). Empty values are dropped before serde, so an empty `Option` is `None` and an empty
required `String` is `valueMissing`; a serde failure is `badInput` on its field.

In the template, `form` is a `FormState` (`FormState::new::<T>()` for an empty form,
`.values(t)` to prefill, `.errors(e)`):

```html
<cv-form>
  <form method="post" action="/notes" hx-post="/notes" hx-target="closest cv-form" hx-swap="outerHTML">
    {{ form.csrf() }}
    {% for e in form.errors() %}<p role="alert">{{ e }}</p>{% endfor %}
    {{ form.field("title", label="Title") }}
    {{ form.field("body", label="Body", kind="textarea", rows=3) }}
    <button class="cv-button-button" data-variant="primary" data-size="md" type="submit">
      <span class="cv-button-label">Add note</span>
    </button>
  </form>
</cv-form>
```

`field(name, label, hint, kind, options, rows, type, placeholder, value)`: `kind` is `input`,
`textarea`, `select`, `checkbox`, `radio-group` or `checkbox-group` (`options=[["v", "Text"], …]`).
Groups render one field around native inputs sharing `name`; the group element (`role="radiogroup"` /
`"group"`) carries `aria-invalid` and `aria-describedby` → the `role="alert"` error, and the
submitted values stay checked. A struct field fed by a checkbox group is a `Vec<String>`
(repeated names are collected). It renders the cascivo `field` and control with `aria-invalid`,
`aria-describedby` pointing at the `role="alert"` error, the submitted value kept, and the rule's
constraint attributes. Control ids are `f-<name>`. Always return **422** on `Invalid`.

Messages are i18n keys resolved with the request locale. Built-ins are
`cascade.form.<ValidityState flag>` (`valueMissing`, `typeMismatch`, `tooShort`, `tooLong`,
`rangeUnderflow`, `rangeOverflow`, `badInput`) with English defaults (`DEFAULT_MESSAGES`); override
them in `[cascade.form]` of `i18n/<locale>.toml`. The server writes the translated text on each
control as `data-cv-msg-<flag>`, so the browser shows the server's words.

`<cv-form>` (the form entry of the elements package, about 1.2 KB gz) enhances the form: it shows the same error
markup client-side instead of the browser bubble, blocks a second submit while one is in flight
(`aria-busy`), swaps 422 responses itself (so htmx needs no `responseHandling` override), and moves
focus to the first `[aria-invalid=true]` on connect and after a swap. It never sets `novalidate`.

## Layouts, navigation, locale

**Layout pattern.** One template per page that `{% extends "base.html" %}`, with the shell (head, nav,
`<main>`) in the base and the swappable region in a named block. The handler returns
`View::page("notes.html").fragment("main")`: a plain request gets the page, a partial htmx request
only `{% block main %}`, and a boosted link or a history-restore cache miss gets the whole page
(`Hx::is_partial()`), so back/forward never shows a bare fragment. Put `hx-boost="true"` on `<body>`
and `hx-target`/`hx-push-url` only on swaps that are not whole-page navigation.

**Active nav.** `{{ aria_current("/notes") }}` writes ` aria-current="page"` when `request.path` is
`/notes` or under it, else nothing (`exact=true`: that path only; `/` always matches exactly):
`<a href="/notes"{{ aria_current("/notes") }}>`. Boosted navigation re-renders the nav, so the mark
follows.

**Locale.** `t(key, **args)` works in every template with the request locale. It comes from the session's
`locale` key, else a handler's `Facts::locale`, else `Accept-Language` negotiated against the app's
`[i18n] locales` (highest `q`, exact tag then primary subtag), else the default locale.

## CSRF, sessions and auth

```rust
let store = CookieStore::new(&[secret])?;            // encrypted cookie, no server state
App::new(engine)
    .sessions(store, SessionConfig::default())
    .auth(DemoAuth)
    .csrf(Csrf::default())
```

**Sessions.** The cookie is `__Host-cv-session` (`HttpOnly; Secure; SameSite=Lax; Path=/`).
`SessionConfig { cookie, secure, same_site, idle, absolute }` defaults to 24 h idle and 7 days
absolute; unknown ids are never adopted. Stores:

| Store | Where |
| ----- | ----- |
| `CookieStore::new(&[secret, old_secret])` | Encrypted in the cookie (XChaCha20-Poly1305). The first key encrypts, the others only decrypt: rotate by prepending. Works everywhere. |
| `MemoryStore` | Per process. Tests and demos. |
| `SqliteStore::new(pool)` | Feature `sqlite`, native. Call `migrate()`; `delete_expired()` prunes. |
| `cascivo_worker::KvStore::new(&env, "SESSIONS")` | Workers KV. |
| your own `SessionStore` | `load`, `save`, `delete`, keyed by `SessionId::storage_key()`. |

The `Session` extractor has `get`, `insert`, `remove`, `flash(ToastKind, key)`, `rotate_id()`,
`destroy()` and `csrf_token()`. A flash shows as a toast on the next page.

**CSRF.** Every unsafe method needs a same-origin request (`Sec-Fetch-Site`, else `Origin`) and, with
sessions, the token as form field `csrf` or header `X-CSRF-Token`. In templates:
`{{ form.csrf() }}` or `<input type="hidden" name="csrf" value="{{ request.csrf }}">` for plain
forms, and the htmx header once on the body:

```html
<body hx-headers='{"X-CSRF-Token":"{{ request.csrf }}"}'>
```

`Csrf { check_origin, header, field, origins, exempt, body_limit }`; `exempt: vec!["/hooks/*"]` opts
out webhooks that verify their own signature. Multipart forms must send the header.

**File uploads.** `MultipartForm<T>` is `Form<T>` for `multipart/form-data`: the text fields go through
the same rules and `Validate`, the files come back as `Vec<UploadedFile>` (`field`, `filename` with any
directory part dropped, `content_type`, `bytes`; an unchosen file input yields none). The body is
buffered up to `UPLOAD_LIMIT` (8 MiB, 413 beyond). Check size, type and content yourself, never use
`filename` as a path, and send the CSRF token in `hx-headers`. Stream large objects to storage
(`R2::upload` on Workers) instead. A malformed body is 400, another content type 415.

**Auth.** Implement `Authenticator` and use the `User<U>` extractor, which redirects an anonymous
visitor to `LOGIN?next=…` (default `/login`); `MaybeUser<U>` returns an `Option`.

```rust
impl Authenticator for DemoAuth {
    type User = Account;
    async fn user(&self, s: &Session, _: &Parts) -> Option<Account> { s.get("user") }
}
```

Login with a password: look the user up, `verify_password(pw, row.map(|r| r.hash.as_str()))`
(Argon2id, feature `password`, default; pass `None` for an unknown user so the time does not leak
which names exist), then **`session.rotate_id()`** before `session.insert("user", …)`. Store hashes
from `hash_password(pw)`. The starter answers an htmx sign-in with `HX-Redirect` (a full reload),
because `rotate_id` issues a new CSRF token and an in-page `HX-Location` swap would leave the old one
in `<body hx-headers>` (403 on the next POST). Log out with `session.destroy()`.

**OAuth hooks.** `Session::oauth_begin(provider, next)` returns the authorize URL parameters (state
plus PKCE S256); the callback route calls `Session::oauth_callback(provider, state)`, you exchange the
code with your HTTP client, then finish like a password login (`rotate_id`, store the user). The
library does not ship provider clients. Behind Cloudflare Access, read
`Cf-Access-Authenticated-User-Email` in `Authenticator::user` instead.

## Data on Workers: D1, KV and R2

On `native` and `containers`, use any async database. `sqlx` with SQLite works and `SqliteStore` keeps
sessions in the same file. On Workers use `cascivo-worker`:

```rust
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
```

`serve(req, env, |env| Router)`, `serve_router` (cache the router in a `OnceLock`) and
`serve_with(req, env, Bindings { d1, r2 }, &router)` for other binding names. Extractors:

| Extractor | Binding | Feature |
| --------- | ------- | ------- |
| `Env` | the whole `worker::Env` (vars, secrets, KV) | |
| `D1(db)` | `DB` | `d1` |
| `R2(bucket)` | `BUCKET` | `r2` |

A missing binding is a 500. Handlers that await a binding future must have `#[worker::send]`
(Workers are single-threaded and the futures are `!Send`):

```rust
#[worker::send]
async fn list(cascivo_worker::D1(db): cascivo_worker::D1) -> Result<View, AppError> {
    let rows = db.prepare("SELECT id, title FROM notes").all().await
        .map_err(|e| AppError::internal(e.to_string()))?
        .results::<serde_json::Value>().map_err(|e| AppError::internal(e.to_string()))?;
    Ok(View::page("notes.html").ctx(context! { notes => rows }))
}
```

`KvStore` stores the record as JSON under the session's hashed key with `expirationTtl` equal to the
session TTL (KV's minimum is 60 s); a corrupt record is a new session. `R2::upload(&Upload::new(max_bytes,
types).prefix("avatars/"), content_type, bytes)` enforces a size and content-type allowlist (413, 415,
400), generates the object key on the server, and stores it as `Content-Disposition: attachment`.
Starter data is in memory; replace `Notes` with D1 or SQLite. Workers have no `Hub` and no SSE
keep-alive (see [SSE](#sse)).

## Toasts, dialogs and tabs after swaps

The elements are light-DOM custom elements over the cascivo markup contract; `@cascivo/elements/htmx`
is the glue that keeps focus and announcements correct when htmx replaces the DOM. Load it once:

```ts
// web/src/elements.ts in the starter: import the elements stylesheet, the `define` function
// of each element entry (dialog, form, menu, tabs, toaster) and the htmx glue entry, then:
for (const define of [dialog, form, menu, tabs, toaster]) define()
```

The elements package is unpublished: the starter links it from a checkout, and `web/src/elements.ts`
has the exact imports.

**Toasts.** Put one `<cv-toaster id="cv-toaster">` in the base template and tell the app which block
renders it: `.toaster("base.html", "toaster")`. `view.toast(kind, key)` then appends the toast to
`#cv-toaster` out of band on an htmx request, and renders it from `flash` on a full page (so a toast
after a redirect works too). The toaster is a live region (`role="status"`, `alert` for danger);
toasts dismiss after 5 s, pause while hovered or focused, and close on Escape or the close button.
Without JavaScript the server-rendered toasts just stay. Without `.toaster(..)`, the toast goes out
as `HX-Trigger: {"cv-toast": [...]}` and the glue adds it.

**Dialogs.** `<cv-dialog>` wraps a native `<dialog>` (`showModal()`: focus trap, inert page, Escape).
Open it with `data-cv-dialog-open="<id>"`; close it with `data-cv-dialog-close`. To close it from the
server after a save, send the event:

```rust
status_view("c/dialog.html", true)
    .trigger("cv-dialog-close", ())
    .toast(ToastKind::Success, "c.dialog")
```

Focus returns to the opener; if a swap replaced it, to the element with the same id, else to
`<main>`, never to `<body>`.

**Focus after a swap.** The glue remembers the focused element's id before a swap. When focus fell to
`<body>` afterwards it goes back to that id, else to the first focusable element the swap rendered,
else to the swap target (made focusable), else `<main>`. Give interactive elements stable ids
(`note-3-delete`) so this works. With idiomorph the typed value of a focused field and the `open`
state of a `<dialog>` survive the morph.

**Tabs.** `<cv-tabs>` is the APG tablist (arrow, Home and End keys; `activation="manual"` stops the
arrows from activating). Load a panel lazily from the tab, with each panel its own block and the
route choosing from an allowlist:

```html
<button role="tab" … data-value="details" hx-get="/c/tabs/details" hx-trigger="focus once"
        hx-target="#details" hx-swap="innerHTML">Details</button>
<div role="tabpanel" id="plan-content-details" hidden>
  <div id="details">{% block details %}Loading{% endblock %}</div>
</div>
```

```rust
match p.as_str() { "details" => Ok(tab_view("details")), "history" => Ok(tab_view("history")), _ => Err(StatusCode::NOT_FOUND) }
```

The `cv-value-change` event reports the active tab (`detail.value`).

## Solid islands

Most of the page stays server-rendered. For a piece that needs real client state, mount a Solid island
(Solid is the only island framework). The markup carries the island's coordinates:

```html
<div id="save-bar" data-island="save-bar" data-client="load"
     data-src="/assets/island.js" data-css="/assets/island.css">
  <span class="cv-badge-badge" data-variant="secondary">Draft</span>
</div>
```

The inner markup is the server fallback with the same shape: content without JavaScript and no
layout shift. `data-client` is `load`, `idle` or `visible`; props go in `data-props='{"a":1}'`.
In `cascivo-web` templates, `{{ island('save-bar', client='load', props={...}) }}` writes these
attributes from the Vite manifest. `{{ islands_script() }}` (in `<head>`, with the CSP nonce) is the
loader, which imports `data-src` and calls its default export with the element and the props.

```tsx
import { classes as c } from '@cascivo/css'
// defineIsland comes from the unpublished solid package (see web/src/island.tsx in the starter)
import { createSignal } from 'solid-js'

function SaveBar(props: { initial?: string }) {
  const [saving, setSaving] = createSignal(false)
  return (
    <div class={c.card.card}>
      <button type="button" class={c.button.button} onClick={() => setSaving(!saving())}>
        <span class={c.button.label}>{saving() ? 'Saving' : (props.initial ?? 'Save')}</span>
      </button>
    </div>
  )
}
export default defineIsland(SaveBar)
```

`defineIsland` clears the fallback, renders the component, and disposes it on
`htmx:beforeCleanupElement`, so a swap does not leak. Style with `@cascivo/css` classes, not CSS
modules; use `<cv-combobox>` and friends instead of rebuilding a widget. `@cascivo/solid` also has
`cv-*` JSX typings (events as `on:cv-value-change`) and a Vite preset, `cascivoSolid({ islands: {
'save-bar': 'src/island.tsx' } })`, that writes fixed names (`save-bar.js`, one stylesheet). Islands talk
to the server only through DOM events and forms (a form-associated element or a hidden input); there
is no shared store. There is no Solid SSR from Rust.

**Server islands** are the other kind: a fragment loaded after the page, with signed props.

```rust
let key = IslandKey::new(&[secret])?;             // own derived key; .ttl(d), default 1 h
App::new(engine)
    .islands(key.clone())
    .server_island("stats", |p: Stats, _parts| async move {
        Ok(View::page("c/island.html").fragment("stats_body").ctx(context! { visits: p.visits }))
    });
// In a page handler: ctx { stats: key.placeholder("stats", &Stats { visits: 7 }, "<p>Loading…</p>")? }
// In the template:   {{ stats }}   →  <div hx-get="/_island/stats?p=<b64>.<mac>" hx-trigger="load" hx-swap="outerHTML">…
```

The HMAC covers the island name, expiry and props: a tampered, expired, other-key or other-island
token answers 400 and the handler never runs.

## SSE

`sse(stream)` turns a stream of `Fragment::new(event, html)` into a `text/event-stream` response; the
htmx `sse` extension swaps each event into the element that names it:

```rust
async fn ticks() -> impl IntoResponse {
    sse(stream::unfold(0u32, |n| async move {
        sleep(Duration::from_millis(150)).await;
        Some((Fragment::new("tick", format!("<p>tick {}</p>", n + 1)), n + 1))
    }))
}
```

```html
<div id="feed" hx-ext="sse" sse-connect="/c/sse/stream" sse-swap="tick" hx-swap="innerHTML"></div>
```

An event name with CR or LF is dropped, and HTML lines each become one `data:` line, so content cannot
inject SSE fields. The htmx SSE extension is a separate file (`htmx-ext-sse`) bundled next to
`htmx.js`.

For fan-out to many clients (native and containers only), `Hub`:

```rust
let hub: Hub<Fragment> = Hub::new(&["feed", "room:*"]).max_per_key(4);
// GET /events/{room}:
sse(hub.subscribe(&format!("room:{room}"), &session_key)?)
// anywhere:
hub.publish("room:42", Fragment::new("msg", html))?;
```

Topics are allowlisted (exact, or `prefix:*` with a `[A-Za-z0-9_-]{1,64}` suffix); `max_per_key` caps
streams per subscriber; a lagging subscriber skips events. Native `sse` also sends a keep-alive
comment every 15 s. **Workers:** the framing compiles but there is no `Hub` and no keep-alive, and
cross-connection fan-out would need Durable Objects, which this stack does not use. Use the
`containers` target for long-lived streams.

## Datastar (optional)

htmx is the supported path. Datastar is an alternative client, and the support is only on the wire:
with the `datastar` feature, two helpers build the events its SSE protocol expects.

```toml
cascivo-server = { version = "…", features = ["datastar"] }
```

```rust
use cascivo_server::{PatchMode, patch_elements, patch_signals, sse};

sse(stream::iter([
    patch_elements("<div id=\"count\">3</div>", Some("#count"), PatchMode::Outer),
    patch_signals(&serde_json::json!({ "count": 3 }))?,
]))
```

`patch_elements(html, selector, mode)` writes a `datastar-patch-elements` event; modes are `Outer`
(default), `Inner`, `Replace`, `Prepend`, `Append`, `Before`, `After`, `Remove`. `patch_signals(&json)`
writes `datastar-patch-signals`. Both return a `Fragment` for `sse`. The boundary:

- **Not included:** the Datastar script, `data-*` attribute helpers, request-side signal parsing, the
  starter, or any test or budget coverage of Datastar pages. Load the script yourself.
- **CSP:** Datastar expressions need `unsafe-eval`. The default CSP forbids it, so you must relax
  `script-src` through `App::security_headers(Headers { csp: Some(…), ..Headers::default() })`, which
  weakens the policy for the whole app. htmx with `allowEval: false` needs no such change.
- Fragments are the same blocks as for htmx: render a block with the engine and wrap it, so the
  fragment-equals-page-subtree rule still holds.

Mixing both clients in one page is not supported.

## Security defaults

Every response gets a strict CSP with a per-request nonce, HSTS, `nosniff`, `Referrer-Policy`,
`Permissions-Policy` and `X-Frame-Options: DENY`. The CSP is `default-src 'self'; script-src
'nonce-{nonce}' 'strict-dynamic'; style-src 'self'; …; form-action 'self'`, so there are no inline
scripts or styles and htmx must run with `{"allowEval":false}` and no `hx-on`. Templates get the
nonce as `request.nonce`; `theme_script()` and `islands_script()` add it for you. Configure with
`App::security_headers(Headers { .. })` (`Headers::none()` turns them off for tests or a proxy that
sets them). There is **no response compression** on `native`: compressing pages that contain CSRF
tokens invites BREACH. Compress at the edge instead.

## JavaScript budgets

| Budget | Limit (gzip) |
| ------ | ------------ |
| Each element | 3 KB |
| cascivo page JS (elements + glue), htmx counted separately | 15 KB per page |
| Each Solid island, Solid runtime included | 10 KB |
| Worker wasm | 3 MB after `wasm-opt -Oz` |

htmx (and `htmx-ext-sse`) ships as its own file so the page budget counts only cascivo's code. The
starter measures about 6.2 KB gz per page and 4.4 KB for its island. An island over 10 KB needs a
written reason. `pnpm dynamic:check:starter` runs the conformance harness (axe after every swap,
focus, JS weight) on a fresh native starter.

## Testing

```rust
check_fragment(&engine, "notes.html", "notes", &ctx, &ReqCtx { path: "/", csrf: Some("t"), nonce: "n", ..ReqCtx::default() })?;
```

Drive the router with `tower::ServiceExt::oneshot` and send the session cookie and the CSRF token as
a browser would (the starter's `tests/views.rs` shows the sign-in, create, edit, delete flow).
`cargo clippy --all-features -D warnings` and
`cargo check -p cascivo-server --target wasm32-unknown-unknown --no-default-features --features workers`
cover the Workers build.

## Gotchas

- A block must be wrapped in `id="<block>"` and open/close exactly at the tags, or `check_fragment` fails.
- Return 422 for invalid forms; a 200 re-render hides the errors from `<cv-form>`.
- Rotate the session id at every privilege change, and reload (`HX-Redirect`) afterwards so
  `<body hx-headers>` carries the new CSRF token.
- `HX-*` request headers never choose what the server renders; use static block names.
- `!Send` Workers futures need `#[worker::send]`; `Hub` and `SqliteStore` are native only.
- Never `|safe` a user string; an `IslandKey::placeholder` fallback is trusted markup.

## Not yet covered

Deferred: Durable Objects / Queues and R2 multipart streaming on the Worker (`Hub` and `SqliteStore`
stay native-only), passkeys, magic links and rate limiting, mixing htmx and Datastar on one page.
Gaps tracked in `docs/plans/htmx-solid-gap-analysis.md` (F15-F17).
