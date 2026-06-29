# v57 — Standalone-Install Integrity: Resolve the Package Graph, Deepen the Docs, Document the Tailwind Seam — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gaps an external integration report surfaced while building a Tailwind-v4 dark dashboard on
cascivo's `cascivo add` copy-paste model (`docs/feedback/feedback-from-tailwind-dashboard.md`), per the analysis in
`docs/ROADMAP-V57.md`. The study confirmed: the report's **one hard blocker is real and systemic** — `cascivo add`
never resolves internal registry dependencies, so the shared `use-popover` hook that **five** components import is
never installed; that the docs claim is **half-true** — prop tables and Cmd+K search exist, but description coverage
is ~34%/43% thin and search is component-level only; that "no layout primitives / no spacing scale" is **inaccurate**
— nine primitives and a documented `--cascivo-space-*` scale ship (the gap is discoverability, and the requested
utility classes are an anti-goal); and that the **Tailwind collision is a real doc/bridge gap** (`[data-theme]` vs
`.dark`, two unmapped token namespaces, zero guidance).

Governing thesis: **make the package graph resolvable and guard it; deepen what already renders; document the seams;
build nothing that already exists.** No new component, no new layout primitive, no utility-CSS layer, no new token
system, no theme re-architecture, no npm publish of `@cascivo/layouts`. Reuse the v2 registry schema (which already
has `registryDependencies`), the multi-registry CLI resolver (which already walks it), the prop-table + search
machinery, and the `@layer` ordering — extend each at its seam.

Deliver: **(T1)** `registryDependencies` on `ComponentMeta` + a generator that ships shared `.ts` files and emits the
edge + the CLI bare-name path resolving it transitively, so `cascivo add shell-header` installs `use-popover`;
**(T2)** a `deps:check` import-graph guard + a clean-room install/tsc smoke test wired into regen/CI, plus fixes for
every straggler the audit finds; **(T3)** 100% prop-description coverage with a guard, props/variants/sizes in Cmd+K
search, and a `/docs/api` reference; **(T4)** `docs/USING-WITH-TAILWIND.md` + an optional `@cascivo/themes/tailwind.css`
bridge (`.dark`↔`[data-theme]`, `--cascivo-*`→`--color-*`); **(T5)** CLI bare-name→`layout/*` resolution + a
`layout-and-spacing.md` cookbook, the maintainer resolution log, and the roadmap flip. **Do not** ship utilities, a
new component, or a new token namespace.

Target state (verified after T5):

| Finding (severity)                                                  | Today                                                                                  | Target                                                                                                            |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| M-1 `cascivo add` ignores internal deps (🔴 blocker)                | generator drops `.ts`; `ComponentMeta` has no `registryDependencies`; bare-name path skips it | shared `.ts` shipped + edge declared + emitted + resolved; `cascivo add shell-header` installs `use-popover`        |
| M-2 No standalone-install guarantee (🔴)                            | nothing parses imports; no CI guard; no smoke test                                     | `deps:check` fails on any unresolved internal import; clean-room install/tsc smoke test; all stragglers fixed       |
| M-3 Thin prop docs + no prop search (🟠)                            | prop tables render; ~34% undocumented; search = name+desc only                         | 100% `description` coverage + guard; Cmd+K indexes props/variants/sizes; `/docs/api` reference                      |
| M-4 No Tailwind-v4 interop (🟠)                                     | `[data-theme]` vs `.dark`; two unmapped token namespaces; no doc                       | `USING-WITH-TAILWIND.md` + `@cascivo/themes/tailwind.css` bridge; `@layer` order + `.dark`↔`[data-theme]` + `@theme` |
| M-5 Layout/spacing undiscoverable (🟡 correction)                   | primitives ship as `layout/*`; bare `stack`/`Flex` queries miss                        | bare-name + `flex/box/hstack/vstack` aliases resolve; `layout-and-spacing.md` cookbook                              |
| C-1/C-2/C-3 feedback mis-statements (corrections)                   | primitives, spacing scale, prop tables, search all exist                               | unchanged — recorded as corrections; nothing rebuilt                                                               |
| Full gate (`pnpm ready`)                                            | green                                                                                  | green                                                                                                              |

**Architecture & evidence (reproduced in-repo before planning):**

- **Registry schema** (`packages/registry/src/types.ts`): `RegistryItem.registryDependencies?: string[]` (line 85) —
  **already defined**, validated in `validate.ts`. The data model is ready; the producers/consumers are not.
- **Generator** (`scripts/registry/generate.ts`): `isSourceFile()` (lines 96–98) allows only `.tsx`/`.module.css` —
  drops `use-popover.ts`; `buildEntry()` maps `dependencies: meta.dependencies` but never `registryDependencies`.
- **Component meta type** (`packages/core/src/types.ts`): `ComponentMeta.dependencies: string[]` (line 99); **no**
  `registryDependencies`. `PropMeta.description?` (line 15) is optional — the coverage hole.
- **CLI** (`packages/cli/src/commands/add.ts`): bare-name path (lines 102–127) iterates only `entry.dependencies`;
  multi-registry path (line 69 + `resolve.ts` queue) **already** walks `registryDependencies`. T1 brings the legacy
  path to parity; the comment at `add.ts:154` already anticipates "via `registryDependencies`".
- **Affected components**: `shell-header.tsx:5`, `side-nav.tsx:14`, `multi-select`, `menu`, `hover-card` all
  `import { usePopover } from '../popover/use-popover'`; `packages/components/src/popover/use-popover.ts` is the
  shared source.
- **Docs site** (`apps/site/src/`): `pages/ComponentPage.tsx` → `pages/components/PropsTable.tsx` (renders
  name/type/default/required/description); `marketing/search/buildIndex.ts` (indexes name+description only),
  `SearchButton.tsx` (⌘K). Per-component pages at `/docs/components/{name}`.
- **Themes/tokens** (`packages/themes/src/{light,dark,…}.css` in `@layer cascivo.theme`, keyed `[data-theme]`;
  `packages/tokens/src/index.css` in `@layer cascivo.tokens`; `all.css` bundle). `docs/CSS-LAYERS-PITFALL.md`,
  `COMPATIBILITY.md`, `THEMING.md`, `TOKENS.md` exist; none cover Tailwind coexistence.
- **Layouts** (`packages/layouts/src/`): `stack`, `grid`, `auto-grid`, `columns`, `spacer`, `center`, `section`,
  `split-view`, `masonry` (+ shells); registry entries `layout/*`; `gap` props read `--cascivo-space-*`.
- **CLAUDE.md constraints (binding on every tranche):** signals only (no `useState`/`useEffect`/`useContext`); no
  utility CSS; modern CSS + `@layer`; user-visible strings from `@cascivo/i18n`; WCAG 2.2 AA + ≥44px coarse targets;
  no off-scale `@media`/`@container` literals (`pnpm breakpoint:check`); manifest-derived docs survive `pnpm regen` +
  the drift check; `@function`/`if()` only as progressive enhancement with a static fallback.

**Tech Stack:** the registry pipeline (`packages/registry` + `scripts/registry`), the `cascivo` CLI
(`packages/cli`), `@cascivo/core` types, the `apps/site` docs app (Preact), `@cascivo/themes`/`@cascivo/tokens` CSS,
`@cascivo/layouts`. Pure TypeScript + modern CSS. **No backend, no new runtime dependency, no new component.**

---

## Tranche Overview

| Tranche | Title                                  | Goal                                                                                                                                                                                                                                                                                              |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Registry dependency-graph resolution   | Add `registryDependencies?: string[]` to `ComponentMeta`; make `generate.ts` include non-test/non-meta `.ts` source files **and** emit `registryDependencies`; declare the `popover`-hook edge on the five affected manifests; bring the CLI bare-name path (`add.ts`) to parity with the multi-registry resolver (transitive, de-duped walk). Result: `cascivo add shell-header` installs `use-popover` and builds. (M-1) |
| T2      | Standalone-install guard               | A `deps:check` script parsing every registry component's relative (`../`) imports and **failing** if any is not covered by the component's `files[]` or transitive `registryDependencies`; a clean-room "copy files → tsc" smoke test for `shell-header`/`side-nav`/`menu`. Wire into `pnpm regen`/CI. Fix every straggler the audit finds beyond the known five. (M-2) |
| T3      | Documentation depth                    | Backfill `PropMeta.description` to 100% across the registry; a `docs:coverage` guard that fails on any undescribed prop; extend `buildIndex.ts` to index props/variants/sizes (+ `Flex/Box/HStack/VStack`→primitive aliases); a manifest-generated central `/docs/api` reference page. (M-3/C-3) |
| T4      | Tailwind v4 interop                    | `docs/USING-WITH-TAILWIND.md`: cross-system `@layer` order, a `.dark`↔`[data-theme='dark']` bridge rule, and a `@theme inline` mapping `--cascivo-*`→Tailwind `--color-*`; ship `@cascivo/themes/tailwind.css` (opt-in) carrying the bridge; cross-link `COMPATIBILITY.md`/`THEMING.md`. No token-system change. (M-4) |
| T5      | Correct the record & close the loop    | CLI: resolve bare `cascivo add stack`→`layout/stack` and `flex/box/hstack/vstack` aliases; surface layout primitives in `cascivo list`. `docs/cookbooks/layout-and-spacing.md` replacing inline-style drift with primitives + `var(--cascivo-space-N)` and naming the `Flex/Box`→`Stack` map. Append the maintainer resolution log to the feedback file; flip `docs/ROADMAP-V57.md`→Shipped. (M-5/C-1/C-2) |

Ordering rationale: **T1 first** (removes the blocker; the foundation T2 verifies). **T2** makes it permanent and
finds the unknowns. **T3/T4/T5** are independent doc/ergonomics tranches; **T5** carries the wrap-up and lands last.
Critical path T1→T2; T3, T4, T5 parallelize.

---

## Files Created / Modified per Tranche

### T1 — Registry dependency-graph resolution

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/core/src/types.ts` (add `registryDependencies?: string[]` to `ComponentMeta`) |
| Modify | `scripts/registry/generate.ts` (`isSourceFile` includes non-test/non-meta `.ts`; `buildEntry` emits `registryDependencies`) |
| Modify | `packages/components/src/{shell-header,side-nav,multi-select,menu,hover-card}/*.meta.ts` (declare `registryDependencies: ['popover']`) |
| Modify | `packages/cli/src/commands/add.ts` (bare-name path: transitive, de-duped `registryDependencies` walk) + `resolve.ts` if shared |
| Modify | `registry.json` + `apps/site/public/r/*` (regenerated) |
| Modify | `packages/cli/src/commands/add.test.ts` (bare-name install pulls the hook) |

### T2 — Standalone-install guard

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `scripts/registry/deps-check.ts` (parse imports; assert internal imports covered by `files[]`/`registryDependencies`) + test |
| Create | `scripts/registry/standalone-smoke.ts` (copy a component's resolved files to a temp tree, run `tsc --noEmit`) |
| Modify | `package.json` (add `deps:check` + a `regen`/CI hook), CI workflow under `.github/workflows/*` |
| Modify | any straggler `*.meta.ts` the audit surfaces (declare their internal deps) |

### T3 — Documentation depth

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | all `packages/**/src/**/*.meta.ts` lacking prop `description`s (backfill to 100%) |
| Create | `scripts/registry/docs-coverage.ts` (fail on any prop without `description`) + `package.json` `docs:coverage` |
| Modify | `apps/site/src/marketing/search/buildIndex.ts` (index props/variants/sizes + `Flex/Box/HStack`→primitive aliases) + test |
| Create | `apps/site/src/pages/ApiReferencePage.tsx` (+ route in `DocsApp.tsx`) — central manifest-generated API reference |

### T4 — Tailwind v4 interop

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `docs/USING-WITH-TAILWIND.md` (layer order, `.dark`↔`[data-theme]` bridge, `@theme inline` token map) |
| Create | `packages/themes/src/tailwind.css` (opt-in bridge) + `package.json` `exports["./tailwind.css"]` |
| Modify | `docs/COMPATIBILITY.md` + `docs/THEMING.md` (cross-link the new page) |

### T5 — Correct the record & close the loop

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/cli/src/commands/add.ts` + `list.ts` (bare→`layout/*` resolution; `flex/box/hstack/vstack` aliases; surface layout group) + tests |
| Create | `docs/cookbooks/layout-and-spacing.md` |
| Modify | `docs/feedback/feedback-from-tailwind-dashboard.md` (append maintainer resolution log) |
| Modify | `docs/ROADMAP-V57.md` → Status: ✅ Shipped + implementation log |

---

## Key Decisions

### Decision 1 — Fix the registry dependency graph at all three broken links, not just declare the edge (firm)

The blocker has three causes: the generator drops `.ts` files, `ComponentMeta` cannot declare an internal edge, and
the CLI bare-name path ignores it. **Decision: fix all three** — ship shared `.ts` source in `files[]`, add
`registryDependencies` to the meta type + emit it, and walk it transitively in the bare-name path. **Rejected:** only
adding `registryDependencies` (the hook still never ships, because `.ts` is filtered out) or only including `.ts`
files (the relative `../popover/use-popover` import still needs the popover dir installed, which the edge guarantees).

### Decision 2 — Reuse the existing v2 schema + multi-registry resolver; bring the legacy path to parity (firm)

`registryDependencies` already exists in the schema and the multi-registry CLI path already resolves it. **Decision:
extend the *bare-name* path to match, sharing the resolve/queue logic.** **Rejected:** a new dependency-resolution
subsystem, or deprecating the bare-name path (breaks `cascivo add button`, the documented happy path).

### Decision 3 — Make standalone-install a guarded invariant, not a one-time fix (firm)

The five known importers are a sample of an unknown set. **Decision: a `deps:check` that statically asserts every
component's internal imports are resolvable, plus a clean-room install/tsc smoke test, both in regen/CI.** A primitive
nobody guards regresses. **Rejected:** manually patching the five and moving on (the next shared hook reships the
blocker).

### Decision 4 — Backfill prop *descriptions*; keep manifests hand-authored (firm)

Prop tables render today; the hole is empty `description` fields (~34% of components). **Decision: backfill to 100%
with a coverage guard.** **Rejected:** building a TypeScript-AST extractor to auto-derive props (large, out of scope —
manifests are hand-authored by design) and "the tables exist, ship nothing" (the team read source precisely because
the tables were bare).

### Decision 5 — Document Tailwind coexistence + a thin opt-in bridge; do not move off `[data-theme]` (firm)

The collision is `[data-theme]` vs `.dark` and two unmapped token namespaces. **Decision: a doc + an opt-in
`@cascivo/themes/tailwind.css` that (a) bridges `.dark`→`[data-theme='dark']` and (b) maps `--cascivo-*`→`--color-*`
via `@theme inline`, so a Tailwind project keeps its `.dark` toggle and reads cascivo tokens.** **Rejected:** switching
cascivo to a `.dark` class (breaks scoped theming + every existing consumer) and shipping a hard Tailwind dependency
(cascivo must work with zero Tailwind).

### Decision 6 — Correct the layout/spacing claim with discovery, not utilities (firm)

Layout primitives and the spacing scale ship; utility classes violate the no-utility-CSS principle. **Decision: make
the existing primitives discoverable (bare-name + `Flex/Box/HStack`→`Stack` aliases in CLI + search) and write the
guide; ship no utilities.** **Rejected:** a `gap-4`/`p-2` utility layer (contradicts CLAUDE.md Core Principle 3) and
publishing `@cascivo/layouts` to npm (intentionally private copy-paste source).

### Decision 7 — Correct the feedback in the docs; build only what's real (firm)

**Decision: the roadmap records C-1 (primitives exist), C-2 (spacing scale exists; utilities are an anti-goal), and
C-3 (prop tables + search exist), and the plan builds none of those.** **Rejected:** taking the report at face value
and re-implementing `Stack`/prop tables / a utilities layer — wasted work that violates "Simplicity First" and
"Surgical Changes".

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if the registry/build pipeline or workspace deps changed; `pnpm breakpoint:check` clean for any new UI (the
   `/docs/api` page).
2. **Extend the pipeline, never rebuild it.** Every tranche is checked against "did we just re-implement an existing
   schema field / resolver / prop table / search / layout primitive / token system?" The answer must stay **no**
   (Decisions 2/4/6/7).
3. **No new component, no utility CSS, no new token namespace, no npm publish.** v57 ships docs, a guard, metadata,
   one opt-in bridge CSS file, and CLI ergonomics — nothing else (Out of scope; Decisions 5/6).
4. **The blocker fix is proven, not asserted.** T1 is not done until `cascivo add shell-header` installs the hook;
   T2's clean-room install/tsc smoke test is the acceptance gate; the `deps:check` guard runs in CI (Decisions 1/3).
5. **Manifest is the source of truth.** New `registryDependencies` and backfilled `description`s live in `*.meta.ts`;
   `registry.json` + `apps/site/public/r/*` regenerate from them; after `pnpm regen` the drift check
   (`git diff --exit-code`) is clean (Rules from CLAUDE.md).
6. **i18n + a11y + responsive** on the one new UI surface (`/docs/api`): strings from `@cascivo/i18n`; WCAG 2.2 AA;
   ≥44px coarse targets; no off-scale `@media`/`@container` literals.
7. **Signals, not hooks** (CLAUDE.md) anywhere the docs app gains interactivity: `useSignal`/`useComputed`/
   `useSignalEffect`/`useRef`-for-DOM only.
8. **Out-of-scope stays out.** No TS-AST prop extractor; no theme re-architecture; no external search engine; no
   change to the working multi-registry resolver; no utilities; no new components.
</content>
