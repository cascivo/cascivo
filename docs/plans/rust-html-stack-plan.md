# Rust + HTML-first stack: plan

Status: Phase 0 (de-risk) done; go for Phase 1. Criterion 6 (tool vs product) awaits the owner. Origin: analysis of (1) a Rust, Astro-class framework and
(2) an HTML/CSS-first stack (htmx, custom elements). Both converge on one architecture.

## Target architecture

```
.meta.ts (source of truth)
  ├─ @cascivo/css        unhashed cv-* classes + data-* attrs (stable markup contract)
  ├─ React components    (unchanged, become one adapter)
  ├─ cascivo-html (Rust) typed component emitters → static HTML
  │    └─ cascivo-web    routes, layouts, content collections, Markdown directives,
  │                      assets, i18n; adapters: static export, axum::Router, workers-rs
  └─ @cascivo/elements   light-DOM custom elements (behaviour only) on @cascivo/core/pure
```

Non-goals: MDX, mixed-framework islands, React SSR from Rust, Rust→wasm UI, Astro parity.

## Kill criteria (revised)

| # | Criterion | Gate |
|---|---|---|
| 1 | React and Rust markup drift | parity test: normalised HTML diff per fixture, CI-enforced |
| 2 | Elements fail a11y sweep or exceed 1.5× React LOC | pilot on combobox, date-picker, menu |
| 3 | Behaviour JS too heavy | ≤ 3 KB gz per element, ≤ 15 KB gz per page |
| 4 | Dev loop slow | content/template edit → rendered page < 1 s without `cargo` rebuild |
| 5 | Not simpler than Astro + cascivo | same site built both ways, measured |
| 6 | No adopter | owner decision: personal tool (cascivo.com dogfood) or product |

## Phase 0: de-risk (this PR)

Three workstreams, independent, merged into one PR.

### W1. Parity harness (criterion 1)
- `scripts/parity/`: render fixtures for 10 components shared by React and cascivo-html
  (button, badge, card, alert, avatar, separator, progress, tabs, breadcrumb, stat) with
  `react-dom/server`; render the same fixtures through cascivo-html.
- Normalise (whitespace, attribute order, CSS-module hash → contract class, generated ids) and
  diff element tree + roles + aria-* + data-* + class contract.
- Vitest test fails on drift; an allowlist file records known, justified differences.
- Output `docs/plans/rust-html-stack-results.md` § Parity: drift found per component.

### W2. Elements pilot (criteria 2, 3)
- New package `packages/elements` (`@cascivo/elements`, private until Phase 2): light-DOM
  custom elements `cv-menu`, `cv-combobox` (form-associated), `cv-date-picker`
  (form-associated), enhancing the same markup and CSS as the React components; logic on
  `@cascivo/core/pure` (FSM + signals-core), strings via `@cascivo/i18n`.
- Events: `cv-value-change` (detail `{ value }`), `cv-select`; native `change`/`input` for
  form-associated elements. Idempotent `define()`; ships a Custom Elements Manifest.
- Tests: behaviour + keyboard (Vitest browser or Playwright), axe, 320–414 px touch-target
  sweep, htmx-swap survival (element state survives idiomorph morph with stable id).
- Size-budget check script (gzip per element and per pilot page).
- Results § Elements: a11y status, LOC vs React, sizes.

### W3. cascivo-web spike + Astro comparison (criteria 4, 5)
- New crate `crates/cascivo-web` (library) + binary: content collections (folder + serde
  schema), Markdown (pulldown-cmark/comrak) with component directives (`::card{title=x}`)
  rendered via cascivo-html, file-based routes + layouts, sitemap, `build` → `dist/`,
  `dev` server with live reload, templates/content as runtime data.
- `axum` adapter behind a feature (`cascivo_web::router(site)`), one integration test.
- Same 20-page fixture site under `apps/bench/static-compare/{astro,rust}` built with
  Astro + `@cascivo/astro` and with cascivo-web.
- Measure: cold build, edit→render latency, output bytes, page JS, Lighthouse (if available),
  deploy steps, authored LOC. Results § Static.

### Exit
All gates green (`pnpm ready`, cargo test/clippy). Results file records pass/fail per criterion
and a go/no-go recommendation for Phase 1.

### Phase 0 results

Details: `rust-html-stack-results-w1.md`, `-w2.md`, `-w3.md`.

| # | Result | Verdict |
|---|---|---|
| 1 | 9/10 components zero structural drift; tabs diverges by design (Rust CSS-only radios vs React JS tablist), allowlisted | pass; `cv-tabs` must pick one contract |
| 2 | axe WCAG 2.2 AA 0 violations, APG keyboard suites, 320–414 px touch sweep, idiomorph morph survival; 0.40× React LOC (subset: editable combobox, typeable date picker) | pass |
| 3 | menu 1.1 KB, combobox 1.4 KB, date picker 3.05 KB gz (20 B headroom); page 8.8 KB | pass; date picker needs a split before growing |
| 4 | edit→render 22 ms median in dev | pass |
| 5 | 20-page site: build 6 ms vs 2.8 s, 71 KB vs 402 KB, 70 vs 145 authored LOC, 20 crates vs 920 npm packages; spike lacks images, i18n, RSS | pass with caveat |
| 6 | open | owner decision |

Side fixes found by the sweeps (also affect React): Menu trigger 24 px on coarse pointers; DatePicker
calendar overflowed at 320/360 px (now a bottom sheet below 30rem).

## Later phases (not in this PR)

1. Contract (2–3 w): `@cascivo/css` generated from meta; CSS modules map onto it; `anatomy`
   in `.meta.ts` generates Rust emitters; parity covers every presentational component.
2. Static MVP (6–8 w): cascivo-web images, i18n, RSS, Cloudflare static deploy;
   cascivo.com built on it (dogfood).
3. Dynamic (6–10 w): axum middleware, actions, sessions, server islands; workers-rs adapter
   (KV/D1/R2); Containers template; htmx/Datastar guides. Checkpoint: criterion 6.
4. Behaviours: port remaining client-JS components to elements via the factory backlog;
   optional React-island loader.
