# v23 Master Plan — Cascade Edge (rebuild `deploy` into the faithful Vercel dashboard)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-15-v23-tranche-1.md` … `2026-06-15-v23-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For any visual surface, also
> use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint
> (320 / 360 / 390 / 414).
>
> **Re-verify each named file/route/count/command/export at tranche start. If absent or different, STOP
> and re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V23.md` — rebuild the existing `apps/examples/deploy` demo in place into
a faithful re-creation of the redesigned Vercel dashboard, and rebrand it **Cascade Edge** (slug/package
`edge`). Five surfaces: top chrome (scope switcher + Cmd+K + tabs), a projects grid home, a project
detail (Overview/Deployments/Analytics/Settings), a deployment inspector with a live build-log stream,
and a Usage/Speed-Insights page. No sixth demo, no client router, no new components, no new runtime
deps, no backend.

**Architecture:** All app work lives in `apps/examples/edge/**` (the renamed `deploy` dir). The demo
introduces its **own** Vercel domain model in `apps/examples/edge/src/data/`, composing kit primitives
(`AppShell`, `seededRandom`, `createSimulation`/`useSimulation`) from `@cascivo/example-kit`. The kit's
shared `createMockApi`/`Pipeline`/`Environment`/`Metrics` API is **not touched** (used by `pay` +
`flow`). Integration surfaces — landing `data.ts`/`route-head.ts`/`sitemap.xml`, `assemble-demos.mjs`,
`demo-storage-keys.test.ts`, `coverage.test.ts`, `screenshots/edge/`, and the `cf-pages.yml`
paths-filter — are renamed/updated. No `@cascivo/*` package source changes.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM side effects — never `useEffect`/`useState`/`useContext`/`useReducer`). Vite +
`vp`, `base: './'`. Mobile-first, token-based CSS. `@cascivo/i18n` for strings. `@cascivo/charts` for
the Usage page. `@cascivo/storage` for persistence. Playwright for the screenshot capture + smoke spec.

---

## Research findings (ground truth — verified 2026-06-15)

### Current-state facts (re-verify at use)

- **The `deploy` demo exists** at `apps/examples/deploy/` (package `@cascivo/example-deploy`, slug
  `deploy`). It is a Vite + `vp` SPA: `dev`/`build`/`preview`/`test`/`check` scripts; `vite.config.ts`
  sets `base: './'` and aliases every `dist`-exporting `@cascivo/*` package + `../kit/src/index.ts` to
  source; `src/main.tsx` mounts `<App/>` on `#root` under `React.StrictMode`.
- **Today's content** (to be replaced): `src/App.tsx` renders a custom shell (not `AppShell`) with a
  theme toggle and three sections — `MetricsBar` (DORA metrics), `PipelineList`, `EnvironmentGrid`.
  Data loads from `src/data/fixtures.ts`, which calls the **kit's** `createMockApi(42, …)` and uses the
  kit types `Pipeline`/`Environment`/`Metrics`. Strings come from `src/i18n.ts` (`defineMessages('deploy…')`,
  exported as `deployMsg`). Theme persists via `persistedSignal('deploy.theme', 'dark')`.
- **The kit's `createMockApi`/`getPipelines`/`getEnvironments`/`getMetrics` and the `Pipeline`/
  `Environment`/`Metrics`/`DeployStatus`/`Stage` types are shared** — `pay` and `flow` both import
  `createMockApi` from `@cascivo/example-kit`. **Do not change them.** Edge stops importing them and
  ships its own domain model instead; the kit API stays for `pay`/`flow`.
- **Kit primitives Edge will reuse:** `AppShell` (`apps/examples/kit/src/app-shell.tsx` — Header +
  SideNav + CommandMenu + theme toggle, `mockBanner` prop), `seededRandom`, and `createSimulation`/
  `useSimulation` (used by `pulse`/`flow` for live-ticking state). Confirm signatures at use.
- **Landing integration (v22):** `apps/landing/src/pages/examples/data.ts` holds `DemoSlug` (`'deploy' |
'pay' | 'flow' | 'track' | 'pulse'`) and a `DEMOS` array whose first entry is the `deploy` demo
  (`name: 'Cascade Deploy'`, `feelsLike: 'Vercel'`, `liveHref: '/demos/deploy/'`, `detailHref:
'/examples/deploy'`, `coverage: [...]`, `screenshots('deploy')`). `ExamplesGallery.tsx`,
  `ExamplesPage.tsx`, and `ExampleDetailPage.tsx` all read from this array.
- **Prerender + SEO:** `apps/landing/src/route-head.ts` has a `ROUTE_HEAD['/examples/deploy']` entry and
  `'examples/deploy'` in `PRERENDER_ROUTES`. `apps/landing/public/sitemap.xml` lists
  `https://cascivo.com/examples/deploy`.
- **Assembly + checks:** `scripts/assemble-demos.mjs` has a `DEMOS` map with `deploy:
'@cascivo/example-deploy'`. `scripts/checks/demo-storage-keys.test.ts` lists `'deploy'` in its `DEMOS`
  array. `apps/examples/coverage.test.ts` lists `'deploy'` in `APPS`. Screenshots live at
  `apps/landing/public/screenshots/deploy/{light,dark}-{desktop,mobile}.png`. The screenshot generator
  is `scripts/gen-demo-screenshots.mjs` (re-verify whether it reads slugs from `data.ts` or hardcodes).
- **CI:** `.github/workflows/cf-pages.yml` `changes` job's `landing` paths-filter watches
  `apps/examples/deploy/**` (among others); `build:landing-demos` builds the landing then runs
  `assemble-demos.mjs --build`.
- **README pipeline:** `apps/examples/deploy/README.md` is generated from `readme.body.md` by
  `scripts/readme/generate.ts` — edit `readme.body.md`, then regenerate; never hand-edit `README.md`.

### Best-practice synthesis (2026 — informs the work, not literal copy)

- **Recognition beats explanation.** The persuasive payload is "I know this screen." Faithful chrome
  (scope switcher, Cmd+K, project tabs, deployment-thumbnail cards) earns recognition in <1s.
- **A live build-log stream is the money shot.** Vercel's inspector — Queued → Building → Ready with
  logs scrolling — is what makes the platform feel alive. The seeded simulation reproduces it
  deterministically.
- **Single-page, signal-routed.** With `base: './'` and no router, the app stays mount-portable; view
  state is just signals. This is the simplest correct way to ship a multi-view demo under `/demos/edge/`.

## Tranche map

| Tranche | Title                                          | Outcome                                                                                             |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| T1      | Rename + rebrand `deploy` → `edge`             | Mechanical sweep: app dir/package/i18n/storage + all landing/CI/script/screenshot refs. Gate green. |
| T2      | Domain model + app chrome + projects home      | Vercel domain model on kit primitives; top chrome + signal view-routing; the projects grid home.    |
| T3      | Project detail + deployments table             | Project header + tabs; Production Deployment panel; Deployments DataTable + filters.                |
| T4      | Deployment inspector (live build logs)         | Simulation-driven log stream Queued→Building→Ready, ProgressBar, copy-logs, Toast, summary.         |
| T5      | Usage / Speed Insights (charts)                | KPI cards, AreaChart, BarChart, Core Web Vitals (Meter/Bullet/ProgressCircle); coverage preserved.  |
| T6      | Screenshots + landing copy + CI + gate + close | Deterministic `edge` captures; landing copy/chips; README regen; full gate; flip ROADMAP DoD.       |

## Global constraints (apply to every tranche)

- **Signals only.** Any component reading `signal.value` during render calls `useSignals()` first; DOM
  side effects use `useSignalEffect`. No `useState`/`useEffect`/`useContext`/`useReducer`. `useRef` only
  for DOM element refs. FSMs only for genuine internal, code-driven state.
- **No client router.** View navigation (home ↔ project ↔ deployment, active tab) is module-level
  signals. No `pushState`, no router dependency. Keep the app single-page so `base: './'` mount
  portability and the standalone Playwright spec at `/` both hold.
- **Reuse, don't fork, the kit.** Compose `AppShell`/`seededRandom`/`createSimulation` from
  `@cascivo/example-kit`. Do not modify `createMockApi` or the `Pipeline`/`Environment`/`Metrics` types.
- **Mobile-first + tokens.** Base styles target 320px; enhancements via `@container`/`@media` using only
  canonical scale literals (30/40/64/80rem); no hardcoded colours; ≥44px touch targets under `(pointer:
coarse)`; never `display:none` to hide content on mobile (relocate to a disclosure/drawer);
  `pnpm breakpoint:check` clean.
- **i18n.** Every user-visible string routes through `@cascivo/i18n` (`defineMessages('edge.…')` + `t`),
  never hardcoded English.
- **Determinism.** All data from seeded fixtures; the simulation is pausable; no `Math.random()` in
  committed assets; re-running the screenshot capture is a no-op diff.
- **Coverage holds.** Keep demoing every component the `deploy` app demoed (AppShell, DataTable, Status,
  Badge, Stat, Sparkline, CommandMenu, ProgressBar, Toast, Skeleton, EmptyState) so
  `coverage.test.ts` stays green; T5 adds the charts.
- **Surgical.** Touch only the files a tranche names. Do not refactor `pay`/`flow`/`track`/`pulse` or the
  kit. Integration-driven fixes only.
- **Gate before commit.** The six CLAUDE.md gate commands must pass before any commit
  (`vp check` → `pnpm build` → `vp run -r check` → `pnpm test` → regen + diff → `breakpoint:check`).
  Where a mid-rebuild tranche cannot exercise a full surface yet, it must still leave the app building,
  type-checking, and passing its own tests.

## Definition of Done (mirrors ROADMAP-V23)

All eleven DoD boxes in `docs/ROADMAP-V23.md` checked, verified across T1–T6, with the full gate green
and the roadmap flipped to ✅ Shipped in T6.
