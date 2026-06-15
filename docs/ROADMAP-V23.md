# cascivo — Roadmap v23: Cascade Edge (the faithful Vercel dashboard)

**Last updated:** 2026-06-15
**Status:** 🚧 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-15-v23-master-plan.md` + tranches 1–6

---

## Vision

The single most persuasive thing cascivo can show an evaluator is a screen they already know, rebuilt
flawlessly with the library. v21 shipped five mock-backed dashboards; one of them — **Cascade Deploy**
(`apps/examples/deploy`, `feelsLike: 'Vercel'`) — gestured at Vercel but is actually a generic CI/CD
view: a DORA-metrics bar, a flat pipeline list, and an environments grid. It does not look or feel like
the real Vercel dashboard an engineer logs into every day (the projects grid with deployment-screenshot
thumbnails, the team scope switcher, the per-project Overview/Deployments/Analytics tabs, the live
build-log inspector).

v23 turns that gesture into the real thing. It **rebuilds the `deploy` app in place into a faithful
re-creation of the redesigned Vercel dashboard**, and **rebrands it "Cascade Edge"** (slug/package
`edge`). The result is a demo an engineer recognises in under a second: _"that's Vercel — and it's all
cascivo components."_

> Concept: **"You've seen this screen. It's built entirely from cascivo."** A pixel-faithful Vercel
> clone — team scope switcher, projects grid with live deployment thumbnails, project detail tabs, and a
> build-log inspector that streams in real time — all driven by a seeded, client-side simulation with no
> backend.

## What changes (the decision)

Two choices were settled up front (see "Decisions baked in"):

1. **Replace, don't add.** v23 does **not** introduce a sixth demo. It rebuilds the existing
   `apps/examples/deploy` app — content _and_ identity — into Cascade Edge. The slug, package name, i18n
   namespace, storage-key prefix, live URL, and marketing page all rename `deploy` → `edge`. This keeps
   the showcase at five demos and avoids two near-identical "feels like Vercel" entries.
2. **Faithful, comprehensive clone.** Not a metrics bar — the actual dashboard chrome: scope switcher +
   Cmd+K search + project tabs; a projects grid of cards (framework, repo, latest-deploy thumbnail,
   status, branch, commit, relative time); a project detail surface (Overview / Deployments / Analytics
   / Settings); a deployment inspector with a live build-log stream; and a Usage/Speed-Insights page
   carrying the chart composition.

## Why rebuild-in-place (not a sixth app)

- **No redundancy.** A sixth "feels like Vercel" demo would sit beside `deploy`'s identical claim. One
  faithful clone is more persuasive than two half-clones.
- **Fewer net surfaces than adding an app.** No new CF deploy concerns (the demo already assembles into
  the landing under `/demos/<slug>/` via v22). The churn is a rename sweep plus a content rebuild, not a
  new package + new CI wiring.
- **Trade-off accepted:** the rebrand renames the live URL `/demos/deploy/` → `/demos/edge/` and the
  marketing route `/examples/deploy` → `/examples/edge`. cascivo.com is pre-launch and these links are
  internal-only (homepage gallery → hub → detail → demo), so no external redirects are owed.

## Naming & identity

| Field           | Before (`deploy`)         | After (`edge`)          |
| --------------- | ------------------------- | ----------------------- |
| Slug            | `deploy`                  | `edge`                  |
| Package         | `@cascivo/example-deploy` | `@cascivo/example-edge` |
| Display name    | Cascade Deploy            | Cascade Edge            |
| `feelsLike`     | Vercel                    | Vercel (unchanged)      |
| i18n namespace  | `deploy.*`                | `edge.*`                |
| Storage prefix  | `deploy.*`                | `edge.*`                |
| Live URL        | `/demos/deploy/`          | `/demos/edge/`          |
| Marketing route | `/examples/deploy`        | `/examples/edge`        |
| Screenshots dir | `screenshots/deploy/`     | `screenshots/edge/`     |

## What "faithful" means here (the surfaces to build)

- **Top chrome:** a team/scope switcher (avatar + team name, switchable), a breadcrumb (team / project),
  global **Cmd+K** search (CommandMenu), and right-aligned Feedback / Docs / Notifications / avatar
  affordances. A secondary tab row scoped to the current view.
- **Projects dashboard (home):** a search + sort/filter bar ("Search Projects…", sort by activity/name,
  production-only filter), an "Add New…" affordance, and a responsive grid of **project cards** — each
  with project name, framework, git repo, a **latest-deployment screenshot thumbnail**, a status dot,
  branch, commit message, and relative time ("Deployed 2h ago"), plus a favourite star. EmptyState when
  filters match nothing; Skeletons while loading.
- **Project detail:** header (project name, "Visit" CTA, production domain) + tab bar (Overview /
  Deployments / Analytics / Settings). Overview shows the **Production Deployment** panel (thumbnail,
  Ready status, domains, source commit, build time) and active preview branches.
- **Deployments:** a dense DataTable — URL, status (Ready / Building / Error / Queued / Canceled),
  environment (Production / Preview), branch, commit, duration, age, author — with status + environment
  filters.
- **Deployment inspector:** click a deployment → a **live build-log stream** that advances line-by-line
  via the simulation engine (Queued → Building → Ready), a ProgressBar, a copy-logs button, a Toast on
  completion, and a deployment summary (domains, source, created-by).
- **Usage / Speed Insights:** KPI cards (edge requests, function invocations, bandwidth), an AreaChart
  (requests/bandwidth over time), a BarChart (top paths), and Core Web Vitals (LCP / CLS / INP) rendered
  with Meter / Bullet / ProgressCircle.

## Workstreams

| #   | Workstream                       | Tranche | Summary                                                                                                                                                          |
| --- | -------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Rename + rebrand `deploy`→`edge` | T1      | Mechanical sweep across the app, the kit-independent fixtures, all landing/CI/script references, and the screenshots dir. Gate green.                            |
| B   | Domain model + app chrome + home | T2      | Vercel domain model (teams/projects/deployments/usage) on kit primitives; top chrome (scope switcher, Cmd+K, tabs, signal view-routing); the projects grid home. |
| C   | Project detail + deployments     | T3      | Project header + tabs; Production Deployment panel; Deployments DataTable with status/environment filters.                                                       |
| D   | Deployment inspector             | T4      | Live build-log stream (simulation), ProgressBar, copy-logs, completion Toast, deployment summary.                                                                |
| E   | Usage / Speed Insights (charts)  | T5      | KPI cards, AreaChart, BarChart, Core Web Vitals (Meter/Bullet/ProgressCircle); preserves chart coverage.                                                         |
| F   | Screenshots + wiring + gate      | T6      | Deterministic `edge` screenshots; landing copy/coverage chips; README regen; CI verify; full CLAUDE.md gate; close DoD.                                          |

## Decisions baked in

1. **Rebuild `deploy` in place; rebrand to Cascade Edge (`edge`).** No sixth demo; the showcase stays at
   five. Every `deploy` identity surface renames to `edge`.
2. **Faithful, comprehensive clone.** The real dashboard chrome + projects grid + project detail +
   deployment inspector + usage, not a metrics bar.
3. **Signal-driven view navigation, no client router.** The demo stays a single-page app with `base:
'./'` so it remains mount-portable under `/demos/edge/` (v22). View state (which project, which tab,
   which deployment) lives in module-level signals — **no `pushState`, no router** — preserving the v22
   assembly/preview assumption and existing Playwright spec at `/`.
4. **Reuse kit primitives; never touch shared kit API.** Edge composes `AppShell`, `seededRandom`, and
   `createSimulation`/`useSimulation` from `@cascivo/example-kit`. It introduces its **own** Vercel
   domain model in `apps/examples/edge/src/data/`. The kit's `createMockApi`/`Pipeline`/`Environment`/
   `Metrics` are **left untouched** — they are shared by the `pay` and `flow` demos.
5. **No new components, no new runtime deps, no server.** Built entirely from existing `@cascivo/react`
   and `@cascivo/charts`. Mock-API + storage + seeded simulation only.
6. **Determinism holds.** All data derives from seeded fixtures; the simulation is pausable; no
   `Math.random()` in committed assets. Re-running the screenshot script is a no-op diff.
7. **Coverage does not regress.** Edge must keep demoing every component the `deploy` app demoed
   (AppShell, DataTable, Status, Badge, Stat, Sparkline, CommandMenu, ProgressBar, Toast, Skeleton,
   EmptyState) plus the charts added in T5, so `apps/examples/coverage.test.ts` stays green.
8. **Signal + mobile-first rules hold.** `useSignals()` before signal reads, `useSignalEffect` for DOM
   side effects, no `useState`/`useEffect`/`useContext`/`useReducer`; token-only CSS; mobile-first with
   canonical breakpoints; ≥44px touch targets; i18n strings; `breakpoint:check` clean.

## Definition of Done

- [ ] The `deploy` app is renamed to `edge` everywhere — package `@cascivo/example-edge`, slug `edge`,
      i18n namespace `edge.*`, storage prefix `edge.*` — and a repo-wide grep finds no stray `deploy`/
      `example-deploy` reference for this demo. _Verify: T1._
- [ ] All integration surfaces are updated: `apps/landing/src/pages/examples/data.ts`, `route-head.ts`,
      `public/sitemap.xml`, `scripts/assemble-demos.mjs`, `scripts/checks/demo-storage-keys.test.ts`,
      `apps/examples/coverage.test.ts`, the `screenshots/edge/` dir, and the `cf-pages.yml` paths-filter.
      _Verify: T1 + T6._
- [ ] Cascade Edge presents the real Vercel chrome: a team scope switcher, a Cmd+K command menu, a
      breadcrumb, and signal-driven view navigation between Home / Project / Deployment with **no client
      router** (no `pushState`). _Verify: T2._
- [ ] The projects dashboard renders a responsive grid of project cards (framework, repo, latest-deploy
      thumbnail, status, branch, commit, relative time, favourite), with search + sort/filter, EmptyState,
      and Skeletons while loading. _Verify: T2._
- [ ] The project detail surface shows a header (Visit CTA, production domain), Overview / Deployments /
      Analytics / Settings tabs, a Production Deployment panel, and a Deployments DataTable with status +
      environment filters. _Verify: T3._
- [ ] A deployment inspector streams build logs line-by-line via the simulation engine (Queued →
      Building → Ready), with a ProgressBar, copy-logs, a completion Toast, and a deployment summary; the
      simulation is pausable and seeded (deterministic). _Verify: T4._
- [ ] A Usage / Speed Insights page renders KPI cards, an AreaChart, a BarChart, and Core Web Vitals
      (Meter / Bullet / ProgressCircle); `coverage.test.ts` stays green. _Verify: T5._
- [ ] Deterministic light/dark (+ mobile) screenshots for `edge` are committed and consumed by the
      landing hub + `/examples/edge` detail page; re-running the capture is a no-op diff. _Verify: T6._
- [ ] The demo builds with `base: './'` and runs both standalone (`vp preview` at `/`) and assembled at
      `/demos/edge/`; `pnpm build:landing-demos` serves the homepage + the live Edge demo. _Verify: T6._
- [ ] Full CLAUDE.md gate exits 0 (`vp check` → `pnpm build` → `vp run -r check` → `pnpm test` → regen +
      diff → `breakpoint:check`). _Verify: T6._
- [ ] `ROADMAP-V23.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T6._

## Non-goals (explicitly out of scope)

| Claim                            | Substance                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **No sixth demo**                | v23 replaces `deploy`; the showcase stays at five apps.                                                         |
| **No client router**             | View navigation is signal-driven; no `pushState`/router is added (preserves v22 mount-portability).             |
| **No new components / deps**     | Built from existing `@cascivo/react` + `@cascivo/charts`; no new `@cascivo/*` component, no runtime dependency. |
| **No changes to shared kit API** | `createMockApi`/`Pipeline`/`Environment`/`Metrics` stay as-is (used by `pay` + `flow`).                         |
| **No backend**                   | Mock fixtures + `@cascivo/storage` + seeded simulation only.                                                    |
| **No real Vercel assets**        | No Vercel logos/marks/screenshots; thumbnails are generated placeholders. "Mock demo" disclaimer stays.         |
| **No team/auth flows**           | The scope switcher cycles seeded teams; there is no login, no real multi-tenant data.                           |

## Deferred (do not re-litigate in v23)

- **A real env-vars / settings editor** — the Settings tab shows a representative read-only surface;
  full CRUD is a follow-up.
- **Web Analytics funnels / per-event drill-down** — the Usage page covers KPIs + Core Web Vitals; deep
  analytics is deferred.
- **Live-embedded (iframe) preview of the deployed site** — the deployment thumbnail is a generated
  placeholder; embedding a real preview is out of scope.
- **A redirect from the old `/examples/deploy` / `/demos/deploy/` paths** — pre-launch, internal-only
  links; no redirect infra is added.
