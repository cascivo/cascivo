# cascivo — Roadmap v51: Charts — Recharts-Informed Parity & Docs Audit

**Last updated:** 2026-06-27
**Status:** 📋 Planned — gap analysis complete and verified against today's `@cascivo/charts` source; no code
written yet. This roadmap defines the work; the plan documents below decompose it into seven tranches.
**Plan documents:** `docs/superpowers/plans/2026-06-27-v51-master-plan.md` + tranches 1–7
**Builds on:** the chart package in `packages/charts/src/*` — the engine (`engine/{scale,scale-log,scale-time,shape,stacked,nearest,stats,treemap}.ts`),
the chrome (`chrome/{axis,grid-lines,legend}.tsx`), the frame/tooltip core (`core/{chart-frame,chart-tooltip,use-chart,data-point,nearest}.*`),
the 17 chart components (`charts/*`), and the docs surfaces that read from them — the showcase
(`apps/site/src/pages/ChartsPage.tsx`, `apps/site/src/marketing/sections/ChartShowcase.tsx`), the Storybook stories
(`apps/storybook/stories/chart/*`), the LLM docs (`apps/site/public/llms/chart/*`), and the per-component manifests
(`charts/*/*.meta.ts`).

> **Source of this roadmap.** A structured study of [Recharts](https://recharts.github.io/en-US/) — its
> [API reference](https://recharts.github.io/en-US/api/) and its documentation site — measured against today's
> `@cascivo/charts`. Recharts is the React charting library most teams reach for first; its docs are widely cited as
> a model of the form (live-editable examples, per-component API pages, a big categorized examples gallery). The
> question this roadmap answers: **where does cascivo's chart library fall short of Recharts, and how do we make the
> charts docs as good as — or better than — the reference everyone benchmarks against?** Each finding below is
> verified against the actual chart source before it is planned.

---

## Why this roadmap exists

`@cascivo/charts` is already strong where it counts: 17 chart components (Recharts ships ~11 chart containers),
a from-scratch zero-dependency engine, signal-driven rendering, keyboard-navigable tooltips with `aria-live`
announcements, CVD-safe palettes verified across 14 themes, and several chart types Recharts simply does not have
(Sparkline, KPI, Bullet, Meter, Boxplot, Histogram). On **chart-type breadth and accessibility, cascivo leads.**

The study found the gap is not "more chart types." It is the **composable enrichment primitives** that make a chart
*useful in a real dashboard* — and the **documentation depth** that makes those primitives discoverable. Recharts'
real advantage is that any chart can be annotated (`ReferenceLine`, `ReferenceArea`, `ReferenceDot`), labelled
(`LabelList`), made interactive (`Brush`, `onClick`, `syncId`), and animated — and that every one of those is
documented on its own page with a live, editable example. Today in cascivo:

- A line chart **cannot show a target line, a threshold, or a shaded "good/bad" band.** There is no annotation layer.
- A bar **cannot print its own value** on or above it. There are no data labels anywhere (`grep` for
  `labelList`/`valueLabel`/`dataLabel` across `packages/charts/src` → zero hits).
- A chart is **not clickable.** Only the legend has an `onClick` (toggle hide); no chart exposes `onDatumClick`/
  `onSelect`. You cannot drive a drill-down off a bar.
- There is **no brush / range-select / zoom**, and **no `syncId`** to link tooltips across a row of charts.
- There is **no animation** — no entrance draw, no update transition (and CLAUDE mandates any motion be
  reduced-motion gated, which is a constraint, not a blocker).
- Stacking offers `grouped`/`stacked` but **no percent / 100% (expand)** mode; lines have **no `connectNulls`** gap
  handling; axes have **no titles, no explicit domain control**, and per-series axis assignment exists **only on
  ComboChart** (`secondAxis`), not on Line/Area/Bar.
- Recharts has **RadialBar, Funnel, Sankey, Sunburst**; cascivo has none of these.

And the docs, while nicely themed, are **incomplete and static**: of 17 charts, only **8 have a Storybook story**
and only **7 have an LLM doc** (`apps/site/public/llms/chart/` lists area, bar, bubble, combo, line, pie, scatter —
the other ten are absent). The showcase (`ChartsPage.tsx`) is one long static page — no per-chart page, no live-edit,
no copy-the-code, no recipe gallery, and the public engine API (scales, shapes, `toStackedSeries`) is undocumented.

None of these is catastrophic alone. Together they are the difference between "a beautiful set of chart components"
and "the charting library a team picks because every job is one prop away and one doc page away."

### Framing: cascivo has the charts; it lacks the *enrichment primitives* and the *docs depth*

The first job of this roadmap was to resist the obvious-but-wrong conclusion — "Recharts has more, so build more
chart types." Verified against the code, cascivo already **exceeds** Recharts on chart-type count. The deficit is
horizontal, not vertical: the **annotation / label / interaction / motion primitives** that compose *onto* the charts
cascivo already has, plus the **documentation system** that surfaces them. So six of seven tranches build composable
primitives and docs; only one (T5) adds new chart types, and it adds the two highest-value ones (RadialBar, Funnel)
while explicitly deferring the two that need whole new layout engines (Sankey, Sunburst).

---

## The findings, verified against today's code

Legend: ✅ already strong (leave it) · ⚠️ partial / present-but-limited · ❌ genuine gap. Severity is impact on
*real-world dashboard usefulness and docs credibility*.

### Lens 1 — Feature parity (can a real dashboard be built without dropping to raw SVG?)

| #     | Finding (severity)                                              | Verified state today                                                                                                                                                | Tranche |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C-F1  | No annotation layer — reference lines / areas / dots (🔴)       | ❌ `grep -ri reference\|threshold\|annotation packages/charts/src` hits only `meter` internals. No way to draw a target line, a threshold, a shaded band, or a marker on any cartesian chart. Recharts' `ReferenceLine`/`ReferenceArea`/`ReferenceDot`. | T1      |
| C-F2  | No data labels on marks (🔴)                                    | ❌ zero hits for `labelList`/`valueLabel`/`dataLabel`/`showValue`. Bars/points/slices cannot print their own value. Recharts' `LabelList`/`Label`. | T2      |
| C-F3  | No percent / 100% (expand) stacking (🟠)                        | ⚠️ `BarChart` `mode` is `'grouped' \| 'stacked'` only (`bar-chart.tsx:26`). No normalized-to-100% stack; AreaChart has no stacked mode at all. | T3      |
| C-F4  | Lines/areas have no gap handling (`connectNulls`) (🟠)          | ❌ `line-chart.tsx` maps every datum straight into `linePath`; a missing/`null` y produces `NaN`, not a break. No `connectNulls`/`defined` concept. | T3      |
| C-F5  | Axes have no titles and no explicit domain control (🟠)         | ❌ `chrome/axis.tsx` `AxisProps` = `{scale, orientation, length, format, tickCount, labelEvery, transform}`. No axis label/title, no `domain`/`min`/`max`, no tick angle. Charts derive domain internally only. | T3      |
| C-F6  | Per-series axis assignment limited to ComboChart (🟡)           | ⚠️ Dual y-axis exists only via `ComboChart`'s `secondAxis` flag (`combo-chart.tsx:26`). Line/Area/Bar cannot put one series on a right-hand axis. | T3      |
| C-F7  | Charts are not clickable / selectable (🔴)                      | ❌ only `chrome/legend.tsx:38` has `onClick`. No `onDatumClick`/`onSelect`/`onPointClick` on any chart — drill-down/cross-filter is impossible without forking. | T4      |
| C-F8  | No brush / range-select / zoom (🟠)                             | ❌ `grep brush\|zoom\|pan` hits only scale/engine internals. No interactive window to subset a long series. Recharts' `Brush`. | T4      |
| C-F9  | No cross-chart synchronization (`syncId`) (🟡)                  | ❌ no `sync` mechanism in `core/*`. A dashboard row of charts can't share a hovered x-position. Recharts' `syncId`/`syncMethod`. | T4      |
| C-F10 | No animation (entrance / update) (🟠)                           | ❌ no transition/animation system (`animat` hits only `legend.module.css` hover + meter). Recharts animates line-draw / area-reveal / bar-grow. Must be reduced-motion gated per CLAUDE. | T5† |
| C-F11 | Missing chart types: RadialBar, Funnel, Sankey, Sunburst (🟡)   | ❌ none exist. cascivo *leads* on Sparkline/KPI/Bullet/Meter/Boxplot/Histogram (Recharts lacks these), but lacks these four. RadialBar + Funnel are tractable; Sankey + Sunburst need new layout engines. | T5 / future |

† Motion (C-F10) is folded into the T4 interaction tranche as a cohesive "make charts feel alive" pass; see the
tranche map.

### Lens 2 — Docs depth (is every capability discoverable, with a runnable example?)

| #     | Finding (severity)                                              | Verified state today                                                                                                                                                | Tranche |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C-D1  | Storybook coverage is 8 of 17 charts (🟠)                      | ❌ `apps/storybook/stories/chart/` has stories for area, bar, bubble, combo, line, pie, scatter, + a `PlainCharts` story. **No** story for boxplot, bullet, heatmap, histogram, kpi, meter, radar, sparkline, treemap. | T6      |
| C-D2  | LLM docs cover 7 of 17 charts (🟠)                             | ❌ `apps/site/public/llms/chart/` = area, bar, bubble, combo, line, pie, scatter. The other ten charts have no machine-readable doc — the MCP/registry/AI surface is half-blind to the catalog. | T6      |
| C-D3  | No per-chart documentation page (🟠)                          | ⚠️ `ChartsPage.tsx` is one long hand-built showcase; there's no per-chart page with a focused demo + props table + when-to-use, the way Recharts gives each component its own API page. | T6      |
| C-D4  | `meta.intent` (when-to-use / alternatives) is authored but not surfaced (🟡) | ⚠️ each `*.meta.ts` has a rich `intent` block (`whenToUse`, `whenNotToUse`, `related`) — e.g. `line-chart.meta.ts` — but nothing renders it for a human choosing a chart. The decision-support data exists and is wasted. | T6      |
| C-D5  | Examples are static — no live edit / copy / runnable (🟠)     | ❌ the showcase renders fixed demos; there's no editable code, no copy-to-clipboard per example, no playground. Recharts' editable examples (Edit / Open in StackBlitz / Copy) are the single biggest reason its docs are loved. | T7      |
| C-D6  | No recipe / composition gallery (🟠)                          | ❌ no task-oriented gallery ("add a target line", "label the bars", "stack to 100%", "sparkline in a table cell", "dual-axis", "dashboard"). Recharts' categorized examples are how people learn the composition model. | T7      |
| C-D7  | Public engine API is undocumented (🟡)                        | ❌ `index.ts` exports the scales (`linearScale`, `timeScale`, `logScale`), shapes (`linePath`), `toStackedSeries`, `stats` — all public, none documented. Power users can't compose the primitives they're given. | T7      |

**Net:** the high-value features are the **annotation layer** (C-F1) and **data labels** (C-F2) — the two things a
dashboard author hits within the first hour — followed by **interaction** (C-F7/F8) and **motion** (C-F10). The
high-value docs work is **closing the coverage gaps** (C-D1/D2 — half the catalog is undocumented) and **live,
copyable examples + a recipe gallery** (C-D5/D6). New chart types (C-F11) are real but lowest-leverage, and the
library already leads on breadth — so they get one focused tranche, not the roadmap's center of gravity.

---

## Tranche map

| Tranche | Lens               | Theme                                                                                                                          |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| T1      | Feature            | **Annotation layer** — `ReferenceLine` / `ReferenceArea` / `ReferenceDot` chrome primitives composable onto every cartesian chart (C-F1). |
| T2      | Feature            | **Data labels** — opt-in value labels on bar/line/area/pie, collision-aware and a11y-safe (C-F2).                              |
| T3      | Feature            | **Axis, scale & stacking completeness** — axis titles + explicit domain control, percent/100% stacking, `connectNulls`, generalize per-series axis assignment (C-F3/F4/F5/F6). |
| T4      | Feature            | **Interaction & motion** — `onDatumClick`/`onSelect` events, `Brush` range-select, `syncId` cross-chart tooltips, reduced-motion-gated entrance/update animation (C-F7/F8/F9/F10). |
| T5      | Feature            | **New chart types** — `RadialBar` (radial gauge bars) + `Funnel`; defer Sankey + Sunburst to a future roadmap (C-F11).        |
| T6      | Docs               | **Complete, generated coverage** — per-chart doc pages, Storybook stories + LLM docs for all 17 charts, surface `meta.intent` as a "pick a chart" chooser (C-D1/D2/D3/D4). |
| T7      | Docs               | **Interactive examples + recipe gallery + engine reference** — live-edit/copy examples, a task-oriented recipe gallery, and a documented public engine API (C-D5/D6/D7). |

Ordering rationale: **T1 → T2** first — annotations and data labels are the most-requested, highest-leverage
features and are self-contained chrome additions with no engine churn. **T3** cleans up the data/axis correctness
gaps (some, like `connectNulls`, are latent bugs). **T4** is the heaviest (events + brush + sync + motion) and wants
the chart internals otherwise settled. **T5** adds the two new chart types. **T6 → T7** then document everything,
including the new primitives from T1–T5 — docs last so they describe the finished surface. T1–T5 are largely
independent and could parallelize across reviewers; T6/T7 depend on them.

---

## Out of scope

- **Sankey and Sunburst chart types.** Both need new layout engines (flow routing; radial hierarchy). They are
  noted in C-F11 and deferred to a future roadmap; T5 ships only RadialBar + Funnel.
- **A charting DSL / fully composable `<Chart><Line/><XAxis/></Chart>` API.** cascivo's model is
  whole-chart components with props, not Recharts' children-composition. This roadmap adds primitives within that
  model (annotation/label props + slot children where natural); it does **not** rearchitect into a
  composition-first API.
- **Animating via a third-party motion library.** Any motion (C-F10) is CSS/SVG-native and reduced-motion gated, per
  the dependency policy and CLAUDE's motion rules. No `framer-motion`/`d3-transition`.
- **Changing the palette / theming model.** The CVD-safe `--cascivo-chart-*` system stays; new primitives read the
  same tokens.
- **Docs infrastructure rewrite.** T7's live-edit/copy uses the existing docs app stack; no new docs framework.

---

## Definition of done (verified after T7)

- Every cartesian chart accepts annotation primitives (target/threshold line, shaded band, marker) and opt-in data
  labels; both are keyboard-reachable and in the a11y tree.
- Bar stacking supports percent/100%; lines/areas handle `null` gaps; axes accept titles + explicit domains; per-series
  right-axis assignment works beyond ComboChart.
- Charts expose `onDatumClick`/`onSelect`; a `Brush` can subset a long series; `syncId` links tooltips across charts;
  entrance/update animation runs and is fully suppressed under `prefers-reduced-motion`.
- `RadialBar` + `Funnel` ship with metas, tests, stories, and LLM docs.
- **All 17 charts** have a Storybook story, an LLM doc, and a per-chart documentation page; `meta.intent` drives a
  "which chart should I use?" chooser.
- Examples are live-editable and copyable; a recipe gallery covers the common composition tasks; the public engine
  API (scales, shapes, `toStackedSeries`, `stats`) is documented.
- `pnpm ready` green; `breakpoint:check` + `fallback:check` clean; CVD/theme checks pass across all 14 themes; the
  charts mobile sweep passes at 320/360/390/414.

---

## Notes

- This roadmap is **Planned, not Shipped** — per the task that produced it (study Recharts, plan the gaps, do not
  implement). The tranche docs carry the task-by-task steps for when implementation begins.
- The verification figures above (8/17 stories, 7/17 LLM docs, zero annotation/label/event hits) are point-in-time
  reads of `main` at 2026-06-27 and should be re-confirmed at implementation start in case other roadmaps have moved
  the surface.
