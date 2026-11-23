# Phase 1/3 handoffs (read before starting a workstream)

## Phase 1 WS-0 (merged)
- `packages/core/src/types.ts`: `ComponentMeta.contractTier?: 'static'|'native'|'behaviour'`, `anatomy?: { root: AnatomyPart; parts?: Record<string, AnatomyPart> }`.
  `AnatomyPart`: `element`, `local?`, `data?` (full `data-*` names), `aria?`, `role?`, `children?` (`'@<unit>'` embeds a component), `when?`, `emit?`, `deprecated?`, `modifiers?: Record<local, whenExpr>`.
- Validator `scripts/contract/anatomy.ts` (class ↔ part both ways; only root data-variant/size/state must match meta). G2 (anatomy required everywhere) not yet enforced.
- `packages/css/contract.json` (`format: 1`, `units.<unit>.{name, tier, alias:'cv-<unit>', classes, anatomy?}`) and `packages/css/src/classes.gen.ts` (`classes.<camelUnit>.{root, alias, …}`, `ContractUnitName`), from `scripts/contract/generate.ts` in `regen`; `pnpm contract:check`.
- `scripts/contract/css.ts` exports `compileModule`, `contractClass`; `build-css.ts` uses them.
- Not done (WS-1): no `packages/css/package.json`, no `cv-<unit>` alias selector in CSS, no dist.
- 17 components have anatomy (button = pattern, only one with `emit:'auto'`). Tiers: 65 static, 21 native, 60 behaviour; form controls are `native`; data-table `behaviour`.
- TSX ↔ meta mismatches to fix (WS-2): badge `data-variant` info/primary missing from meta; avatar, progress, field, checkbox list states but set no `data-state`; tabs panel lacks `data-state`; toast `.icon` never rendered.

## Phase 1 WS-5 (merged)
`cv-tabs` element, ARIA tablist in cascivo-html, radio CSS removed, tabs zero drift.

## Phase 3 A (merged)
`cascivo_web::` with `default-features = false` (wasm32 builds):
```rust
Engine: Clone + Send + Sync; Engine::new(&Bundle)->Result<Engine>; Engine::from_bundle(&[u8]); #[fs] Engine::load(&Path)
fn render(&self, tpl:&str, ctx:&minijinja::Value, req:&ReqCtx)->Result<String>; fn render_block(&self, tpl, block, ctx, req)->Result<String>
fn locales(&self)->Vec<String>; fn version(&self)->u64; fn reload(&self)->Result<bool>; #[fs] fn watch(&self, Duration)->JoinHandle<()>
ReqCtx<'a>{path, locale /*"" = default*/, csrf:Option<&str>, nonce:&str, user:Option<&Value>, flash:&[Flash]} (Default)
Flash{kind, message}; Bundle{format, config, templates, messages, vite_manifest, css_modules, data}
```
- `build --bundle` writes `<site>/app.bundle` (not in public `dist/`).
- Gaps for B1: engine adds no component CSS; `theme_script`/`islands_script` add no CSP nonce; `render_block` renders the full page first.

## Phase 3 X1 (merged): checkpoint α passes
0.46 MB gz wasm; cold start p50 49.5 ms (marginal, local wrangler); warm 4.9 ms. Workers for F, Containers second; re-measure cold start on a real workers.dev deploy early in F. `!Send` binding handlers untested. Details `phase-3-x1-results.md`.

## Phase 1 WS-2 C1/C2/C3 (merged)
Anatomy: C1 43 static, C2 26 (P′ + native), C3 56 behaviour (parts only). Some TSX ↔ meta state
mismatches stay open (see each branch's last commit message). On merge, `blockquote`,
`empty-state`, `spinner` and `text` were switched from `emit:'auto'` to `'manual'`: WS-3's generator
cannot auto-emit them.

## Phase 1 WS-3 (merged)
- `crates/cascivo-html/src/contract_gen.rs`: per unit class consts, `ROOT`/`ALIAS`, `data-*` value
  enums. `tests/contract.rs` fails on any `"cv-` literal in `src/emit` (G4).
- `emit/auto_gen.rs` from `emit:'auto'`. Auto only when parts need no `aria-*` beyond
  `aria-busy`/`aria-hidden` and `when` is `'p'`/`'!p'`; else `regen` errors. Conventions at the top
  of `scripts/html-kit/gen-contract.ts`.
- `@unit` children need a hand-written fn in `emit/embed.rs` (only `spinner` exists); the unit must
  be in `cv-spec.ts` or no emitter is generated. Manual emitters use `crate::contract::<unit>::*`.

## Phase 3 B1 (merged): `crates/cascivo-server` (`publish = false`)
- `App::new(engine).with_state(s).routes(Router<S>).security_headers(Headers).toaster(tpl, block)
  .into_router()`, `.serve(addr)` (`native`).
- `View::page(tpl)` `.ctx` `.fragment(block)` `.oob(tpl, block, ctx)` `.toast(ToastKind, key)`
  `.trigger` `.status` `.push_url`; App layer renders, sends `Vary: HX-Request`.
- `Hx` extractor (`request, boosted, history_restore, target, trigger, current_url, is_partial()`);
  `see_other(&Hx, &LocalPath)`; `LocalPath::parse`; `Nonce`; `Headers` (strict CSP `{nonce}`, HSTS…).
- `Facts { locale, csrf, user, flash }` in request extensions: B3's session/auth layer fills it.
- `AppError`, `MaybeSend`, `check_fragment(engine, tpl, block, ctx, req)` (checkpoint β holds).
- No compression in `native` (BREACH with CSRF tokens). cascivo-web scripts now carry the nonce.
  wasm32 check step added to `rust.yml`.

## Phase 3 B3 (branch `claude/p3-b3-sessions`): sessions, CSRF, auth
- `App::sessions(store, SessionConfig)`, `.auth(A: Authenticator)`, `.csrf(Csrf{check_origin, header, field, origins, exempt, body_limit})`.
  Layers outer→inner: render → session → auth → CSRF → routes. Session layer fills `Facts` (request ext; response ext for a `View`).
- `trait SessionStore: MaybeSend + Sync { load(&SessionId) -> Result<Option<Record>, StoreError>; save(&SessionId, &Record, ttl: Duration); delete(&SessionId) }`
  (futures `+ MaybeSend`). F's `KvStore`: key `SessionId::storage_key()` (sha256 hex), value `serde_json(Record)`, KV `expirationTtl = ttl`.
  `Record { data: Map, csrf, flash: Vec<Flash>, created, touched }`. Built in: `CookieStore::new(&[&[u8]])` (XChaCha20-Poly1305), `MemoryStore`, `SqliteStore` (`sqlite`).
- Workers: `!Send` stores/authenticators work in workers-only builds via `util::Local` (unsafe `Send` on single-threaded wasm, `atomics` rejected).
- `Session` extractor: `get/insert/remove/flash(ToastKind, key)/rotate_id/destroy/csrf_token/oauth_begin/oauth_callback`.
- `Authenticator { type User; const LOGIN = "/login"; fn user(&Session, &Parts) }`; `User<U>`, `MaybeUser<U>`.
- `hash_password`/`verify_password(pw, Option<&str>)` (`password`, default). `LocalPath::parse_or_root`, serde `Deserialize` validates.
- For C: the island HMAC needs its own key from `APP_SECRET`; derive it like `CookieStore::new` (HMAC-SHA256 with a distinct label), do not reuse the cookie key.
## Phase 1 WS-1 (package + React switch)
- `@cascivo/css` (`packages/css`, 0.x, minor changeset). Exports: `.` → `classes` (`classes.<camelUnit>.{root, alias, <local>}`), `ContractUnitName`, `Contract*` types; `./vite` → `cascivoScopedName`, `createCascivoScopedName({ unit?: (file) => unit|undefined, locals?: 'contract'|'any' })`; `./contract.json`; `./cascivo.css` (all units, no tokens/themes); `./<unit>.css` (`./*.css` pattern). No `sideEffects` field (CSS is imported explicitly, like tokens/themes).
- dist CSS: `scripts/contract/dist-css.ts` (run by the package build). Root selectors become `:is(.cv-x-root,.cv-x)` (Q1 alias, same specificity). Only units with a known root get the alias selector (anatomy root / `root` local / local named like the unit); others get it once WS-2 adds anatomy. The Rust `assets/css` do NOT carry the alias yet (WS-3: emit `cv-<unit>` on roots + copy `packages/css/dist`).
- React switch: `scripts/contract/scoped-name.ts` (`cascivoRepoScopedName`) in `packages/react`, site, storybook and the 11 examples that alias component source. Bench apps use the `@cascivo/react` dist, so they need nothing. Gates that matched `_name_hash_line` now match `cv-*` (astro-islands, framework-install, astro-browser, react-vite-ssr, react-next).
- Solid example (WS-6): depend on `@cascivo/css` + `@cascivo/themes`; `import '@cascivo/themes/light.css'; import '@cascivo/css/cascivo.css'; import { classes as c } from '@cascivo/css'`. Vite configs in this repo need the source aliases `@cascivo/css/vite` (above) and `@cascivo/css` (as in site/storybook). Use `c.<unit>.alias` or `.root` on the root.
- G6: same-machine A/B of the site visual suite (local Chromium, 0 px tolerance): 534/534 screenshots identical between the hashed and contract builds; `progress` ×3 never stabilises in either (animated). CI `visual.yml` stays the authority.

## Phase 3 F (branch `claude/p3-f-worker`): `crates/cascivo-worker` (`publish = false`)
- `serve(req, env, |env| Router)`, `serve_router(req, env, &Router)` (cache in a `OnceLock`), `serve_with(req, env, Bindings{d1, r2}, &Router)`; `worker::Env` goes in request extensions.
- `KvStore::new(&env, "SESSIONS")` / `KvStore::with_backend(impl KvBackend)`: key `storage_key()`, JSON `Record`, `expirationTtl = max(ttl, 60)`; corrupt record = new session.
- Extractors `Env`, `D1` (`d1`, binding `DB`), `R2` (`r2`, binding `BUCKET`) → 500 when missing. `R2::upload(&Upload{max_bytes, types, prefix}, ct, bytes) -> Stored` (413/415/400 via `AppError`).
- Handlers awaiting bindings need `#[worker::send]`. No change to `cascivo-server` was needed.
- CI (`rust.yml`): wasm32 build + clippy for `cascivo-worker`. Spike rebuilt; numbers in `phase-3-x1-results.md` (0.74 MB gz, edge startup 2 ms).
## Phase 3 B2 + D2 cv-form (branch `claude/p3-d2-forms`)
- `cascivo_server::{Form<T>, Submission::{Valid(T), Invalid(FormState)}, Validate { const RULES: &[(&str, Rule)]; fn validate(&self, &mut FormErrors) }, Rule::{text,email,url,number,checkbox}().required().min_len().max_len().min().max(), FormErrors::{add, add_form}, Msg::new(key).arg(k, v), FormState::{new::<T>(), values(serialize), errors, id_prefix}, parse_form}`. Modules `forms.rs`, `form_view.rs`.
- Template: `form.field(name, label, hint, kind, options, rows, type, placeholder, value)`, `form.csrf()`, `form.errors()`, `form.value(n)`, `form.valid`. Control ids `f-<name>`. Return 422 on `Invalid`.
- i18n keys `cascade.form.<ValidityState flag>`; the server puts the translated text on each control as `data-cv-msg-<kebab flag>`, so `<cv-form>` shows the server's words.
- `@cascivo/elements/form` (`cv-form`, 1.2 KB gz): renders the field error markup on `invalid` (no browser bubble, no `novalidate`), clears it on a valid input, focuses the first `[aria-invalid=true]` on connect and `htmx:afterSettle`, `aria-busy` double-submit guard (cleared on `htmx:afterRequest`/`pageshow`), swaps 422 in `htmx:beforeSwap`. H's starter therefore needs no `responseHandling` meta for 422 inside a `cv-form`.
