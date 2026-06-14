# v22 Master Plan — Demos On-Domain (integrate the five showcase apps into the landing)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-14-v22-tranche-1.md` … `2026-06-14-v22-tranche-5.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For any visual surface, also
> use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint.
>
> **Re-verify each named file/route/count/command/export at tranche start. If absent or different, STOP
> and re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V22.md` — make the five v21 demo dashboards (Cascade
Deploy/Pay/Flow/Track/Pulse) reachable and persuasive from the landing site **on the same origin**.
Assemble each demo into the landing's build output under `/demos/<name>/`, add a `/examples` marketing
hub plus a `/examples/<name>` detail page per demo, wire the homepage gallery's dead links, generate
deterministic screenshots, and consolidate CI so the landing's single Cloudflare Pages deploy carries
everything. No new components, no new runtime deps, no server, no Cloudflare routing config.

**Architecture:** Changes live in `apps/landing/**` (new pages, hub, vite assembly), `apps/examples/*`
(relative `base`, README/spec touch-ups), `scripts/` (assembly + screenshot scripts), and
`.github/workflows/cf-pages.yml` (fold five `deploy-*` jobs into `deploy-landing`, widen the `landing`
paths-filter, drop redundant jobs/vars). No `@cascivo/*` package source changes.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM side effects, never `useEffect`/`useState`/`useContext`). Vite + `vp`.
Mobile-first, token-based CSS. `@cascivo/i18n` for strings. Playwright for screenshots + e2e.

---

## Research findings (ground truth — verified 2026-06-14)

### Current-state facts (re-verify at use)

- **Five demos exist** under `apps/examples/`: `deploy`, `pay`, `flow`, `track`, `pulse` (packages
  `@cascivo/example-deploy|pay|flow|track|pulse`), plus the shared `@cascivo/example-kit`
  (`apps/examples/kit/`). Each is a Vite + `vp` SPA: `dev`/`build`/`preview`/`test`/`check` scripts; a
  `vite.config.ts` aliasing every `dist`-exporting `@cascivo/*` package + `@cascivo/example-kit` to its
  `src` entry; `src/main.tsx` mounts `<App/>` on `#root` under `React.StrictMode`.
- **No internal client routing** in any demo (no `pushState`, no router) — verified. They are
  single-page; relative-base assembly is safe.
- **No demo sets a Vite `base`** today (defaults to `/`).
- **Theme/state persistence:** demos use `@cascivo/storage` `persistedSignal` with app-prefixed keys
  (e.g. `deploy.theme`). Once all five share the `cascivo.com` origin they share `localStorage`/
  IndexedDB — prefixes must be confirmed unique across all five (T1).
- **Landing** (`apps/landing/`, `@cascivo/landing`): React SPA, hash-free path routing in `src/App.tsx`
  via a `ROUTES` record keyed by pathname (`/`, `/accessibility`, `/performance`, `/guides`, `/og`).
  Pages are `React.lazy` chunks under `src/pages/`; home sections under `src/sections/`.
- **`ExamplesGallery`** (`apps/landing/src/sections/ExamplesGallery.tsx`): renders five cards from a
  local `EXAMPLES` array; every card's `href` is `'#'` with `aria-disabled="true"` and a "Mock demo"
  note. This is the dead link v22 fixes.
- **SEO / prerender pipeline:** `src/route-head.ts` holds `ROUTE_HEAD` (per-route title/description/
  ogTitle), `PRERENDER_ROUTES` (`['accessibility','performance','guides']`), `SITE_URL =
  https://cascivo.com`, and `canonicalFor()`. `src/seo.ts` applies heads at runtime. `vite.config.ts`'s
  `prerenderHeads()` plugin (a `closeBundle` step) copies the built shell into `dist/<route>/index.html`
  with rewritten head tags, and writes `dist/404.html` (SPA fallback, `noindex`). `public/sitemap.xml`
  is a static file. **CF Pages serves real files first, falling back to `404.html`** — so a new real
  file at `dist/demos/deploy/index.html` is served directly; a new prerendered `dist/examples/index.html`
  is served for `/examples`.
- **Landing build:** `vp run @cascivo/landing#build`. The landing's `vite.config.ts` aliases
  `@cascivo/{core,storage,i18n,ai,render,icons,registry}` → source, and aliases `react-dom/client` →
  `react-dom/profiling` (for the SignalsDemo profiler). The landing does **not** import the demo apps;
  demos are built separately and copied in (so no new aliases needed in the landing config).
- **CI deploy:** `.github/workflows/cf-pages.yml` — a `changes` job (dorny/paths-filter) emits per-app
  booleans, then one `deploy-<app>` job per app runs `pnpm exec vp run @cascivo/<app>#build` and
  `npx wrangler pages deploy <dist> --project-name=<CF_PROJECT_*>`. Jobs exist for docs, landing,
  storybook, playground, **deploy, pay, flow, track, pulse** (the five to fold in). The `landing` filter
  currently watches `apps/landing/**`, `packages/tokens/**`, `packages/themes/**`, `pnpm-lock.yaml`.
- **Header/Footer cross-app links:** `Header.tsx` `NAV_LINKS` includes `{ label: 'Examples', href:
  '/#examples' }` (homepage anchor today). `Footer.tsx` includes `{ label: 'Examples', href:
  '/#examples' }`. Both become `/examples` in T2.
- **Screenshot precedent:** `apps/landing/scripts/gen-og.mjs` + the `og:generate` script
  (`vp preview --port 4180 & … node scripts/gen-og.mjs`) is the existing pattern for build-time browser
  capture. Per-app Playwright specs + axe live in each demo (v21 T6).

### The collision (why `/demos/*` ≠ `/examples/*`)

A landing SPA route `/examples/deploy` (prerendered to `dist/examples/deploy/index.html`) and a live
assembled app at `dist/demos/deploy/index.html` would collide if both used `/examples/deploy`. Mounting
the **live apps under `/demos/<name>/`** and the **marketing pages under `/examples/<name>`** keeps the
two file trees disjoint. Confirm there is no `dist/examples/<name>/` directory created by the assembly
step — only `dist/demos/<name>/`.

### Best-practice synthesis (2026 — informs the work, not literal copy)

- **One-click proof beats prose.** The homepage already pitches; v22's job is to make the "see it"
  path frictionless and same-origin. Hub → detail → live demo, all on `cascivo.com`.
- **Static screenshots for marketing, live app one click away.** Detail pages load fast (static images,
  no embedded heavy SPA) and the "Open live demo" CTA hands off to the real, drivable app.
- **Relative base is the portability primitive.** A `base: './'` SPA with no client routing runs at any
  mount path; it is the simplest correct way to assemble-and-serve.

## Tranche map

| Tranche | Title                                            | Outcome                                                                                  |
| ------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| T1      | Mount-portability + assembly pipeline            | `base:'./'` ×5, `scripts/assemble-demos.mjs`, storage-key audit, local end-to-end preview |
| T2      | `/examples` hub route + wire the gallery         | Hub page, header/footer/sitemap, homepage `ExamplesGallery` cards link to detail pages    |
| T3      | `/examples/<name>` detail pages ×5               | Reusable detail template + per-demo data, prerendered heads, "Open live demo" CTAs        |
| T4      | Deterministic screenshot assets                  | Capture script (light/dark/mobile), committed static images consumed by T2/T3 surfaces    |
| T5      | CI consolidation + READMEs + full gate + close   | Fold demo deploys into landing, widen filter, drop redundant jobs/vars, gate, DoD         |

## Global constraints (apply to every tranche)

- **Signals only.** Any landing component reading `signal.value` during render calls `useSignals()`
  first; DOM side effects use `useSignalEffect`. No `useState`/`useEffect`/`useContext`/`useReducer`.
- **Mobile-first + tokens.** Base styles target 320px; enhancements via `@container`/`@media` using only
  the canonical scale literals; no hardcoded colours; `pnpm breakpoint:check` clean.
- **i18n.** User-visible strings on new landing surfaces route through `@cascivo/i18n`, not hardcoded.
- **Determinism.** Screenshots come from seeded demo fixtures with the simulation engine paused; no
  `Math.random()` in committed assets; re-running the capture script is a no-op diff.
- **Surgical.** Touch only the files a tranche names. Do not refactor demo internals; integration-driven
  bug fixes only.
- **Gate before commit.** The six CLAUDE.md gate commands must pass before any commit
  (`vp check` → `pnpm build` → `vp run -r check` → `pnpm test` → regen + diff → `breakpoint:check`).

## Definition of Done (mirrors ROADMAP-V22)

All eleven DoD boxes in `docs/ROADMAP-V22.md` checked, verified across T1–T5, with the full gate green
and the roadmap flipped to ✅ Shipped in T5.
