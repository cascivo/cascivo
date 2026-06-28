# cascivo — Roadmap v56: Real-Time & Scale — Production-Grade Streaming Primitives for Data Dashboards

**Last updated:** 2026-06-28
**Status:** ✅ Shipped — T1–T5 implemented: a bounded `createStreamBuffer`/`useStreamBuffer` ring buffer
(`@cascivo/core`); a virtualized `LogViewer` stream console (`@cascivo/react`); `useStreamSeries`/`bindStream` +
multi-axis on `LineChart`/`AreaChart` (`@cascivo/charts`) with a streaming cookbook; a disposable
`createScope`/`useScope` (`@cascivo/core`); and an end-to-end proof — the `apps/examples/deploy` **Build monitor**
streams a mock build log + a live throughput chart under a per-build scope, plus `docs/cookbooks/vercel-dashboard.md`
and streaming pointers in the `dashboard` template. The pieces the feedback assumed were missing (layout shells, a
chart package, a dashboard template) already shipped; this work corrected that and built only the real streaming/scale
gaps. See the implementation log at the end.
**Plan documents:** `docs/superpowers/plans/2026-06-28-v56-master-plan.md` + tranches 1–5
**Builds on:** `@cascivo/core` (signals + `useMachine` + `infinite-scroll` + `FocusScope` — `packages/core/src/`),
`@cascivo/storage` (`persistedSignal` — `packages/storage/src/persisted-signal.ts`), `@cascivo/charts` (25 chart
types, the `engine/decimate.ts` + `engine/scale-time.ts` engine, signal-driven frames — `packages/charts/src/`),
`@cascivo/layouts` (`AppShell`, `DashboardLayout`, `Grid`, `Stack`, `SideNav` — `packages/layouts/src/`),
`packages/components/src/data-table` (already virtualized), the v55 templates system + the `templates/dashboard`
seed, and `apps/examples/deploy` (the Vercel-like reference mock).

> **Source of this roadmap.** A user-supplied evaluation —
> `cascivo_dashboard_analysis.md` — of building a high-performance, Vercel-inspired dashboard on cascivo. The doc
> names three "bottlenecks" (layout/primitive granularity, real-time stream ingestion / garbage collection, and
> scope isolation for large teams) and a "correction" about the first-party chart package. The job was to **study it,
> separate what is real from what is already solved or mis-stated, and design the fix.** The conclusion below: two of
> the three bottlenecks describe **real gaps** (high-frequency stream ingestion; disposable per-workspace state), one
> is **largely already solved** (layout shells and a dashboard template ship today), the chart "correction"
> **understates** an already-strong package while pointing at a narrow true gap (no live-binding pattern), and the
> feedback's own suggested fix for streaming is an **anti-pattern** we must not ship.

---

## The questions this roadmap had to answer first

### Q1 — Which of the feedback's bottlenecks are real, against today's code?

The evaluation was read line-by-line and checked against `main` at 2026-06-28. Verdict per claim:

- **Bottleneck 1 — "Cascivo provides primitives, not pre-baked dashboard shells."** *Largely already solved.*
  `@cascivo/layouts` ships `AppShell` (sticky header + collapsible drawer side-nav, focus trap),
  `DashboardLayout` (stats/main/aside), `Grid`/`AutoGrid`/`Stack`, and `SideNav`/`ShellHeader` in
  `packages/components`. v55 shipped an installable `templates/dashboard`. The feedback's `DashboardShell` /
  `ProjectGrid` already exist under other names. **Real residual gap:** there is no *cookbook* that wires them into a
  Vercel-grade dashboard, and the reference example never exercises the hard parts (streaming). → folded into **T5**,
  not a primitives build.
- **Bottleneck 2 — "Real-time stream ingestion & garbage collection (build logs)."** *Real gap (🔴).* Nothing in
  `@cascivo/core`/`@cascivo/storage` provides a bounded ring buffer or a frame-batched stream signal, and there is no
  virtualized log/terminal console (`DataTable` virtualizes rows but is not a monospace high-frequency log view). The
  feedback's proposed fix — `logsSignal.value = [...currentLogs.slice(1), newLine]` — is **O(n) per line**: it
  reallocates the whole array on every append, the exact GC pressure it claims to prevent. → **T1** (correct O(1)
  primitive) + **T2** (virtualized console).
- **Bottleneck 3 — "Context & scope isolation for large-scale teams."** *Real but modest gap (🟡).* Core has
  `FocusScope` (DOM focus only) and `AppShell`'s `ShellState` (a composition object), but no `createScope()` that owns
  a set of signals/effects and tears them down on workspace switch. → **T4**.

### Q2 — Is the chart "correction" accurate?

**No — it understates the package.** The feedback frames a first-party chart package as a newly-discovered fact that
"completely changes the trajectory." In reality `@cascivo/charts` already ships **25 chart types** across five waves
(line/area/bar/scatter/sparkline/KPI/combo/…), is **signal-driven**, **zero-dependency** (only `@cascivo/core` +
`@cascivo/i18n`), CVD-safe (`docs/specs/chart-palette.md`), and the engine already contains **`decimate.ts`** and
**`scale-time.ts`**. The genuinely true sub-claim is narrow: data flows **one-way (props → internal signals)** with
**no documented live-metrics binding**, no decimation-on-append helper, and **multi-axis only in `ComboChart`**. So
the chart work is not "adopt charts" — it is a thin **streaming-binding pattern + multi-axis on Line/Area + a
cookbook**. → **T3**.

### Q3 — What is the smallest set of new primitives that closes the real gaps?

Four, each small and reusable, plus one integration tranche that proves them:

1. A **bounded stream buffer** (`@cascivo/core`): O(1) capped append + rAF-coalesced flush so 60fps ingestion causes
   one render per frame, not one per line. (Correct replacement for the feedback's anti-pattern — T1.)
2. A **virtualized `LogViewer`** (`packages/components`): monospace, windowed DOM, pin-to-bottom auto-follow, search,
   ANSI/line-level coloring — backed by the T1 buffer. (T2.)
3. A **live chart-binding helper + multi-axis** (`@cascivo/charts`): bind a capped time-series signal (poll/SSE) to
   `LineChart`/`AreaChart` with append-time decimation; a documented `secondAxis` on the standard charts. (T3.)
4. A **disposable signal scope** (`@cascivo/core`): `createScope()` owning signals/computeds/effects with a single
   `dispose()` for clean per-workspace teardown. (T4.)

Then **T5** integrates all four into the v55 `templates/dashboard`, makes `apps/examples/deploy` actually stream
build logs and live charts, and ships a `docs/cookbooks/vercel-dashboard.md` recipe.

---

## Why this roadmap exists

cascivo already composes a *static* dashboard well (shells, tables, charts, a template). What it cannot yet do
**well** is the thing that makes a Vercel dashboard hard: ingest a high-frequency stream (build logs at tens to
hundreds of lines/sec), render it without tab-crashing GC, push live metrics into charts, and switch org/workspace
scope without leaking state. The feedback found these by trying to *build* the dashboard — and it reached for the
wrong fix (an O(n) array copy) precisely because the right primitive does not exist yet. v56 supplies the four
missing primitives and proves them in the reference example, so the next person who builds a streaming dashboard
copies a working recipe instead of inventing a leaky buffer.

---

## The findings, verified against today's code

Legend: ✅ already present (reuse) · ⚠️ partial / adjacent · ❌ genuine gap. "Verified state" reflects a read of
`main` at 2026-06-28.

| #   | Finding (severity)                                                              | Verified state today                                                                                                                                                              | Tranche |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-1 | No bounded streaming-buffer primitive (🔴)                                      | ❌ `@cascivo/core` has `useInfiniteScroll`, `@cascivo/storage` has `persistedSignal`; **no** O(1) ring buffer / capped append / rAF-batched stream signal. The feedback's own `[...logs.slice(1), line]` is O(n)/line — the anti-pattern. | T1      |
| M-2 | No virtualized log / stream console (🔴)                                        | ⚠️ `packages/components/src/data-table` virtualizes rows (windowSize/overscan); **no** monospace, auto-follow, high-frequency log/terminal viewer. `apps/examples/deploy` lists deployments but never streams build output. | T2      |
| M-3 | No live/streaming chart binding; multi-axis only in `ComboChart` (🟠)           | ⚠️ charts are signal-driven and the engine already ships `engine/decimate.ts` + `engine/scale-time.ts`, but data is one-way props→signals, there is **no** documented live-metrics binding / append-time decimation helper, and multi-axis is limited to `ComboChart`. | T3      |
| M-4 | No scoped/disposable signal context for tenant isolation (🟡)                   | ⚠️ `FocusScope` (DOM focus) + `AppShell` `ShellState` (composition) exist; **no** `createScope()`/teardown for per-workspace signal isolation. | T4      |
| M-5 | Dashboard composition not proven end-to-end with streaming (🟠)                 | ⚠️ v55 shipped `templates/dashboard` and the shells/table/charts all exist, but **nothing wires** streaming logs + live charts + scope; no Vercel-dashboard cookbook; `apps/examples/deploy` is static. | T5      |
| C-1 | Feedback claims layout shells are *missing* (correction)                        | ❌ **inaccurate** — `AppShell`/`DashboardLayout`/`SideNav`/`Grid`/`Stack`/`AutoGrid` ship in `@cascivo/layouts` + `packages/components`; a `templates/dashboard` ships (v55). The gap is a *recipe*, not the shells. | T5      |
| C-2 | Feedback "correction" treats charts as a new discovery (correction)             | ❌ **understated** — `@cascivo/charts` already ships 25 signal-driven, zero-dep chart types with a CVD-safe palette (`docs/specs/chart-palette.md`). The real gap is *live binding + multi-axis*, not existence. | T3      |
| R-1 | Signals, layouts, charts engine, templates, the deploy example (✅ reuse)       | ✅ the foundation — `useSignal`/`useMachine`, `@cascivo/layouts`, the charts `engine/`, the v55 templates pipeline, `apps/examples/deploy`. **Build on it; do not re-implement.** | all     |

**Net:** the headline work is **M-1/M-2** — the bounded buffer and the log console that the feedback needed but could
not find. **M-3** is a thin binding layer over an engine that already decimates. **M-4** is a small core helper.
**M-5** proves the lot. **C-1/C-2 are honesty corrections** that keep the plan from rebuilding what already exists.

---

## Tranche map

| Tranche | Theme                                                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | **Bounded stream buffer (core)** — a `createStreamBuffer({ capacity })` ring buffer + `useStreamBuffer` hook: O(1) bounded `append`, a `signal` of the current window, and an rAF-coalesced flush so N appends per frame cause one render. The *correct* replacement for the feedback's O(n) `slice` pattern. No new dependency. (M-1) |
| T2      | **Virtualized `LogViewer` (components)** — a monospace stream console backed by the T1 buffer: windowed DOM (only visible rows mount), pin-to-bottom auto-follow that releases on scroll-up, line-level/ANSI coloring, copy + search, `role="log"`/`aria-live` semantics, i18n strings, ≥44px coarse controls. (M-2) |
| T3      | **Live chart binding + multi-axis (charts)** — a `bindStream`/`useStreamSeries` helper that feeds a capped time-series signal (poll/SSE) into `LineChart`/`AreaChart` using the existing `engine/decimate.ts` at append time; promote `secondAxis` from `ComboChart` to `LineChart`/`AreaChart`; a `docs/cookbooks/charts-streaming.md`. (M-3/C-2) |
| T4      | **Disposable signal scope (core)** — `createScope()` returning `{ signal, computed, effect, dispose }` that owns its reactive members and tears them all down on `dispose()`, so switching org/workspace cleans up without leaks; a `useScope()` hook tying a scope to a component's lifetime. (M-4) |
| T5      | **Prove it end-to-end** — wire T1–T4 into the v55 `templates/dashboard` (a streaming build-log panel + a live-metrics chart + scoped workspace state); make `apps/examples/deploy` actually stream a mock build log and a live usage chart; ship `docs/cookbooks/vercel-dashboard.md`. Update this roadmap → Shipped. (M-5/C-1) |

Ordering rationale: **T1 first** — the buffer is the primitive T2 and T3 both consume. **T2** delivers the most
visible missing piece (a real log console). **T3** layers live charts on the same buffering idea. **T4** is
independent and can land any time before T5. **T5** integrates and proves all four in the template + example +
cookbook. T1→T2 and T1→T3 are the critical path; T4 is parallelizable; T5 depends on all.

---

## Out of scope

- **A real backend / WebSocket server / SSE endpoint.** v56 ships *client-side* primitives and *mock* streams (the
  deploy example already uses a seeded mock API). Wiring a real transport is the user's job; the cookbook shows the
  seam.
- **A full terminal emulator.** `LogViewer` renders line-oriented log/stream text with optional ANSI color — not a
  PTY, not cursor addressing, not interactive shells.
- **Replacing or forking `@cascivo/charts`' engine.** T3 *uses* `engine/decimate.ts` + `engine/scale-time.ts`; it
  does not rewrite scales, shapes, or stacking.
- **A new state-management library.** `createScope()` is a thin ownership wrapper over existing `@cascivo/core`
  signals/effects — not a store, not context, not a DI container.
- **Rebuilding layout shells or a dashboard template.** `AppShell`/`DashboardLayout` and the v55 `templates/dashboard`
  already exist; T5 *composes* them, it does not re-author them (C-1).
- **New runtime dependencies in any published package.** Everything is built on signals + the DOM + the existing
  charts engine.
- **Worker-thread / OffscreenCanvas chart rendering.** The feedback's "no main-thread bloat" is already true (SVG +
  CSS transitions); offloading to a worker is a separate, deferred investigation.

---

## Definition of done (verified after T5)

- `@cascivo/core` exports `createStreamBuffer`/`useStreamBuffer`: bounded O(1) `append`, a windowed `signal`, and
  rAF-coalesced flushing; unit tests prove capacity eviction, single-flush-per-frame, and no unbounded growth under a
  high-frequency append loop.
- `packages/components/src/log-viewer` ships a virtualized monospace console (only visible rows mount), with
  pin-to-bottom auto-follow, search, copy, ANSI/line coloring, `role="log"` + i18n strings + ≥44px coarse targets;
  exported from `@cascivo/react`; manifest + docs derive from `log-viewer.meta.ts`.
- `@cascivo/charts` exposes a live-binding helper (`bindStream`/`useStreamSeries`) demonstrated against
  `LineChart`/`AreaChart` with append-time decimation; `secondAxis` works on `LineChart`/`AreaChart`;
  `docs/cookbooks/charts-streaming.md` documents the poll/SSE → capped signal → chart seam.
- `@cascivo/core` exports `createScope()`/`useScope()` with a `dispose()` that tears down owned signals/computeds/
  effects; a test proves no effect fires after `dispose()` and a workspace-switch loop leaks nothing.
- The v55 `templates/dashboard` includes a streaming log panel + a live chart + a scoped workspace store;
  `apps/examples/deploy` streams a mock build log and a live usage chart; `docs/cookbooks/vercel-dashboard.md` ties it
  together.
- `pnpm ready` green; `pnpm breakpoint:check` and the drift check clean; **no new runtime dependency** in any
  published package; nothing rebuilds an already-shipping shell/chart/template (C-1/C-2 honored).

---

## Implementation log (2026-06-28)

Shipped across five commits. No new runtime dependency in any published package; no existing shell/chart/template was
rebuilt (C-1/C-2 held).

- **T1 — Bounded stream buffer.** `createStreamBuffer`/`useStreamBuffer` in `@cascivo/core` — a fixed-capacity ring
  with O(1) `append`/`appendMany`, a `dispose()`, and rAF-coalesced flushing (one render per frame). Tests prove
  eviction, single-flush-per-frame coalescing, and the O(capacity) memory bound under a 200k-append loop. Replaces the
  feedback's O(n)-per-line `slice` pattern. **Closes M-1.**
- **T2 — Virtualized `LogViewer`.** A monospace console (`packages/components/src/log-viewer`) backed by the T1
  buffer: only visible rows mount, pin-to-bottom auto-follow that releases on scroll-up, ANSI/level coloring, search
  highlight, copy-all, `role="log"` + `aria-live`, i18n (en+de), ≥44px coarse controls; exported from `@cascivo/react`.
  **Closes M-2.**
- **T3 — Live chart binding + multi-axis.** `useStreamSeries`/`bindStream` (`@cascivo/charts/src/stream`) feed a
  poll/SSE/WS source into a capped, index-decimated series (reusing `engine/decimate.ts`). `secondAxis` + per-series
  `axis:'left'|'right'` generalized from `ComboChart` to `LineChart` and non-stacked `AreaChart`, **guarded so the
  single-axis default is byte-identical** (all 421 chart tests still pass). `docs/cookbooks/charts-streaming.md`.
  Also hardened the T1 coalescing against synchronous rAF. **Closes M-3 / C-2.**
- **T4 — Disposable signal scope.** `createScope`/`useScope` in `@cascivo/core` — own signals/computeds/effects, tear
  them down with an idempotent `dispose()`. A 1000-iteration workspace-switch loop leaks zero active effects. **Closes
  M-4.**
- **T5 — End-to-end proof.** `apps/examples/deploy` gained a **Build monitor** view wiring all four primitives
  (`useStreamBuffer`+`LogViewer` for the log, `useStreamSeries`+`AreaChart` for throughput, `createScope` per build);
  added `@cascivo/charts` dep + source alias. `docs/cookbooks/vercel-dashboard.md` documents the full recipe and the
  real-transport seam; the `dashboard` template gained streaming pointers. **Closes M-5 / C-1.**

### Deferred to a follow-up

- **Rebuilding the published `dashboard` template's `public/r/*.json`.** The template page gained streaming guidance
  inline (copy-paste-safe, no new imports that would couple it to charts in a bare project); wiring live components
  into the *published* bundle + regenerating its registry artifacts is a follow-up.
- **Real screenshots / live demo for the Build monitor.** It runs from a deterministic mock; a Pages demo + screenshot
  are a follow-up.

---

## Notes

- This roadmap was **planned from external feedback** and deliberately *corrects* that feedback where the code
  disagrees (C-1 layout shells exist; C-2 charts are already strong; the suggested O(n) buffer is an anti-pattern).
  Surfacing the disagreement is the point — per CLAUDE.md "Think Before Coding".
- The verification figures (the absence of a stream buffer / log console / live chart binding / signal scope, and the
  *presence* of `engine/decimate.ts`, `engine/scale-time.ts`, `AppShell`, `DashboardLayout`, `templates/dashboard`)
  are point-in-time reads of `main` at 2026-06-28 and should be re-confirmed at implementation start.
- Nearest prior art in-repo: **v21** (`@cascivo/example-kit` + `apps/examples/deploy`) is the reference dashboard this
  productizes; **v53** built the charts package; **v55** built the templates system + the `dashboard` seed this plan
  enriches.
</content>
</invoke>
