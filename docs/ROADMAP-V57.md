# cascivo — Roadmap v57: Standalone-Install Integrity — Resolve the Package Graph, Deepen the Docs, Document the Tailwind Seam

**Last updated:** 2026-06-29
**Status:** 📋 Planned — analysis complete, tranches authored, not yet implemented.
**Plan documents:** `docs/superpowers/plans/2026-06-29-v57-master-plan.md` + tranches 1–5
**Builds on:** the registry pipeline (`packages/registry/src/` — `types.ts` schema v2 already has
`registryDependencies`, `validate.ts`, `build.ts`; `scripts/registry/generate.ts` — the manifest→`registry.json`
generator), the CLI (`packages/cli/src/commands/add.ts` — bare-name vs multi-registry resolution),
`ComponentMeta`/`PropMeta` (`packages/core/src/types.ts`), the docs site (`apps/site/` — `ComponentPage.tsx`,
`PropsTable.tsx`, the Cmd+K search in `src/marketing/search/`), the themes/tokens layers
(`packages/themes/src/*.css` in `@layer cascivo.theme`, `packages/tokens/src/index.css` in `@layer cascivo.tokens`),
and `@cascivo/layouts` (`Stack`/`Grid`/`AutoGrid`/`Columns`/`Spacer`/`Center`/`Section`/… already CLI-installable as
`layout/*`).

> **Source of this roadmap.** A user-supplied integration report —
> `docs/feedback/feedback-from-tailwind-dashboard.md` — from a team that built a dark dashboard on cascivo's
> `cascivo add` copy-paste model on top of an existing Tailwind v4 project. The report names one **hard blocker**
> (an internal `use-popover` hook that `shell-header`/`side-nav` import but that `cascivo add` never installs), and
> three friction points (thin/​unsearchable API docs; "no layout primitives / no spacing utilities" → inline-style
> drift; a Tailwind-v4 token/​dark-mode collision with no guidance). The job — per CLAUDE.md "Think Before Coding" —
> was to **study it, verify each claim against `main`, separate the real gaps from what already ships or is
> mis-stated, and design the smallest correct fix.** Conclusion below: the blocker is **real and systemic** (it is
> the headline); the docs claim is **half-true** (prop tables and Cmd+K search *do* exist; the gaps are *prop-level*
> search and *description coverage*); the "no layout primitives / spacing scale" claim is **inaccurate** (both ship —
> the gap is discoverability and a naming/namespace mismatch) and its suggested fix (utility classes) **violates the
> no-utility-CSS principle**; the Tailwind collision is a **real documentation/​bridge gap**.

---

## The questions this roadmap had to answer first

### Q1 — Is the `use-popover` blocker a one-off, or systemic?

**Systemic.** The report hit it on two components; a read of `main` at 2026-06-29 shows **five** registry components
import the shared hook `packages/components/src/popover/use-popover.ts` via a relative path
(`import { usePopover } from '../popover/use-popover'`): `shell-header` (`shell-header.tsx:5`),
`side-nav` (`side-nav.tsx:14`), `multi-select`, `menu`, and `hover-card`. **None** declare that dependency, and
`cascivo add <name>` installs only the component's own `.tsx` + `.module.css`. The build then fails on the unresolved
`../popover/use-popover` import. There are **two** root causes, both real:

1. **The generator drops `.ts` source files.** `scripts/registry/generate.ts:96–98` — `isSourceFile()` returns true
   only for `.tsx` and `.module.css`. So `use-popover.ts` is excluded from **every** registry entry's `files[]` —
   even the `popover` entry's own. A shared hook can therefore never reach a consumer through the registry.
2. **The dependency edge is never declared or resolved.** The v2 schema already defines
   `registryDependencies?: string[]` (`packages/registry/src/types.ts:85`, validated in `validate.ts`), and the CLI's
   **multi-registry** path already walks it (`add.ts:69`, `resolve.ts` queue). But (a) `ComponentMeta`
   (`packages/core/src/types.ts:99`) has **no** `registryDependencies` field, so manifests cannot declare the edge;
   (b) the generator never emits it; and (c) the CLI's **legacy bare-name** path (`add.ts:102–127`, the path
   `cascivo add shell-header` takes) iterates only `entry.dependencies` (npm packages) and **never** follows
   `registryDependencies`. Every link in the chain — declare → generate → resolve — is broken.

So the blocker is not "popover was forgotten"; it is "the registry has no mechanism to ship or resolve a shared
hook/util." That is the headline of v57.

### Q2 — Is the documentation as sparse as the report says?

**Half-true — and the true half is precise.** Prop tables **do** render per component on the public site
(`apps/site/src/pages/ComponentPage.tsx` → `PropsTable.tsx`, columns: name/type/default/required/description), and a
Cmd+K search **does** exist (`apps/site/src/marketing/search/`). So "no prop table, no search" is **inaccurate**. But
two real gaps explain why the team still read source:

- **Description coverage is thin.** `PropMeta.description` is optional (`packages/core/src/types.ts:15`). Across the
  registry, **~34% of components have zero prop descriptions** (e.g. `button`, `badge`, `input`, `accordion`) and
  **~43% are partial**; only ~23% document every prop. A prop table that shows `variant: string` with no description
  still forces a source read to learn what `variant` *does*.
- **Search is component-level only.** `buildIndex.ts` indexes component *name + description*, not props/variants/
  sizes. You cannot ask "which components take a `loading` prop?" There is no central API reference page.

So the fix is not "build prop tables" (they exist); it is **backfill descriptions to 100% with a coverage guard**,
**index props/variants/sizes in search**, and **add a central API reference**.

### Q3 — Are layout primitives and a spacing scale really missing?

**No — both ship; the gap is discoverability, and the suggested fix is wrong for this system.** `@cascivo/layouts`
ships `Stack` (gap/direction/align/justify/wrap), `Grid`/`GridItem`, `AutoGrid`, `Columns`, `Spacer`, `Center`,
`Section`, `SplitView`, `Masonry` — all **CLI-installable** as `cascivo add layout/stack`, `layout/grid`, … (14
registry entries under the `layout/` namespace). A full spacing scale exists (`--cascivo-space-0..24`,
`packages/tokens`) and is documented (`docs/TOKENS.md`, the site's `TokensPage.tsx`); `gap` props consume it
(`<Stack gap={4}>` → `var(--cascivo-space-4)`). So "no Stack/Flex/Grid, no documented spacing scale" is **inaccurate**.

Why the team missed it — and the *real* residual gap:

- **A namespace/​naming mismatch.** The primitives install as `layout/stack`, not bare `stack`; and they are named
  `Stack`/`Columns`/`AutoGrid`, not the `Flex`/`Box`/`HStack`/`VStack` the team searched for. `cascivo add stack`
  (bare) does not resolve to `layout/stack`; Cmd+K search over names/descriptions does not surface "Flex"→`Stack`. So
  the primitives are present but **undiscoverable from the obvious queries**.
- **"Utility classes" is the wrong fix here.** The report asks for "spacing scale utility classes." cascivo is
  deliberately **modern-CSS-only, no utility CSS, no Tailwind** (CLAUDE.md, Core Principle 3). Shipping `gap-4`-style
  utilities would contradict the system's thesis. The sanctioned answer to inline-style drift is **layout primitives
  + `var(--cascivo-space-N)`**, which already exist and just need to be *found*. → a discoverability fix (bare-name
  resolution + a "Layout & spacing" guide that names the `Flex/Box`→`Stack` mapping), **not** a utilities build.

### Q4 — Is the Tailwind collision real, and what is the right fix?

**Real — a documentation + thin-bridge gap, not a re-architecture.** cascivo themes live in `@layer cascivo.theme`
and key on `[data-theme='dark']`; Tailwind v4 keys dark mode on a `.dark` class and emits its own `:root`/`.dark`
token block (often unlayered, so it can out-cascade cascivo's layered tokens). The two systems therefore (a) use
**different dark-mode selectors** (`[data-theme]` vs `.dark`) and (b) expose **two unmapped token namespaces**
(`--cascivo-*` vs Tailwind's `--color-*`). There is **zero** interop guidance today: `COMPATIBILITY.md` mentions only
the Tailwind/lightningcss *minifier* caveat; `MIGRATING-FROM-SHADCN.md` assumes you are leaving Tailwind, not
coexisting. The fix is small and doc-shaped: a `docs/USING-WITH-TAILWIND.md` (mirroring `USING-WITH-PREACT.md`) with
(1) the canonical `@layer` order for both systems, (2) a one-line `.dark` ↔ `[data-theme='dark']` bridge, and (3) an
optional `@theme inline` snippet (and a shippable `@cascivo/themes/tailwind.css`) mapping `--cascivo-*` semantics into
Tailwind's `--color-*` so utilities read cascivo tokens. No engine change, no fork of either token system.

---

## Why this roadmap exists

The report's verdict — *"feels more like a styled component kit than a fully integrated design system"* — traces to
one structural defect and three information gaps. The structural defect is the **broken registry dependency graph**:
a copy-paste design system whose components silently import files the installer never ships is, by definition, not
"fully integrated." Fix that and the single hard blocker disappears *and* a whole class of latent blockers (every
shared hook/util) is closed by a guard that fails CI before it can ship again. The three information gaps —
description coverage + prop search, layout/spacing discoverability, the Tailwind seam — are what made an
already-capable library *feel* thin. v57 closes the structural defect and the information gaps **without building any
new component, utility-CSS layer, or token system**, and corrects the record where the feedback mis-stated what
already ships.

---

## The findings, verified against today's code

Legend: ✅ already present (reuse) · ⚠️ partial / adjacent · ❌ genuine gap. "Verified state" reflects a read of
`main` at 2026-06-29.

| #   | Finding (severity)                                                                  | Verified state today                                                                                                                                                                                                                                            | Tranche |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| M-1 | `cascivo add` does not resolve internal (registry) dependencies (🔴 **blocker**)    | ❌ five components import `../popover/use-popover`; **none** declare it. Generator drops `.ts` files (`generate.ts:96–98`), `ComponentMeta` lacks `registryDependencies` (`types.ts:99`), CLI bare-name path ignores it (`add.ts:102–127`). The whole declare→generate→resolve chain is broken. | T1      |
| M-2 | No repo-wide guarantee that every component installs standalone (🔴)                | ❌ nothing parses component imports to assert each internal import is covered by `files[]` or `registryDependencies`. The popover case is one of an unknown set; no CI guard, no clean-room install smoke test.                                                  | T2      |
| M-3 | Thin prop-description coverage + no prop-level/central API search (🟠)              | ⚠️ prop tables render (`PropsTable.tsx`) and Cmd+K search exists, **but** ~34% of components have **zero** prop descriptions / ~43% partial (`PropMeta.description` optional), and search indexes only name+description, not props/variants/sizes. No `/docs/api`. | T3      |
| M-4 | No Tailwind-v4 interop guidance or token/dark-mode bridge (🟠)                       | ❌ themes key on `[data-theme]` in `@layer cascivo.theme`; Tailwind keys on `.dark` with unlayered `--color-*`. No `@layer`-order doc, no `.dark`↔`[data-theme]` bridge, no `--cascivo-*`→Tailwind `@theme` mapping. `COMPATIBILITY.md` covers only the minifier. | T4      |
| M-5 | Layout primitives + spacing scale present but undiscoverable (🟡 correction)         | ⚠️ `Stack/Grid/AutoGrid/Columns/Spacer/Center/Section/…` ship as `layout/*` and `--cascivo-space-*` is documented, but `cascivo add stack` (bare) doesn't resolve, and `Flex`/`Box`/`HStack` searches miss. No "Layout & spacing" guide naming the mapping.       | T5      |
| C-1 | Report: "no layout primitive (Stack/Flex/Grid)" (correction)                        | ❌ **inaccurate** — nine layout primitives ship, CLI-installable as `layout/*`. The gap is discoverability/naming, not existence (M-5).                                                                                                                          | T5      |
| C-2 | Report: "no documented spacing scale utility classes" (correction)                  | ❌ **inaccurate + philosophy mismatch** — `--cascivo-space-0..24` is documented and consumed by `gap` props; utility classes are intentionally absent (no-utility-CSS, CLAUDE.md). The fix is docs, **not** utilities (M-5).                                     | T5      |
| C-3 | Report: "no prop table on the website" (correction)                                 | ❌ **inaccurate** — per-component prop tables render today; the true gap is *coverage + prop-level search* (folded into M-3).                                                                                                                                    | T3      |
| R-1 | The registry pipeline, `registryDependencies` schema, the docs site, themes/layers (✅ reuse) | ✅ schema v2 already has `registryDependencies`; the multi-registry CLI path already resolves it; `PropsTable`/search/`ComponentPage` exist; `@layer` ordering is sound. **Extend the pipeline; do not rebuild it.**                                       | all     |

**Net:** the headline is **M-1/M-2** — make the package graph actually resolvable *and* guard it so no component ever
again ships an unresolved internal import. **M-3** is description backfill + a search/index extension over machinery
that already renders tables. **M-4** is one interop doc + a thin optional CSS bridge. **M-5/C-1/C-2/C-3 are
corrections** that keep the plan from building layout primitives, utility classes, or prop tables that already exist.

---

## Tranche map

| Tranche | Theme                                                                                                                                                                                                                                                                                                  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | **Registry dependency-graph resolution (blocker)** — add `registryDependencies` to `ComponentMeta`; make `scripts/registry/generate.ts` include shared `.ts` source files **and** emit `registryDependencies`; declare the popover-hook edge on the five affected manifests; fix the CLI bare-name path (`add.ts`) to walk `registryDependencies` transitively (de-duped) like the multi-registry path already does. After T1, `cascivo add shell-header` installs the hook. (M-1) |
| T2      | **Standalone-install guard (regression)** — a `deps:check` script that parses every registry component's imports and **fails** if any internal (relative `../`) import is not satisfied by the component's own `files[]` or its transitive `registryDependencies`; a clean-room "install + tsc" smoke test for a representative set (`shell-header`, `side-nav`, `menu`). Wire both into `pnpm regen`/CI so the blocker can never reship. Fix any stragglers the audit surfaces beyond the known five. (M-2) |
| T3      | **Documentation depth — descriptions, prop search, API reference** — backfill `PropMeta.description` to **100% coverage** across the registry; add a `docs:coverage` guard that fails on any undescribed prop; extend `buildIndex.ts` so Cmd+K indexes props/variants/sizes (and `Flex/Box/HStack` aliases → primitives); add a central `/docs/api` reference page generated from manifests. (M-3/C-3) |
| T4      | **Tailwind v4 interop** — `docs/USING-WITH-TAILWIND.md`: the canonical cross-system `@layer` order, a one-line `.dark` ↔ `[data-theme='dark']` bridge, and a `@theme inline` mapping of `--cascivo-*` semantics → Tailwind `--color-*`; ship an optional `@cascivo/themes/tailwind.css` bridge file; cross-link from `COMPATIBILITY.md`/`THEMING.md`. No change to either token system. (M-4) |
| T5      | **Correct the record & close the loop** — layout/spacing discoverability: resolve bare `cascivo add stack` → `layout/stack` (and `flex/box/hstack/vstack` aliases) in the CLI + `cascivo list`; a `docs/cookbooks/layout-and-spacing.md` guide that replaces inline-style drift with `Stack`/`Grid`/`AutoGrid` + `var(--cascivo-space-N)` and names the `Flex/Box`→`Stack` mapping. Append a maintainer **resolution log** to the feedback file; flip this roadmap → Shipped. (M-5/C-1/C-2) |

Ordering rationale: **T1 first** — it removes the hard blocker and is the foundation the T2 guard verifies. **T2**
makes the fix permanent (and finds the unknowns). **T3/T4/T5 are independent** doc/ergonomics tranches that can land
in any order after T1; T5 carries the wrap-up (resolution log + roadmap flip) and so lands last. Critical path:
T1→T2; T3, T4, T5 parallelize.

---

## Out of scope

- **A new component, hook, or layout primitive.** v57 ships *no* new UI. `Stack`/`Grid`/etc. already exist (C-1);
  `use-popover` already exists — it just needs to *ship*.
- **Utility CSS / a spacing-utility layer / a Tailwind-style class API.** Contradicts the no-utility-CSS principle
  (C-2). The answer to inline-style drift is the existing primitives + tokens, documented (M-5).
- **Re-architecting the theme/token layers or Tailwind's.** T4 documents coexistence and ships a *thin optional*
  bridge; it does not move cascivo off `[data-theme]` or rewrite `@layer cascivo.theme`.
- **Auto-deriving prop *types* from TypeScript.** T3 backfills `description` text into existing manifests; it does not
  build a TS-AST prop extractor (manifests stay hand-authored, as today).
- **Publishing `@cascivo/layouts` to npm.** It is intentionally `private` copy-paste source (per the pagome
  resolution log); v57 keeps that and only improves discovery.
- **A full-text docs search engine / external index.** T3 extends the existing in-app Cmd+K index; it does not adopt
  Algolia or a server.
- **Changing the multi-registry CLI path.** It already resolves `registryDependencies` correctly; T1 only brings the
  legacy bare-name path up to parity.

---

## Definition of done (verified after T5)

- `ComponentMeta` has `registryDependencies?: string[]`; `scripts/registry/generate.ts` includes non-test/non-meta
  `.ts` source files in `files[]` and emits `registryDependencies`; the five affected manifests declare the
  popover-hook edge; `cascivo add shell-header` (and `side-nav`/`menu`/`multi-select`/`hover-card`) installs the hook
  and **builds standalone** — proven by the T2 smoke test.
- A `deps:check` script parses every registry component's imports and fails on any internal import not covered by
  `files[]` or `registryDependencies`; it runs in `pnpm regen`/CI; the audit surfaced and fixed every straggler, not
  just the known five.
- Every component prop has a `description`; a `docs:coverage` guard fails on any gap; Cmd+K search indexes
  props/variants/sizes and resolves `Flex`/`Box`/`HStack`→`Stack`; a `/docs/api` reference renders from manifests.
- `docs/USING-WITH-TAILWIND.md` documents the `@layer` order, the `.dark`↔`[data-theme]` bridge, and the
  `--cascivo-*`→`--color-*` `@theme` mapping; `@cascivo/themes/tailwind.css` ships as an opt-in bridge;
  `COMPATIBILITY.md`/`THEMING.md` link it.
- `cascivo add stack` resolves to `layout/stack` (and `flex/box/hstack/vstack` aliases); `docs/cookbooks/layout-and-
  spacing.md` shows primitives + `var(--cascivo-space-N)` replacing inline styles.
- The feedback file carries a maintainer resolution log; this roadmap is **✅ Shipped**.
- `pnpm ready` green; `pnpm ready:ci` if the registry/build pipeline changed; `pnpm breakpoint:check` + the drift
  check clean; **no new runtime dependency**, **no new component**, **no utility-CSS layer**.

---

## Notes

- This roadmap was **planned from external feedback** and deliberately *corrects* it where the code disagrees: layout
  primitives and a documented spacing scale already ship (C-1/C-2); prop tables + search already exist (C-3); the
  requested utility classes are an anti-goal for a no-utility-CSS system. Surfacing the disagreement is the point —
  per CLAUDE.md "Think Before Coding".
- The verification figures (the five `use-popover` importers; `isSourceFile` at `generate.ts:96–98`; the missing
  `registryDependencies` on `ComponentMeta` at `types.ts:99`; the bare-name path at `add.ts:102–127`; ~34%/43% prop-
  description coverage; the `[data-theme]` vs `.dark` mismatch) are point-in-time reads of `main` at 2026-06-29 and
  should be re-confirmed at implementation start.
- Nearest prior art in-repo: **the pagome feedback** (`docs/feedback/feedback-from-pagome.md`) already fixed a sibling
  packaging bug (`@cascivo/themes`→`@cascivo/tokens`) and documented the canonical import order — v57 generalizes that
  "every package/component installs standalone" hygiene to the *registry* graph. **v55** built the templates pipeline
  and **v53** the charts package referenced by the docs site this plan deepens.
</content>
