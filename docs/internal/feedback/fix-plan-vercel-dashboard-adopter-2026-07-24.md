# Fix plan — Vercel-style TanStack dashboard adopter report (2026-07-24, tested 0.11.0 packages)

**Status: SPEC ONLY — not implemented.** Written to be handed to an implementing agent (Opus)
as-is. The source report is the 2026-07-24 "Vercel-style dashboard with TanStack + cascivo"
experience report (a Vercel-style dashboard on TanStack Router + TanStack Query / React 19 /
Vite 6, tested against published `@cascivo/react@0.11.0`, `@cascivo/charts@0.5.0`,
`@cascivo/icons@0.3.3`, `@cascivo/themes@0.4.5`). Every claim in it is triaged against current
`main` with file:line evidence, and every workstream carries a spec, the tests that lock it,
and acceptance criteria.

Per-workstream status (all **planned — not implemented**):
**WS-1** useTheme docs drift (P0) · **WS-2** nested-object-field docs + guard (P0) ·
**WS-3** chart x-type asymmetry docs (P1) · **WS-4** router/nav docs + phantom-dep path (P1) ·
**WS-5** CSS side-effect import TS setup — TS2882/`vite/client` (P1) · **WS-6** chart axis
rendering bugs (P2) · **WS-7** component-count single source of truth (P2) · **WS-8** SideNav
example missing icon import (P2) · **WS-9** discoverability minors — Switch→Toggle, CSS
subpath naming (P3) · **WS-10** the anti-drift gate + status hygiene (P0, ties it together).

> **Status hygiene (binding, see `README.md` WS-K):** whichever PR implements a workstream
> below MUST update this header and the per-WS status in the same PR, and flip
> `merged → published vX.Y.Z` in the PR that publishes. A plan that says "planned" after its
> fixes shipped — or "✅" while the docs adopters read still teach the pre-fix API — is how
> the same red flag gets re-reported. It just happened again: see §0.

---

## §0 — Read this first: why these are back, and the one thing this plan must fix

This is the seventh cold-adopter report. Unlike the six before it, **it shipped with zero
blockers** — the app compiled, type-checked, and rendered like Vercel. The adopter had full
`.d.ts` access and repeatedly praised the shipped TypeScript types as "the best documentation
in the project." So the friction they hit is not "the API is wrong." It is: **the docs an
agent is pointed at (`cascivo.com/llms/*.md`, the pasteable `AI-RULES.md` contract, the
quick-start snippets) lag the shipped types and the shipped code.**

That lag is the same defect the six prior reports hit, and the `README.md` in this directory
already names it (WS-K). The evidence that it is **still live on `main` today**, not a story
about old versions:

1. **Code fixed, docs still teach the pre-fix API — `useTheme`.** The 07-23 fix-plan marks
   **WS-E ✅ "`useTheme` returns a string + `themeSignal()`"**
   (`fix-plan-tanstack-router-dashboard-adopter-2026-07-23.md:7`), and the code confirms it:
   `packages/react/src/theme.tsx:119` returns `readonly [string, (next: string) => void]`.
   But three adopter-facing docs — including the file meant to be **pasted verbatim into an
   agent's system prompt** — still say it returns a signal you read with `.value`:
   - `docs/AI-RULES.md:60-64` — *"`useTheme()` returns a **tuple** `[Signal<string>, setTheme]`
     — read `theme.value`; never destructure `{ theme, setTheme }`."*
   - `docs/GETTING-STARTED.md:237-244` — *"useTheme() returns a TUPLE `[themeSignal, setTheme]`
     … read `theme.value`"*.
   - `docs/THEMING.md:78` — `const [theme, setTheme] = useTheme() // reactive [signal, setter]`.
   An agent following `AI-RULES.md` on 0.11.0 writes `theme.value`, which is now a **type
   error** (`theme` is a `string`), and files "useTheme docs contradict the types" — the
   eighth report. This is the whole recurrence in one bug.

2. **Items marked "carried forward" with no owner.** The TS2882 CSS-side-effect-import type
   error (`@cascivo/themes/all` under `noUncheckedSideEffectImports`) was raised on 07-22,
   given workstream WS-C, and then appears in the 07-23 plan **only** as a line item in a
   carry-forward list (`fix-plan-tanstack-router-dashboard-adopter-2026-07-23.md:712`) with no
   spec and no owner. The 07-24 adopter hit the same class of error (Finding #4) from the
   other side (`@cascivo/react/styles.css` needs `vite/client`). Unowned ≠ fixed.

3. **No gate diffs what the adopter actually reads against what shipped.**
   `scripts/checks/deployed-freshness.sh` probes the live host, but only for a version stamp
   (lines 154-159) and ~6 hand-picked canary strings (lines 159-170) — each added reactively
   after a prior report. It cannot catch "manifest/type has prop X but the doc omits it," and
   its `[theme, setTheme]` canary (line 170) matches both the old and new `useTheme` shape, so
   it did not catch failure mode (1). `props-parity.test.ts` reconciles manifest↔type but
   **only at top-level props** — it never descends into nested object fields, which is exactly
   where this report's biggest gap lives (`Column.render`).

**The one thing this plan must deliver (WS-10):** an *enforced* gate so a code/type change can
never again leave the adopter-facing docs teaching the old API. Everything else is the
content fix; WS-10 is why it stays fixed. The model to copy is the one integration this
report praised as "worked first try": the router-link recipe, which lives **in the shipped
`setLinkComponent` JSDoc** (a channel that travels with `pnpm add` and cannot drift from the
code because it sits next to it). Where feasible, move truth into type-adjacent, drift-proof
channels; where it must live in prose, gate the prose against the code.

---

## §0.5 — Triage: where the report diverges from current `main` (do NOT re-fix these)

The report is accurate about symptoms but was written without repo access; several items it
frames as "missing" are partially present on `main`. Read this before implementing so effort
lands on the real gap:

| Report claim | Reality on `main` | Real gap to fix |
| --- | --- | --- |
| Finding #1: `ShellHeader.end` undocumented | `end` **is** documented at prop level: `packages/components/src/shell-header/shell-header.meta.ts:31-36`. `actions` is also documented (`:26-30`). | The **field shape** of `ShellHeaderAction` (`id/label/icon/active?/onClick?`) is not expanded — no `typeDefs`. → WS-2. |
| Finding #1: `DataTable.Column.render` undocumented | Correct. `Column.render?: (row) => ReactNode` exists (`data-table.tsx:15`) but `data-table.meta.ts` has **no `typeDefs`**, so it appears in no generated doc. | Add `typeDefs` for `Column<Row>`. → WS-2. |
| Finding #3: router types not re-exported from `@cascivo/react`; `@cascivo/core` MODULE_NOT_FOUND | `setLinkComponent`/`LinkComponent` shipped in **0.8.0**, `LinkComponentProps` in **0.9.0**; both re-exported at `packages/react/src/index.ts:103-108`. A 0.11.0 adopter **has** them. | The adopter followed the `@cascivo/core` import path, which the docs **still present as valid** (`docs/HEADLESS.md:89` "works too") — a phantom-dependency error on the prebuilt path. → WS-4. |
| Finding #3: no router recipe exists | A correct recipe exists: `docs/HEADLESS.md:62-96`. | It is not discoverable from the AI-first channel (`llms/*`), and `USING-WITH-NEXTJS.md` omits `setLinkComponent` entirely. → WS-4. |
| Finding #8: SideNav docs import from `lucide-react` | No `lucide-react` import exists in any doc. The example shows a bare `<Home size={16} />` with **no import at all** (`apps/site/public/llms/side-nav.md:70`, generated). | Make the generated example import from `@cascivo/icons`. → WS-8. |
| Finding #8: counts 192 vs 204 | Both are **derived**, from different bases: README = `registry.components.length` (192); llms = components **+ page-blocks** (204). Plus stale hardcoded "192" in hand docs. | Reconcile the semantics and label them; kill hardcoded copies. → WS-7. |

Genuinely new / correct as stated: Finding #2 (chart x-type asymmetry — no antecedent),
Finding #4 (`vite/client`/TS2882 — unowned), Finding #7 (chart axis rendering bugs — real
code defects). Finding #5 (CSS subpath name) and #6 (Switch vs Toggle) are minor and mostly
already mitigated. → WS-3, WS-5, WS-6, WS-9.

---

## The five documentation channels (from the 07-23 plan — the frame for every WS below)

An AI adopter's effective doc surface, in order of trust and drift-resistance:
1. `package.json` metadata (deps, description) — travels with `pnpm add`.
2. shipped `dist/index.d.ts` + JSDoc — **cannot drift from the code**; this report's favorite.
3. runtime behavior (warnings, defaults).
4. install-time artifacts (what lands in `node_modules`).
5. the website / `llms/*.md` / `AI-RULES.md` — the channel that keeps lagging.

**Rule for this plan:** prefer channels 1–4 for any contract an agent must not get wrong; when
content must live in channel 5, WS-10 gates it against 1–2.

---

## WS-1 — `useTheme` docs drift (P0, live bug)

**Root cause.** 0.11.0 changed `useTheme()` to return `[string, setter]`; the docs that teach
it were not updated in the same change. Channel-5 truth drifted from channel-2 truth.

**Evidence.** Code: `packages/react/src/theme.tsx:119` (`useTheme` → `readonly [string, …]`),
`:131` (`themeSignal()` is the escape hatch for the signal). Stale docs: `docs/AI-RULES.md:60-64`,
`docs/GETTING-STARTED.md:237-244`, `docs/THEMING.md:78`. All three are **hand-authored**
(edit directly); their generated mirrors under `apps/site/public/docs/*` refresh via
`pnpm docs-md:generate`.

**Fix.**
1. Rewrite the `useTheme` guidance in all three files to the string-return contract:
   `const [theme, setTheme] = useTheme()` where `theme` is a `string`; `setTheme(next)` to
   change it; direct `theme` comparisons (`theme === 'dark'`); and `themeSignal()` **only** for
   the advanced signal case. Remove every `theme.value` and every "returns a tuple
   `[Signal<string>, …]`" phrasing.
2. Update the `AI-RULES.md` reactivity contract (the pasteable block) to match, since this is
   the file agents load into their system prompt.
3. Run `pnpm regen` so the `apps/site/public/docs/*` mirrors and any llms reference regenerate;
   commit the regenerated artifacts.

**Verification / enforcement.** Add a case to the WS-10 doctest harness that compiles the
`useTheme` snippet from each guide against the built `@cascivo/react` types — `theme.value`
must fail to compile, `theme === 'dark'` must pass. Until WS-10 lands, add a narrow guard in
`scripts/checks/` that greps these three files for `theme.value` / `Signal<string>, setTheme`
and fails. Also tighten the `deployed-freshness.sh` canary at line 170 from `[theme, setTheme]`
to a string-return-specific needle.

**Status:** planned — not implemented.

---

## WS-2 — AI-doc completeness for nested object fields (P0)

**Root cause — structural, this is the report's #1 finding.** Per-component docs are generated
**only** from the flat `meta.props[]` list plus an **optional, hand-authored** `meta.typeDefs[]`.
When a prop's type is a named object (`Column<Row>`, `ShellHeaderAction`), the object's fields
are invisible unless the author wrote `typeDefs` — and **nothing enforces that they did.** So
the single most important prop for a real dashboard table — `Column.render` for custom cell
content — is in zero generated docs, and all CI is green.

**Evidence.**
- Generator reads flat props (`scripts/llms/generate.ts:135-150` `propsTable`) and renders
  object fields only from `meta.typeDefs` (`:152-171` `typeDefsSection`, skipped entirely when
  absent). `scripts/context/generate.ts` re-declares a **local `ComponentMeta` that omits
  `typeDefs`** (~`:62-76`), so the context channel renders **no** field docs even if a manifest
  adds them — a second bug.
- Schema intent: `packages/core/src/types.ts:30-41` — `TypeDefMeta` exists precisely so
  "the field list — not just the type string — is machine-readable." `typeDefs` is optional
  (`:94-95`).
- DataTable: `Column.render?: (row: Row) => ReactNode` at `data-table.tsx:15`; manifest
  `data-table.meta.ts:40-45` documents `columns: Column<Row>[]` with **no `typeDefs`**.
- ShellHeader: `ShellHeaderAction` = `{ id, label, icon, active?, onClick? }`
  (`shell-header.tsx:41-47`); manifest documents the `actions`/`end` **props** but not the
  action **field shape** (no `typeDefs`).
- The intended pattern already exists in one place: `bar-chart.meta.ts:146-167` authors
  `typeDefs` for `BarChartSeries<Datum>`. Copy that shape.
- The gap is unguarded: `props-parity.test.ts` reconciles top-level props both directions
  (`:99-132`) but never descends into nested types; `manifest-completeness.test.ts:55-64` only
  checks `props` is non-empty.

**Fix.**
1. **Teach `context/generate.ts` about `typeDefs`.** Replace its local `ComponentMeta` with the
   canonical one from `@cascivo/core` (or add the `typeDefs` field + a `typeDefsSection`
   mirroring `llms/generate.ts:152-171`) so the context channel renders field docs too.
2. **Add `typeDefs` to the manifests that need them.** Minimum for this report:
   `data-table.meta.ts` (`Column<Row>`: `key, header, sortable?, render?, align?, width?`) and
   `shell-header.meta.ts` (`ShellHeaderAction`, and `ShellHeaderNavItem`). Add a runnable
   `render` example to `data-table.meta.ts` examples (Badge cell + icon/link cell) — this is
   the pattern every dashboard needs first.
3. **Add the enforcement guard `scripts/checks/typedefs-parity.test.ts`** (the reason it stays
   fixed). Using the existing ts-morph plumbing in
   `scripts/checks/lib/component-props.ts`: for every manifest prop whose resolved TS type
   references a **named object type or an array of one** (excluding primitives, `ReactNode`,
   DOM/event types, and an allowlist), assert the manifest declares a matching `typeDefs` entry
   whose `fields` cover that object's public fields. This is the nested-field analogue of
   `props-parity` and closes the exact hole `Column.render` fell through.

**Verification.** `pnpm regen` then confirm `apps/site/public/llms/data-table.md` and
`.../context/data-table.md` list `render` (and the other `Column` fields); the new
`typedefs-parity` test fails before the manifests are updated and passes after.

**Status:** planned — not implemented.

---

## WS-3 — Chart x-accessor type asymmetry, documented (P1)

**Root cause.** `BarChart.x` returns `string` (band/categorical scale) while `AreaChart.x` /
`LineChart.x` return `number | Date` (linear/time). The prose docs say the cartesian charts
"share the same API design"; the asymmetry is only visible in the types. No BarChart date
example exists.

**Evidence.** `bar-chart.tsx:32` `x: (d) => string`; `area-chart.tsx:57` and `line-chart.tsx:47`
`x: (d) => number | Date`. Manifests don't contrast them: `bar-chart.meta.ts:19-24` (no note),
`line-chart.meta.ts:18-24` (terse), `area-chart.meta.ts:17-23` (explains its own but not the
contrast). Confirmed genuinely new: `fix-plan-…-2026-07-23.md:79` (WS-D) — no antecedent.

**Fix.**
1. In each of the three chart manifests, add prose to the `x` prop description stating the
   scale it drives and cross-referencing the others: BarChart = "categorical **band** scale —
   `x` returns a **`string`** label; for continuous/time x use LineChart/AreaChart"; Area/Line
   = "linear/time scale — `x` returns `number | Date`; for discrete categories use BarChart."
2. Add a `typeDefs`/example to `bar-chart.meta.ts` showing a **date-based** bar chart where the
   caller formats the `Date` to a label string (the exact workaround the adopter had to
   discover), so the generated doc teaches it.
3. Add a short shared section to `docs/` (a "Charts: axis & scale model" block, e.g. appended to
   the charts guide or `HEADLESS.md`'s chart notes) that states the three-way scale table once,
   and link it from each chart's generated doc via the manifest `intent.related`/`content`.

**Verification.** `pnpm regen`; confirm `llms/bar-chart.md` shows the string-x contract and a
date example, and the cross-references render.

**Status:** planned — not implemented.

---

## WS-4 — Router / nav integration: kill the phantom-dep path, make the recipe findable (P1)

**Root cause.** The re-export is shipped and correct, but (a) the docs still bless the
`@cascivo/core` import that breaks on the prebuilt path, and (b) the working recipe is buried in
`HEADLESS.md` and absent from the AI-first (`llms`) channel and the Next.js guide — so a
nav-heavy dashboard adopter (the "with TanStack" prompt) doesn't find it.

**Evidence.** Shipped: `packages/react/src/index.ts:103-108` re-exports
`setLinkComponent/getLinkComponent/LinkComponent/LinkComponentProps`; `@cascivo/core` is a
`dependency` of react (`packages/react/package.json:52-56`), so it's transitive/phantom for the
app. Correct recipe: `docs/HEADLESS.md:62-96`. The phantom-dep hedge: `docs/HEADLESS.md:89`
("`import { setLinkComponent } from '@cascivo/core'` works too"). Gaps: `llms/*` has no router
recipe; `docs/USING-WITH-NEXTJS.md` never mentions `setLinkComponent`. Consumption points that
prove the seam: `getLinkComponent()` at `side-nav.tsx:518`, `shell-header.tsx:195`.

**Fix.**
1. In `docs/HEADLESS.md`, change the `@cascivo/core` "works too" line (`:89`) to a **warning**:
   on the prebuilt `@cascivo/react` path, import the link API from `@cascivo/react` (core is a
   transitive dep and importing from it is a phantom-dependency error under pnpm strict
   `node_modules`). Keep the core import documented only for the copy-paste/source path.
2. Add a `setLinkComponent` recipe to `docs/USING-WITH-NEXTJS.md` (`setLinkComponent(Link)` for
   the App Router `<Link>`), mirroring the TanStack recipe already in `HEADLESS.md`/`VITE-SSR`.
3. **Surface the recipe in the AI-first channel.** Add a "Client-side routing / nav links"
   section to the `llms.txt`/`llms-full.txt` generator (`scripts/llms/generate.ts`) reactivity/
   integration prose, and reference it from `SideNav`/`ShellHeader` `intent.related` so their
   per-component `llms/*.md` point to it. The truth already lives drift-proof in the
   `setLinkComponent` JSDoc (`packages/core/src/link.ts:55-71`) — the fix is discoverability,
   not new content.

**Verification.** `pnpm regen`; grep `apps/site/public/llms*` and `llms/side-nav.md` for the
routing recipe; confirm `USING-WITH-NEXTJS.md` mentions `setLinkComponent`.

**Status:** planned — not implemented.

---

## WS-5 — CSS side-effect import TypeScript setup: `vite/client` / TS2882 (P1, the unowned item)

**Root cause.** Every quick-start shows `import '@cascivo/react/styles.css'` but none tells a
typechecking adopter that a bare `.css` import needs ambient module types (`vite/client`), or
that strict TanStack-Start-style scaffolds fail it under `noUncheckedSideEffectImports`
(TS2882). The only place the fix exists is the CLI scaffold, which prebuilt-path adopters
never run. This is the carried-forward, unowned WS-C.

**Evidence.** Quick-start imports with no TS note: `scripts/llms/generate.ts:566` (→
`apps/site/public/llms.txt:82`), `packages/react/readme.body.md:73` (→ `README.md:91`),
`apps/site/src/pages/GettingStartedPage.tsx:77`, plus the SSR/troubleshooting guides. The only
`vite/client` wiring in the whole repo: `packages/cli/src/commands/create.ts:227,429` (scaffold
only). TS2882 appears nowhere in docs. Prior status: raised 07-22 (WS-C), demoted to an
unowned carry-forward line at `fix-plan-…-2026-07-23.md:712`.

**Fix.**
1. Add a short, **findable** "TypeScript setup for CSS imports" note wherever the CSS import is
   taught: `docs/GETTING-STARTED.md` (near the CSS section), `docs/TROUBLESHOOTING.md` (a named
   entry: "TS2307/TS2882 on `import '@cascivo/…/styles.css'`"), the `AI-RULES.md` SSR section
   (`:156-174`), and the quick-start block in `scripts/llms/generate.ts` (~`:566`) and
   `packages/react/readme.body.md`. Content: add `/// <reference types="vite/client" />` (or a
   `src/vite-env.d.ts`); for `noUncheckedSideEffectImports`, declare an ambient
   `declare module '*.css';`. Give the copy-paste snippet.
2. Regenerate (`pnpm regen`) so `llms.txt`, READMEs, and the docs mirrors pick it up.

**Verification / enforcement.** Add a fixture to the cold-adopter check (`pnpm cold-adopter:check`)
or a small typecheck fixture that imports `@cascivo/react/styles.css` under
`noUncheckedSideEffectImports: true` **without** the ambient decl (must fail) and **with** the
documented decl (must pass) — proving the documented fix is the correct one and locking it.

**Status:** planned — not implemented.

---

## WS-6 — Chart axis rendering bugs: y-label clipping + x-label collision (P2, real code)

These are the only findings that are code defects, not docs. Both are "shipped looking rough"
in a one-shot.

**6a — y-axis tick labels clipped (`40,000` → `)0,000`).**
Root cause: the left margin is a **fixed constant** (`DEFAULT_MARGINS.left = 36`,
`packages/charts/src/core/use-chart.ts:75`), never widened for wide labels; y labels are
right-anchored at `x = -8` (`chrome/axis.tsx:89-97`) and `toLocaleString()` adds thousands
commas, so `"40,000"` (~35px) overflows past the `viewBox` origin `0`
(`core/chart-frame.tsx:249`), which clips (SVG default `overflow:hidden`).
Fix: measure or estimate the widest **formatted** y tick label (character-count × per-char em at
`fontSize 11`, or a hidden-measure pass) and set `margins.left = max(36, estimatedLabelWidth + 8 + gutter)`
before rendering; only the left is auto-sized (right already auto-adjusts for a second axis).
Alternatively/additionally set `overflow: visible` on the chart `<svg>` with padding — but
auto-margin is the correct fix and keeps the frame clip for the plot area. Apply uniformly to
Area/Line/Bar (all read `DEFAULT_MARGINS`).

**6b — BarChart x-axis date labels collide (`Jul 1Jul 1Jul 1…` at 14 bars).**
Root cause: band-scale axis renders a centered horizontal label for **every** category; the
only thinning control is the opt-in `xLabelEvery` (undefined by default →
`chrome/axis.tsx:43-54`, `bar-chart.tsx:46-47,94,394`), and `xTicks` is ignored for band scales.
No rotation, no auto-skip.
Fix (pick the least-surprising that removes overlap without a required prop): compute an
**automatic label stride** from `bandwidth` vs measured/estimated label width — when labels
would overlap, skip to every Nth (and always render first+last), which is what a caller has to
do by hand today. Make `xLabelEvery` override the auto value. Optionally add an opt-in
`xLabelAngle`/rotation for dense categorical axes, with a bottom-margin bump. Keep it CSS/SVG,
no new deps.

**Verification.** Add Vitest/DOM snapshot tests in `packages/charts` asserting: (6a) a series
with 5-digit y values produces `margins.left > 36` and the leftmost tick `<text>` x-extent ≥ 0;
(6b) a 14-category bar chart renders ≤ N x-labels (strided) or non-overlapping bands. Visual
sweep at 320/360/390/414 per the authoring rules. Update the chart manifests only if new props
(`xLabelAngle`) are added — then WS-2's `typedefs-parity` and `props-parity` apply.

**Status:** planned — not implemented.

---

## WS-7 — Component count: single source of truth (P2)

**Root cause.** Two derivations from different bases (README = `registry.components.length` = 192;
llms = components + page-blocks = 204) plus stale **hardcoded** "192" in hand-authored docs that
don't track the registry at all.

**Evidence.** README derivation: `scripts/readme/generate.ts:71,281,286,302`. llms derivation:
`scripts/llms/generate.ts:1053` (`[...registry.components, ...blockEntries]`), `:971`
(`Component index (${sorted.length} entries)`). Hardcoded "192": `docs/GETTING-STARTED.md:9`,
`docs/ROADMAP.md:3,11`, `docs/TESTING.md:4`, `packages/react/readme.body.md:231`,
`packages/video/README.md:21`. Existing partial guard:
`scripts/checks/claims.test.ts` asserts literal "N components/charts/themes" claims match
`registry.components.length` (added in #136) — but it does not reconcile the llms "204 entries"
figure, and hardcoded copies above evidently predate or evade it.

**Fix.**
1. Make the two figures **semantically distinct and labeled**, not accidentally different: keep
   `registry.components.length` for "components," and have llms print
   `Component index (N entries — M components + K blocks)` so 204 vs 192 reads as intentional,
   not a contradiction.
2. Replace every hardcoded "192" in hand-authored docs with the generated placeholder
   (`{{count.components}}` where the file is a `readme.body`-style template, or move the number
   into a generated include). For pure prose files (`GETTING-STARTED.md`, `ROADMAP.md`,
   `TESTING.md`) that aren't templated, either template them through `docs-md:generate` or
   extend `claims.test.ts` to cover them so the guard fails on drift.
3. Extend `scripts/checks/claims.test.ts` to also assert the llms "entries" and "components"
   sub-counts against the registry, closing the 204/192 reconciliation.

**Verification.** `pnpm regen && pnpm meta:check`; `git diff --exit-code`; the extended
`claims.test.ts` fails on a deliberately wrong hardcoded count.

**Status:** planned — not implemented.

---

## WS-8 — SideNav example: missing `@cascivo/icons` import (P2)

**Root cause.** The generated SideNav example shows `icon: <Home size={16} />` with **no import
line**, so a copy-paste yields an undefined `Home`. The `.md` is generated, so the fix belongs
in the manifest/generator, not the emitted file.

**Evidence.** `apps/site/public/llms/side-nav.md:70`, `apps/site/public/context/side-nav.md:95`
(both generated). Correct source is `@cascivo/icons` (`apps/storybook/stories/SideNav.stories.tsx:3`).

**Fix.** Update the SideNav manifest example `code` (in `packages/components/src/side-nav/side-nav.meta.ts`)
to include `import { Home, BarChart, Settings } from '@cascivo/icons'` above the JSX, and audit
other components whose examples use icons for the same omission. Regenerate.

**Enforcement.** Consider a lightweight check that manifest example snippets using a
JSX identifier that matches an `@cascivo/icons` export include the corresponding import — or
fold into the WS-10 doctest harness (example snippets that reference an undeclared identifier
fail to compile).

**Status:** planned — not implemented.

---

## WS-9 — Discoverability minors (P3)

- **Switch → Toggle.** No `Switch` exists; `Toggle` is the control. Already mitigated:
  `toggle.meta.ts:81` tags `['switch', …]`, `docs/MIGRATING-FROM-SHADCN.md:70` maps
  `Switch → toggle`, `docs/specs/parity-matrix.md:91`. Optional polish: add a one-line "there is
  no `Switch` — use `Toggle`" alias to the llms component index / a redirect in the site search
  synonyms so an agent grepping "Switch" lands on Toggle immediately. `onValueChange` is the
  contract; `onChange` is `@deprecated` (`toggle.tsx:10-12`).
- **CSS subpath name ≠ physical filename.** `@cascivo/charts/styles.css` → `dist/charts.css`
  (`packages/charts/package.json:40`); `@cascivo/react/styles.css` → `dist/styles.css`. Runtime
  is fine and docs already warn against importing the physical file. Optional: one sentence in
  the CSS-import note (WS-5) stating "always import the `…/styles.css` **specifier**, never the
  `dist/` filename — the subpath is an `exports` alias."

**Status:** planned — not implemented.

---

## WS-10 — The anti-drift gate (P0) — why it stays fixed this time

**This is the workstream that addresses the user's actual complaint** ("always said to be
fixed"). Content fixes above are necessary but insufficient; without a gate they rot again on
the next API change. Two mechanisms:

**10a — Doc-snippet doctest (structural, drift-proof).** Add `scripts/checks/doc-snippets.test.ts`:
extract fenced `tsx`/`ts` code blocks tagged `// @typecheck` (or all blocks in a curated set)
from `docs/AI-RULES.md`, `docs/GETTING-STARTED.md`, `docs/THEMING.md`, `docs/HEADLESS.md`, and
each component manifest's `examples[].code`, then **compile them against the built package
types** (ts-morph in-memory program, or a temp project referencing `packages/*/dist`). A block
that uses a removed/renamed API (e.g. `theme.value` after 0.11.0, or `actions={<div/>}`) fails
CI in the **same PR** that changed the API. This makes failure mode (1) from §0 impossible.
Wire into `pnpm meta:check`.

**10b — Manifest→published-doc parity (extend the freshness probe).** Extend
`scripts/checks/deployed-freshness.sh` (or a new `scripts/checks/published-props.mjs`) from
~6 hardcoded canaries to a **generated** assertion: for a sampled set of (component, prop)
pairs derived from `registry.json`, assert the corresponding needle appears in the live
`llms/<name>.md`. Minimum: assert `data-table.md` contains `render`, `shell-header.md` contains
the `ShellHeaderAction` fields, and `bar-chart.md` contains the string-x note — so the exact
gaps this report hit are canaried, and the set grows from the registry, not by hand.

**10c — Status hygiene (process, already binding).** Per `README.md` WS-K: the implementing PR
updates this header and per-WS status; the publishing PR flips `merged → published vX.Y.Z`;
open items carry forward **with an owner and a spec**, never as a bare list line (the failure
that stranded WS-5's ancestor). Add this plan to the directory's "Current live tracker" and
point the 07-23 plan's header at it for its still-open items (TS2882/WS-C → WS-5 here).

**Status:** planned — not implemented.

---

## Prioritization & sequencing

1. **P0, do first (stop the active bleeding + build the gate):** WS-1 (useTheme docs),
   WS-2 (typeDefs + guard), WS-10 (doctest + parity gate). WS-10a should land with or right
   after WS-1 so WS-1 is locked by a test, not just edited.
2. **P1:** WS-3 (chart type docs), WS-4 (router docs + phantom-dep), WS-5 (CSS/TS setup + the
   long-unowned item). These are pure docs/manifest + one JSDoc hedge; low risk, high adopter
   value.
3. **P2:** WS-6 (chart rendering — the only real code work; needs tests + visual sweep),
   WS-7 (counts), WS-8 (SideNav icon import).
4. **P3:** WS-9 (minors), foldable into WS-5's CSS note and the llms index.

Each PR runs `pnpm ready` (regen → check → build → typecheck → test) and commits regenerated
artifacts; docs-touching PRs additionally run `pnpm meta:check` and `git diff --exit-code`.

## Definition of done

A workstream is done when it is (1) merged with this plan's status updated in the same PR,
(2) for anything an adopter installs, **published** and the header flipped to `published vX.Y.Z`,
and (3) **locked by a test** — WS-10a for prose/example API drift, `typedefs-parity` for nested
field docs, `claims.test.ts` for counts, the charts tests for WS-6, the fixture for WS-5. The
plan as a whole is done when an agent restricted to channels 1–5 on the **published** packages
can build this exact Vercel dashboard — custom table cells, header actions, router-linked nav,
date-based bar chart, typechecked CSS imports, correct `useTheme` — without reading `.d.ts` to
discover any of it, and no doc it reads teaches an API the code no longer has.

## Enforcement summary (the guards that must exist when this is done)

| Recurrence risk | Guard | New/extend | WS |
| --- | --- | --- | --- |
| Prose/example teaches removed API | `doc-snippets.test.ts` (compile snippets vs built types) | new | 10a, 1, 8 |
| Nested object field undocumented | `typedefs-parity.test.ts` | new | 2 |
| Published llms doc omits a shipped prop | extend `deployed-freshness.sh` → registry-derived needles | extend | 10b |
| Hardcoded/conflicting counts | extend `claims.test.ts` to llms entries + prose files | extend | 7 |
| Chart labels clip/collide | charts DOM/snapshot tests | new | 6 |
| CSS import fails typecheck | cold-adopter TS fixture (with/without ambient decl) | new/extend | 5 |
| Status drifts from what shipped | `README.md` WS-K process | existing | 10c |
