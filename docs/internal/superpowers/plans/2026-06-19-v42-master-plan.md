# v42 — Web Awesome Study → Adopt the Genuinely-Missing Pieces — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study [Web Awesome](https://webawesome.com/) (the Lit-based successor to
[Shoelace](https://github.com/shoelace-style/webawesome)) and adopt the **five** things cascivo genuinely
lacks or can learn from — **not** re-port its element library. A category-by-category map (in
`docs/ROADMAP-V42.md`) shows cascivo (~118 components + `@cascivo/layouts`/`charts`/`ai`) is already a
superset of Web Awesome v3.9.x (~70 custom elements on Lit/shadow-DOM, distributed via CDN/autoloader/npm with
a CEM manifest, `@lit/react` wrappers, `llms.txt` + Agent Skills, **and no MCP server**). The only net-new
*components* are **`comparison`** (before/after draggable-divider comparer) and **`qr-code`**, plus an
auto-updating **`relative-time`** display component. The other adoptions are an **i18n gap** (`formatBytes` —
the one missing Intl formatter), a **DX gap** (Web Awesome's `wa-resize-observer`/`wa-mutation-observer`/
`wa-intersection-observer`, adopted as `@cascivo/core` **hooks**), and one fresh **AI idea** (Web Awesome's
`choosing-components` decision tree, adopted by surfacing cascivo's **existing** per-component `intent` data as
an intent-router). Web Awesome's stack — **Lit/custom elements/shadow DOM, the autoloader + CDN distribution,
`@lit/react` wrappers, and CEM-driven IDE integration** — is explicitly **rejected** as contrary to cascivo's
React, CSS-native, copy-paste-owned-source principles. Web Awesome's chart family is **already covered** by
`@cascivo/charts` (incl. `sparkline`), and its `llms.txt`/Agent-Skills/CEM are **matched or exceeded** (cascivo
ships an MCP server, richer per-component manifests with typed `intent`, skills, and `llms.txt`).

Target state (verified after T5):

| Metric                                   | Today                                  | Target |
| ---------------------------------------- | -------------------------------------- | ------ |
| Components                               | ~118 (no comparison/qr-code/relative-time) | +3 (`comparison`, `qr-code`, `relative-time`) with manifest + react export + registry + tests |
| i18n formatters                          | 4 (`formatDate`/`Number`/`RelativeTime`/`List`) | + `formatBytes` |
| Core observer hooks                      | 1 (`useInfiniteScroll`)                | + `useResizeObserver`, `useMutationObserver`, `useIntersectionObserver` |
| AI intent-router                         | per-component `intent` data only       | + consolidated intent-router resource (pick-by-intent) |
| `intent-completeness.test.ts`            | green                                  | green (new components carry `intent`) |
| Full CI gate (`pnpm ready`)              | green                                  | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Components:** `packages/components/src/*` (~118 dirs), re-exported from `packages/react/src/index.ts`
  (`export * from '../../components/src/<name>/<name>'`), metas enumerated in
  `packages/components/src/_all-metas.ts`. Mapping every Web Awesome element to a cascivo equivalent leaves
  exactly two component gaps — **`comparison`** and **`qr-code`** — plus an auto-updating **`relative-time`**
  component, an i18n **`formatBytes`** gap, and three **observer-hook** gaps.
- **`useDraggable`:** `packages/core/src/draggable.ts` (added v41) returns a pointer-driven `{ x, y }` signal
  offset + handle/target refs, attaching pointer listeners in `useSignalEffect`. It is the **divider engine**
  for `comparison` — no new drag code, no animation library.
- **Avatar / Image load FSM:** `packages/components/src/avatar/avatar.tsx` and
  `packages/components/src/image/image.tsx` (v41) are the `createMachine`/`useMachine` + `useSignals()`
  template `qr-code` (state-free render) and `comparison` reuse where applicable.
- **i18n formatters:** `packages/i18n/src/format.ts` exports `formatDate`, `formatNumber`,
  `formatRelativeTime`, `formatList` (all `Intl`-backed, locale from the i18n signal store). It has **no
  `formatBytes`** — T3 adds it here following the same pattern; `relative-time` (T3) reuses
  `formatRelativeTime`.
- **Observer hooks:** `packages/core/src/infinite-scroll.ts` wraps an `IntersectionObserver` via
  `useSignal` + `useRef` + `useSignalEffect` cleanup (no `useEffect`). It is the **template** for T4's three
  hooks. There is **no** generic `useResizeObserver`/`useMutationObserver`/`useIntersectionObserver`.
- **`intent` manifest field:** every `component.meta.ts` carries a typed `intent`
  (`whenToUse`/`whenNotToUse`/`related`/`a11yRationale`/`flexibility`), enforced by
  `packages/components/src/intent-completeness.test.ts`. This **already** exceeds Web Awesome's prose
  `choosing-components` decision tree — T5 surfaces it as a consolidated intent-router, it does not author a
  new taxonomy.
- **Charts:** `packages/charts/src/charts/*` ships `sparkline` + the full chart family, so Web Awesome's
  Chart.js wrappers are **covered** — no action.
- **AI / CLI:** `@cascivo/mcp`, `skills/` (`cascivo-add`, `cascivo-create-theme`, `cascivo-design-page`,
  `cascivo-extend`), `llms.txt` (in `apps/docs/public` + `apps/landing/public`), and per-component manifests
  put cascivo's AI layer **ahead** of Web Awesome (which has **no MCP**). The only AI work is the intent-router
  surface in T5.

**Tech Stack:** signal-driven TSX + CSS Modules for T1/T2/T3 components (no Lit, no shadow DOM, no
`useState`/`useEffect`); `Intl`-backed function for T3 `formatBytes`; pure signal hooks for T4
(`useSignal`/`useSignalEffect`/`useRef`); docs + intent-router + gate for T5. vite+ (`vp`) for
check/build/test throughout. Progressive-enhancement CSS (`@function`/`if()` only with static fallbacks —
`fallback:check`). No runtime dependencies (the `qr-code` encoder is vendored owned source).

---

## Tranche Overview

| Tranche | Title                                | Goal                                                                                                  |
| ------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| T1      | `comparison` component               | New before/after comparer: two slotted layers + a draggable divider via `useDraggable` (CSS `clip-path`/`inset`, keyboard-accessible) + manifest + react export + registry + tests. The clearest, most distinctive component gap. |
| T2      | `qr-code` component                  | New SVG QR encoder (vendored minimal MIT routine, no runtime dep): `value`/`size`/`errorCorrection`/`radius`/colors, themeable, a11y-labelled + manifest + tests. |
| T3      | `relative-time` + `formatBytes`      | Auto-updating `relative-time` component (reuses `formatRelativeTime`, `useSignalEffect` tick, injectable `now`) + add `formatBytes` to `@cascivo/i18n` (completes the Intl set). |
| T4      | `@cascivo/core` observer hooks       | Add `useResizeObserver`, `useMutationObserver`, `useIntersectionObserver` (signal-driven, SSR-guarded, the `infinite-scroll.ts` template) + unit tests. The Web Awesome observer-element DX gap. |
| T5      | Web Awesome study doc + intent-router + gate | Document the study + new surfaces; surface existing per-component `intent` as a consolidated intent-router (MCP/skill) — `choosing-components` parity; `pnpm regen`; full gate + drift + grep sweep. |

Ordering rationale: **T1**, **T2**, **T3** are independent net-new surfaces (T1 reuses `useDraggable`; T2 is
self-contained; T3 touches `i18n` + a component) and can run in parallel; sequenced T1 → T2 → T3 for a single
reviewer. **T4** (pure core hooks) is independent of T1–T3. **T5** documents everything, adds the intent-router
(which depends on all new components carrying `intent`), and runs the final gate including drift and a grep
sweep proving the new components reached every registration surface (`react/src/index.ts`, `_all-metas.ts`,
`registry.json`).

---

## Files Created / Modified per Tranche

### T1 — `comparison` component

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/comparison/comparison.tsx`, `comparison.module.css`, `comparison.meta.ts`, `comparison.test.tsx` |
| Modify | `packages/react/src/index.ts` (export `comparison`)                                     |
| Modify | `packages/components/src/_all-metas.ts` (add `comparisonMeta`)                           |
| Modify | `packages/i18n/src/builtin.ts` (divider aria-label default, if surfaced)                |
| Regen  | `registry.json` (`pnpm regen`)                                                           |

### T2 — `qr-code` component

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/components/src/qr-code/qr-code.tsx`, `qr-code.module.css`, `qr-code.meta.ts`, `qr-code.test.tsx` |
| Create | `packages/components/src/qr-code/encode.ts` (vendored minimal MIT QR-encoding routine, owned source) + `encode.test.ts` |
| Modify | `packages/react/src/index.ts` (export `qr-code`)                                        |
| Modify | `packages/components/src/_all-metas.ts` (add `qrCodeMeta`)                               |
| Modify | `packages/i18n/src/builtin.ts` (default QR aria-label)                                  |
| Regen  | `registry.json` (`pnpm regen`)                                                           |

### T3 — `relative-time` + `formatBytes`

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/i18n/src/format.ts` (add `formatBytes`) + `packages/i18n/src/index.ts` (export) |
| Modify | `packages/i18n/src/format.test.ts` (cover `formatBytes`)                                |
| Create | `packages/components/src/relative-time/relative-time.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/react/src/index.ts` (export `relative-time`)                                  |
| Modify | `packages/components/src/_all-metas.ts` (add `relativeTimeMeta`)                         |
| Regen  | `registry.json` (`pnpm regen`)                                                           |

### T4 — `@cascivo/core` observer hooks

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/core/src/resize-observer.ts` + `resize-observer.test.ts`                      |
| Create | `packages/core/src/mutation-observer.ts` + `mutation-observer.test.ts`                  |
| Create | `packages/core/src/intersection-observer.ts` + `intersection-observer.test.ts`          |
| Modify | `packages/core/src/index.ts` (export the three hooks + their types)                     |
| Modify | `packages/core/README.md` (document the new hooks)                                       |

### T5 — Web Awesome study doc + intent-router + final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `docs/ROADMAP-V42.md` (status → in progress/done as tranches land)                      |
| Modify | component docs / `packages/core/README.md` / `@cascivo/i18n` formatter doc (new surfaces) |
| Modify/Create | intent-router resource — surface existing `intent` (e.g. `@cascivo/mcp` tool + a skill section / generated artifact under `scripts/registry/` or `skills/`) |
| Verify | `pnpm regen` (registry + generated listings); commit drift                              |
| Verify | full gate: `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, drift; grep sweep for `comparison`/`qr-code`/`relative-time` |

---

## Key Decisions

### Decision 1 — Do NOT re-port Web Awesome's elements (firm)

cascivo (~118 components) already supersedes Web Awesome v3.9.x (~70 elements). The component map in
`docs/ROADMAP-V42.md` shows every Web Awesome element has a cascivo equivalent **except** `comparison` and
`qr-code` (plus an auto-updating `relative-time`, an i18n `formatBytes`, and three observer hooks). Re-porting
would be redundant and would import Web Awesome's stack assumptions (Lit, shadow DOM, the autoloader).
**Decision: adopt `comparison` + `qr-code` + `relative-time` as net-new; reject the rest as already-shipped.**
This is the central honest finding and the reason v42 is scoped around ideas, not ports.

### Decision 2 — Reject Lit / custom elements / shadow DOM / autoloader / CDN distribution / CEM (firm)

Web Awesome is Lit custom elements (shadow DOM) bundled with esbuild, distributed via CDN + an autoloader
(MutationObserver) or cherry-pick imports, with `@lit/react` wrappers and a CEM-driven VS Code/JetBrains
integration. cascivo is React + CSS-native (`@layer`, CSS Modules, custom properties), builds its own
micro-FSM + signals + a11y helpers in `@cascivo/core`, and distributes copy-paste owned source + a prebuilt
`@cascivo/react` package. **Decision: none of Web Awesome's stack is adopted.** The study records each as
"considered, rejected, with reason." The one Web Awesome *interaction* worth keeping — the
draggable-divider comparer — is reimplemented on cascivo's existing `useDraggable` (T1), **without** Lit. The
CEM/IDE integration is rejected because cascivo's `component.meta.ts` manifests are richer and React provides
TS autocomplete natively.

### Decision 3 — `comparison` reuses `useDraggable`, keyboard-accessible, CSS reveal (recommended)

cascivo has `useDraggable` (v41) but no before/after comparer. **Decision: a dedicated `comparison`
component** with two slotted layers (`before`/`after`) revealed by a draggable divider whose position is a
`useDraggable`-driven signal applied as a CSS `clip-path`/`inset` reveal (no animation library), `position`
(0–100, controllable), and `orientation` (`horizontal`/`vertical`). The divider is `role="slider"` with
`aria-valuenow`, keyboard-driven (Arrow nudge, Home/End to ends), reduced-motion-safe (static fallback for any
settle), with a ≥44px coarse handle. Rejected: a bare CSS-only slider (no keyboard a11y) and a Framer/animation
dependency (cascivo animates with CSS; the drag is `useDraggable`).

### Decision 4 — `qr-code` renders SVG from a vendored MIT encoder, no runtime dep (recommended)

cascivo has no QR encoder. **Decision: a dedicated `qr-code` component** that renders a crisp **SVG** module
matrix from `value`, with `size`, `errorCorrection` (`L|M|Q|H`), `radius`, `fill`/`background` (default
`currentColor`/`transparent`, themeable via tokens), and an a11y `label` (`role="img"` + `aria-label`,
i18n-defaulted). The encoding routine is a **minimal MIT QR algorithm vendored as owned source**
(`qr-code/encode.ts`) — **not** an npm runtime dependency — preserving the no-runtime-deps policy and the
copy-paste-owned model. Rejected: a `<canvas>` raster (not crisp/serializable, not themeable) and pulling a
`qrcode` package (runtime dep).

### Decision 5 — Only `relative-time` ships as a component; add `formatBytes` as a function (recommended)

Web Awesome ships `wa-format-date`, `wa-format-number`, `wa-format-bytes`, and `wa-relative-time` as elements
because HTML has no way to call a function. cascivo **already** has `formatDate`/`formatNumber`/
`formatRelativeTime` functions. **Decision: ship only `relative-time` as a component** (it auto-ticks — the
one case a component adds value), add **`formatBytes`** as the single missing i18n **function**
(`Intl.NumberFormat` `style: 'unit'`, binary/decimal option), and leave `format-date`/`format-number` as
functions. `relative-time` auto-updates via a `useSignalEffect` interval (cadence by magnitude), with a `sync`
opt-out and an **injectable `now`** so tests are deterministic (fire events, not wall-clock timers). Rejected:
`<FormatDate>`/`<FormatNumber>` display wrappers (add nothing over the existing functions — component bloat).

### Decision 6 — Observer wrappers are hooks, not components (recommended)

Web Awesome ships `wa-resize-observer`/`wa-mutation-observer`/`wa-intersection-observer` as declarative
elements. cascivo already expresses observation as signal hooks (`useInfiniteScroll`). **Decision: add
`useResizeObserver`, `useMutationObserver`, and a generic `useIntersectionObserver` to `@cascivo/core`**, each
returning a signal (size/entry/visibility) + a target `ref`, built from `useSignal`/`useSignalEffect`/`useRef`
(the `infinite-scroll.ts` template), SSR-guarded (`typeof <Observer>`), observer disconnected in
`useSignalEffect` teardown, exported from `index.ts`, unit-tested. Rejected: declarative `<ResizeObserver>`
components (un-idiomatic for cascivo; hooks compose into any component) and `useEffect`/`useState`
implementations (violate CLAUDE.md).

### Decision 7 — AI parity is already met; adopt the intent-router by surfacing existing data (recommended)

cascivo's AI layer (per-component `component.meta.ts` manifests with typed `intent`, `@cascivo/mcp`, `skills/`,
`llms.txt`) already **exceeds** Web Awesome's (CEM-derived `llms.txt` + Agent Skills, **no MCP**). Web Awesome's
one fresh idea is the **`choosing-components` decision tree** (v3.9.0) — "pick by intent, not name." cascivo
**already has** that data, structured, per component (`intent.whenToUse`/`whenNotToUse`/`related`), enforced by
`intent-completeness.test.ts`. **Decision: surface the existing `intent` data as a consolidated intent-router
resource** (an `@cascivo/mcp` tool + a skill section / generated artifact) — not a new authored taxonomy. New
components (T1–T3) carry `intent` so the test stays green. Rejected: authoring a parallel prose decision tree
(duplicates the typed data) and any MCP/llms.txt re-port (already ahead).

### Decision 8 — Defer the heavy/edge media + reject the unsafe utilities (recommended)

**Decision: defer** `wa-video`/`wa-video-playlist`/`wa-zoomable-frame`/`wa-animated-image`/`wa-markdown` as
out-of-scope (heavy media surfaces or a runtime-parser dependency; future-study candidates), and **reject**
`wa-include` (fetch+inline arbitrary external HTML — injection/SSRF surface) and `wa-animation` (cascivo
animates with CSS only). Recorded in `docs/ROADMAP-V42.md`. v42 stays five tight, additive workstreams.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **No Lit, no shadow DOM, no autoloader, no runtime deps, no banned hooks.** New TSX (`comparison`,
   `qr-code`, `relative-time`) and hooks obey CLAUDE.md: no `useState`/`useEffect`/`useContext`/`useReducer`;
   `useSignal*` + `useRef` only; CSS handles hover/focus/active/disabled; i18n-defaulted strings;
   `useSignals()` when a signal is read during render in React apps.
3. **DOM side effects use `useSignalEffect`.** The `comparison` pointer/keyboard handlers (via `useDraggable`),
   the `relative-time` tick interval, and the three observer hooks attach/detach via `useSignalEffect` with
   cleanup — never `useEffect`. SSR/no-DOM guarded.
4. **No runtime dependencies:** the `qr-code` encoder is vendored owned source (minimal MIT routine);
   `@cascivo/core` keeps zero runtime deps.
5. **Animations: progressive enhancement + reduced-motion.** The `comparison` settle/reveal has a static
   fallback before every progressive declaration (`fallback:check`), disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); no `display:none`
   data loss; ≥44px coarse-pointer targets where interactive (the divider handle).
6. **Additive only:** new components/hooks/formatters are net-new; no existing component API changes and no
   behavior change to existing call sites.
7. **AI-first:** `comparison`/`qr-code`/`relative-time` each ship a `component.meta.ts` **including `intent`**
   (so `intent-completeness.test.ts` passes), are added to `packages/react/src/index.ts` and `_all-metas.ts`;
   new hooks/formatters are exported from `@cascivo/core`/`@cascivo/i18n` `index.ts`; `pnpm regen` refreshes
   `registry.json`.
8. **Generated artifacts stay in sync:** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check` green.
