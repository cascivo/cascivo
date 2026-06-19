# cascivo — Roadmap v42: Web Awesome Study — Adopt the Genuinely-Missing Pieces

**Last updated:** 2026-06-19
**Status:** ✅ Shipped (T1–T5). `comparison`, `qr-code`, `relative-time` components added; `formatBytes` added
to `@cascivo/i18n`; `useResizeObserver`/`useMutationObserver`/`useIntersectionObserver` added to `@cascivo/core`.
The "intent-router" idea was found to **already exist** as the `select_component` MCP tool (`packages/mcp/src/select.ts`),
which predates Web Awesome's `choosing-components` skill — it was **enhanced** to return `whenNotToUse`/`related`
so agents can disqualify wrong picks; the three new components flow into it automatically via `context:generate`.
**Plan documents:** `docs/superpowers/plans/2026-06-19-v42-master-plan.md` + tranches 1–5
**Builds on:** the component registry + manifests (`registry.json`, `packages/components`, `packages/react`),
the `@cascivo/core` hooks/primitives (`useClipboard`, `useDisclosure`, `useInfiniteScroll`, **`useDraggable`**,
`useMediaQuery`, `useAnchorPosition`, …) added through v41, the `@cascivo/i18n` Intl formatters
(`formatDate`, `formatNumber`, `formatRelativeTime`, `formatList`), the `@cascivo/charts` package, the
per-component **`intent`** manifest field + `intent-completeness.test.ts`, and the v41 HeroUI study
(`docs/ROADMAP-V41.md`) whose "we are already a superset — adopt only what's genuinely missing" framing this
roadmap reuses.

---

## Why this roadmap exists

The brief was to **study [Web Awesome](https://webawesome.com/)** (the rebranded successor to
[Shoelace](https://github.com/shoelace-style/webawesome)) and find components, layouts, utilities, and
UX/DX/AI ideas worth adopting into cascivo.

The honest headline, as with v39 (RetroUI) and v41 (HeroUI): **cascivo is already a superset of Web Awesome at
the component level.** Web Awesome (~3.9.x) ships ~70 framework-agnostic **custom elements built on Lit**
(shadow DOM, esbuild-bundled), distributed via **CDN / npm / an autoloader** (no copy-paste CLI), with a
**Custom Elements Manifest (`custom-elements.json`)** as source of truth, **`@lit/react` wrappers**, a
published **`llms.txt`** (`/dist/llms.txt`) and **Agent Skills** (`webawesome` + `webawesome-design`), and
**no MCP server** (described only as a future possibility). A category-by-category map (below) shows **all but
a small handful** of Web Awesome's elements already exist in cascivo (~118 components + `@cascivo/layouts`,
`@cascivo/charts`, `@cascivo/ai`).

So v42 is deliberately **not** a "port the component library" roadmap. It adopts the **genuinely missing
pieces and the ideas worth learning from**, each filtered through cascivo's principles (CSS-native,
signal-driven, owned code, AI-first). Web Awesome's stack — **Lit / custom elements / shadow DOM**, the
**autoloader + CDN distribution**, `@lit/react` wrappers, and the CEM-driven IDE integration — is explicitly
**rejected** as contrary to cascivo's React, CSS-native, copy-paste-owned-source model.

This document records the full study so the decision not to port is auditable, then scopes the five adoptable
workstreams.

> **Note on Web Awesome Pro / charts.** Web Awesome ships a Chart.js wrapper family (`wa-bar-chart`,
> `wa-line-chart`, `wa-pie-chart`, `wa-doughnut-chart`, `wa-scatter-chart`, `wa-bubble-chart`,
> `wa-radar-chart`, `wa-polar-area-chart`, `wa-sparkline`). cascivo's **`@cascivo/charts`** already ships
> area/bar/line/pie/scatter/bubble/radar/combo/histogram/boxplot/heatmap/treemap/bullet/kpi/meter **and
> `sparkline`** on its own CSS-native engine. Charts are **fully covered** — no action.

---

## Web Awesome at a glance (what the study found)

| Dimension     | Web Awesome (v3.9.x)                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Identity      | Framework-agnostic web components (successor to Shoelace, by Font Awesome); free + Pro tiers           |
| Stack         | **Lit** (custom elements / shadow DOM) + **esbuild**; Font Awesome icons as default icon library        |
| Distribution  | **CDN / npm / self-host download** + an **autoloader** (`webawesome.loader.js`, MutationObserver-driven, loads each `wa-*` definition on demand) or manual cherry-pick from `dist/components/<name>/<name>.js`. **No consumer CLI** (no `init`/`add`). You **import**, not own. |
| Elements      | ~70: page, card, split-panel, divider, drawer; breadcrumb, dropdown, tab-group, carousel; accordion, details, tree; button (+group), copy-button, rating; input, textarea, select, combobox, checkbox(+group), radio(+group), switch, slider, color-picker, date/time-input, date-picker, number-input, file-input; badge, callout, toast, tooltip, popover, dialog, progress-bar, progress-ring, spinner, skeleton; avatar, icon, animated-image, video(+playlist), comparison, tag, zoomable-frame; the chart family; and the **utilities/observers** below |
| Utilities     | `wa-animation`, `wa-intersection-observer`, `wa-mutation-observer`, `wa-resize-observer`, `wa-include`, `wa-format-date`, `wa-format-number`, **`wa-format-bytes`**, **`wa-relative-time`**, `wa-markdown`, **`wa-qr-code`**, `wa-popup`, `wa-scroller` |
| Theming       | CSS custom properties + design tokens; light/dark; WCAG-2.0-based color-palette generator; `::part()` styling hooks; named slots; `wa-*`-prefixed custom events |
| DX            | **CEM (`custom-elements.json`)** source of truth → `@lit/react` wrappers, VS Code `html-custom-data.json`, JetBrains `web-types.json`; **form-associated custom elements** (Constraint Validation API, `setCustomValidity`, `:state(user-invalid)`/`:state(blank)` custom states) |
| UX            | Candid **Accessibility Commitment** (philosophy, not a VPAT); hierarchical **localization** (`@shoelace-style/localize`, `lang`/`dir` mutation-observer auto-update, `registerTranslation`); **`prefers-reduced-motion`** honored (v3.8.0); per-component keyboard docs |
| AI layer      | **`llms.txt`** (`/dist/llms.txt`, generated from CEM), **Agent Skills** (`webawesome` + a separate `webawesome-design` + a `choosing-components` decision tree, agentskills.io spec), CEM manifest. **No MCP server** (future only) |

### Component map: Web Awesome → cascivo (already covered)

| Web Awesome                                   | cascivo equivalent                                          |
| --------------------------------------------- | ----------------------------------------------------------- |
| `wa-page`                                      | `app-shell` / `@cascivo/layouts` `dashboard-layout`         |
| `wa-card`                                       | `card` / `tile`                                            |
| `wa-split-panel`                                | `resizable` / `@cascivo/layouts` `split-view`             |
| `wa-divider`                                    | `separator`                                                |
| `wa-drawer`                                     | `drawer` / `sheet`                                         |
| `wa-breadcrumb`                                 | `breadcrumb`                                               |
| `wa-dropdown`                                   | `dropdown` / `menu`                                        |
| `wa-tab-group` / `wa-tab` / `wa-tab-panel`      | `tabs`                                                     |
| `wa-carousel`                                   | `carousel`                                                 |
| `wa-accordion`                                  | `accordion`                                                |
| `wa-details`                                    | `collapsible`                                              |
| `wa-tree` / `wa-tree-item`                       | `tree-view`                                                |
| `wa-button` / `wa-button-group`                  | `button` / `button-group` / `icon-button`                 |
| `wa-copy-button`                                | `copy-button`                                              |
| `wa-rating`                                     | `rating-group`                                            |
| `wa-input` / `wa-textarea`                       | `input` / `input-group` / `textarea`                      |
| `wa-select` / `wa-option`                        | `select` / `native-select` / `multi-select`               |
| `wa-combobox`                                   | `combobox`                                                |
| `wa-checkbox` (+group)                           | `checkbox` / `checkbox-card`                              |
| `wa-radio` (+group)                              | `radio` / `radio-card`                                    |
| `wa-switch`                                     | `toggle` / `switch`                                       |
| `wa-slider`                                     | `slider`                                                  |
| `wa-color-picker`                               | `color-picker`                                            |
| `wa-date-input` / `wa-date-picker` / `wa-known-date` | `date-picker` / `calendar` / `date-range-picker`     |
| `wa-time-input`                                 | `time-picker`                                             |
| `wa-number-input`                               | `number-input`                                            |
| `wa-file-input`                                 | `file-uploader`                                          |
| `wa-badge`                                      | `badge` / `indicator`                                    |
| `wa-callout`                                    | `alert`                                                  |
| `wa-toast` / `wa-toast-item`                     | `toast` / `notification`                                 |
| `wa-tooltip`                                    | `tooltip`                                                |
| `wa-popover` / `wa-popup`                        | `popover` / `hover-card` / `toggletip` / `useAnchorPosition` |
| `wa-dialog`                                     | `modal`                                                  |
| `wa-progress-bar`                               | `progress-bar` / `progress`                              |
| `wa-progress-ring`                              | `progress-circle` / `radial-progress`                   |
| `wa-spinner`                                    | `spinner` / `inline-loading`                             |
| `wa-skeleton`                                   | `skeleton`                                               |
| `wa-avatar`                                     | `avatar` / `avatar-group` / `user`                       |
| `wa-icon`                                       | `@cascivo/icons`                                        |
| `wa-tag`                                        | `tag`                                                   |
| `wa-scroller`                                   | `scroll-area`                                           |
| `wa-chart` + chart family + `wa-sparkline`       | `@cascivo/charts` (incl. `sparkline`)                   |
| `wa-format-date` / `wa-format-number`            | `@cascivo/i18n` `formatDate` / `formatNumber` (functions) |
| `wa-animation`                                  | CSS-only animation (`@starting-style`, keyframes, `view-transition`) |
| `wa-popup`                                      | `@cascivo/core` `useAnchorPosition` / `computePosition`  |
| **`wa-comparison`**                             | **— none —** ⬅ genuine component gap                     |
| **`wa-qr-code`**                                | **— none —** ⬅ genuine component gap                     |
| **`wa-relative-time`**                          | `formatRelativeTime` exists (function); **no auto-updating component** ⬅ gap |
| **`wa-format-bytes`**                           | **— none —** ⬅ `formatBytes` missing from `@cascivo/i18n` |
| **`wa-resize-observer`**                        | **— none —** ⬅ core-hook gap (`useResizeObserver`)        |
| **`wa-mutation-observer`**                      | **— none —** ⬅ core-hook gap (`useMutationObserver`)      |
| **`wa-intersection-observer`**                  | `useInfiniteScroll` only (sentinel); **no generic `useIntersectionObserver`** ⬅ gap |
| `wa-animated-image` / `wa-video(+playlist)` / `wa-zoomable-frame` / `wa-include` / `wa-markdown` | **considered, deferred / rejected** (see below) |

**Conclusion:** the only net-new *components* Web Awesome has that cascivo lacks are **`comparison`** and
**`qr-code`**, plus an auto-updating **`relative-time`** display component. The remaining gaps are a missing
**`formatBytes`** Intl formatter and three **observer hooks** (`useResizeObserver`, `useMutationObserver`,
`useIntersectionObserver`) that Web Awesome ships as declarative elements but cascivo expresses as
`@cascivo/core` signal hooks (mirroring `useInfiniteScroll`). Everything else is already shipped, usually with
more variants.

### Explicitly rejected (does not fit cascivo)

- **Lit / custom elements / shadow DOM / `@lit/react` wrappers** — cascivo is React + CSS-native (`@layer`,
  CSS Modules, custom properties) with its own signals/FSM primitives. **Not adopted.**
- **The autoloader + CDN distribution + cherry-pick imports** — cascivo's model is copy-paste owned source via
  `npx cascivo add` + the prebuilt `@cascivo/react` distribution + the shadcn-registry interop (v39). **Not
  adopted.**
- **CEM (`custom-elements.json`) + VS Code/JetBrains custom-data** — these exist to give HTML custom-elements
  autocomplete. cascivo's per-component **`component.meta.ts`** manifests are richer (typed `intent`, a11y,
  tokens, examples) and React gives autocomplete from TS types natively. **Not adopted** (cascivo is ahead).
- **`wa-animation` (declarative, ~100 presets)** — animation is CSS-only, reduced-motion-safe. **Not adopted.**
  (Web Awesome's *draggable-divider interaction* on `wa-comparison` and `wa-split-panel` is adopted via the
  existing `useDraggable` — see T1 — without the animation element.)
- **`wa-include`** — fetches and inlines arbitrary external HTML (injection/SSRF surface). **Rejected.**
- **`wa-video` / `wa-video-playlist` / `wa-zoomable-frame`** — heavy media surfaces; the native `<video>`
  element + cascivo's existing primitives cover the common case. **Deferred** (future-study candidates, not
  v42 scope).
- **`wa-animated-image`** (GIF/WEBP play-pause) — a thin wrapper; low value. **Considered, deferred.**
- **`wa-markdown`** (in-browser markdown→HTML) — would add a runtime markdown-parser dependency, contrary to
  the `@cascivo/core` no-runtime-deps policy; cascivo keeps `prose` (styling) + `@cascivo/render` (schema
  rendering). **Deferred.**
- **`llms.txt` / Agent Skills / form-association** — cascivo **already** ships `llms.txt` (docs + landing),
  `skills/`, an **MCP server** (which Web Awesome lacks), and `form`/`field` with React validation. The one
  fresh AI idea — Web Awesome's **`choosing-components` decision tree** — is adopted in T5 by surfacing the
  **existing** per-component `intent` data as an intent-router resource. **No re-port.**
- **Re-porting the ~55 covered elements** — already superseded. **Not adopted.**

---

## What *is* worth adopting (the five workstreams)

| #   | Workstream                                          | Tranche | Origin in Web Awesome                                  | Category    |
| --- | --------------------------------------------------- | ------- | ------------------------------------------------------ | ----------- |
| A   | **`comparison` component**                          | T1      | `wa-comparison` (before/after, draggable divider)      | component   |
| B   | **`qr-code` component**                             | T2      | `wa-qr-code`                                           | component   |
| C   | **`relative-time` component + `formatBytes`**       | T3      | `wa-relative-time` / `wa-format-bytes`                 | component / i18n |
| D   | **Observer hooks in `@cascivo/core`**               | T4      | `wa-resize-observer` / `wa-mutation-observer` / `wa-intersection-observer` | DX / core |
| E   | **Web Awesome study doc + intent-router + gate**    | T5      | the study record + the `choosing-components` skill idea | docs / AI  |

Why these five, and why in this order:

1. **T1 — `comparison` (clearest, most distinctive component gap).** A before/after comparer: two stacked
   layers (e.g. images) revealed by a draggable vertical (or horizontal) divider, the position driven by
   cascivo's existing **`useDraggable`** (a `clip-path`/`inset` CSS transform, no animation library),
   keyboard-accessible (Arrow keys move the divider), reduced-motion-safe. Net-new, self-contained, ships a
   manifest.
2. **T2 — `qr-code`.** Encode a URL/short string into a scannable **SVG** (crisp, themeable via
   `currentColor`, no canvas raster), signal-driven (`value`, `size`, `errorCorrection`, `radius`, colors).
   Owned code: a minimal MIT QR-encoding routine vendored inline (no runtime npm dependency). Self-contained,
   manifest-backed.
3. **T3 — `relative-time` + `formatBytes`.** The one formatter that genuinely benefits from being a
   *component* is **`relative-time`**: it auto-ticks (re-renders "2 minutes ago" → "3 minutes ago") via a
   `useSignalEffect` interval, reusing `@cascivo/i18n`'s `formatRelativeTime`. Alongside it, add the single
   missing Intl formatter, **`formatBytes`** (`Intl.NumberFormat` `style: 'unit'`), completing the i18n
   formatter set. `format-date`/`format-number` stay **functions** (a React display wrapper adds nothing).
4. **T4 — observer hooks.** Web Awesome ships `wa-resize-observer`, `wa-mutation-observer`, and
   `wa-intersection-observer` as declarative elements. cascivo's idiom is signal hooks — add
   **`useResizeObserver`**, **`useMutationObserver`**, and a generic **`useIntersectionObserver`** to
   `@cascivo/core`, each built from `useSignal`/`useSignalEffect`/`useRef` (the `infinite-scroll.ts`
   template), SSR-guarded, observer torn down in `useSignalEffect` cleanup. Pure additions.
5. **T5 — study doc + intent-router + gate.** Record the full Web Awesome study (this roadmap), document the
   new components/hooks. Adopt Web Awesome's one fresh AI idea — the **`choosing-components` decision tree** —
   by surfacing cascivo's **already-existing** per-component **`intent`** data (`whenToUse`/`whenNotToUse`/
   `related`, enforced by `intent-completeness.test.ts`) as a consolidated **intent-router** resource in the
   MCP/skill surface, so agents pick a component by intent, not by guessing names. `pnpm regen`, full CI gate,
   drift, and a grep sweep.

---

## What exists today (verified against the codebase)

| Area                  | State                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Components            | ~118 in `packages/components/src/*`, re-exported from `packages/react/src/index.ts`; metas enumerated in `_all-metas.ts` |
| comparison / qr-code  | **None** — no before/after comparer, no QR encoder                                                  |
| relative-time         | `@cascivo/i18n` exports **`formatRelativeTime`** (function); **no auto-updating display component**  |
| i18n formatters       | `formatDate`, `formatNumber`, `formatRelativeTime`, `formatList` in `packages/i18n/src/format.ts`; **no `formatBytes`** |
| Charts                | `@cascivo/charts` ships area/bar/line/pie/scatter/bubble/radar/combo/histogram/boxplot/heatmap/treemap/bullet/kpi/meter **+ `sparkline`** — Web Awesome chart family **fully covered** |
| Draggable             | `@cascivo/core` **`useDraggable`** (pointer-driven `{ x, y }` signal offset + handle/target refs) added in v41 — the divider engine for `comparison` |
| Core observer hooks   | only **`useInfiniteScroll`** (IntersectionObserver sentinel) in `packages/core/src/infinite-scroll.ts`; **no `useResizeObserver`/`useMutationObserver`/generic `useIntersectionObserver`** |
| Manifest `intent`     | **every** `component.meta.ts` carries a typed **`intent`** (`whenToUse`/`whenNotToUse`/`related`/`a11yRationale`/`flexibility`), enforced by `packages/components/src/intent-completeness.test.ts` |
| AI layer              | per-component manifests → MCP (`@cascivo/mcp`), `skills/` (`cascivo-add`, `cascivo-create-theme`, `cascivo-design-page`, `cascivo-extend`), auto-docs, `llms.txt` (docs + landing) — **ahead** of Web Awesome (which has **no MCP**); **no consolidated intent-router resource** yet |
| render / prose        | `@cascivo/render` (schema → component validation/rendering) + `prose` (markdown *styling*) — no in-browser markdown parser (intentional) |

---

## Target state (after v42)

| Concern                        | Today                               | Target                                                                 |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| Components                     | ~118 (no comparison/qr-code/relative-time) | +3 (`comparison`, `qr-code`, `relative-time`), each with manifest, react export, registry entry, tests |
| i18n formatters                | 4 (`formatDate`/`Number`/`RelativeTime`/`List`) | + **`formatBytes`** (completes the Intl set)                  |
| Core observer hooks            | 1 (`useInfiniteScroll`)             | + `useResizeObserver`, `useMutationObserver`, `useIntersectionObserver` (signal-driven) |
| AI intent-router               | per-component `intent` data only    | + a consolidated **intent-router** resource (MCP/skill) — pick by intent, not name (Web Awesome `choosing-components` parity) |
| Docs                           | —                                   | Web Awesome study recorded; new components/hooks/formatter documented   |

---

## Key open decisions (recommendations in the master plan)

1. **`comparison` divider — reuse `useDraggable`?** _Recommendation: **yes**._ v41 already shipped a
   pointer-driven `useDraggable` (signal `{ x, y }` + handle/target refs). The comparer's divider is exactly
   that interaction applied to a `clip-path`/`inset` CSS reveal — no new drag engine, no animation library.
   Keyboard support (Arrow keys nudge the divider, Home/End to ends) is added on top; reduced-motion disables
   any settle transition.
2. **`qr-code` rendering: SVG or canvas, and the encoder dependency?** _Recommendation: **SVG**, with a
   **minimal vendored MIT encoder** (owned code, no runtime npm dep)._ SVG is crisp at any size, themeable via
   `currentColor`/tokens, and serializes server-side. cascivo's no-runtime-deps policy rules out pulling a
   `qrcode` package into owned/copied source; a small inline encoder keeps the component self-contained.
3. **Reactive formatter components — how many?** _Recommendation: ship **only `relative-time`** as a
   component; add **`formatBytes`** as an i18n function; leave `format-date`/`format-number` as functions._
   `relative-time` is the one that benefits from being a component (it auto-ticks). A React `<FormatDate>` that
   just calls `formatDate(...)` once adds nothing over the function. Avoid component bloat.
4. **`relative-time` auto-update without `useEffect`/timers-in-tests?** _Recommendation: a `useSignalEffect`
   interval (SSR-guarded), tick cadence derived from the magnitude (seconds → minutes → hours), with the
   interval **opt-out** (`sync={false}`) and **disabled under tests** via deterministic injection (pass a
   `now` signal) so assertions fire events, not wall-clock timers._
5. **Observer hooks: declarative components or hooks?** _Recommendation: **hooks** in `@cascivo/core`._ Web
   Awesome ships them as `wa-*` elements because it has no other reactivity primitive; cascivo already
   expresses observation as signal hooks (`useInfiniteScroll`). `useResizeObserver`/`useMutationObserver`/
   `useIntersectionObserver` return signals + a `ref`, mirror the `infinite-scroll.ts` template, and compose
   into any component. No new components.
6. **AI intent-router: new data or surface existing?** _Recommendation: **surface existing**._ cascivo
   **already** has structured per-component `intent` (richer than Web Awesome's prose decision tree). The work
   is a consolidated **intent-router** resource (an MCP tool / skill section / generated artifact) that maps
   an intent phrase → ranked components from the existing `intent` fields — not a new authored taxonomy.
   cascivo is ahead; this closes the one presentation gap.
7. **Scope discipline — what stays out?** _Recommendation: **defer** `video`/`video-playlist`/
   `zoomable-frame`/`animated-image`/`markdown`/`include`, and **reject** the Lit/custom-element/autoloader/CEM
   stack outright_ (recorded above). v42 is five tight, additive workstreams — not a media-player or
   web-components initiative.

---

## Cross-cutting rules

1. **No Lit / custom elements / shadow DOM / autoloader / CDN distribution / runtime deps.** Adopt ideas, not
   Web Awesome's stack. React + CSS-native + `@cascivo/core` signals/FSM throughout. Every net-new component
   obeys the CLAUDE.md authoring rules (no `useState`/`useEffect`/`useContext`/`useReducer`; `useSignal*` +
   `useRef`; CSS for hover/focus/active/disabled; i18n-defaulted strings; `useSignals()` when reading a signal
   during render in React apps).
2. **DOM side effects use `useSignalEffect`.** The `comparison` pointer/keyboard handlers (via `useDraggable`),
   the `relative-time` tick interval, and all three observer hooks attach/detach via `useSignalEffect` with
   cleanup — never `useEffect`. SSR/no-DOM guarded (`typeof ResizeObserver`, `typeof window`, etc.).
3. **No runtime dependencies.** The `qr-code` encoder is **vendored owned source** (minimal MIT routine), not
   an npm dependency; `@cascivo/core` keeps its zero-runtime-deps posture.
4. **Animations are progressive enhancement + reduced-motion-safe.** The `comparison` divider settle and any
   reveal transition have a static fallback (`fallback:check`) and are disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); never
   `display:none` content away (≥44px coarse-pointer targets where interactive — the divider handle qualifies).
5. **AI-first discipline.** `comparison`, `qr-code`, and `relative-time` each ship a `component.meta.ts`
   (including the required **`intent`** block so `intent-completeness.test.ts` passes), are added to
   `packages/react/src/index.ts` and `_all-metas.ts`, and appear in `registry.json` after `pnpm regen`. New
   hooks/formatters are exported from `@cascivo/core`/`@cascivo/i18n` `index.ts`.
6. **Additive, not a rewrite.** New components/hooks/formatters are net-new; no existing component API changes
   and no behavior change to existing call sites.
7. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready` green
   before each commit.

---

## Definition of Done

### T1 — `comparison` component

- [ ] `packages/components/src/comparison/` ships `comparison.tsx` + `comparison.module.css` +
      `comparison.meta.ts` + `comparison.test.tsx`.
- [ ] Two slotted layers (`before`/`after`) revealed by a draggable divider driven by `@cascivo/core`
      `useDraggable` (CSS `clip-path`/`inset`, no animation library); `position` (0–100, controllable),
      `orientation` (`horizontal`/`vertical`). No banned hooks.
- [ ] Keyboard-accessible (Arrow keys nudge, Home/End to ends; `role="slider"`, `aria-valuenow`), WCAG AA,
      reduced-motion-safe settle with a static fallback, logical-property CSS, ≥44px coarse handle.
- [ ] Manifest complete (incl. `intent`); exported from `packages/react/src/index.ts` + `_all-metas.ts`;
      appears in `registry.json` after `pnpm regen`. `pnpm exec vp run @cascivo/components#test` green.

### T2 — `qr-code` component

- [ ] `packages/components/src/qr-code/` ships `qr-code.tsx` + `.module.css` + `.meta.ts` + `.test.tsx` plus a
      vendored, MIT-licensed minimal QR-encoding routine (owned source, no runtime npm dependency).
- [ ] Renders a crisp **SVG** from `value`; props `size`, `errorCorrection` (`L|M|Q|H`), `radius`, `fill`/
      `background` (default `currentColor` / `transparent`), `label` (a11y). No banned hooks; signal-driven.
- [ ] WCAG AA (`role="img"` + `aria-label` from `label`/i18n default), themeable via tokens, deterministic
      tests (known value → known module matrix). Manifest (incl. `intent`); exported; in `registry.json`.

### T3 — `relative-time` component + `formatBytes`

- [ ] `packages/i18n/src/format.ts` gains **`formatBytes`** (`Intl.NumberFormat` `style: 'unit'`, binary/
      decimal option, locale-aware) exported from `@cascivo/i18n` `index.ts`, with unit tests.
- [ ] `packages/components/src/relative-time/` ships an auto-updating component reusing `formatRelativeTime`;
      ticks via a `useSignalEffect` interval (cadence by magnitude), `sync` opt-out, injectable `now` for
      deterministic tests (no wall-clock timers). No banned hooks.
- [ ] WCAG AA (`<time datetime>` semantics, full date in `title`/`aria-label`), i18n-defaulted; manifest
      (incl. `intent`); exported from `packages/react/src/index.ts` + `_all-metas.ts`; in `registry.json`.

### T4 — observer hooks in `@cascivo/core`

- [ ] `useResizeObserver`, `useMutationObserver`, `useIntersectionObserver` in `packages/core/src/`, each
      returning a signal (entry/size/visibility) + a target `ref`, built from `useSignal`/`useSignalEffect`/
      `useRef` (the `infinite-scroll.ts` template), exported from `index.ts`, each unit-tested. No
      `useState`/`useEffect`.
- [ ] SSR/no-DOM guarded (`typeof <Observer>`); observers disconnected in `useSignalEffect` teardown.
- [ ] `pnpm exec vp run @cascivo/core#test` green; documented in `packages/core/README.md`.

### T5 — Web Awesome study doc + intent-router + final gate

- [ ] This roadmap + the new components/hooks/formatter documented (component docs, core-hooks note,
      `@cascivo/i18n` formatter doc).
- [ ] A consolidated **intent-router** resource surfaced from the existing per-component `intent` data (MCP
      tool / skill section / generated artifact) — pick-by-intent parity with Web Awesome's `choosing-components`
      skill; `intent-completeness.test.ts` stays green (new components carry `intent`).
- [ ] `pnpm regen`; drift gate green; full CI gate passes: `vp check`, `pnpm build`, `vp run -r check`,
      `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`; grep sweep confirms `comparison`/
      `qr-code`/`relative-time` reached every registration surface.
