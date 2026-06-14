# v21 Master Plan — The Showcase Dashboards (five functional example apps)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-14-v21-tranche-1.md` … `2026-06-14-v21-tranche-6.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For any visual surface, also
> use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint.
>
> **Re-verify each named file/route/count/command/export at tranche start. If absent or different, STOP
> and re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V21.md` — ship five recognisable, _functional_ example dashboards
(Cascade Deploy/Pay/Flow/Track/Pulse), backed by a shared `@cascivo/example-kit`, with **no backend**.
Each app proves cascivo composes into a real product: data loads via a client-side mock-API (with
visible loading/empty/error states), mutations persist across reload via `@cascivo/storage`, and "live"
surfaces tick via a client-side simulation engine. Together they demo every component tier and every
chart.

**Architecture:** `apps/examples/*` only, plus a new workspace package `apps/examples/kit/`
(`@cascivo/example-kit`), plus CI wiring (`.github/workflows/cf-pages.yml`, paths filters) and a
gallery link from docs/landing. No `@cascivo/*` _component_ packages change. No new npm runtime deps
beyond what the kit/apps consume from existing `@cascivo/*` packages. No server.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM side effects/timers, never `useEffect`/`useState`/`useContext`).
`React.lazy`/`Suspense` permitted. Vite + `vp`. Mobile-first, token-based CSS. `@cascivo/storage` for
persistence, `@cascivo/i18n` for strings, `@cascivo/charts` for visualisations. Playwright for e2e.

---

## Research findings (ground truth — verified 2026-06-14)

### Current-state facts (re-verify at use)

- **Example apps today** (`apps/examples/`): `json-playground` (fully functional, the reference),
  `registry-starter` (CLI registry template), `react-vite` (skeleton: only `package.json` + `README`),
  `react-next` (skeleton: only `package.json` + `README`, no `app/`, no route handlers). **No server
  code exists anywhere in the repo.**
- **Reference app shape** (`apps/examples/json-playground/`): `vite.config.ts` aliases every `dist`-
  exporting package to its source (`@cascivo/core|storage|i18n|ai|react|render` → `packages/*/src`);
  `src/main.tsx` is a React 19 StrictMode root; `src/App.tsx` imports `@cascivo/themes/light|dark|warm`,
  uses `signal`/`useSignals` from `@cascivo/core`, and switches theme via `data-theme` on a container.
  Scripts: `dev` (`vp dev`), `build` (`vp build`), `preview` (`vp preview`).
- **Workspace wiring:** `pnpm-workspace.yaml` globs include `apps/examples/*`. Root `package.json` runs
  `vp run -r build|test`; root `vite.config.ts` sets `run.cache`, lint ignores, `fmt` (no semi, single
  quote). `vp run @cascivo/<name>#build` runs a named package's task.
- **CI:** `.github/workflows/ci.yml` — `verify` job: `vp check` → audit:animation → audit:signals →
  `vp run -r build` → audit:bundle → `vp run -r check` (typecheck) → `vp run -r test`; plus a `drift`
  job. `.github/workflows/cf-pages.yml` — per-app Cloudflare Pages deploy jobs, each gated by a
  `dorny/paths-filter@v3` filter; existing jobs: docs, landing, storybook, json-playground.
- **Source-alias rule (CLAUDE.md):** apps that build _without_ a prior full build must alias every
  `dist`-exporting `@cascivo/*` package (`core`, `storage`, `i18n`, `ai`, `render`, `icons`) to its `src`
  entry. CI builds apps via `vp run …#build` with no prior `pnpm build`, so **every new example needs
  these aliases** (plus an alias for `@cascivo/example-kit`'s source).
- **Library inventory (re-verify):** `@cascivo/react` exports ~120 components across tiers (inputs,
  data/display, advanced, typography). `@cascivo/charts` exports LineChart, AreaChart, BarChart,
  PieChart, ScatterChart, Sparkline, Meter, KPI, Histogram, Boxplot, BubbleChart, ComboChart, Heatmap,
  Treemap, Radar, Bullet (+ engine: scale/shape/stats/treemap). `@cascivo/storage` = persisted signals
  (localStorage/IndexedDB, SSR-safe). `@cascivo/i18n` = signal locale store + catalogs + Intl.
  `@cascivo/layouts` = app shells/page layouts (copy-paste source).
- **Signal correctness:** the example apps must call `useSignals()` first in any component reading
  signals during render (no Babel transform in React apps). The sim engine and async mock-api use
  `useSignalEffect`, never `useEffect`.

### Best-practice synthesis (2026 — informs the apps, not literal copy)

- **Demos must be drivable in seconds.** No login, no setup, seeded data on first paint, theme persisted.
  An evaluator's trust is won by clicking, not reading. → all tranches.
- **Async UI states are a feature to show, not hide.** The mock-api's artificial latency lets the apps
  demonstrate `Skeleton`/`Spinner`/`InlineLoading`/`EmptyState`/`ErrorBoundary`/`SuspenseBoundary` —
  exactly the states a real adopter will need. → T1 sets the pattern; all apps reuse it.
- **Persistence signals realness.** Mutations that survive reload (via `@cascivo/storage`) are the single
  strongest "this is real" cue; each app ships at least one. → T1 pattern, enforced per app.
- **Live data sells ops dashboards.** A pausable, seeded `createSimulation` delivers the Datadog/Vercel
  "it's alive" feel with zero server and full determinism for tests. → T1 + T5.
- **Recognisable but original.** Re-create the layout grammar (sidebar + table + detail drawer; metric
  grid + charts; board ↔ list) so the shape reads instantly; avoid trademarks/logos/brand copy. → naming
  and content guardrail across all tranches.
- **Accessibility + mobile are non-negotiable** even for demos: axe-clean (light + dark), no horizontal
  overflow at 320–414, keyboard-drivable. → T6 harness, per-app smoke specs.

---

## Key decisions

1. **No backend — full stop.** Three client-side mechanisms deliver "functional": mock-API (latency +
   error injection), `@cascivo/storage` persistence, `createSimulation` live updates. The deliverable is
   provably runnable offline from `vp preview`. A real server, if ever needed, is a separate roadmap with
   its own network-policy review.

2. **One shared kit (`@cascivo/example-kit`), nothing more.** Exports `createMockApi`,
   `createSimulation`, `seededRandom`, `<AppShell>`. Justified by 5 concrete uses. Per-app code stays in
   each app. The kit is a workspace package under `apps/examples/kit/`; apps alias `@cascivo/example-kit`
   to its `src` (it exports source, but alias it anyway so CI builds without a prior full build).

3. **Cascade Deploy is the reference (T1).** It establishes every pattern the other four copy: vite
   config + aliases, `<AppShell>` usage, mock-api module shape, storage-persisted mutation, sim engine
   usage, theme persistence, smoke/axe spec, README. T2–T5 follow it; do not re-invent.

4. **Coverage is a design constraint, not an afterthought.** The app→component/chart mapping in
   `ROADMAP-V21.md` is the contract. T6 maintains a coverage matrix and a test asserting no top-tier
   `@cascivo/react` component and no `@cascivo/charts` chart is entirely undemoed across the five.

5. **Deterministic, seeded data.** All fixtures derive from `seededRandom`; the sim engine is seeded and
   pausable. No `Math.random()` in committed fixtures — screenshots and tests must be reproducible.

6. **Signal + mobile-first rules hold.** `useSignals()` first when reading signals; `useSignalEffect` for
   timers/DOM side effects (the sim engine and mock-api subscriptions qualify); no
   `useState`/`useEffect`/`useContext`. `React.lazy`/`Suspense` allowed for route/section splitting.
   Mobile-first, token-only CSS, no hardcoded colors. Strings via `@cascivo/i18n`.

7. **Cascade Flow's diagram is hand-built SVG.** A visual of nodes/edges with a token that the sim engine
   advances — NOT a BPMN parser/executor. This caps the highest-risk item.

8. **Board moves are menu/keyboard, not DnD.** Cascade Track moves issues via ContextMenu/CommandMenu/Kbd
   and SegmentedControl view toggles. A real drag-and-drop kit is deferred.

9. **Every app is a CI citizen.** Builds via `vp run @cascivo/<app>#build` (source aliases mandatory),
   deploys via a paths-filtered `cf-pages.yml` job, has a Playwright smoke + axe spec. Full gate at T6.

10. **Honest framing.** Each app shows a small "mock demo — no real data" affordance; READMEs say the
    same. No trademarks, logos, or brand copy; codenames are "Cascade <verb>".

---

## Tranche map

| T#  | Focus                                | Files / dirs (primary)                                                                                                                | Risk     |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| T1  | Kit + **Cascade Deploy** (reference) | `apps/examples/kit/**` (`@cascivo/example-kit`), `apps/examples/deploy/**`, `pnpm-workspace.yaml` (already globs), per-app `vite.config.ts` | **High** |
| T2  | **Cascade Pay** (charts-heavy)       | `apps/examples/pay/**` (vite config + aliases, `api/`, `data/`, `App.tsx`, sections), Playwright spec                                  | Medium   |
| T3  | **Cascade Flow** (process)           | `apps/examples/flow/**` incl. a hand-built SVG `FlowDiagram`, `api/`, sim-driven token, Playwright spec                               | **High** |
| T4  | **Cascade Track** (keyboard tracker) | `apps/examples/track/**` incl. CommandMenu wiring + storage-persisted issues board/list, Playwright spec                              | Medium   |
| T5  | **Cascade Pulse** (observability)    | `apps/examples/pulse/**` incl. live `createSimulation` metrics/logs/alerts + heavy chart composition, Playwright spec                 | Medium   |
| T6  | Gallery + CI + coverage + gate       | examples index/gallery, docs/landing link, `.github/workflows/cf-pages.yml` (+ `ci.yml` paths), coverage test, per-app README, gate, `ROADMAP-V21.md` | Medium |

**Risk notes:**

- **T1 (High):** It's the foundation _and_ the reference app at once. The kit's `createMockApi` /
  `createSimulation` signal/effect contract must be right (no `useEffect`; pausable; deterministic) or
  every later app inherits the bug. Get the vite-alias + CI-buildability proven on a fresh checkout
  before declaring T1 done. Spike `<AppShell>` against real `@cascivo/layouts`/components first.
- **T3 (High):** The flow diagram is the most novel surface. Keep it hand-built SVG driven by signals;
  resist any pull toward a BPMN library. Token movement is the sim engine mutating a "current node"
  signal — verify it pauses and is deterministic.
- **T2/T5 (Medium):** Heavy `@cascivo/charts` composition; watch bundle size (audit:bundle in CI) and
  CLS from late-loading chart data. Keep charts below the fold lazy where it helps; never lazy the
  primary above-the-fold KPI row.
- **T4 (Medium):** Storage persistence + CommandMenu keyboard model must not leak `useState`/`useEffect`.
  Persisted-signal hydration is SSR-safe but verify first-paint with empty vs seeded storage.
- **T6 (Medium):** The coverage assertion and five new CI/deploy jobs are mechanical but easy to get
  subtly wrong (paths filters, alias gaps). Verify each app builds via `vp run …#build` on a clean tree.
