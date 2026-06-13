# cascade — Roadmap v2: From Component Library to Application Platform

**Last updated:** 2026-06-10
**Status:** Planning — supersedes nothing; `docs/ROADMAP.md` (v1) is complete except where noted in "Carry-over items"
**Decisions baked in:** charts built fully from scratch (zero deps) · JSON UI ships runtime renderer first, codegen second · component parity is pragmatic (~35–40, not full Carbon catalog) · i18n is typed catalogs + native `Intl` (no ICU framework)

This document is the ground truth for v2. Like the v1 roadmap, it is structured so an agent can pick up any milestone and execute it without additional context.

---

## Vision

v1 made cascade a component library. v2 makes it the fastest way to ship a complete app:

> An AI agent (or a human) should be able to go from _"build me an admin dashboard with a user table, charts, and dark mode"_ to a working, accessible, themed, localized app in one step — using only cascade.

Every v2 workstream serves that sentence: more components (parity), instant layouts, JSON-driven views, built-in i18n, built-in persistence, charts, cmd-k, and DX/AI tooling that never drifts out of date.

**The killer argument is performance.** A DataTable with 10,000 rows must feel like one with 10. Every open/close/enter/exit is animated — smoothly, by the browser's compositor, in pure CSS. No JS animation code, no motion library, ever. Speed is not a feature of cascade; it is the proof of the thesis (modern CSS + signals beat VDOM + JS animation runtimes).

---

## Current State (start of v2)

| Area       | Status                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Components | 20 v1 components done (`kbd` in review). TSX + CSS Modules + meta + tests per component.                                   |
| Packages   | `core`, `tokens`, `themes`, `icons`, `cli`, `mcp`, `components` (registry source), `react` (prebuilt npm distribution)     |
| Apps       | `docs`, `storybook`, `landing`, `examples/react-vite`, `examples/react-next`                                               |
| Automation | Dark factory (backlog-driven), registry generation, CI (check/test/build/visual/docs/release workflows), changesets        |
| AI layer   | MCP server (6 tools), `registry.json`, component manifests. `skills/` contains only a README — skills not yet implemented. |

### Carry-over items / housekeeping (do before or alongside Milestone 1)

- [ ] `registry.json` file URLs point at `urbanisierung/native-ui`; the repo is `urbanisierung/cascade-ui`. Fix `REGISTRY_BASE_URL` default in `scripts/registry/generate.ts` and regenerate.
- [ ] Land `kbd` (status: review) and clear the v1 backlog.
- [ ] `skills/` is empty except README — the four planned skills (`cascade:add`, `cascade:design-page`, `cascade:create-theme`, `cascade:extend`) are implemented as part of Phase 6.
- [ ] Add `packages/react` to CLAUDE.md monorepo structure docs (it exists but is undocumented). Every new component must also be exported from `@cascade-ui/react`.

---

## Architecture Decisions for v2

### New packages

| Package            | npm name                            | Distribution       | Purpose                                                                          |
| ------------------ | ----------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| `packages/i18n`    | `@cascade-ui/i18n`                  | npm                | Signal-driven locale store, typed message catalogs, `Intl`-based formatting      |
| `packages/storage` | `@cascade-ui/storage`               | npm                | Persisted signals over localStorage/IndexedDB, SSR-safe                          |
| `packages/charts`  | `@cascade-ui/charts`                | npm                | Chart components, built from scratch (scales/axes/shapes included)               |
| `packages/render`  | `@cascade-ui/render`                | npm                | Runtime JSON → UI renderer                                                       |
| `packages/layouts` | registry source (like `components`) | copy-paste via CLI | App shells and page layouts — owned code, because layouts get customized heavily |

Charts, i18n, storage, and render are **published packages**, not copy-paste: they have real internal complexity, need bugfix delivery via semver, and users don't customize their internals. Components and layouts stay copy-paste (owned code).

### One-component-one-import (the anti-Carbon DX rule)

Carbon's "compose a DataTable from 12 subcomponents" approach is explicitly rejected. Every cascade component ships as **one component with one well-typed props object**. Pagination on a table is `pagination={{ pageSize: 25 }}`, not a separately wired `<Pagination>` sibling. Escape hatches are render props / slot props (`renderCell`, `renderRow`), never required assembly. Discriminated unions make invalid prop combinations unrepresentable (e.g. `selection: { mode: 'multi', onChange }`).

### Cross-cutting rules (apply to every milestone)

1. All v1 component authoring rules hold (signals not hooks, CSS-first states, manifests, tests).
2. Every new component goes through the dark factory backlog → PR → review pipeline.
3. Every new package/feature updates: `registry.json` (if registry content), MCP tools, docs app, storybook stories, and its README — **in the same PR** (enforced by the drift gate, Phase 6).
4. Components that render text (Pagination, DataTable empty states, FileUploader, DatePicker…) take their strings from `@cascade-ui/i18n` once it exists — never hardcoded English.
5. **Motion is CSS-only and mandatory.** Every component with an enter/exit or open/close (Modal, Toast, Dropdown, Tooltip, Accordion, SideNav, CommandMenu…) ships its animation in its `.module.css` via `@starting-style` + `transition-behavior: allow-discrete`, using only `--cascivo-duration-*` / `--cascivo-ease-*` tokens, animating only compositor-friendly properties (`opacity`, `transform`/`translate`/`scale`). No JS animation, no animation library, no `requestAnimationFrame`. All motion collapses under `prefers-reduced-motion: reduce`.
6. **Performance budgets are part of the spec.** Interactions must not trigger React re-renders (signals patch the DOM); large collections render via CSS containment before any JS windowing is considered. Budgets are enforced by CI gates (Milestone 6.5), not by code review vigilance.

---

## Phase 1 — Component Parity, Wave 1: The App-Critical Set

**Goal:** the components without which no real app can be built. This phase unblocks layouts, the docs overhaul, and JSON rendering.
**Mechanism:** append specs to `factory-backlog.json`; the factory grinds through them; humans review design + a11y.

### Milestone 1.0 — Motion system & v1 retrofit

State of play: duration (`--cascivo-duration-75..300`) and easing (`--cascivo-ease-in/out/in-out`) tokens exist, but only Dropdown and Tooltip use `@starting-style`; Modal and Toast barely animate; only Spinner handles `prefers-reduced-motion`. Fix this before the component count triples.

- [ ] **Semantic motion tokens** in `@cascade-ui/tokens`: `--cascivo-motion-enter` / `--cascivo-motion-exit` / `--cascivo-motion-emphasis` (duration+easing pairs composed from the existing primitives), so components reference intent, not raw values — themes can later tune motion character the same way they tune color.
- [ ] **Retrofit Modal**: `@starting-style` + `transition-behavior: allow-discrete` on `<dialog>` (scale/fade enter, fade exit) and `::backdrop` fade — the native-dialog showcase animation.
- [ ] **Retrofit Toast**: slide-in/slide-out via `@starting-style`; the existing `dismissing` machine state only toggles a `data-state`, CSS does the rest.
- [ ] **Audit Dropdown, Tooltip, Accordion, Tabs**: consistent durations/easings from semantic tokens; Accordion's `grid-template-rows` animation verified.
- [ ] **Global reduced-motion rule** in the tokens layer: one `@media (prefers-reduced-motion: reduce)` block inside `@layer cascade` collapsing transition/animation durations to `0.01ms` (Spinner's continuous indicator documented as the intentional exception).
- [ ] **Factory spec template update**: every backlog entry for an open/close component must include a "motion" line (enter/exit behavior + tokens); the factory checklist gains "animations present, CSS-only, reduced-motion verified".
- [ ] **View Transitions API** for theme switching in docs/landing (cross-fade on `data-theme` change) — a marketing-grade demo of CSS-only motion.

### Milestone 1.1 — Navigation & shell primitives

- [ ] **Header / UIShell-header** — app top bar: product name, nav links, actions slot, user menu. Container-query responsive collapse.
- [ ] **SideNav** — collapsible sidebar navigation with nested items, icons, active state, rail mode. One component, items via typed `items` array.
- [ ] **Breadcrumb** — `items: { label, href }[]`, overflow collapse for deep paths.
- [ ] **Pagination** — page size selector, page jumper, item-range label. Designed first as DataTable's built-in, exported standalone.
- [ ] **Link** — styled anchor with variants (standalone, inline), external-link affordance.
- [ ] **ProgressIndicator** (steps) — linear multi-step progress for wizards.

### Milestone 1.2 — DataTable (the flagship)

The single most important v2 component; it sets the DX standard.

- [ ] One component: `<DataTable columns={...} rows={...} />` with typed column defs (`Column<Row>` generic — full inference of cell values).
- [ ] Built-in, prop-toggled features: sorting, client-side filtering, global search, pagination, row selection (single/multi), expandable rows, sticky header, zebra, density (compact/normal/relaxed), empty state, loading skeleton state, batch-action toolbar.
- [ ] Server-side mode: `sortMode: 'server'` etc. surface events instead of computing locally.
- [ ] **Large-data strategy, CSS-first**: rows get `content-visibility: auto` + `contain-intrinsic-size` so the browser skips layout/paint of off-screen rows — 10,000 rows with zero JS windowing code. Sorting/filtering recompute via signals without re-rendering row components. Only if profiling proves CSS containment insufficient at extreme counts (≥100k rows) add an opt-in signal-driven windowing mode (own implementation, no react-window dependency) — measured justification required, not speculative.
- [ ] `renderCell` / `renderExpandedRow` render-prop escape hatches.
- [ ] A11y: full grid keyboard navigation, `aria-sort`, screen-reader announcements for sort/selection changes.
- [ ] Verify (benchmark, kept as a CI perf gate): 10,000-row docs demo — initial render, scroll, sort, and filter feel identical to a 10-row table; interaction latency budget enforced per Milestone 6.5; zero React re-renders on sort/filter/selection asserted in tests.

### Milestone 1.3 — Forms & inputs completion

- [ ] **Combobox** — single + multi-select with type-ahead filtering, custom option rendering, async option loading. (The custom-dropdown Select that v1 deferred.)
- [ ] **NumberInput** — steppers, min/max/precision, `Intl.NumberFormat`-aware display.
- [ ] **Search** — input variant with clear button and `onSearch` debounce built in.
- [ ] **DatePicker** — single date + range, built on a from-scratch calendar grid; all month/weekday names via `Intl.DateTimeFormat` (depends on Phase 3 i18n for strings, but calendar math is standalone). Includes **TimePicker**.
- [ ] **FileUploader** — drag-and-drop zone + file list with status (uploading/complete/error), controlled file state.
- [ ] **Form** — lightweight form-level helper: typed field registration over signals, validation (sync + async, zod-compatible via a `validate` fn — no zod dependency), error wiring into existing inputs. Not a react-hook-form clone; the minimum that makes "build a settings form" one-step.

### Milestone 1.4 — Display & feedback completion

- [ ] **Tag** (dismissible chip) · **Skeleton** (text/shape placeholders) · **ProgressBar** · **InlineNotification** / **ActionableNotification** · **OverflowMenu** (kebab menu, builds on Dropdown) · **Tile/ClickableTile** (if Card variants don't already cover it — check first; prefer extending Card) · **EmptyState** (illustration slot, title, description, action).

### Milestone 1.5 — CommandMenu (cmd-k)

- [ ] `<CommandMenu>` inspired by cmdk: global hotkey (⌘K/Ctrl-K), fuzzy matching (own implementation, ~50 lines, no dependency), groups, nested pages, async items, keyboard-first. Signal-driven — typing must not re-render the list container, only patch matching items.
- [ ] Dogfood immediately: wire it into `apps/docs` as the docs search (see Phase 6).

**Phase 1 exit criteria:** ~38 components in the registry; the docs app's own UI (shell, nav, search, tables of props) is built exclusively from cascade components.

---

## Phase 2 — Layouts: Instant Page Structure

**Goal:** common page skeletons usable in one import. Distributed as **copy-paste registry items** under a new `layout` registry category (`npx cascade add layout/dashboard`).

### Milestone 2.1 — Layout primitives (`packages/layouts/src/primitives/`)

- [ ] **Stack** (vertical/horizontal, gap from spacing tokens) · **Grid** (responsive column grid with container-query breakpoints) · **Columns** (`<Columns count={2|3|4}>` with collapse behavior) · **Center** · **Spacer** · **PageHeader** (title, description, breadcrumb slot, actions slot).
- [ ] All layout via CSS Grid + `@container`; zero JS where possible; logical properties for RTL.

### Milestone 2.2 — App shells

- [ ] **AppShell** — header + sidenav + content + optional right rail; collapsible, responsive, persists sidebar state via `@cascade-ui/storage` once available.
- [ ] **DashboardLayout** — AppShell + widget grid area with named slots (`stats`, `main`, `aside`).
- [ ] **SettingsLayout** — side menu + content panel pattern.
- [ ] **AuthLayout** — centered card layout for login/signup.
- [ ] **SplitView** — resizable two-pane layout (list/detail master-detail pattern).

### Milestone 2.3 — Blocks (assembled examples)

- [ ] 8–10 copy-paste blocks combining components + layouts: stats-cards row, users table page, settings form page, login page, empty dashboard, notification center. These double as docs examples and as few-shot material for the JSON renderer and AI skills.

**Exit criteria:** `npx cascade add layout/app-shell block/users-table-page` produces a running page; the landing page and docs app are rebuilt on these layouts (dogfood).

---

## Phase 3 — Platform Primitives: i18n + Storage

These two ship early because later phases consume them (DatePicker strings, theme persistence, chart locale formatting, JSON renderer i18n refs).

### Milestone 3.1 — `@cascade-ui/i18n`

Scope decision: **typed catalogs + native `Intl`** — no ICU parser, no extraction CLI, no competing with i18next.

- [ ] Locale store: `const locale = createLocale({ default: 'en', supported: ['en', 'de'] })` — a signal; switching locale updates all `t()` output with zero full re-renders.
- [ ] Typed catalogs: `defineMessages({ greeting: 'Hello {name}' } as const)` → `t(messages.greeting, { name })` with full key + parameter autocomplete and compile errors on missing params. Per-locale dictionaries type-checked against the default locale's shape.
- [ ] Interpolation + plural support via `Intl.PluralRules` (`{ one: '...', other: '...' }` objects, not ICU strings).
- [ ] Formatting helpers wrapping `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.ListFormat` — memoized per locale.
- [ ] Lazy locale loading: `registerCatalog('de', () => import('./de'))`.
- [ ] **Built-in component strings**: every cascade component string (Pagination labels, Modal close, FileUploader statuses, DataTable empty state…) lives in a cascade-owned catalog; ships with `en`, `de` first-party; users override per-key. Components fall back gracefully when no provider is configured.
- [ ] SSR-safe (no window access at module scope), RSC-compatible (`"use client"` boundary documented).
- [ ] Retrofit task: sweep all existing components for hardcoded strings → move to the built-in catalog.

### Milestone 3.2 — `@cascade-ui/storage`

- [ ] **Persisted signals**: `const theme = persistedSignal('cascade.theme', 'light')` — a normal signal, hydrated from storage, written through on change. localStorage driver default.
- [ ] **IndexedDB driver** for structured/large data: same API, async hydration with a `ready` signal; small typed wrapper over `indexedDB` (no `idb` dependency — keep it from scratch like charts).
- [ ] Versioned keys + migration hook: `persistedSignal(key, initial, { version: 2, migrate })`.
- [ ] Cross-tab sync via the `storage` event (signals update in other tabs).
- [ ] SSR-safe: server renders `initial`, hydrates on client without flash where possible (documented inline-script pattern for theme).
- [ ] First consumers (same PR series): docs/landing theme switcher, AppShell sidebar collapsed state, CommandMenu recent-commands list.

**Exit criteria:** docs app theme survives reload with no flash, switchable locale (en/de) across all docs UI strings.

---

## Phase 4 — Charts (from scratch, zero dependencies)

**Goal:** the Carbon Charts catalog, built entirely in-house — including the math. This is the largest workstream; it is deliberately split so value ships early. Accepted cost: we own scale/tick/shape math and its edge cases.

### Milestone 4.1 — Chart engine (`packages/charts/src/engine/`)

No rendering yet — pure, heavily-tested math and infrastructure:

- [ ] **Scales**: linear, log, time, band/ordinal — domain/range mapping, nice-ticks algorithms (Wilkinson/extended for linear, calendar-aware for time). Property-based tests (fast-check as devDep) for tick correctness.
- [ ] **Shape generators**: line/area path builders (with monotone + linear curve interpolation), arc generator (pie/donut), stacking layout.
- [ ] **Signal-driven chart core**: data, dimensions, and hover state are signals; SVG attributes patch without React re-render. `ResizeObserver`-driven responsive sizing.
- [ ] **Shared chrome**: Axis, Grid lines, Legend (interactive: click to toggle series), Tooltip (shared crosshair), color ramps from theme tokens (`--cascivo-chart-1..n` semantic tokens added to all three themes).
- [ ] **A11y foundation**: every chart renders an off-screen data table fallback, `role="img"` + generated description, keyboard point navigation. Locale-aware tick/tooltip formatting via `@cascade-ui/i18n`.

### Milestone 4.2 — Chart wave 1 (the 80% set)

- [ ] Line (+ multi-series), Area (+ stacked), Bar (vertical/horizontal/grouped/stacked), Pie/Donut, Scatter, Sparkline, Meter/Gauge, KPI/stat tile.
- [ ] Each chart = one component, one typed props object (`<LineChart data={...} x={...} y={...} />`), consistent across all charts.
- [ ] Verify: render 5,000-point line chart with smooth hover crosshair; visual regression snapshots in all three themes.

### Milestone 4.3 — Chart wave 2 (parity completion)

- [ ] Bubble, Histogram, Boxplot, Heatmap, Treemap, Radar, Combo (bar+line), Bullet, Word cloud-class charts deferred unless requested. Match remaining Carbon Charts catalog pragmatically — same rule as components: build the ones real dashboards use, skip novelty until asked.
- [ ] Chart manifests: extend `ComponentMeta` (or a `ChartMeta` sibling) so MCP/docs/JSON renderer know chart props the same way they know component props.

**Exit criteria:** dashboard block from Phase 2 gains a real charts demo; docs has a gallery page per chart with live theme switching.

---

## Phase 5 — JSON-Configured UI

**Goal:** a JSON document in, a working view (or app) out. Primary customers: AI agents and rapid prototyping. Strategy: **runtime renderer first, codegen second**, sharing one schema.

### Milestone 5.1 — The schema (`@cascade-ui/render`)

- [ ] Versioned view schema (TypeScript types + generated JSON Schema artifact published with the package so any tool/LLM can validate):

```jsonc
{
  "$schema": "https://cascade-ui.dev/schemas/view/v1.json",
  "view": {
    "layout": "dashboard",
    "regions": {
      "stats": [{ "component": "KpiTile", "props": { "label": "Users", "value": 1024 } }],
      "main": [{
        "component": "DataTable",
        "props": { "columns": [...], "pagination": { "pageSize": 25 } },
        "bind": { "rows": "$data.users" },
        "events": { "onRowClick": "$actions.openUser" }
      }]
    }
  }
}
```

- [ ] Component allowlist generated **from `registry.json`** — the schema's `component` enum and per-component prop validation derive from manifests automatically. No hand-maintained mapping.
- [ ] Data binding (`$data.*`) and action references (`$actions.*`) resolve against a host-provided context object — JSON stays serializable, logic stays in code.
- [ ] i18n refs in config: `{ "$t": "users.title" }` resolves through `@cascade-ui/i18n`.
- [ ] Strict validation with actionable errors ("`DataTable.pagination.pageSize` must be a number, got string at view.regions.main[0]").

### Milestone 5.2 — Runtime renderer

- [ ] `<CascadeView config={json} data={...} actions={...} />` — renders the tree using the prebuilt `@cascade-ui/react` components.
- [ ] Config is a signal: patching JSON updates the view in place (live-preview loop for AI/prototyping).
- [ ] MCP tools: `validate_view(config)` and `scaffold_view(description) → config` (replaces/upgrades the v1 `scaffold_page` JSX-string tool).
- [ ] Demo app: `apps/examples/json-playground` — textarea on the left, live view on the right.

### Milestone 5.3 — Codegen (`cascade generate`)

- [ ] `npx cascade generate view.json --out src/pages/users.tsx` — emits clean, idiomatic TSX (the same code a human following the docs would write), using copy-paste components, formatted with the project formatter.
- [ ] Generated code has zero dependency on `@cascade-ui/render` — the graduation path from prototype to owned code.
- [ ] Round-trip test in CI: render(config) and render(generated TSX) produce equivalent DOM.

**Exit criteria:** an agent with only the MCP server can produce a validated JSON config and the user sees a live dashboard without writing a line of TSX.

---

## Phase 6 — Best-in-World DX & AI Layer

Runs partially in parallel with everything above; listed last because its gates verify the rest.

### Milestone 6.1 — README + docs generation

- [ ] `scripts/readme/generate.ts`: assembles every package/app README from `readme.header.md` (shared, templated: name, badges, one-liner) + per-package `readme.body.md` (hand-written core content) + auto-generated sections (install, exports/components list from manifests, links) + shared footer (license, links, AI-tooling pointer).
- [ ] CI **drift gate**: regenerate READMEs + `registry.json` + JSON schema + MCP manifest data in CI and fail if `git diff` is non-empty. This is the mechanism that keeps "always up2date AI tools" true by construction.

### Milestone 6.2 — Docs app overhaul

- [ ] CommandMenu-powered search (⌘K) over components, charts, layouts, tokens, and docs prose — dogfooding Milestone 1.5.
- [ ] Live editable examples (lightweight in-browser editor; consider Sandpack-class embed only if a from-scratch contenteditable + esbuild-wasm proves too costly — decide at implementation time).
- [ ] Per-category landing pages (components / charts / layouts / platform packages) generated from manifests.
- [ ] "For AI agents" page: MCP setup, JSON schema link, llms.txt + per-component markdown endpoints (`/llms/button.md`) for agent consumption.

### Milestone 6.3 — Claude Code skills (finally implement `skills/`)

- [ ] `cascade:add` — add components/layouts/blocks to a project with config awareness.
- [ ] `cascade:design-page` — natural language → JSON config (Phase 5) → preview or codegen.
- [ ] `cascade:create-theme` — brand color in, full semantic token theme out, contrast-checked (WCAG AA verified programmatically).
- [ ] `cascade:extend` — scaffold a new component in cascade style inside a user project.
- [ ] Skills read manifests/registry at runtime — no duplicated component knowledge inside skill prompts.

### Milestone 6.4 — Owned-code update story (fixing shadcn's biggest flaw)

- [ ] Per-component `version` + changelog entries in `registry.json` (generated from conventional commits touching that component's directory).
- [ ] `cascade update` (exists) gains: three-way diff against the version originally installed (record installed version + file hashes in `cascade.lock.json` at `add` time), so user edits survive upstream updates.
- [ ] `cascade outdated` — list installed components with newer registry versions.

### Milestone 6.5 — Quality gates expansion (incl. performance gates)

- [ ] axe-core automated a11y checks across every docs demo page in CI.
- [ ] Visual regression (exists for components) extended to charts, layouts, and blocks in all three themes.
- [ ] Bundle-size budget per published package, enforced in CI.
- [ ] Type-level tests (`expectTypeOf` in vitest) for the flagship generic APIs: DataTable columns, i18n catalogs, JSON schema types.
- [ ] **Zero-re-render assertions**: shared test utility (render-count probe) asserting that interactions (typing in CommandMenu, sorting DataTable, toggling Accordion, chart hover) cause **0** React component re-renders — the signals contract, enforced.
- [ ] **Interaction-latency benchmarks** via Playwright traces on docs demos: 10k-row table sort/filter/scroll, modal open, cmd-k keystroke-to-filtered-list. Budgets checked in CI (e.g. sort < 100ms, keystroke feedback < 16ms on the CI baseline machine); regressions fail the build.
- [ ] **Animation audit gate**: CI script greps component CSS to verify every open/close component has `@starting-style` and a reduced-motion path, and that animated properties are compositor-safe (`opacity`/`transform`/`translate`/`scale` only — no `height`/`top`/`margin` transitions outside the documented Accordion grid trick).
- [ ] **Perf comparison page** in docs/landing: cascade DataTable + Modal vs. equivalent shadcn/Carbon setups, with live row-count slider — the killer argument, demonstrated rather than claimed.

---

## Execution Order & Dependency Graph

```
Phase 1 (components, waves can interleave) ──┬─→ Phase 2 (layouts need SideNav/Header/Pagination)
                                             ├─→ Phase 5 (renderer needs component breadth)
Phase 3.1 i18n ──→ DatePicker strings, charts formatting, renderer $t
Phase 3.2 storage ──→ AppShell persistence, theme persistence
Phase 4.1 engine ──→ 4.2 ──→ 4.3 (independent of Phases 2/5; start after 1.2)
Phase 6.1 drift gate ──→ as early as possible (cheap, protects everything after)
Phase 6.3 skills / 6.4 update story ──→ after Phase 2 (need layouts/blocks to be useful)
```

| Order | Item                                        | Size | Why this position                                           |
| ----- | ------------------------------------------- | ---- | ----------------------------------------------------------- |
| 1     | Housekeeping + 6.1 drift gate               | S    | Protects all later work; registry URL is actively wrong     |
| 2     | Phase 1.0 motion system + retrofit          | S    | Sets the motion/perf bar before the component count triples |
| 3     | Phase 1.1 + 1.4 (shell, nav, display)       | M    | Factory-friendly, unblocks layouts                          |
| 4     | Phase 3 (i18n + storage)                    | M    | Everything downstream consumes them                         |
| 5     | Phase 1.2 DataTable + 1.3 forms + 1.5 cmd-k | L    | Flagship DX components, need i18n strings                   |
| 6     | Phase 2 layouts + blocks                    | M    | Needs 1.1; unblocks JSON renderer demos                     |
| 7     | Phase 4.1 + 4.2 charts                      | L    | Longest pole — start engine as soon as DataTable ships      |
| 8     | Phase 5 JSON renderer → codegen             | L    | Needs component breadth + layouts                           |
| 9     | Phase 6.2–6.5 DX/AI completion              | M    | Gates and skills verify the whole platform                  |
| 10    | Phase 4.3 chart parity tail                 | M    | Demand-driven                                               |

---

## Open Questions (decide before the relevant phase starts)

1. **Charts engine purity** — fully from scratch is decided; if tick/curve edge cases burn more than ~2 self-heal cycles per chart in the factory, revisit vendoring (not depending on) specific d3 algorithms with attribution.
2. **Layouts distribution** — proposed copy-paste; confirm vs. publishing `@cascade-ui/layouts` to npm. (Copy-paste recommended: layouts are the most-customized code in any app.)
3. **JSON schema hosting** — `cascade-ui.dev/schemas/...` implies a domain + static hosting; needed before Milestone 5.1 publishes `$schema` URLs.
4. **First-party locales** — `en` + `de` proposed for built-in component strings; which others before v2.0?
5. **Live docs editor** — from-scratch vs. embed; defer to Milestone 6.2 implementation spike.

---

## Definition of Done for v2

- `npx cascade add layout/dashboard block/users-table-page` + one JSON config + one MCP-connected agent can produce a localized, theme-persistent, chart-bearing admin app.
- ~38 components, ~12 layouts/blocks, ~15 chart types in the registry; all manifests, docs, stories, READMEs, and MCP data generated and drift-gated.
- Every component: one import, one typed props object, WCAG AA, signal-driven, zero hardcoded strings.
- Every open/close interaction animated in pure CSS (tokens-driven, reduced-motion-aware); a 10,000-row DataTable indistinguishable from a 10-row one; zero React re-renders on interaction — all three enforced by CI gates, demonstrated live on the perf comparison page.
