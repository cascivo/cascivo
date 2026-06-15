# cascivo — Roadmap v24: Pixel Fidelity for Edge (Vercel), Flow (Camunda) and Track (Linear)

**Last updated:** 2026-06-15
**Status:** 🚧 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-15-v24-master-plan.md` + tranches 1–9

---

## Vision

v21 shipped five mock-backed dashboards. v23 is replacing and rebuilding `deploy` into a
faithful Vercel clone (Cascade Edge). v24 closes the remaining pixel-fidelity gaps across all
three screenshot-benchmarked apps: **Cascade Edge** (`apps/examples/edge`, `feelsLike: 'Vercel'`),
**Cascade Flow** (`apps/examples/flow`, `feelsLike: 'Camunda'`), and **Cascade Track**
(`apps/examples/track`, `feelsLike: 'Linear'`).

v23 builds the Edge foundation (projects grid, project detail, deployment inspector, usage
charts). Fresh analysis of the three Vercel screenshots reveals three surfaces v23 does not
cover: a compact **Usage billing widget** on the home view, a **5-filter Deployments bar**, and
a **Feature Flags / Marketplace section** that is absent entirely. v24 adds those gaps as T9.

Flow and Track currently gesture at their inspirations but neither looks or feels like the real
product. v24 closes that gap for all three apps simultaneously.

> Concept: **"You've seen these screens. They're built entirely from cascivo."** All three apps
> become pixel-faithful reproductions of their source products — the Vercel team dashboard with
> Usage widget, rich Deployments filters, and Feature Flags Marketplace; the Camunda Organization
> Catalog with expandable DataTable and adoption charts; and the Linear grouped sidebar with dense
> issue rows, sub-tabs, and a Settings surface — all driven by seeded, client-side mock data.

---

## Source screenshots studied

Screenshots live in `tmp/` and informed every design decision in this roadmap:

| App   | Files                                                     | Key surfaces observed                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge  | `vercel0.png`, `vercel1.png`, `vercel2.png`               | Team-level home: 2-column layout with compact Usage billing widget (cost/limit rows + `ProgressBar`) + Alerts panel + project template gallery empty state; Deployments page: 5-filter dense bar (Date Range, Authors, Environments, Repositories, Branch search + Status chip) + "No Results" empty state; Flags page: "No flags found" EmptyState + "Create Flag" + Marketplace Providers grid (Statsig / GrowthBook / PostHog cards) |
| Flow  | `camunda-hub.png`, `camunda-hub2.png`, `camunda-hub3.png` | Asset adoption metrics + AreaChart + ranked list; Catalog DataTable with expandable rows and status badges; Project detail 2-column layout with right sidebar                                                                                                                                                                                                                                                                           |
| Track | `linear0.png`, `linear1.png`, `linear2.png`               | Grouped sidebar (Personal / Favorites / Your teams) with notification badge; dense issue rows (status circle + ID prefix + assignee + date); sub-tabs (All / Active / Backlog); Preferences + Workspace settings forms                                                                                                                                                                                                                  |

---

## What changes (the decisions)

### Cascade Edge — Vercel screenshot gaps (supplements v23)

**Current state after v23:** The edge app has a projects grid home, project detail with
Overview / Deployments / Analytics / Settings tabs, a deployment inspector with a live build-log
stream, and a Usage / Speed Insights page. The three Vercel screenshots reveal three surfaces
v23 does not address.

**Target state (informed by screenshots):**

1. **Home — Usage billing widget + template gallery** (`vercel0.png`) — The home view gains a
   right-hand panel alongside the projects grid containing:
   - A compact **Usage** section: "Last 30 Days" heading, four usage rows (Fast Data Transfer,
     Fast Edge Transfer, Private Data Transfer, Edge Requests) each with a `ProgressBar` showing
     consumed/limit and a cost string; a small "Upgrade" `Badge` link.
   - An **Alerts** panel below the Usage section: `EmptyState` reading "Get started for anomalies —
     Automatically monitor your projects for anomalies and get notified." with an "Upgrade to Pro"
     `Button`.
   - A **Recent Processes** panel: `EmptyState` "Preview deployments from repos you have recently
     visited or created will appear here."
   - When `projects` signal is empty: the main content area shows "Deploy your first project"
     heading + a seeded template list (`EmptyState` variant) — each template as a row with name,
     short description, and a `Button` ("Deploy" or "Import"). A "Browse Templates" text link below.

2. **Deployments — 5-filter bar** (`vercel1.png`) — The per-project Deployments tab currently
   (per v23 T3) has status + environment filters. Replace with a dense filter bar matching the
   screenshot: `DatePicker` (or `Select` with preset ranges) for "Select Date Range"; `Select`
   for "All Authors"; `Select` for "All Environments"; `Select` for "All Repositories"; `Search`
   input for "Search Branches…"; a Status filter chip (`Select`) on the far right; a view-toggle
   icon-button group. When all filters active and no rows match: `EmptyState` "No Results — No
   deployments match the current filters." + "Clear Filters" link `Button`.

3. **Feature Flags section** (`vercel2.png`) — A new top-level nav item "Flags" in the Edge
   sidebar. The Flags view renders:
   - Top bar: "All types" `Select` filter + "Create Flag" primary `Button`.
   - Main content (left): `EmptyState` with flag SVG placeholder, "No flags found" heading,
     "Create flags in Manage Feature releases. Learn more →" description, "Create Flag" `Button`.
   - Below: **Marketplace Providers** panel with "Create feature flags and experiments" heading,
     sub-description, "Marketplace Experimentation Providers" heading + "Learn more →" link, and
     a grid of three provider `Card`s — Statsig ("Manage flags and A/B tests"), GrowthBook ("Open
     source experimentation"), PostHog ("Feature flags and A/B tests") — each with a "Create"
     `Button`.

### Cascade Flow — Camunda Hub faithful clone

**Current state:** Three nav items render instances (DataTable + detail), incidents (DataTable),
and a tasklist. The sidebar has no section grouping. No charts. No catalog surface.

**Target state (informed by screenshots):**

1. **Sidebar restructure** — SideNav extended with group headers (`CONSOLE`, `CLUSTERS`). Flow
   populates: CONSOLE → Dashboard, Clusters, Organization; CLUSTERS → one named workspace cluster
   with a dev/prod environment `Badge`. Sidebar widths and collapse behavior unchanged.

2. **Organization Catalog** — a new top-level nav section (`catalog`) with three sub-tabs:
   `Catalog assets` | `Asset usage` | `Asset adoption`. The **Adoption** sub-tab matches
   `camunda-hub.png` exactly: a date-range selector (SegmentedControl), four `Kpi` metric cards
   in a horizontal row (% values + descriptions + trend indicators), an `AreaChart` (three series:
   Up to date / Outdated / Unpublished, 30-day seeded data), and a "Top 5 assets" ranked list
   (asset name + `ProgressBar` + usage count).

3. **Catalog Assets DataTable** — the `Catalog assets` sub-tab matches `camunda-hub2.png`: a
   `Search` bar + `Status` dropdown filter + `Workspaces` dropdown filter above a `DataTable`
   with expandable rows. Columns: Asset name (icon + name), Workspaces (count), Projects (count),
   Latest version, On latest (fraction `Badge`, colour-coded), Status (`Badge`: "No longer
   available" / "Outdated versions" / "Up to date"), Last updated. Expanding a row reveals
   workspace × project sub-rows with version-in-use and last-deployed date.

4. **Project detail** — clicking an asset row navigates (signal-driven, no router) to a project
   detail view matching `camunda-hub3.png`: a `Breadcrumb` (Projects / asset name), page title +
   `···` `OverflowMenu`, a version `Select` ("v2.1.0"), and a primary `Button` ("Deploy & run").
   Main content: `Search` + `Button` ("Create"), a file list (rows: icon, filename, `Badge`
   "Outdated asset", last-modified relative, modified-by, created-by, `OverflowMenu`). A `README`
   section renders below the file list. **Right sidebar** (25% width): three `Card` panels —
   Latest deployment (env `Badge`, relative time), Git repository (repo name, branch, Sync +
   Configure `Button`s), Assets (catalog items used, with their own status badges).

### Cascade Track — Linear faithful clone

**Current state:** Board (kanban columns) + List (DataTable) with a new-issue `Modal`.
AppShell provides a two-item flat sidebar (Board, List).

**Target state (informed by screenshots):**

1. **Sidebar restructure** — SideNav groups support used to produce Linear's three-tier sidebar:
   - **Personal** group (no header): Inbox, My Issues, Notifications (count `Badge`)
   - **Favorites** group (header: "Favorites"): empty placeholder row
   - **Your teams** group (header: "Your teams"): one team block — team name as sub-header,
     then sub-items Issues (active), Cycles, Projects, Views, Pages
   - Bottom: "Add a team" link + "Create new…" `Button`

2. **Issue list redesign** — replaces the plain DataTable rows with Linear's ultra-dense custom
   row list matching `linear0.png`: for each issue, a colored status `circle` icon (backlog=muted,
   todo=blue, in-progress=amber, in-review=violet, done=green), issue ID (`TRK-{n}`), issue title,
   spacer, assignee `Avatar` (sm), relative date. Row height ~32px. Above the list: a tab bar
   (`Tabs` component: All Issues / Active / Backlog) that filters the visible issues.
   A team section header (`<h3>`) groups issues by team.

3. **Breadcrumb + content header** — the issues content area grows a header matching
   `linear0.png`: `Breadcrumb` ("Forum / Issues"), an issue count `Badge`, and icon-button
   affordances for filter, sort, and view (placeholder tooltips).

4. **Settings section** — a new "Settings" bottom-of-sidebar nav item (below the team block)
   opens a settings surface with two sub-pages driven by a secondary `Tabs` bar:
   - **Preferences** (`linear1.png`): General section (display-name `Input`, first-day-of-week
     `Select`, notifications `Toggle`); Interface and theme section (font-size `Select`, pointer
     cursors `Toggle`, Light / Dark `Radio` group that writes to the persisted theme signal).
   - **Workspace** (`linear2.png`): Logo `FileUploader` (128×128 constraint label), workspace
     name `Input`, URL `Input`, Time & region `Select` pair (fiscal year month, region), Welcome
     message read-only note, Danger zone — "Delete workspace" `Button` (destructive variant)
     wrapped in an `AlertDialog` ("This action cannot be undone. All issues and data will be
     permanently deleted.").

---

## Why these changes and not others

- **Faithful over inventive.** The screenshots are the spec. Every layout decision (2-column,
  sidebar groups, dense rows) traces to a pixel in one of the six reference images.
- **No new components, no new deps.** All surfaces compose existing `@cascivo/react`,
  `@cascivo/charts`, and `@cascivo/example-kit` primitives. The one structural extension —
  group headers for SideNav — is a type-safe additive change to `SideNavProps` that is
  backwards-compatible (groups are optional alongside the existing `items` prop).
- **Signal + mobile-first rules hold unchanged.** No `useState`/`useEffect`/router; all
  navigation is signal-driven; all layout is mobile-first with canonical breakpoints.
- **Coverage does not regress.** Both apps must keep exercising every component they currently
  demo; T8 verifies `apps/examples/coverage.test.ts` stays green.

---

## Workstreams

| #   | Workstream                                  | App    | Tranche | Summary                                                                                                                                                                                       |
| --- | ------------------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | SideNav groups extension                    | Shared | T1      | Add `SideNavGroup` type + group-header rendering to the SideNav component; keep flat `items` prop working.                                                                                    |
| B   | Flow sidebar + nav restructure              | Flow   | T1      | Wire Flow App.tsx to use SideNav groups (CONSOLE, CLUSTERS sections, cluster badge item).                                                                                                     |
| C   | Flow Catalog — domain model + chrome        | Flow   | T2      | Catalog data model (assets, workspaces, projects) on kit primitives; Catalog nav item; sub-tab routing signal; date-range control.                                                            |
| D   | Flow Catalog — Adoption view                | Flow   | T2      | Kpi metric cards + AreaChart (3 series) + ranked ProgressBar list.                                                                                                                            |
| E   | Flow Catalog — Assets DataTable             | Flow   | T3      | Expandable DataTable rows; Search + Status + Workspace filters; version fraction badge; status badge variants.                                                                                |
| F   | Flow Project Detail                         | Flow   | T4      | 2-column layout; Breadcrumb; version Select; Deploy & run Button; file list with badges; README; right-sidebar Cards.                                                                         |
| G   | Track sidebar + sub-tabs                    | Track  | T5      | SideNav groups (Personal, Favorites, Your teams); notification count badge; Settings nav item; Tabs (All Issues / Active / Backlog).                                                          |
| H   | Track issue row redesign                    | Track  | T6      | Dense custom row list; status circle icon; issue ID prefix; assignee Avatar; team section header; Breadcrumb + count badge content header.                                                    |
| I   | Track Settings section                      | Track  | T7      | Preferences (General + Interface & theme with radio-driven theme toggle) + Workspace (Logo FileUploader, Name/URL, fiscal/region, danger zone AlertDialog).                                   |
| J   | Screenshots + gate (Flow + Track)           | Both   | T8      | Regenerate `flow` + `track` screenshots; update coverage test app list; full CLAUDE.md gate.                                                                                                  |
| K   | Edge home — Usage widget + template gallery | Edge   | T9      | Right-panel Usage billing widget (cost/limit rows + ProgressBar); Alerts EmptyState; Recent Processes EmptyState; "Deploy your first project" template gallery when projects signal is empty. |
| L   | Edge Deployments — 5-filter bar             | Edge   | T9      | Replace 2-filter approach with 5-filter dense bar (DateRange, Authors, Environments, Repositories, Branch search + Status chip); "No Results" EmptyState + "Clear Filters" link.              |
| M   | Edge Feature Flags section                  | Edge   | T9      | New "Flags" nav item; EmptyState + Create Flag Button; Marketplace Providers grid (3 provider Cards with Create buttons); top-bar type filter Select.                                         |

---

## Decisions baked in

1. **T9 is additive to v23; it does not re-litigate v23 decisions.** The edge app is already
   being rebuilt by v23. T9 layers on three surfaces v23 did not cover, identified from the
   Vercel screenshots in `tmp/`. T9 assumes v23 is complete (or being executed concurrently)
   and that the `edge` app exists at `apps/examples/edge/`.
2. **Both Flow and Track apps are rebuilt in place; slugs and package names are unchanged.** `flow` stays
   `@cascivo/example-flow`; `track` stays `@cascivo/example-track`. Unlike v23's rename, the
   Camunda and Linear analogs are already correctly named.
3. **SideNav groups are additive, not replacing.** `SideNavProps` gains an optional `groups?:
SideNavGroup[]` prop. When `groups` is provided, `items` is ignored. Existing consumers that
   pass only `items` (all current apps) are unaffected at the callsite.
4. **Signal-driven navigation everywhere, no router.** The Flow catalog sub-tabs and project
   detail, and the Track settings sub-pages, all use module-level signals — no `pushState`, no
   React Router — preserving v22's mount-portable `/demos/<slug>/` assembly assumption.
5. **No new chart types.** Flow's Adoption view uses `AreaChart` (already in `@cascivo/charts`)
   and `ProgressBar` (already in `@cascivo/react`). No new chart component is introduced.
6. **No real Camunda or Linear assets.** No logos, marks, or content is copied from the real
   products. All screenshots in `tmp/` are reference-only; the apps use placeholder branding.
7. **Determinism holds.** All data derives from `seededRandom` fixtures; no `Math.random()` in
   committed code. Re-running the screenshot script produces a no-op diff.
8. **Coverage does not regress.** Both apps must continue demoing every component they currently
   cover. The `coverage.test.ts` APPS list already includes `flow` and `track`; it is not changed
   — only new component usages are added.
9. **CSS rules hold.** Token-only CSS; mobile-first with canonical breakpoints; ≥44px touch
   targets; `pnpm breakpoint:check` and `pnpm fallback:check` must exit 0.

---

## Definition of Done

### Shared

- [ ] `SideNavProps` gains `groups?: SideNavGroup[]`; flat `items` prop remains; all existing
      consumers compile with zero TypeScript errors. _Verify: T1._
- [ ] `pnpm exec vp check` (fmt + lint + tsc) exits 0 on `packages/components` after SideNav
      change. _Verify: T1._

### Cascade Flow

- [ ] Flow sidebar shows two section headers ("CONSOLE", "CLUSTERS") with items beneath each;
      one cluster entry renders an env `Badge` chip inline. _Verify: T1._
- [ ] A "Catalog" top-level nav item is present; selecting it shows three sub-tabs (Catalog
      assets / Asset usage / Asset adoption) rendered with the `Tabs` component. _Verify: T2._
- [ ] The Adoption sub-tab renders: a date-range `SegmentedControl`; four `Kpi` metric cards
      (each with a % value, label, sub-metric, and trend `Badge`); an `AreaChart` with three
      labelled series and seeded 30-day data; a "Top 5 assets" ranked list using `ProgressBar`.
      _Verify: T2._
- [ ] The Catalog assets sub-tab renders a `DataTable` with expandable rows, a `Search` bar, a
      Status dropdown, a Workspaces dropdown, status `Badge` cells, and a fraction `Badge` on the
      "On latest" column. _Verify: T3._
- [ ] Clicking a catalog asset navigates (signal, no router) to a project detail view with a
      `Breadcrumb`, version `Select`, "Deploy & run" primary `Button`, file list with "Outdated
      asset" `Badge`s, a README section, and a right sidebar containing three `Card` panels
      (Latest deployment, Git repository, Assets). _Verify: T4._
- [ ] `apps/examples/coverage.test.ts` stays green for Flow. _Verify: T8._

### Cascade Track

- [ ] Track sidebar renders three groups: Personal (Inbox, My Issues, Notifications with a count
      `Badge`), Favorites (empty placeholder), and Your teams (team sub-header + Issues, Cycles,
      Projects, Views, Pages sub-items). _Verify: T5._
- [ ] Issues content area has a `Breadcrumb` ("Forum / Issues") + issue count `Badge` + a `Tabs`
      bar (All Issues / Active / Backlog) that correctly filters the displayed issue list.
      _Verify: T5 + T6._
- [ ] Each issue row renders: colored status circle (CSS-driven by `data-status`), issue ID
      (`TRK-{n}`), title, spacer, assignee `Avatar` (sm), relative date; row height ≤36px.
      _Verify: T6._
- [ ] A Settings nav item opens a settings surface with two sub-pages (Preferences, Workspace)
      selectable via `Tabs`. _Verify: T7._
- [ ] Preferences page: General section with display-name `Input` and notifications `Toggle`;
      Interface & theme section with Light / Dark `Radio` that updates the persisted theme signal.
      _Verify: T7._
- [ ] Workspace page: logo `FileUploader`, name + URL `Input`s, fiscal-month + region `Select`s,
      and a Danger zone with a "Delete workspace" destructive `Button` wrapped in an `AlertDialog`.
      _Verify: T7._
- [ ] `apps/examples/coverage.test.ts` stays green for Track. _Verify: T8._

### Cascade Edge (T9)

- [ ] The edge app home view renders a right-side panel containing: a **Usage** section with four
      cost/limit rows (Fast Data Transfer, Fast Edge Transfer, Private Data Transfer, Edge Requests),
      each with a `ProgressBar` showing consumed ratio and a cost string; an "Alerts" panel with an
      `EmptyState`; a "Recent Processes" panel with an `EmptyState`. _Verify: T9._
- [ ] When the seeded projects array is empty, the main home area renders "Deploy your first project"
      heading + a template list (≥4 templates, each with name, description, and a `Button`) + a
      "Browse Templates" link. _Verify: T9._
- [ ] The per-project Deployments tab filter bar renders five filter controls in a row: date-range
      `Select`, Authors `Select`, Environments `Select`, Repositories `Select`, Branch `Search`
      input, and a Status `Select` chip; filtering to zero results shows `EmptyState` "No Results" + a "Clear Filters" link `Button`. _Verify: T9._
- [ ] A "Flags" nav item is present in the edge sidebar; clicking it renders the Flags view with:
      a top-bar "All types" `Select` + "Create Flag" `Button`; an `EmptyState` "No flags found"
      with a "Create Flag" `Button`; a Marketplace Providers section with three provider `Card`s
      (Statsig, GrowthBook, PostHog) each with name, description, and a "Create" `Button`.
      _Verify: T9._
- [ ] `apps/examples/coverage.test.ts` stays green for Edge. _Verify: T9._

### Gate

- [ ] Deterministic screenshots regenerated for `flow` (light/dark/mobile) and `track`
      (light/dark/mobile); re-running the capture is a no-op diff. _Verify: T8._
- [ ] Deterministic screenshots regenerated for `edge` (light/dark/mobile) after T9 changes;
      re-running the capture is a no-op diff. _Verify: T9._
- [ ] Full CLAUDE.md gate exits 0: `vp check` → `pnpm build` → `vp run -r check` → `pnpm test`
      → regen + diff → `breakpoint:check`. _Verify: T9 (final gate across all tranches)._
- [ ] `ROADMAP-V24.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T9._

---

## Non-goals (explicitly out of scope)

| Claim                                       | Substance                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No rename of flow or track slugs**        | Package names, slugs, and i18n namespaces are unchanged.                                                                                         |
| **No new components**                       | All surfaces compose existing `@cascivo/react` + `@cascivo/charts`. The SideNav groups extension is additive to a shared component's props only. |
| **No client router**                        | Navigation between catalog / project detail / settings is signal-driven; no `pushState` added.                                                   |
| **No real product assets**                  | No Camunda or Linear logos, marks, or screenshots are included.                                                                                  |
| **No BPMN/workflow diagram rendering**      | Flow remains a hub-style catalog app; live process graph visualisation is deferred.                                                              |
| **No real auth / multi-tenant**             | Team and workspace switching is seeded fiction; no login flow.                                                                                   |
| **No backend**                              | Seeded fixtures + `@cascivo/storage` + mock API only.                                                                                            |
| **No changes to pay or pulse**              | Both apps are out of scope for v24.                                                                                                              |
| **No real Vercel assets or flag providers** | No Vercel / Statsig / GrowthBook / PostHog logos, APIs, or SDKs. The Flags Marketplace grid uses placeholder card content only.                  |
| **No live flag management**                 | "Create Flag" buttons are no-ops; the Flags section renders permanently in empty state.                                                          |

---

## Deferred (do not re-litigate in v24)

- **Real BPMN canvas** — rendering live process diagrams in Flow is a specialised visualisation
  that requires a dedicated chart type; out of scope.
- **Linear Cycles and Projects views** — the Track sidebar links to Cycles/Projects sub-pages
  but they render placeholder content; full implementation is deferred.
- **Flow Asset Usage sub-tab** — the third sub-tab ("Asset usage") is wired and renders a
  placeholder; detailed usage-trend views are deferred to a follow-up.
- **Track Notifications inbox** — the Notifications sidebar item shows a count badge; clicking
  it shows placeholder content; full notification list is deferred.
- **Settings CRUD persistence** — Track Workspace settings render a working form UI but the
  save action only updates in-memory signals (not persisted to `@cascivo/storage`); full
  persistence is deferred.
- **Edge Deployments pagination** — the 5-filter bar shows all matching seeded rows; pagination
  of the filtered list is deferred.
- **Edge Flags actual creation flow** — the "Create Flag" button is a no-op in T9; a modal or
  drawer for flag creation is deferred.
