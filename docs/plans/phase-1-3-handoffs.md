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
