# Remediation Spec — CSS Layering & Headless Primitives

_Source: post-implementation experience review (CSS layering architecture)._
_Status: implemented (see Implementation status below). Scope: `@cascivo/tokens`,
`@cascivo/themes`, `@cascivo/core`, `@cascivo/components`, `@cascivo/cli`, docs, checks._

## Implementation status

| Item | Status |
| --- | --- |
| **Issue 1** — canonical `@layer` order (`layers.css`), `cascivo.override` escape hatch, all entry paths + scaffold + examples + docs aligned, `layers:check` drift guard | ✅ done |
| **Issue 2 Phase A** — Modal + Tooltip id bugs (also AlertDialog, found during the work) | ✅ done |
| **Issue 2 Phase B** — `useTypeahead` primitive in `@cascivo/core` | ✅ done |
| Composed `useMenu` / `useListbox` + submenu engine | ⏸ deferred — API should be driven by a concrete migration, not designed speculatively |
| **Issue 2 Phase C** — Menu migrated to shared roving/typeahead; AlertDialog to `useId` | ✅ done |
| Combobox / date-picker / date-range-picker outside-click → `DismissableLayer` | ⏸ deferred — wraps markup in DismissableLayer's element; needs a visual layout review. Tracked in the `primitive-adoption` allowlist. |
| **Issue 2 Phase D** — `primitives:check` guard, CLAUDE.md rule, `docs/HEADLESS.md` | ✅ done |

---

## 0. What the report said, and what the code actually shows

The review raised two issues. Before planning fixes, each was checked against the
codebase, because a spec that fixes a mis-stated problem ships the wrong thing.

| Report claim | Verdict after code audit |
| --- | --- |
| **"Layer Rigidity on Overrides"** — layout components in a lower layer get "priority locked" unless runtime `var(--token)`s scale from the root layer. | **Real, but mis-diagnosed.** `var()` resolution is _not_ layer-bound — a component in `cascivo.component` always reads the winning value of a custom property regardless of the layer the component rule lives in. The genuine defect is that **there is no single shipped source of truth for `@layer` order**; the order is declared in ≥5 places that _contradict each other_ on whether `theme` or `component` wins, and there is **no top-most `cascivo.override` escape-hatch layer**. Overrides therefore behave differently depending on which entry path loaded first — that unpredictability is what reads as a "priority lock." |
| **"Lack of Unstyled Primitive State Engines"** — devs must roll their own aria/keyboard/focus for complex nested dropdowns. | **Inaccurate as stated, real in practice.** `@cascivo/core` already ships a substantial headless layer: `FocusScope`, `DismissableLayer` (nesting-aware), `useRovingFocus`, `useDisclosure`, `useAnchorPosition`, `Portal`, `Presence`, `useId`, `useScrollLock`. The defect is **low, inconsistent adoption**: the headline components (Dropdown, Combobox, Menu, Tabs, Modal, Tooltip) bypass the primitives and hand-roll `onKeyDown` switches, ad-hoc `document.addEventListener` outside-click, and inline aria. Genuine gaps: no `useTypeahead`, no aria prop-getters / composed `useMenu`/`useListbox`, no submenu keyboard engine. One real bug: `Modal` hardcodes static aria ids. |

Both fixes below are grounded in these findings. The spec explicitly corrects the
premises so we do **not** build a redundant "primitives package" that already
exists, and do **not** chase a `var()`-scoping problem that does not exist.

---

## Issue 1 — Deterministic layer order + a real override escape hatch

### 1.1 Evidence: the order is declared 5 ways and they disagree

| Location | Declared order (low → high) | `theme` vs `component` |
| --- | --- | --- |
| `docs/CSS-LAYERS-PITFALL.md:12-16` (prose) | `base < theme < component` | **component wins** |
| `packages/themes/src/all.css:11-13` (implicit, by `@import` first-appearance) | `tokens < base < theme < component` | **component wins** |
| `docs/CSS-LAYERS-PITFALL.md:40` (the "fix" snippet) | `reset, tokens, base, component, example, theme` | **theme wins** |
| `packages/cli/src/commands/create.ts:164` (scaffolded into every new app) | `reset, tokens, component, theme` | **theme wins** (and no `base`) |
| `apps/examples/*/index.html` | `reset, tokens, component, example, theme` | **theme wins** |

The library default bundle (`all.css`) and the prose docs say **component wins**;
every scaffold and example says **theme wins**. There is no `@layer a, b, c;`
_statement_ shipped by any package — `all.css` relies on `@import`
first-appearance, which is fragile: whichever CSS an unusual bundler emits first
silently re-pins the order. This is the root cause of "priority lock."

Secondary defect: blog/marketing copy references a `cascivo.override` layer
(`apps/site/src/blog/posts/modern-css-component-library.ts:28`,
`apps/site/src/marketing/sections/TechDeepDive.tsx:31`) but **nothing declares or
ships it**, so consumers have no guaranteed always-wins layer and must instead
learn the `:root:not([data-theme])` (0,2,0) specificity footgun documented in
`docs/THEMING.md:59-112`.

### 1.2 Decision: one canonical order

Ship exactly one statement, everywhere, first:

```css
@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.override;
```

Rationale for each boundary:

- **`reset < base`** — consumer reset (`box-sizing`, zeroing) is the floor; `base`
  (`@cascivo/themes/base.css` — `html` font/color) sits just above it. No shared
  properties between them; order is narrative only.
- **`base < tokens`** — no conflict (`base` reads `var()`, `tokens` defines them);
  ordered this way so the whole token/theme system sits above the resets.
- **`tokens < ... < theme`** — non-negotiable: `[data-theme]` semantic values must
  beat `:root` primitive defaults. Already true in every current order.
- **`component < theme`** — matches the **scaffold + CLI + examples** (the actual
  shipped consumer setups), so no scaffolded app changes behavior. Themes only set
  custom properties; components consume them — so for the intended model this
  boundary is a no-op, and picking "theme wins" also lets a theme retune a
  component-tier token (`--cascivo-button-*`) when needed. **This flips the
  _library-default bundle_ (`all.css`) and the prose docs, which currently imply
  component-wins** — see migration note 1.6.
- **`theme < override`** — **new.** `cascivo.override` is the top layer, the
  consumer's guaranteed escape hatch. Anything in it beats tokens, components, and
  themes, and is immune to the `:root:not([data-theme])` specificity footgun. This
  is the direct fix for the "priority lock" complaint.

`cascivo.example` / `cascivo.blocks.*` are app-local sublayers, not shipped by any
package; they stay out of the canonical statement and apps insert them relative to
it (recommended slot: between `theme` and `override`).

### 1.3 Work items

1. **New file `packages/tokens/src/layers.css`** — contains only the canonical
   statement above, plus a header comment. This is the single source of truth.
2. **Prepend it via `@import`** at the very top (before any styled `@layer` block,
   as the spec requires) of:
   - `packages/tokens/src/index.css`
   - `packages/themes/src/all.css`
   - each `packages/themes/src/*.css` (they already self-import `@cascivo/tokens`;
     add `@import '@cascivo/tokens/layers.css';` above it)
   - the `@cascivo/react` style entry that emits `styles.css`
   `@import` dedupes by URL, so the statement is emitted **once, first**, no matter
   how many entry points pull it in. Add `./layers.css` to the `exports` map and
   `files`/`sideEffects` of `packages/tokens/package.json`.
3. **CLI scaffold** — rewrite `packages/cli/src/commands/create.ts:164` to emit the
   canonical order (adds `base` and `override`, keeps theme-highest-of-the-shipped
   layers). Keep the inline `@layer cascivo.reset { ... }` reset block.
4. **Example apps** — update each `apps/examples/*/index.html` and any
   `apps/site` bootstrap to the canonical order (their app-local `cascivo.example`
   slot moves to just below `override`).
5. **Docs** — reconcile `docs/CSS-LAYERS-PITFALL.md` (§Recommended layer ordering
   and the fix snippet) and `packages/themes/src/all.css:11-13` prose to the
   canonical order; delete the now-contradictory "component wins" statements.
6. **`cascivo.override` documentation** — add a short section to `docs/THEMING.md`
   and `docs/CSS-LAYERS-PITFALL.md`: _"Put brand/one-off overrides in
   `@layer cascivo.override { … }`. It is the highest cascivo layer, so it beats
   tokens, themes, and component CSS, and — unlike a plain `:root { … }` — it does
   not lose the `:root:not([data-theme])` specificity fight."_ Keep the existing
   unlayered-CSS and brand-indirection-variable recipes as alternatives, but lead
   with the override layer as the recommended, foolproof path.

### 1.4 Durable guard (prevents re-drift)

Add `scripts/checks/layer-order.test.ts`, run in the `drift` CI job:

- Extract every `@layer <names>;` order statement from `packages/**`,
  `apps/**/index.html`, `docs/**`, and the CLI scaffold source.
- Assert each is an **ordered subsequence** of the canonical statement in
  `packages/tokens/src/layers.css` (so a file may omit layers it doesn't use, but
  may never contradict relative order).
- Fail with the offending file + the diff vs. canonical.

This is what turns the fix from "renamed some files" into "cannot regress."

### 1.5 Acceptance criteria (Issue 1)

- `pnpm exec vp run @cascivo/tokens#build @cascivo/themes#build` emit the canonical
  `@layer` statement as the first rule of the combined stylesheet (assert in a
  build-output snapshot test).
- A consumer stylesheet `@layer cascivo.override { :root { --cascivo-color-accent: red } }`
  changes accent everywhere including inside components, with **no** `data-theme`
  set and **no** specificity tricks — add a jsdom/computed-style regression test.
- `layer-order.test.ts` passes; intentionally corrupting one scaffold order makes
  it fail.
- `packages/themes/src/parity.test.ts` and `chart-palette.test.ts` still pass
  (theme token values unchanged — this change is order-only).

### 1.6 Migration / risk

The one behavior change is `all.css`'s implicit `component > theme` becoming
explicit `theme > component`. This only affects a consumer who (a) imports
`@cascivo/themes/all` **without** a scaffold-declared order, **and** (b) relies on
a component redefining a semantic token in `cascivo.component` and winning over the
active theme — an anti-pattern under cascade's "themes own the semantic tier"
model. Ship under a **minor** version for tokens/themes with a CHANGELOG note and a
one-line `docs/UPGRADING.md` entry. Verify no first-party component sets a
`--cascivo-color-*` semantic token inside its own module (grep guard); if any do,
that is a separate pre-existing bug to file, not a blocker.

---

## Issue 2 — Close the headless-primitive adoption gap (and the real gaps)

### 2.1 Evidence

`@cascivo/core` already exports the headless layer (`packages/core/src/index.ts`):
`FocusScope`, `DismissableLayer` (module-level nesting registry,
`dismissable-layer.tsx:11,45-54`), `useRovingFocus`, `useDisclosure`,
`useControllableSignal`, `useAnchorPosition`, `Portal`, `Presence`, `useId`,
`useScrollLock`, `Slot`, `VisuallyHidden`. There is no separate `behaviors`/
`primitives` package and none is needed — **core is that package.**

Adoption is the problem:

- `useRovingFocus` imported by **7** components; `DismissableLayer` by **8**;
  `FocusScope` by **3** — none of them the headline overlay/menu components.
- **13** components hand-roll their own inline `createMachine` open/close tables.
- `onKeyDown`/`KeyboardEvent` appears **109×** across **36** component files;
  the arrow/Home/End move-active logic in `roving-focus.ts:44-65` is
  reimplemented verbatim in `dropdown.tsx:129-158`, `combobox.tsx:146-170`,
  `tabs.tsx:56-72`, `menu.tsx:129-145`.
- **5** components hand-roll outside-click with raw `document.addEventListener`
  instead of `DismissableLayer`: `combobox.tsx:102`, `date-range-picker.tsx:113`,
  `date-picker.tsx:133`, `app-shell.tsx:90`, `blocks/app-shell/app-shell.tsx:49`.
- **Concrete bug:** `modal.tsx:83-84,99,116` uses static
  `aria-labelledby="cascade-modal-title"` / `aria-describedby="cascade-modal-desc"`
  → **two modals on one page emit duplicate ids** and the aria references break.
  `useId` exists and is unused here.
- **Real capability gaps:** no shared `useTypeahead`, no aria prop-getters, no
  `useMenu`/`useListbox` that _composes_ the primitives, and **no submenu / nested
  menu keyboard engine** — the exact "complex nested drop-downs" the report calls
  out. `Tooltip` even generates ids with `Math.random()` (`tooltip.tsx:35`).

### 2.2 Fixes, in priority order

**Phase A — the bug + the cheapest correctness wins (small, ship first)**

- `Modal`: replace the three static ids with `useId` from `@cascivo/core`; drop the
  redundant Escape handler (`modal.tsx:67-72`) — native `<dialog>` already closes
  on Escape. Regression test: render two `<Modal>`s, assert distinct
  `aria-labelledby` ids and that both label associations resolve.
- `Tooltip`: replace `Math.random()` id with `useId`. Test: stable id across
  re-render, unique across two tooltips.

**Phase B — new shared primitives in `@cascivo/core` (fills the real gaps)**

- `useTypeahead({ onMatch, resetMs })` — type-to-select buffer, used by menu /
  select / combobox / listbox. Signal-backed, no `useEffect`.
- Prop-getters / composed behaviors — one of:
  - low-level getters `getTriggerProps`, `getMenuProps`, `getMenuItemProps`,
    `getListboxProps`, `getOptionProps` (role + aria + id wiring, composable via
    the existing `mergeProps`), **or**
  - a composed `useMenu` / `useListbox` hook that internally wires
    `useRovingFocus` + `DismissableLayer` + `FocusScope` + `useTypeahead` + `useId`
    + aria into a single drop-in — this is the "drop-in headless runtime wrapper"
    the report asks for. **Recommended:** ship `useMenu`/`useListbox` (higher
    leverage) and expose the getters they use as the escape hatch.
- Submenu support — extend `useMenu` for nested menus: ArrowRight/ArrowLeft
  open/close, hover-intent, and `DismissableLayer`'s existing top-first nesting
  resolution for dismissal. Covers the "complex nested drop-downs" case explicitly.

Each primitive: unit tests in `packages/core`, no `useState`/`useEffect`/
`useContext` (CLAUDE.md Part 2), exported from `packages/core/src/index.ts`.

**Phase C — migrate the headline components onto the primitives (one PR each)**

Ordered by user-facing risk/reuse. Every migration keeps behavior identical and
ships a regression test proving the keyboard/dismiss/focus contract before & after:

1. `Combobox` → `DismissableLayer` (replace `mousedown` listener) + `useTypeahead`.
2. `Dropdown` → `useRovingFocus` + `DismissableLayer` (or `useMenu`).
3. `Menu` / `MenuButton` / `Menubar` → `useMenu` + submenu support (removes the
   fragile `nextElementSibling` DOM-walking in `menu.tsx:129-145`).
4. `Tabs` → `useRovingFocus`.
5. `date-picker`, `date-range-picker`, `app-shell` → `DismissableLayer`.
6. `Accordion` → add optional arrow-key header nav via `useRovingFocus` (WAI-ARIA
   accordion pattern; currently absent).

Leave `Toast` as-is (self-contained module-global queue; no primitive needed) and
keep native `<dialog>`/`popover` where a component already gets the browser focus
trap for free — the goal is to delete _duplicated_ logic, not to force a wrapper
where the platform already does the job.

**Phase D — make it durable**

- Add to `CLAUDE.md` "Component Authoring Rules": _interactive components MUST
  consume the shared `@cascivo/core` primitives (`useRovingFocus`,
  `DismissableLayer`, `FocusScope`, `useId`, `useMenu`/`useListbox`) rather than
  hand-rolling roving keyboard nav, `document.addEventListener` outside-click, or
  static/`Math.random()` aria ids._
- Add `scripts/checks/primitive-adoption.test.ts` (grep-based, runs in CI):
  flags in `packages/components/src/**` and `packages/layouts/src/**`:
  - raw `document.addEventListener('mousedown'|'click'|'keydown', …)` (→ use
    `DismissableLayer`),
  - hardcoded `aria-labelledby=`/`aria-describedby=` string literals and
    `Math.random()` in id positions (→ use `useId`),
  - inline `case 'Arrow{Up,Down}'` blocks in a file that does **not** import
    `useRovingFocus`/`useMenu`/`useListbox`.
  Seed an allowlist for the deliberate exceptions (Toast, native `<dialog>` Escape)
  so the check is green on merge and blocks _new_ hand-rolling.
- Add `docs/HEADLESS.md`: catalogue the core primitives and give a "build your own
  accessible menu/listbox from primitives" recipe. This is the standing answer to
  the report's "structural engineering overhead left to the implementation team."

### 2.3 Acceptance criteria (Issue 2)

- Phase A bug tests pass; two modals on a page have unique, resolvable aria ids.
- New core primitives have unit tests and are exported; `pnpm test` green.
- Each migrated component keeps its existing tests green and adds a
  before/after keyboard-contract regression test; a manual sweep (`/verify`) drives
  Dropdown, Combobox, Menu(+submenu), Tabs with keyboard only.
- `primitive-adoption.test.ts` passes and fails when a new raw outside-click
  listener or static aria id is introduced.
- No new `useState`/`useEffect`/`useContext` imports (existing CLAUDE.md checklist).

---

## 3. Sequencing & sizing

| Phase | Scope | Risk | Depends on |
| --- | --- | --- | --- |
| 1.3 + 1.4 (layer order + guard) | tokens, themes, cli, examples, docs, 1 check | Low (order-only; one documented bundle-default flip) | — |
| 2 Phase A (Modal/Tooltip ids) | 2 components | Very low | — |
| 2 Phase B (new primitives) | core | Low (additive) | — |
| 2 Phase C (migrations) | ~8 components, 1 PR each | Medium (behavior-preserving, test-gated) | Phase B |
| 2 Phase D (rule + checks + docs) | CLAUDE.md, 1 check, 1 doc | Low | Phase C landed enough to be green |

Issue 1 and Issue 2 Phase A/B are independent and can land in parallel. Ship each
phase behind the full `pnpm ready` gate (regen → `vp check --fix` → build → type
check → tests) plus `pnpm breakpoint:check`.

## 4. Explicitly out of scope

- No new package — `@cascivo/core` is the headless layer; do not create
  `@cascivo/primitives`.
- No token _value_ changes — Issue 1 is order + escape-hatch only.
- No rewrite of components that legitimately delegate to the platform (native
  `<dialog>`, `popover`) beyond deleting the logic the platform duplicates.
- `@container style()` palette branching and `light-dark()` remain deferred per
  `docs/THEMING.md:239-259`.
