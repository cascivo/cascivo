# v24 — Pixel Fidelity for Edge (Vercel), Flow (Camunda) and Track (Linear) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close pixel-fidelity gaps across all three screenshot-benchmarked example apps: Cascade Edge (three Vercel surfaces v23 didn't cover), Cascade Flow (Camunda Hub clone), and Cascade Track (Linear clone).

**Architecture:** Three parallel workstreams (Edge T9 is independent of T1–T8) share one foundation change (SideNav groups, T1). Flow gains an Organization Catalog with expandable DataTable, adoption metrics charts, and a project detail 2-column layout. Track gains a grouped sidebar, a dense issue row list with sub-tabs, and a Settings section. Edge gains a Usage billing widget + template gallery on home, a 5-filter Deployments bar, and a Feature Flags / Marketplace section. All navigation is signal-driven; no router; all data is seeded mock; no backend.

**Tech Stack:** `@cascivo/react` (SideNav, DataTable, Tabs, Badge, Kpi, ProgressBar, FileUploader, AlertDialog, Radio, Toggle, Select, Input, Avatar, Breadcrumb, Button, Card, Search, OverflowMenu, Skeleton, EmptyState), `@cascivo/charts` (AreaChart, ProgressBar), `@cascivo/example-kit` (AppShell, createMockApi, seededRandom), `@cascivo/storage` (persistedSignal), `@cascivo/i18n` (defineMessages, t), Vitest + Playwright.

---

## Tranche Overview

| Tranche | Title                                 | Workstream    | Goal                                                                                                              |
| ------- | ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| T1      | SideNav Groups + Flow Nav Restructure | Shared + Flow | Extend SideNav with optional `groups` prop; wire Flow to CONSOLE / CLUSTERS sections                              |
| T2      | Flow Catalog Chrome + Adoption View   | Flow          | Catalog nav item, sub-tab routing, date-range control, Kpi cards, AreaChart, ranked list                          |
| T3      | Flow Catalog Assets DataTable         | Flow          | Expandable DataTable, Search + Status + Workspace filters, fraction badge, status badge variants                  |
| T4      | Flow Project Detail                   | Flow          | 2-column layout, Breadcrumb, version Select, file list, README, right-sidebar Cards                               |
| T5      | Track Sidebar + Sub-tabs              | Track         | SideNav groups (Personal/Favorites/Your teams), notification badge, Settings nav, sub-tabs on Issues              |
| T6      | Track Issue Row Redesign              | Track         | Dense custom row list, status circle, issue ID prefix, assignee Avatar, team header, content Breadcrumb           |
| T7      | Track Settings Section                | Track         | Preferences (General + theme radio) + Workspace (FileUploader, inputs, danger zone AlertDialog)                   |
| T8      | Screenshots + Gate (Flow + Track)     | Both          | Regenerate `flow` + `track` screenshots; coverage check; CLAUDE.md gate                                           |
| T9      | Edge — Vercel Screenshot Gaps         | Edge          | Home Usage widget + template gallery; 5-filter Deployments bar + empty state; Feature Flags / Marketplace section |

---

## Files Created / Modified per Tranche

### T1 — SideNav Groups + Flow Nav Restructure

| Action | Path                                                   |
| ------ | ------------------------------------------------------ |
| Modify | `packages/components/src/side-nav/side-nav.tsx`        |
| Modify | `packages/components/src/side-nav/side-nav.module.css` |
| Modify | `packages/components/src/side-nav/side-nav.test.tsx`   |
| Modify | `apps/examples/flow/src/App.tsx`                       |
| Modify | `apps/examples/flow/src/i18n.ts`                       |

### T2 — Flow Catalog Chrome + Adoption View

| Action | Path                                                              |
| ------ | ----------------------------------------------------------------- |
| Create | `apps/examples/flow/src/data/catalog.ts`                          |
| Create | `apps/examples/flow/src/sections/catalog/CatalogShell.tsx`        |
| Create | `apps/examples/flow/src/sections/catalog/AdoptionView.tsx`        |
| Create | `apps/examples/flow/src/sections/catalog/AdoptionView.module.css` |
| Modify | `apps/examples/flow/src/App.tsx`                                  |
| Modify | `apps/examples/flow/src/i18n.ts`                                  |

### T3 — Flow Catalog Assets DataTable

| Action | Path                                                             |
| ------ | ---------------------------------------------------------------- |
| Create | `apps/examples/flow/src/sections/catalog/AssetsTable.tsx`        |
| Create | `apps/examples/flow/src/sections/catalog/AssetsTable.module.css` |
| Modify | `apps/examples/flow/src/sections/catalog/CatalogShell.tsx`       |

### T4 — Flow Project Detail

| Action | Path                                                               |
| ------ | ------------------------------------------------------------------ |
| Create | `apps/examples/flow/src/sections/catalog/ProjectDetail.tsx`        |
| Create | `apps/examples/flow/src/sections/catalog/ProjectDetail.module.css` |
| Modify | `apps/examples/flow/src/sections/catalog/CatalogShell.tsx`         |
| Modify | `apps/examples/flow/src/data/catalog.ts`                           |

### T5 — Track Sidebar + Sub-tabs

| Action | Path                                  |
| ------ | ------------------------------------- |
| Modify | `apps/examples/track/src/App.tsx`     |
| Modify | `apps/examples/track/src/i18n.ts`     |
| Modify | `apps/examples/track/src/commands.ts` |

### T6 — Track Issue Row Redesign

| Action | Path                                                        |
| ------ | ----------------------------------------------------------- |
| Create | `apps/examples/track/src/sections/IssueRow.tsx`             |
| Create | `apps/examples/track/src/sections/IssueRow.module.css`      |
| Create | `apps/examples/track/src/sections/IssueListView.tsx`        |
| Create | `apps/examples/track/src/sections/IssueListView.module.css` |
| Modify | `apps/examples/track/src/App.tsx`                           |
| Modify | `apps/examples/track/src/i18n.ts`                           |

### T7 — Track Settings Section

| Action | Path                                                               |
| ------ | ------------------------------------------------------------------ |
| Create | `apps/examples/track/src/sections/Settings.tsx`                    |
| Create | `apps/examples/track/src/sections/Settings.module.css`             |
| Create | `apps/examples/track/src/sections/settings/Preferences.tsx`        |
| Create | `apps/examples/track/src/sections/settings/Preferences.module.css` |
| Create | `apps/examples/track/src/sections/settings/Workspace.tsx`          |
| Create | `apps/examples/track/src/sections/settings/Workspace.module.css`   |
| Modify | `apps/examples/track/src/App.tsx`                                  |
| Modify | `apps/examples/track/src/i18n.ts`                                  |

### T8 — Screenshots + Gate (Flow + Track)

| Action            | Path                             |
| ----------------- | -------------------------------- |
| Modify/regenerate | `screenshots/flow/`              |
| Modify/regenerate | `screenshots/track/`             |
| Verify            | `apps/examples/coverage.test.ts` |

### T9 — Edge Vercel Screenshot Gaps

| Action            | Path                                                                               |
| ----------------- | ---------------------------------------------------------------------------------- |
| Create            | `apps/examples/edge/src/sections/home/UsagePanel.tsx`                              |
| Create            | `apps/examples/edge/src/sections/home/UsagePanel.module.css`                       |
| Create            | `apps/examples/edge/src/sections/home/TemplateGallery.tsx`                         |
| Create            | `apps/examples/edge/src/sections/home/TemplateGallery.module.css`                  |
| Modify            | `apps/examples/edge/src/sections/home/Home.tsx` (add UsagePanel + TemplateGallery) |
| Modify            | `apps/examples/edge/src/sections/project/Deployments.tsx` (replace filter bar)     |
| Create            | `apps/examples/edge/src/sections/flags/FlagsView.tsx`                              |
| Create            | `apps/examples/edge/src/sections/flags/FlagsView.module.css`                       |
| Modify            | `apps/examples/edge/src/App.tsx` (add Flags nav item + view routing)               |
| Modify            | `apps/examples/edge/src/data/edge.ts` (add usage fixtures + template seeding)      |
| Modify            | `apps/examples/edge/src/i18n.ts`                                                   |
| Modify/regenerate | `screenshots/edge/`                                                                |

---

## Dependency Graph

```
T1 (SideNav groups) ──► T2 (Flow Catalog) ──► T3 (Assets table) ──► T4 (Project detail) ──► T8
                    └──► T5 (Track sidebar) ──► T6 (Issue rows)  ──► T7 (Settings)       ──► T8
                                                                                               │
T9 (Edge gaps) ────────────────────────────────────────────────────────────────────────────────┘
```

T1 must complete first. T2–T4 (Flow) and T5–T7 (Track) can be executed in parallel once T1 is
done. T9 (Edge) is independent of T1–T8 and can run in parallel — it only requires that the
`edge` app (created by v23) exists. T8 gates on T1–T7; T9 runs concurrently and adds its own
screenshot + gate step at the end.

---

## Component Budget per App (coverage check)

### Edge — new components exercised in v24 (T9)

| Component                        | Where introduced                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `ProgressBar`                    | UsagePanel.tsx — cost/limit rows (each metric has a thin bar)                            |
| `Card`                           | FlagsView.tsx — Marketplace provider cards                                               |
| `EmptyState`                     | FlagsView.tsx + Home.tsx — "No flags found", "No projects yet", Alerts, Recent Processes |
| `DatePicker` or `Select` (range) | Deployments.tsx — date-range filter control                                              |
| `Search`                         | Deployments.tsx — branch search filter                                                   |

### Flow — new components exercised in v24

| Component      | Where introduced                         |
| -------------- | ---------------------------------------- |
| `Kpi` (charts) | AdoptionView.tsx — four metric cards     |
| `AreaChart`    | AdoptionView.tsx — asset usage over time |
| `ProgressBar`  | AdoptionView.tsx — ranked list bars      |
| `Breadcrumb`   | ProjectDetail.tsx                        |
| `Select`       | ProjectDetail.tsx — version picker       |
| `FileUploader` | _(reserved for Track T7)_                |
| `OverflowMenu` | ProjectDetail.tsx — file row actions     |
| `Card`         | ProjectDetail.tsx — right sidebar panels |

### Track — new components exercised in v24

| Component      | Where introduced                                                                          |
| -------------- | ----------------------------------------------------------------------------------------- |
| `Avatar`       | IssueRow.tsx — assignee avatar                                                            |
| `Tabs`         | IssueListView.tsx — All Issues / Active / Backlog; Settings.tsx — Preferences / Workspace |
| `Breadcrumb`   | IssueListView.tsx — content header                                                        |
| `Radio`        | Preferences.tsx — Light / Dark theme                                                      |
| `Toggle`       | Preferences.tsx — notifications toggle                                                    |
| `FileUploader` | Workspace.tsx — logo upload                                                               |
| `AlertDialog`  | Workspace.tsx — delete workspace confirmation                                             |

---

## Conventions to follow in every tranche

1. **Signals over hooks.** `useSignal`, `useComputed`, `useSignalEffect` only. No `useState`,
   `useEffect`, `useContext`, `useReducer`.
2. **`useSignals()` first line** in every component that reads `.value` during render (React apps
   get no Babel transform).
3. **i18n strings always.** No hardcoded English strings in TSX. Every user-visible string comes
   from `defineMessages` + `t(msg.key)`.
4. **Token-only CSS.** No hardcoded colour hex, no raw pixel sizes outside of layout
   necessities. Use `var(--cascivo-*)` throughout.
5. **Mobile-first.** Base styles for 320px; enhancements at `min-width: 30rem` / `40rem` /
   `64rem` / `80rem`. `pnpm breakpoint:check` must exit 0.
6. **Seeded data.** All mock data uses `seededRandom(seed)` from `@cascivo/example-kit`. No
   `Math.random()`.
7. **Commit after each tranche.** Gate commands must all exit 0 before the commit.

---

## Gate Commands (run before each commit)

```sh
pnpm exec vp check           # fmt + lint + tsc
pnpm build                   # build all packages
pnpm exec vp run -r check    # type-check all packages
pnpm test                    # unit + smoke tests
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm breakpoint:check
```
