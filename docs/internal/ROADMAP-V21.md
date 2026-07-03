# cascivo — Roadmap v21: The Showcase Dashboards

**Last updated:** 2026-06-14
**Status:** ✅ Shipped
**Plan documents:** `docs/superpowers/plans/2026-06-14-v21-master-plan.md` + tranches 1–6

---

## Vision

A UI library lives or dies by trust. Trust is not earned by a component gallery — a gallery proves each
piece renders in isolation; it does not prove the pieces compose into a real product. The question a
prospective adopter actually asks is: _"If I build my app's dashboard with this, will it work, and will
it be pleasant to build?"_ Today cascivo answers that with 120 isolated component stories, a JSON
playground, and a landing page. None of them is a **product you can drive.**

v21 ships five **example dashboards**, each modelled on a well-known SaaS product so an evaluator
recognises the shape instantly, and each **functional** — you can click, filter, mutate, and watch state
change, and your changes survive a reload. They are deliberately _not_ the originals: no real
deployments, no real money, no real processes. They are faithful re-creations of the **interaction
surface** of those products, wired to a seeded, client-side mock data layer. Collectively they exercise
the whole library — every tier of `@cascivo/react`, all of `@cascivo/charts`, plus `@cascivo/storage`,
`@cascivo/i18n`, and the app-shell layouts — under realistic composition, not toy isolation.

> Concept: **"Drive it, don't read about it."** Five recognisable dashboards an evaluator can open and
> play with in under ten seconds, proving cascivo composes into real products. No backend, no accounts,
> no setup — open the URL and use it.

## The five dashboards (recognisable shape → what it proves)

Each app has an original, non-infringing name (it re-creates the _interaction pattern_, not the brand),
a one-line "feels like", and the slice of the library it stresses. The set is chosen so that **together**
they cover every component tier and every chart — a gap in coverage is a gap an adopter would hit.

| #   | App (codename)     | Feels like | Domain (mock)                       | Primary library coverage                                                                                                                       |
| --- | ------------------ | ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Cascade Deploy** | Vercel     | Projects, deployments, build logs   | App shell (ShellHeader/SideNav), DataTable, Status/Badge, Stat+Sparkline, Tabs, CodeSnippet/Terminal, Drawer, CommandMenu, ProgressBar, Toast  |
| 2   | **Cascade Pay**    | Stripe     | Payments, revenue, customers        | `@cascivo/charts` (AreaChart, BarChart, KPI), DataTable, DateRangePicker, Combobox, Pagination, Stat, optimistic refund + Toast                |
| 3   | **Cascade Flow**   | Camunda    | Process instances, tasks, incidents | A simplified flow diagram (SVG), Timeline, TreeView, DataTable, Form (claim/complete task), Status, Tabs, EmptyState                           |
| 4   | **Cascade Track**  | Linear     | Issues, board, backlog              | CommandMenu (Cmd+K) + Kbd, board ↔ list (SegmentedControl), Drawer+Form, MultiSelect, Combobox, ContextMenu, `@cascivo/storage` persistence    |
| 5   | **Cascade Pulse**  | Datadog    | Metrics, alerts, logs               | `@cascivo/charts` (LineChart, Heatmap, Sparkline, Meter, Bullet, ProgressCircle), live simulation, time-range selector, log stream, alert list |

> The codenames are deliberate: "Cascade <verb>" signals these are cascivo's own demos, not clones of a
> trademarked product. No logos, no copy, no proprietary data — only the recognisable _layout grammar_.

## The backend question — answered: no backend

The brief allows a backend "only if really necessary." It is not. Every app in this repo (docs, landing,
storybook, json-playground) is a static SPA deployed to Cloudflare Pages; there is **no server anywhere
in the monorepo today**. Adding one would contradict the deployment model, complicate the network policy,
and add infra an evaluator must trust before they can even click. Instead, "functional" is delivered
three ways, all client-side:

1. **A mock-API layer.** Each app has a typed `api/` module whose functions return `Promise`s with
   artificial latency (and optional, toggleable error injection). This is what makes the dashboards
   _functional_ AND lets them genuinely demonstrate the library's async surface — `Skeleton`,
   `Spinner`, `InlineLoading`, `EmptyState`, `ErrorBoundary`, `SuspenseBoundary`. It reads like a real
   API and could be swapped for `fetch` later without touching the UI.
2. **`@cascivo/storage` for persistence.** User mutations (refund a payment, move an issue, claim a
   task, change a theme) persist to localStorage/IndexedDB, so "play around" survives a reload — the
   single biggest signal that a demo is _real_ and not a static mock.
3. **A client-side simulation engine.** A small, pausable `createSimulation` helper drives signal
   mutations on an interval (a build advancing, a process token moving, metrics ticking, an alert
   firing). This delivers the "live" feel of an ops dashboard with zero server.

> Decision: **No backend, no exceptions.** If a future app genuinely needs server state (real auth, real
> LLM streaming for an AI copilot), that is a separate roadmap with its own network-policy review — not
> smuggled in here. v21 is provably runnable from a static host with the network unplugged.

## Shared foundation

Five apps that each re-scaffold a shell, a mock layer, and a sim engine would be five copies of the same
code — a clear case for a shared kit (5 uses, not speculative). v21 introduces a small workspace package:

- **`@cascivo/example-kit`** (`apps/examples/kit/`) — the family's common spine, exporting:
  `createMockApi` (latency + error injection), `createSimulation` (pausable interval-driven signal
  mutations), `seededRandom` (deterministic fixtures), and an `<AppShell>` layout (ShellHeader + SideNav
  - theme switcher + CommandMenu mount) so all five apps read as one cohesive product family.

Everything else stays per-app and self-contained, mirroring `json-playground` (Vite + `vp`, source
aliases to `packages/*/src`, themes imported as CSS, signals + `useSignals()`).

## Workstreams

| #   | Workstream                 | Tranche | Summary                                                                                                 |
| --- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| A   | Foundation + reference app | T1      | `@cascivo/example-kit`; **Cascade Deploy** as the reference implementation that sets every pattern.     |
| B   | Charts-heavy dashboard     | T2      | **Cascade Pay** — revenue/payments, stressing `@cascivo/charts` + DataTable + date/range filtering.     |
| C   | Process-orchestration      | T3      | **Cascade Flow** — instances/tasks/incidents, a simplified flow diagram, Timeline/TreeView, task forms. |
| D   | Keyboard-first tracker     | T4      | **Cascade Track** — issues board/list, Cmd+K command menu, storage-persisted mutations.                 |
| E   | Real-time observability    | T5      | **Cascade Pulse** — metrics/alerts/logs, live simulation, time-range, heavy chart composition.          |
| F   | Gallery + CI + gate        | T6      | Examples index/gallery, per-app READMEs, CI build + CF Pages deploy for all five, full gate, close.     |

## Decisions baked in

1. **No backend.** Mock-API layer + `@cascivo/storage` + client-side `createSimulation`. Provably
   runnable offline from a static host. (See "The backend question" above.)
2. **One shared kit, everything else per-app.** `@cascivo/example-kit` carries only what all five share
   (shell, mock-api, sim, seeded RNG). No premature abstraction beyond that.
3. **Recognisable, not infringing.** Codenames are "Cascade <verb>"; no trademarks, logos, brand copy,
   or proprietary data. The value is the recognisable _layout grammar_, re-created in the open.
4. **Coverage is the design constraint.** The five apps are chosen so their union touches every
   `@cascivo/react` tier and every `@cascivo/charts` chart. A coverage matrix is maintained in T6 and a
   test asserts no top-tier component is entirely undemoed across the set.
5. **Signal + mobile-first rules hold.** Any component reading `signal.value` during render calls
   `useSignals()` first; DOM side effects use `useSignalEffect`; no `useState`/`useEffect`/`useContext`.
   `React.lazy`/`Suspense` permitted. Mobile-first, token-only CSS, no hardcoded colors.
6. **i18n by default.** User-visible strings route through `@cascivo/i18n` (built-in catalog +
   per-instance overrides), never hardcoded English — consistent with the component authoring rules.
7. **Deterministic data.** Fixtures derive from a seeded RNG so screenshots, tests, and the gallery are
   reproducible. The sim engine is pausable and seeded; no `Math.random()` in committed fixtures.
8. **Every app is a CI citizen.** Each builds with `vp run @cascivo/<app>#build` (no prior full build →
   source aliases required per CLAUDE.md), deploys via a `cf-pages.yml` job, and has a Playwright smoke +
   axe spec. The full CLAUDE.md gate runs at T6.
9. **Cascade Flow's diagram is hand-built SVG, not a BPMN engine.** A faithful _visual_ of a process
   with a moving token — not a real BPMN parser/executor. Scope guard against the heaviest item.
10. **The apps are demos, not products.** No real auth, payments, deployments, or process execution.
    Banners/labels make the mock nature explicit so no one mistakes them for the real services.

## Definition of Done

- [x] `@cascivo/example-kit` exists and exports `createMockApi`, `createSimulation`, `seededRandom`,
      `<AppShell>`; it builds and is consumed by all five apps. _Verify: T1._
- [x] Five apps exist under `apps/examples/` — `deploy`, `pay`, `flow`, `track`, `pulse` — each a
      runnable `vp dev`/`vp build` Vite app with source aliases to `packages/*/src`. _Verify: T1–T5._
- [x] Each app is **functional**: data loads via the mock-API (with visible loading/empty/error states),
      at least one mutation persists across reload via `@cascivo/storage`, and at least one "live"
      surface updates via `createSimulation`. _Verify: T1–T5 exit criteria._
- [x] No backend, no server process, no network calls; each app runs offline from `vp preview`. _Verify: T6._
- [x] The union of the five apps demos every `@cascivo/react` top-tier component and every
      `@cascivo/charts` chart; a coverage check asserts no top-tier gap. _Verify: T6._
- [x] An examples gallery/index lists all five with a one-line "feels like" and a live link; linked from
      docs and/or landing. _Verify: T6._
- [x] Each app has a Playwright smoke + axe spec (light + dark) and a README stating it's a mock demo.
      _Verify: T6._
- [x] Each app builds in CI via `vp run @cascivo/<app>#build` and deploys through a `cf-pages.yml` job
      (paths-filtered). _Verify: T6._
- [x] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen + diff). _Verify: T6._
- [x] `ROADMAP-V21.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T6._

## Non-goals (explicitly out of scope)

| Claim                        | Substance                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **No backend / no server**   | Mock-API + storage + sim engine only. A real server is a separate, network-policy-reviewed roadmap.         |
| **No real integrations**     | No real Vercel/Stripe/Camunda/Linear/Datadog APIs, no auth, no payments, no SDKs. All data is seeded mock.  |
| **No new components**        | v21 _consumes_ the library; it adds no `@cascivo/*` components. New components go through the dark factory. |
| **No BPMN engine**           | Cascade Flow's diagram is a hand-built SVG visual with a simulated token, not a real BPMN parser/runtime.   |
| **No drag-and-drop library** | Board moves use menus/keyboard/buttons; a full DnD kit is out of scope (revisit if an evaluator asks).      |

## Deferred (do not re-litigate in v21)

- **A real backend / serverless functions** — only if a future app genuinely needs server state; own roadmap.
- **AI copilot with live LLM streaming** — `@cascivo/ai` exists, but live streaming needs a key + server; deferred.
- **Drag-and-drop board** — menu/keyboard moves ship in v21; true DnD is a follow-up.
- **Mobile-native gestures / PWA install for the demos** — responsive yes, installable PWA no.
- **Real-time collaboration / multiplayer** — out of scope; the sim engine is single-user.
