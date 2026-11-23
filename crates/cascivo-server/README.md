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

## Sessions, CSRF, auth

```rust
let app = App::new(engine)
    .sessions(CookieStore::new(&[secret.as_bytes()])?, SessionConfig::default())
    .auth(MyAuth) // impl Authenticator { type User; async fn user(&self, &Session, &Parts) }
    .routes(router);
// Login handler: verify_password(pw, row.map(|r| r.hash)) → s.rotate_id(); s.insert("uid", id)?;
//                see_other(&hx, &LocalPath::parse_or_root(form.next.as_deref()))
```

- Stores: `CookieStore` (encrypted, stateless, key list for rotation), `MemoryStore`,
  `SqliteStore` (`sqlite`), or your own `SessionStore` (records keyed by
  `SessionId::storage_key()`). Cookie `__Host-cv-session; HttpOnly; Secure; SameSite=Lax;
Path=/`; idle and absolute TTLs; unknown ids are never adopted; `rotate_id()` on login,
  `destroy()` on logout.
- CSRF on every unsafe method: `Sec-Fetch-Site`/`Origin` must be same-origin, and with sessions
  the token (`request.csrf`) must arrive as form field `csrf` or header `X-CSRF-Token`
  (`hx-headers` on `<body>`). `Csrf { exempt: vec!["/hooks/*"], .. }` opts routes out.
- `Session::flash(kind, key)` shows on the next rendered page (`flash` in templates).
- `User<U>` redirects anonymous visitors to `Authenticator::LOGIN?next=…`; `MaybeUser<U>`.
- `hash_password`/`verify_password` (Argon2id, `password`); `Session::oauth_begin` /
  `oauth_callback` (state + PKCE S256) for OAuth providers.

Features: `native` (default: tokio, `App::serve`), `password` (default), `sqlite`, `workers` (Cloudflare Workers, wasm32, no
tokio; `MaybeSend` drops `Send` without `native`). Check:
`cargo check -p cascivo-server --target wasm32-unknown-unknown --no-default-features --features workers`.

## Forms and validation

```rust
#[derive(Deserialize)]
struct Todo { title: String, prio: Option<u32> }

impl Validate for Todo {
    // Checked on the raw values first, and rendered as constraint attributes.
    const RULES: &'static [(&'static str, Rule)] =
        &[("title", Rule::text().required().max_len(80)), ("prio", Rule::number().min(1.0))];
    fn validate(&self, e: &mut FormErrors) { /* server-only checks: e.add("title", Msg::new("todo.taken")) */ }
}

async fn create(hx: Hx, Form(s): Form<Todo>) -> Response {
    match s {
        Submission::Valid(t) => see_other(&hx, &LocalPath::parse("/todos").unwrap()),
        Submission::Invalid(form) => View::page("todos.html").fragment("todo_form")
            .ctx(context! { form }).status(StatusCode::UNPROCESSABLE_ENTITY).into_response(),
    }
}
```

The template gets `form` (`FormState::new::<Todo>()` for an empty form, `.values(&todo)` to
prefill): `form.csrf()`, `form.errors()`, `form.value(name)`, `form.valid` and
`form.field(name, label=…, hint=…, kind="input|textarea|select|checkbox", options=…, rows=…)`.
`field` renders through the cascivo-html `field` + control emitters (`aria-invalid`,
`aria-describedby` → the `role="alert"` error, the submitted value kept) and adds the rule's
constraint attributes and one translated `data-cv-msg-<flag>` per constraint for `<cv-form>`.

Messages are i18n keys resolved with the request locale: built-ins are
`cascade.form.<ValidityState flag>` (`valueMissing`, `typeMismatch`, `tooShort` `{min}`,
`tooLong` `{max}`, `rangeUnderflow` `{min}`, `rangeOverflow` `{max}`, `badInput`), with English
defaults (`DEFAULT_MESSAGES`) when the app's `i18n/<locale>.toml` has no `[cascade.form]`.
A serde failure is `badInput` on its field; empty values are dropped before serde, so an
empty `Option` is `None` and an empty required `String` is `valueMissing`. Only urlencoded
bodies (415 otherwise, 413 over 64 KB); the CSRF layer checks the `csrf` field first.
