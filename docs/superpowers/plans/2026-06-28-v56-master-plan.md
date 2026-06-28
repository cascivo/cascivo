# v56 — Real-Time & Scale: Production-Grade Streaming Primitives for Data Dashboards — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the **real-time / scale** gaps an external evaluation surfaced while building a Vercel-like dashboard
on cascivo (`cascivo_dashboard_analysis.md`), per the analysis in `docs/ROADMAP-V56.md`. The study confirmed that of
the feedback's three "bottlenecks", **two are real** (high-frequency stream ingestion without GC pressure; disposable
per-workspace state) and **one is largely already solved** (layout shells + a dashboard template ship today); that the
chart "correction" **understates** an already-strong, 25-type, zero-dep package whose only true gap is a **live-binding
pattern + multi-axis**; and — critically — that the feedback's own suggested streaming fix
(`logsSignal.value = [...logs.slice(1), line]`) is an **O(n)-per-line anti-pattern** we must replace, not ship.

Governing thesis: **supply four small, reusable primitives and prove them; do not rebuild what exists.** A bounded
stream buffer, a virtualized log console, a live chart-binding helper, and a disposable signal scope are the missing
pieces; the shells, the table, the charts engine (which already has `decimate.ts` + `scale-time.ts`), the templates
pipeline, and the deploy example are the foundation we compose. No backend, no new runtime dependency, no fork of the
charts engine, no re-authoring of an already-shipping shell or template.

Deliver: **(T1)** `createStreamBuffer`/`useStreamBuffer` in `@cascivo/core` — O(1) capped append + rAF-coalesced
flush; **(T2)** a virtualized `LogViewer` component backed by the T1 buffer; **(T3)** a `bindStream`/`useStreamSeries`
chart helper + `secondAxis` on `LineChart`/`AreaChart` + a streaming cookbook; **(T4)** `createScope`/`useScope` in
`@cascivo/core` for disposable per-workspace signal isolation; **(T5)** the integration — wire all four into the v55
`templates/dashboard`, make `apps/examples/deploy` stream a mock build log + live chart, and ship
`docs/cookbooks/vercel-dashboard.md`. **Do not** add a backend, a real socket transport, a terminal emulator, a state
library, or a new runtime dependency.

Target state (verified after T5):

| Finding (severity)                                               | Today                                                          | Target                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| M-1 No bounded streaming buffer (🔴)                            | core has `infinite-scroll`; storage has `persistedSignal`     | `createStreamBuffer`/`useStreamBuffer`: O(1) capped append + rAF flush; one render/frame             |
| M-2 No virtualized log console (🔴)                             | `DataTable` virtualizes rows only                             | `LogViewer`: windowed monospace console, auto-follow, search, ANSI, a11y, i18n                        |
| M-3 No live chart binding; multi-axis only in ComboChart (🟠)   | charts signal-driven; `decimate.ts`/`scale-time.ts` exist     | `bindStream`/`useStreamSeries` + append-time decimation; `secondAxis` on Line/Area; streaming cookbook |
| M-4 No disposable signal scope (🟡)                             | `FocusScope` (DOM) + `ShellState` (composition)               | `createScope`/`useScope` with `dispose()` that tears down owned signals/effects                       |
| M-5 Streaming dashboard not proven end-to-end (🟠)              | static `templates/dashboard` + static deploy example          | template + deploy example stream logs + live charts under a scope; `vercel-dashboard.md` cookbook       |
| C-1 Feedback says shells are missing (correction)               | `AppShell`/`DashboardLayout`/`templates/dashboard` exist       | unchanged — composed, not rebuilt; the recipe is the deliverable                                      |
| C-2 Feedback "discovers" charts (correction)                    | 25 zero-dep signal-driven chart types ship                    | unchanged engine — only a binding layer + multi-axis added                                            |
| Full gate (`pnpm ready`)                                        | green                                                         | green                                                                                               |

**Architecture & evidence (reproduced in-repo before planning):**

- **Core** (`packages/core/src/`): `signals.ts` (`signal`/`computed`/`effect`/`batch`/`useSignal`/`useComputed`/
  `useSignalEffect`/`useSignals`), `machine.ts`, `infinite-scroll.ts`, `focus-scope.tsx`, `index.ts` (the export
  surface). **No** stream buffer and **no** disposable scope — that is T1 + T4.
- **Storage** (`packages/storage/src/persisted-signal.ts`): the persistence pattern T1's buffer follows for shape
  (factory returning a signal + helpers), minus persistence.
- **Charts** (`packages/charts/src/`): `engine/decimate.ts` (already present — append-time downsampling), `engine/
  scale-time.ts` (time axis), `charts/{line,area,combo}-chart/*`, `core/chart-frame.tsx` (signal-driven frame,
  `tooltipMode:'axis'` crosshair), `chrome/{legend,grid-lines}.tsx`, `combo-chart` `secondAxis?: boolean` (the
  multi-axis to generalize). T3 *uses* these; it does not rewrite them.
- **Components** (`packages/components/src/data-table/data-table.tsx`): the existing virtualization (windowSize/
  rowHeight/overscan, visible-range slice) is the model T2's `LogViewer` mirrors for windowing.
- **Layouts** (`packages/layouts/src/`): `app-shell`, `dashboard-layout`, `grid`, `auto-grid`, `stack`,
  `split-view`; `app-shell/shell-state.ts` (the composition object). Reused by T5; not rebuilt (C-1).
- **Templates** (`templates/dashboard/`, `templates/cascivo-registry.json` — v55): the seed T5 enriches with the new
  primitives.
- **Reference** (`apps/examples/deploy/`): the Vercel-like mock (`AppShell`/`DataTable`/`Sparkline`/`Stat`/mock API +
  `persistedSignal`). T5 adds a streaming log panel + a live chart here.
- **CLAUDE.md constraints (binding on every tranche):** signals only — `useSignal`/`useComputed`/`useSignalEffect`/
  `useMachine`/`useRef`-for-DOM; **no** `useState`/`useEffect`/`useContext`/`useReducer`; React example apps
  (`apps/examples/*`) call `useSignals()` first; user-visible strings default from `@cascivo/i18n`
  (`t(builtin.<component>.<key>)`); WCAG 2.2 AA; ≥44px coarse touch targets; no off-scale `@media`/`@container`
  literals (`pnpm breakpoint:check`); component exported from `@cascivo/react`; manifest-derived docs survive
  `pnpm regen` + the drift check; CSS `@function`/`if()` only as progressive enhancement with a static fallback.

**Tech Stack:** `@cascivo/core` (signals + `useMachine` + `requestAnimationFrame`), `@cascivo/charts` engine
(`decimate`/`scale-time`), `packages/components` + `@cascivo/react`, `@cascivo/layouts`, the v55 templates pipeline,
`apps/examples/deploy`, `@cascivo/i18n`. Pure TypeScript + modern CSS. **No backend, no new runtime dependency.**

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                                                                                                                                                                                                                                                  |
| ------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Bounded stream buffer (core)       | `createStreamBuffer<T>({ capacity })` — a ring buffer with O(1) `append(item)` / `appendMany(items)`, a `.signal` exposing the current window (newest-last), `.clear()`, and **rAF-coalesced** flushing so many appends in one frame produce one signal write / one render. A `useStreamBuffer` hook ties it to a component. Replaces the feedback's O(n) `[...slice(1), line]`. No new dependency. (M-1) |
| T2      | Virtualized `LogViewer` (components) | A monospace stream console reading a T1 buffer (or any `Signal<readonly Line[]>`): windowed DOM (only visible rows mount, overscan), **pin-to-bottom auto-follow** that releases when the user scrolls up and re-engages at the bottom, line-level + ANSI 16-color spans, search/highlight, copy-all, `role="log"`/`aria-live="polite"`, i18n strings, ≥44px coarse controls. Exported from `@cascivo/react`. (M-2) |
| T3      | Live chart binding + multi-axis (charts) | A `bindStream`/`useStreamSeries` helper: a poll/SSE callback → a capped time-series signal → `LineChart`/`AreaChart`, decimated at append time via `engine/decimate.ts`, time-scaled via `engine/scale-time.ts`. Promote `secondAxis` from `ComboChart` to `LineChart`/`AreaChart` (a right-hand y-axis + per-series axis assignment). `docs/cookbooks/charts-streaming.md`. (M-3/C-2) |
| T4      | Disposable signal scope (core)     | `createScope()` → `{ signal, computed, effect, dispose }`: members created through the scope are *owned* by it; `dispose()` stops every owned `effect` and releases references so a workspace/org switch tears down cleanly without leaks or stale subscriptions. `useScope()` binds a scope to a component's mount lifetime. Correct framing of the feedback's Bottleneck 3. (M-4) |
| T5      | Prove it end-to-end                | Wire T1–T4 into the v55 `templates/dashboard` (a streaming build-log panel via `LogViewer`+buffer, a live-metrics `AreaChart` via `useStreamSeries`, workspace state via `createScope`). Make `apps/examples/deploy` stream a mock build log + a live usage chart (driven by the existing seeded mock API). Ship `docs/cookbooks/vercel-dashboard.md`. Flip `docs/ROADMAP-V56.md` → Shipped. (M-5/C-1) |

Ordering rationale: **T1 first** — the buffer is the primitive both T2 and T3 consume. **T2** ships the most visible
missing piece (a real log console). **T3** reuses the same bounded-stream idea for charts. **T4** is independent
(parallelizable any time before T5). **T5** integrates and proves all four. T1→T2 and T1→T3 are the critical path;
T4 floats; T5 depends on all.

---

## Files Created / Modified per Tranche

### T1 — Bounded stream buffer (core)

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/core/src/stream-buffer.ts` (`createStreamBuffer`, `useStreamBuffer`) + `stream-buffer.test.ts` |
| Modify | `packages/core/src/index.ts` (export `createStreamBuffer`/`useStreamBuffer` + their types) |
| Modify | `packages/core/README.md` (document the buffer + the anti-pattern it replaces) |

### T2 — Virtualized `LogViewer` (components)

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/components/src/log-viewer/log-viewer.tsx` + `log-viewer.module.css` + `log-viewer.meta.ts` + `log-viewer.test.tsx` |
| Modify | `packages/components/package.json` (add the `./log-viewer` export) |
| Modify | `packages/react/src/index.ts` (re-export `LogViewer`) |
| Modify | `packages/i18n/src/builtin/*` (add `logViewer` strings: follow/paused/search/copy/empty) |

### T3 — Live chart binding + multi-axis (charts)

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/charts/src/stream/use-stream-series.ts` (`bindStream`/`useStreamSeries`) + test |
| Modify | `packages/charts/src/charts/line-chart/line-chart.tsx` + `area-chart/area-chart.tsx` (`secondAxis` + per-series axis) + tests |
| Modify | `packages/charts/src/index.ts` (export the stream helper + types) |
| Create | `docs/cookbooks/charts-streaming.md` |

### T4 — Disposable signal scope (core)

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/core/src/scope.ts` (`createScope`, `useScope`) + `scope.test.ts` |
| Modify | `packages/core/src/index.ts` (export `createScope`/`useScope` + types) |
| Modify | `packages/core/README.md` (document scope ownership + teardown) |

### T5 — Prove it end-to-end

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `templates/dashboard/*` (add a streaming log panel + a live chart + a scoped workspace store) + rebuilt `public/r/*.json` |
| Modify | `apps/examples/deploy/src/*` (stream a mock build log via `LogViewer`; a live usage `AreaChart` via `useStreamSeries`; scope per-workspace state) |
| Create | `docs/cookbooks/vercel-dashboard.md` |
| Modify | `docs/ROADMAP-V56.md` → Status: Shipped + an implementation log |

---

## Key Decisions

### Decision 1 — Fix the streaming buffer correctly: O(1) ring + rAF flush, not the feedback's O(n) slice (firm)

The single most important decision. The feedback proposes `logsSignal.value = [...currentLogs.slice(1), newLine]` —
which **reallocates and re-copies the entire array on every line**, O(n) per append, the exact GC pressure it claims
to fix, and which also triggers a render per line. **Decision: a fixed-capacity ring buffer with O(1) `append`, plus
**rAF-coalesced flushing** so a burst of appends within one animation frame results in one signal write and one
render.** **Rejected:** the array-slice pattern (O(n)/line, render-per-line) and an unbounded array (memory growth →
tab crash, the original symptom).

### Decision 2 — `LogViewer` virtualizes DOM and follows the windowing model `DataTable` already uses (firm)

A 100k-line log cannot mount 100k DOM nodes. **Decision: only the visible rows (+ overscan) mount, mirroring the
existing `DataTable` virtualization approach; auto-follow pins to bottom and releases on scroll-up.** **Rejected:**
rendering every line (DOM blow-up) and CSS `content-visibility` alone (does not bound node count for hundreds of
thousands of lines).

### Decision 3 — Charts get a *binding layer*, not an engine rewrite (firm)

The engine already decimates (`engine/decimate.ts`) and time-scales (`engine/scale-time.ts`); charts are already
signal-driven and zero-dep (C-2). **Decision: add a thin `useStreamSeries`/`bindStream` helper (poll/SSE → capped
time-series signal → existing chart) and generalize the existing `ComboChart` `secondAxis` to Line/Area.**
**Rejected:** a new streaming chart type, a worker/canvas renderer, or any change to scales/shapes/stacking — out of
scope, and unjustified given the engine.

### Decision 4 — Scope is a thin ownership wrapper over `@cascivo/core` signals, not a store or context (firm)

The feedback's "scoped signal contexts" must not become a state-management framework. **Decision: `createScope()`
returns `{ signal, computed, effect, dispose }`; members made through it are owned and torn down together by
`dispose()`.** It composes with existing signals; it is not a `Context`, a Redux-style store, or a DI container.
**Rejected:** React Context (banned by CLAUDE.md) and a global registry of scopes (leaks the thing we are trying to
prevent).

### Decision 5 — Prove the primitives in real surfaces; don't ship them naked (firm)

A primitive nobody wires up rots. **Decision: T5 lands all four in the v55 `templates/dashboard` *and* the
`apps/examples/deploy` reference *and* a `vercel-dashboard.md` cookbook, so the next builder copies a working
streaming dashboard.** **Rejected:** shipping T1–T4 with only unit tests and no integrated example (the gap the
feedback hit in the first place).

### Decision 6 — Correct the feedback in the docs; build only what's real (firm)

**Decision: the roadmap explicitly records C-1 (shells/template already exist) and C-2 (charts already strong), and
the plan builds neither a new shell nor a new chart package.** **Rejected:** taking the feedback at face value and
re-implementing `DashboardShell`/`ProjectGrid` or "adopting" a chart package that already ships — wasted work that
violates CLAUDE.md "Simplicity First" and "Surgical Changes".

### Decision 7 — Mock streams only; the real transport is the user's seam (recommended)

**Decision: T5 drives streams from the deploy example's existing seeded mock API; the cookbook documents where a real
WebSocket/SSE plugs in.** **Rejected:** building a server or a real socket client — out of scope (no backend) and
unnecessary to prove the client primitives.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if build config or workspace deps changed; `pnpm breakpoint:check` clean for any new UI.
2. **Build on the foundation, never rebuild it.** Every tranche is checked against "did we just re-implement an
   existing shell / chart / template / virtualization?" The answer must stay **no** (C-1/C-2, Decisions 3/6). Reuse
   `@cascivo/layouts`, the charts `engine/`, `DataTable`'s windowing model, and the v55 templates pipeline.
3. **No backend, no new runtime dependency.** Streams are client-side + mock; the buffer, scope, log console, and
   chart binding rely only on signals, the DOM, `requestAnimationFrame`, and the existing charts engine (Decisions
   1/3/7).
4. **Performance is the acceptance test, not a nicety.** T1 must prove one-render-per-frame under a high-frequency
   append loop; T2 must prove bounded DOM node count under a 100k-line buffer; T3 must prove decimation caps rendered
   points. Each ships a test asserting the bound (Decisions 1/2/3).
5. **Signals, not hooks** (CLAUDE.md): `useSignal`/`useComputed`/`useSignalEffect`/`useMachine`/`useRef`-for-DOM only;
   any DOM side effect (scroll listeners, rAF, `scrollIntoView`) uses `useSignalEffect`, never `useEffect`; React
   example apps call `useSignals()` first.
6. **i18n + a11y + responsive** on every new UI (`LogViewer`, the template/example panels, the cookbook demos):
   strings default from `@cascivo/i18n`; WCAG 2.2 AA (`role="log"`/`aria-live`, keyboard scroll/search/copy); ≥44px
   coarse targets; no off-scale `@media`/`@container` literals; mobile sweep at 320/360/390/414.
7. **Manifest is the source of truth.** `LogViewer` ships a `log-viewer.meta.ts`; docs/stories derive from it; after
   `pnpm regen` the drift check (`git diff --exit-code`) is clean. New `@cascivo/*` exports that resolve to `dist/`
   get source aliases per CLAUDE.md "Workspace package aliases".
8. **Out-of-scope stays out.** No real socket transport; no terminal emulator; no chart-engine rewrite; no
   state-management library; no worker/canvas rendering; no re-authoring of `AppShell`/`DashboardLayout`/
   `templates/dashboard`.
</content>
