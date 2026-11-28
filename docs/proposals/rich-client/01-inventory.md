# Rich-client inventory: what cascivo already has

Scope: analysis only. Goal: judge how close cascivo is to supporting React/Angular-class rich client web apps.
Evidence comes from two read-only source sweeps. Paths are relative to the repo root; `packages/` paths are shortened (e.g. `core/src/machine.ts` = `packages/core/src/machine.ts`).

## 1. Headline findings

- cascivo is stronger than the brief assumed. `@cascivo/app` (not in the original list) already ships a signal-based router, a typed API client, file-based routes, realtime sync (Durable Objects), auth, D1 and flags.
- Real gaps: no query/cache/mutation layer, no React form-state library, no devtools, no hydration/streaming story, no offline queue, no published test helpers.
- Rust crates are a server-driven HTML stack (axum + htmx + SSE + islands), not a client framework. None has a client router, data layer, offline support or devtools.
- Differentiators are real: one framework-neutral `cv-*` markup contract, signals everywhere, the `.cv` compiler, a Rust toolchain, an AI-first registry, and a measured React-vs-htmx comparison.

## 2. JS/TS packages

| Package | What it gives a rich client today | Missing |
|---|---|---|
| `core` | Signals: `signal/computed/effect/batch`, `useSignal/useComputed/useSignalEffect/useSignals` (`core/src/signals.ts`). FSM: `createMachine/useMachine` (`machine.ts:6-8`), pure `transition` (`fsm.ts:14`, `./pure` has no React). Scope: `createScope/useScope` (`scope.ts`). Bridges: `useControllableSignal`, `useSignalState`, `useEffectPropSignal`, `useDisclosure`. Persistence: `persistedSignal` (`persisted-signal.ts:37`, SSR-safe) + drivers (`drivers.ts`). Theme: `ThemeProvider`, `themePreloadScript` (`theme.tsx`). Boundaries: `ErrorBoundary`, `SuspenseBoundary`, `Portal`, `Presence`, `FocusScope`, `DismissableLayer`. Hooks: media query, scroll lock, clipboard, infinite scroll, drag, resize/mutation/intersection observers, typeahead, roving focus, anchor position, stream buffer. `announce` live region. Router-agnostic link seam (`link.ts`). | Async resource / query / mutation primitive. Form state and validation. Global store convention. Hydration helpers. Test utils. Devtools. |
| `react` | About 156 components re-exported from `components/src/*` (`react/src/index.ts:41`): Button, Input, Form, DataTable, Combobox, DatePicker, Modal, Menu, CommandMenu, Toast, Tabs, FileUploader and more. Core primitives re-exported (parity test `scripts/checks/path-b-parity.test.ts`). CSS-free SSR builds via `node` and `react-server` export conditions (`docs/USING-WITH-VITE-SSR.md`). | No form or data hooks. `<Form>` (`components/src/form/form.tsx`) is UI only. Hydration/streaming guidance stops at "SSR renders". Testing is documented (`docs/TESTING.md`) but no helpers ship. |
| `app` (`@cascivo/app`) | Router: `createRouter/route/lazyRoute/RouterView` (`app/src/router.tsx:117,34,43,229`), signals for `pathname/search/match`, `navigate`, `Link`, base path, view transitions (`router.tsx:60-93`), typed params (`path.ts`). Typed API: `defineApi/endpoint/stream` (`contract.ts`), `createClient` (`client.ts:59`), `createHandler` (`server.ts`, Worker). File routes: `vite.ts`. Realtime: `sync.ts` (`connectRoom`, shared signals/maps on a Durable Object), `live.ts` (`defineLive/watchLive`). Also jobs, uploads, `db.ts` (D1: `defineTable/queryTable/migrate`), `auth.ts:74` + `auth-client`, OAuth, `flags.ts`, `guard` (rate limit, Turnstile, webhooks), analytics, export. | README: no nested layouts, no data loaders, no server rendering. No route guards, no route-level prefetch, no query cache or invalidation. |
| `data` | `parseSSE/formatSSE`, `fetchSSE`, `HttpError` (`data/src/index.ts`). | No fetch cache, dedupe, retry or invalidation. |
| `solid` | `defineIsland` (`solid/src/island.ts:20`, htmx-aware mount), `createForm` (`form.ts`, 422 field-error model), `createI18n`, `createTheme`, `fromSignal` (`signals.ts:13`), 8 components, `./vite`, `./elements`, `./testing` (`mountIsland`, `testing.ts:13`). | Islands, not an app framework. Only 8 components. No router or query. `createForm` has no schema or dirty/touched state. |
| `elements` | Light-DOM custom elements (`elements/src/*.ts`): form, combobox, command-menu, data-table, date-picker, dialog, drawer, menu, multi-select, tabs, tags-input, toaster, tooltip, theme. Base classes `CvElement/CvFormElement` (`base.ts:28,71`), `define()` (`base.ts:174`). `/htmx` glue (`htmx.ts:27 install()`): focus restore after swap, `HX-Trigger` dialog-close and toast, Idiomorph defaults. | Progressive enhancement for server HTML, not a client runtime. No data or routing. |
| `css` | `docs/CONTRACT.md`: `cv-<unit>-<local>` classes, `data-*` variants/states, `@layer cascivo.component`. `contract.json` (+ baseline), typed `classes` map (`css/src/classes.gen.ts`), 3 tiers static/native/behaviour (`src/contract.ts`), Vite scoped names (`src/vite.ts:54`). | Style and markup only, by design. |
| `render` | `validateView`, `CascivoView` (`render/src/cascivo-view.tsx`): JSON view to React. A2UI v0.9 surface, store, two-way binding, `webmcp.ts`. Schemas `schema/view.v1.json`, `catalog.v1.json`. | Agent-driven UI renderer, not an app runtime. Its data-model store is A2UI-specific. |
| `storage` | Re-exports `persistedSignal` + drivers; adds `indexedDBDriver` (`storage/src/indexed-db.ts:5`). | Key/value only. No offline queue, service worker, cache persistence. |
| `i18n` | `createLocale`, `defineCatalog/defineMessages/t`, `format*` (bytes, date, list, number, relative time), plurals, `builtin` catalog. | No lazy catalog loading, no route-aware locale. |
| `icons` | 445 SVGs, per-icon exports, `create-icon.tsx`. | Assets only. |
| `charts` | 31 chart types, scales/stacked/voronoi engine, SSR determinism test (`charts/ssr-determinism.test.tsx`). | No data-fetch binding. Streaming charts need an externally fed buffer. |
| `tokens` / `themes` | DTCG tokens, `style-contract.json`, 17 CSS themes with parity and palette tests. | Static CSS. |
| `cli` | `add, init, create, eject, drift, doctor, audit, list, registry, search, theme, tokens, update, view, mcp, email, app, generate, template-init` (`cli/src/commands/`), `cmdspec.json`, scaffolds, recipes, `audit-ai/`. | Scaffolding and distribution, not a build tool. Build is Vite (`vite-plugin`, `css/vite`, `app/vite`). |
| `registry` | `buildRegistry`, validators, shadcn export (`shadcn.ts`), advisories. | Component metadata only. |
| `mcp` | Tools for registry, scaffold, validate, theme, tokens, icons, email lint, deploy preview, guides. | Authoring-time only, no app runtime. |
| `skills/` | 12 skills, each with `SKILL.md`: add, add-template, create-theme, design-page, email, extend, html, migrate-from-shadcn, server, tui, web, share-preview. | Agent instructions only. No skill for building a rich client app. |
| layouts / blocks | app-shell, dashboard, settings, auth, split-view layouts; login-page and settings-form-page blocks. | No form state; validation is left to the app. |
| `ai` | `ai-chat.tsx`, `ai-label.tsx`. | Chat UI only. |

## 3. Rust crates

| Crate | What it gives a rich client today | Missing |
|---|---|---|
| `cascivo-html` (`.cv`) | 51 static elements + 7 SVG charts (`docs/USING-CASCIVO-HTML.md:57`). One node per line, `key=value`, flags, `3x` repeat, aliases, `@title/@brand/@lang` (`src/ast.rs:9-14`). Catalog-validated with "did you mean" (`catalog.rs`). Deterministic single-file output. Per-component `ClientJs` level (`catalog.rs:58`). | Doc says "Static output only: no forms, no live data, no event handlers" (`:18`). No signals, handlers, components, imports, loops, expressions. Values limited to Str/Num/Bool/Pairs/Nums/Rows (`ast.rs:36-43`). |
| `cascivo-html-cli` | `render/check/guide`; exit 1 invalid, 2 usage (`src/main.rs:10-37`). | No watch or dev mode. |
| `cascivo-web` | Static sites: Markdown, TOML collections, minijinja (`src/lib.rs:1-16`). File routes with `[param]` (`routes.rs:23-171`). Dev server + live reload (`dev.rs:65`). i18n, images, RSS, highlighting. Hot-reload `Engine` (`engine.rs:42,287`), block rendering (`:333`). Islands loader (`islands.rs:11,62`). axum router, Vite integration. | No client routing. Data only from content collections (`data.rs:8`). |
| `cascivo-server` | `View` returns full page or one named block, plus OOB swaps, toasts, triggers, `push_url` (`view.rs:49-110`). `check_fragment` (`view.rs:252`). `Hx` extractor (`hx.rs`). `Form<T>`, `Validate`, per-field `FormErrors` with i18n keys (`forms.rs:63-327`). `FormState` re-render (`form_view.rs:37-99`). Multipart, sessions (cookie/memory/sqlite), CSRF, flash, auth + OAuth + Argon2, strict CSP with nonces. SSE `Hub` fan-out (`sse.rs:15,167-293`) with Datastar patches. HMAC-signed expiring server islands (`islands.rs:64-182`). Tests in `tests/`. | `Hub` is native only. No client data cache, optimistic updates, offline or cross-route client state; state is the server session. |
| `cascivo-worker` | Cloudflare adapter: `serve()` (`src/lib.rs:1-19`), KV sessions (`kv.rs`), D1/R2 extractors (`r2.rs`). | Thin. No Durable Object abstraction in the crate; the demo's DO lives in `apps/examples/track-lite-htmx/worker/src/lib.rs`. |
| `cascivo-tui` | Elm-style `App/Cmd` (`src/app.rs:1-25`), keymaps, focus, layout, class-to-style, themes, headless `testing.rs`. | Not a web client. Shows "same tokens, other target". |
| `cascivo-blitz` | `.cv`/HTML to native window (`src/lib.rs:1-40`). Signals: `Signal/computed/effect/batch/untracked` (`reactive.rs:109-300`). `.on(selector, Event, fn)` (`app.rs:264`), `bind_text/attr/class` (`:274-296`). Native sort, tabs, details, dialog (`behaviors.rs`). Headless `InteractiveDocument` (`app.rs:480-627`, `tests/interactive.rs`). | Selector-based, not component-based. No lists or conditional bindings. Handlers are Rust, not `.cv` syntax. Desktop only. |

## 4. Examples and apps

| App | Purpose | Rich-client relevance |
|---|---|---|
| `track` | Keyboard-first issue tracker (React, `@cascivo/storage`) | Largest local-first style React demo |
| `track-lite` | Slice of `track`, twin of the htmx version; module signals, `LiveStatus.tsx` | Comparison baseline |
| `track-lite-htmx` | Same slice on axum + htmx + elements + one Solid island | See deep dive below |
| `solid-htmx` | Minimal axum + htmx + one Solid island | Smallest contract demo |
| `pulse`, `trade`, `pay`, `deploy`, `flow` | Real-time dashboards (React + charts) | Dense data UI |
| `stage` | Live Q&A on Durable Objects (Preact + `@cascivo/app`, 51 files) | Router + sync in practice |
| `chat` | Streaming AI chat on Workers AI (`@cascivo/ai`, `@cascivo/data`) | SSE client |
| `react-vite`, `react-next`, `react-vite-ssr` | Integration examples (Vite, Next App Router, SSR) | SSR proof |
| `astro-islands`, `ghost-theme`, `json-playground` | Island CSS-survives-SSR probe, Ghost theme, JSON-to-UI | Contract reuse |
| `registry-starter`, `template-starter`, `kit` | Third-party publishing, shared utils | Ecosystem |
| `bench` | Same app in cascade, shadcn/ui, Carbon; agent benchmark (`apps/bench/agent`, `METHODOLOGY.md`) | Credibility asset |
| `live` | Presence-only `@cascivo/app/sync` room on a Durable Object, with limits | Sync in production |

### track-lite-htmx vs solid-htmx

| Concern | track-lite-htmx | solid-htmx |
|---|---|---|
| Architecture | axum `server/src/lib.rs` (`build()` at `:454`, routes `:477-487`). Worker variant with a per-visitor Durable Object (`worker/src/lib.rs`). | axum `server/src/lib.rs` (106 lines), partials `templates/c/*.html`, `conformance.rs` |
| Routing | One page; server routes only | One page |
| Data | In-memory `Store` + simulated teammate (`lib.rs:88-175`) | None |
| Forms | `create` (`:283-320`): Valid or Invalid; 422 + fragment; OOB list, `cv-dialog-close`, toast; 303 without JS | `c/form.html` |
| State | Server session + `Hub`. Client state is one island signal (`src/live.tsx:11-39`). | One Solid signal (`src/island.tsx:14-30`) |
| Live updates | `hx-ext="sse"` (`templates/issues.html:21-29`); `X-Client-Id` drops own events (`src/htmx.ts:7-19`) | `c/sse.html` |
| Island hydration | `data-island/data-client/data-src` markup, loader (`cascivo-web/src/islands.rs:62`), `defineIsland`. Client-only mount over server fallback; no serialized state. | Same pattern |
| Tests | `server/tests/smoke.rs`: page+CSP, create, 422, advance/delete, CSRF, SSE | `smoke.rs` (154 lines) |
| Measured | `docs/COMPARE-REACT-VS-HTMX-SOLID.md`, `pnpm compare:react-vs-htmx` | n/a |

## 5. Gap matrix (rich-client capability vs today)

| Capability | Today | Where | Gap size |
|---|---|---|---|
| Router | Signal router, typed params, lazy routes, view transitions, file routes | `app/src/router.tsx` | Medium: no nested layouts, loaders, guards |
| Data / query layer | Typed API client; SSE helpers | `app/src/client.ts`, `data/` | **Large**: no cache, dedupe, invalidation, optimistic updates |
| Forms | Server-driven forms (Rust); Solid `createForm`; UI `<Form>` | `cascivo-server/src/forms.rs`, `solid/src/form.ts` | **Large** for React/client: no schema, dirty/touched, shared validation |
| Cross-route state | Module signals, `persistedSignal`, `createScope`, `app/sync` | `core/src/scope.ts` | Medium: no route-scoped lifecycle or store convention |
| SSR / hydration | SSR-safe builds; `check_fragment`; islands mount client-only | `docs/USING-WITH-VITE-SSR.md`, `view.rs:252` | Large: no hydration or streaming API; `app` has no SSR |
| Offline | Storage drivers incl. IndexedDB | `storage/src/indexed-db.ts:5` | **Large**: no queue, service worker, cache persistence |
| Realtime | DO rooms, SSE hub | `app/src/sync.ts`, `cascivo-server/src/sse.rs` | Small: already a strength |
| Auth / backend | Auth, OAuth, D1, jobs, uploads, flags | `app/src/auth.ts:74`, `db.ts` | Small |
| Testing | Vitest docs; Solid `mountIsland`; Rust `oneshot`, Blitz and TUI headless harnesses | `docs/TESTING.md`, `solid/src/testing.ts:13` | Medium: no React helpers, no e2e harness |
| Devtools | Live reload only; `workbench` is a component workbench | `cascivo-web/src/dev.rs:65` | **Large**: no signal/route/query inspector |
| Build | Vite plugins; Rust compilers for `.cv` and sites | `vite-plugin`, `app/src/vite.ts` | Medium: no bundler of its own (fine) |
| UI components | 156 React, 8 Solid, 14 elements, 51 `.cv` | `react/src/index.ts` | Small |
| i18n / a11y / theming | Strong | `i18n`, `themes`, authoring rules in `CLAUDE.md` | Small |

## 6. Reusable assets that could differentiate

| Asset | Why it matters for rich clients | Pointer |
|---|---|---|
| Framework-neutral `cv-*` contract | One markup/CSS contract emitted by React, Solid, htmx, `.cv`, Blitz; conformance-tested. Lets an app change framework or render target without restyling. | `docs/CONTRACT.md`, `css/contract.json`, `conformance.rs`, `smoke.rs:60` |
| Signals everywhere | Same reactive model in `core`, `solid` bridge, and Rust (`cascivo-blitz`). A natural base for a query/store layer. | `core/src/signals.ts`, `reactive.rs:109-300` |
| Micro-FSM (pure + React) | Deterministic, testable component logic with no React in `./pure`. | `core/src/fsm.ts:14`, `machine.ts` |
| `.cv` language | Deterministic, validated, AI-safe compile target with diagnostics; could grow into handlers and components. | `cascivo-html/src/catalog.rs`, `parse.rs` |
| Rust toolchain | Fast compile, single-binary tooling, native (Blitz) and TUI targets from one design system. | `crates/` |
| `check_fragment` and One-View-two-shapes | Guards against hydration drift without hydration; compact alternative to client data fetching. | `cascivo-server/src/view.rs:49-110,252` |
| Signed server islands, strict CSP, 303 no-JS forms | Rare security and progressive-enhancement story. | `cascivo-server/src/islands.rs:64-182`, `headers.rs` |
| Sync rooms on Durable Objects | Realtime multi-user state with little code, in production at `apps/live` and `stage`. | `app/src/sync.ts` |
| AI-first registry, MCP, skills, audit | Components generated from `.meta.ts`; agents scaffold and validate; `audit-ai`; agent benchmark in `apps/bench/agent`. | `registry.json`, `mcp/`, `skills/`, `cli/src/audit-ai/` |
| Measured comparison | React vs htmx+Solid, same app, LOC and throttled CPU. | `docs/COMPARE-REACT-VS-HTMX-SOLID.md` |

## 7. Observations for the proposal (not decisions)

- Rich-client pieces are split across `core`, `app`, `solid`, `elements` and the Rust crates. No single doc says how they fit together.
- The cheapest high-value gaps sit on top of existing signals: an async resource/query primitive, form-state hooks, route loaders in `app`. The router and client already exist to build on.
- The Rust side already has the server half of a "hypermedia rich client" (fragments, forms, SSE, islands). Its weak spot is client state across navigations and offline.
- `.cv` is static by design. Adding handlers and signals would overlap with `cascivo-blitz`; that is a scoping decision for the proposal.
- Caveats: the sweeps did not examine `editor`, `flow`, `search`, `text`, `theme-kit`, `workbench`, `astro` or `email*` in detail. Line numbers outside those quoted by the sweeps are file-level.
