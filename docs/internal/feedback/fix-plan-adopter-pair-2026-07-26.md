# Fix plan — the 2026-07-26 adopter **pair** (both tested published `0.12.0`)

**Status: implemented on `claude/ui-library-analysis-plan-s4qogb`; not yet published.**
Per-workstream: **WS-1** ✅ (`tsdoc:generate` republishes the manifest onto the type surface —
124 components, 300+ props; `tsdoc-parity` guard + placeholder blocklist + coverage ratchet) ·
**WS-2** ✅ (all four root causes fixed; `adopter-app` fixture audits clean in CI; `props-parity`
gained a `required` direction, which found 2 real drifts) · **WS-3** ✅ (`Link asChild`,
`text-decoration: none` + `aria-disabled` on all four control-like components,
`--cascivo-link-color` published, `USING-WITH-A-ROUTER.md` + `aschild-docs` guard) ·
**WS-4** ✅ (ComboChart: margins, stride, legend, line series in the a11y table, two dev-warns;
16-case chart-chrome contract test) · **WS-5** ✅ (`Axis orientation="y-right"`,
`rightMarginForLabels`, pixel-based stride/last-label collision) · **WS-6** ✅ (overlap fill
opacity + `--cascivo-chart-fill-opacity-overlap` in all 12 themes + scale-mismatch warning) ·
**WS-7** ✅ (23 chart manifests rewritten; recipe "Sizing charts" section) ·
**WS-8** ✅ (fixed layout only when every column is sized; `Column.minWidth`; scoped
`overflow-wrap`) · **WS-9** ✅ (`Tone` + `Progress` in `@cascivo/core`, six components accept
them, `vocabulary` guard) · **WS-10** ✅ (`Badge tone=` fixed; `example-props` guard type-checks
all 370 examples and found a second real gap) · **WS-11** ✅ (channels derived per-symbol;
`importableSymbols`; `PageHeader` exported) · **WS-12** ✅ (12 papercuts) ·
**WS-13** ✅ (`export-collisions` guard + icons-overlap ratchet) · **WS-14** ✅ (10 new guards,
wired into `pnpm meta:check` / `pnpm ready` / CI) · **WS-15** ◑ (15b `npm-parity` canary
implemented; 15a publish is a release action, not a code change).

> **Correction — the publishing theory was wrong for this round.** This plan originally
> carried the 07-25 plan's framing: _"both 07-26 adopters tested npm, not `main`, so they met
> defects already fixed."_ **That is false, and it was worth checking rather than repeating.**
> `@cascivo/react@0.12.0` was on npm before the reports, and the published tarball was
> unpacked and compared:
>
> - published `dist/index.d.ts` has `direction?: 'vertical' | 'horizontal';` with **no TSDoc**
>   — the same as `main`. The `⚠` existed only in the manifest.
> - published `dist/button/button.css` contains **zero** `text-decoration` declarations — the
>   underline defect was genuinely shipped.
> - the published CLI's bundled contract has the **duplicate `AppShell`/`Calendar` entries**
>   and `SideNav.items: required: true` — the audit's false positives were genuinely shipped.
> - the published `@cascivo/docs` **does** carry the Flex ⚠ — which is why the adopter who
>   read it was saved and the adopter who read the `.d.ts` was not.
>
> Every artifact matched its source exactly. **Nothing lagged; the release pipeline is sound.**
> The defects were real defects in real published code, and the explanation is Mechanism D
> alone — the fix reached the manifest, not the type surface. Attributing three rounds of
> recurrence to "not yet published" was itself an instance of the failure this directory
> exists to prevent: a diagnosis carried forward without being checked.
>
> `scripts/checks/npm-parity.test.ts` now answers that question with evidence instead of
> assumption, in both directions, so no future plan has to guess.

Every claim in both reports was triaged against `main` at commit `183ef05a` with file:line
evidence, a verdict (**CONFIRMED** / **PARTIALLY REFUTED** / **REFUTED**), and — for the two
red flags that are reproducible in-process — an actual reproduction that was run.

**Source reports** (both dated 2026-07-26, both a Vercel-style console, both **Path B**, both
against the *published* `@cascivo/react@0.12.0` / `@cascivo/charts@0.6.0` /
`@cascivo/icons@0.3.5` / `@cascivo/themes@0.4.7` — which is exactly `main` at `183ef05a`):

| | Report | Stack | Outcome |
| --- | --- | --- | --- |
| **A** | [`feedback-tanstack-start-dashboard-adopter-2026-07-26.md`](feedback-tanstack-start-dashboard-adopter-2026-07-26.md) | TanStack Start 1.168 (SSR) + Router 1.170 + Query 5.101, React 19, TS 6 | 8 routes SSR, clean build, **no blockers**, 4 red flags |
| **B** | [`feedback-react-router-dashboard-adopter-2026-07-26.md`](feedback-react-router-dashboard-adopter-2026-07-26.md) | Vite 8 + React Router 8.3 (CSR), React 19, TS 6 | 6 routes, clean build, **no blockers**, 8 red flags |

> **Status hygiene (binding, see [`README.md`](README.md) WS-K):** the PR that implements a
> workstream MUST update this header and that workstream's status **in the same PR**; the PR
> that publishes flips `merged → published vX.Y.Z`. This is the **ninth** and **tenth** report;
> the recurring adopter sentence is _"this was raised before and was said to be fixed."_

**Carry-forward:** this plan supersedes
[`fix-plan-vercel-tanstack-start-adopter-2026-07-25.md`](fix-plan-vercel-tanstack-start-adopter-2026-07-25.md)
as the live tracker. Its **WS-15** is still open and is restated here as **WS-15** below
(publish the 07-24 + 07-25 trains, run the freshness / npm-parity canaries, finish the 07-23
WS-J Playwright browser leg). Nothing in this plan is "done" while WS-15 is open — see §0.4.

---

## §0 — Read this first

### §0.1 The pair is a controlled experiment, and it names the real defect

Two agents, same day, same published versions, same task (a Vercel-style dashboard), different
routers. That makes the *differences* between the reports evidence rather than anecdote — and
the single largest difference is not about a component at all:

> Report A: _"I built most of this app by **reading the `.d.ts`** rather than the website."_
> Report B: _"`npx @cascivo/docs` … 428 files, greppable. **I never needed to load
> `cascivo.com` at all.**"_

They read **different surfaces**, and they hit **different bugs on the same code**:

| Fact | Where it lives today | Report B (read `llms.txt`) | Report A (read `.d.ts`) |
| --- | --- | --- | --- |
| `Flex` defaults to `direction: 'vertical'` | `flex.meta.ts:13-19` — with a ⚠ and a full explanation | **Saved.** "I would have shipped broken rows without it." | **Bitten 3×** in one build. "Neither the `FlexProps` interface nor `AI-RULES.md` states the default." |
| Charts are responsive when you omit `width` | `chart-frame.tsx:40-46` TSDoc + `charts/src/index.ts:10` module docstring | not reached | **Missed.** Invented 4 pixel widths; concluded "charts have no fluid mode." |
| `Column.width` semantics | nowhere (`data-table.tsx:17` is a bare `width?: string`) | hit it, guessed right | **Bitten.** Collapsed the free-form column. |

The 07-25 plan's **WS-7 swept 231 prop defaults into the manifests and marked itself ✅.**
`Flex.direction` was one of them (`flex.meta.ts:14` — `default: 'vertical'`). The fix is real,
the guard is real, and it **did not reach the adopter**, because the manifest is not the
surface a typed-language agent reads. Measured on `main`:

```
192 manifests · 1157 documented props · 373 carry a `default:`
284 of those 373 have NO TSDoc on the corresponding TypeScript prop
284 of 1157 props (24.5%) have any TSDoc at all
```

So this is a **new mechanism**, and it is the one to fix first:

> ### Mechanism D — the fix landed on a surface the adopter does not read
> A fact is corrected on one surface and the guard checks *that* surface, so the guard is
> green and the defect ships anyway. It is invisible to review because the fix genuinely
> happened. `props-parity` checks manifest↔interface **names and types**; nothing has ever
> checked that the interface *explains itself*.
>
> **Fix pattern — the Three-Surface Rule (WS-1).** Every adopter-facing fact must exist on all
> three surfaces, with one owner and bidirectional parity guards:
> 1. **Type surface** — `packages/react/dist/index.d.ts` (what an IDE and a typed agent read)
> 2. **Machine surface** — `registry.json` / `llms/*.md` / `llms.txt` (what an MCP client reads)
> 3. **Human surface** — `docs/*.md` guides (what a person reads)
>
> A doc-only fix that lands on fewer than three is not a fix. This is the direct answer to the
> standing instruction *"if it's a docs issue, make sure it is perfectly documented and easy to
> find"*: "documented" means three surfaces, and "easy to find" means the guard proves it.

Mechanisms **A** (claim exists only as prose), **B** (fact inferred from a proxy), and **C**
(same fact stated twice) from the 07-25 plan's §0 all recur here too, and each finding below is
tagged with its mechanism.

### §0.2 Triage — report A (TanStack Start)

| # | Report item | Verdict | Root cause (evidence) | Mech | WS |
| --- | --- | --- | --- | --- | --- |
| 1 | `Flex` defaults to a column; undiscoverable | **CONFIRMED (as a `.d.ts` gap)** | `flex.tsx:8` `direction?: 'vertical' \| 'horizontal'` — **no TSDoc**. The ⚠ exists only in `flex.meta.ts:13-19`. | D | WS-1 |
| 2 | No supported way to style a router link | **CONFIRMED** | `link.tsx:12-31` renders a literal `<a>`; `LinkProps` has no `asChild` (`Button` does, `button.tsx:16`); `setLinkComponent` is consumed only by config-driven navs (`core/link.ts:47-52`). `asChild` appears in **zero** `docs/*.md`. | A+D | WS-3 |
| 3 | `Button asChild` on an `<a>` keeps the UA underline | **CONFIRMED** | `button.module.css` never sets `text-decoration` (grep: 0 hits). `asChild` routes through `Slot` (`button.tsx:37-41`), so `a[href]`'s UA underline survives. | — | WS-3 |
| 4 | `DataTable` starves any column without a `width` | **CONFIRMED** | `data-table.module.css:120-122` sets `table-layout: fixed` whenever `data-paginated`; `:150` sets `overflow-wrap: anywhere` on every `td`. Under fixed layout, unsized columns split only the *leftover* space and have no content floor — so 6 declared widths ≈ 100% leaves the 7th at ~0 and it wraps one char per line. | — | WS-8 |
| 5 | `cascivo audit --ai` fails a correct app — 6 false positives | **CONFIRMED — reproduced, 4 of 6 exactly** | see §0.3 | B+A | WS-2 |
| 6 | Charts require hardcoded pixel dimensions | **PARTIALLY REFUTED — docs defect** | Charts **are** responsive: omit `width` and `ChartFrame` tracks the container (`chart-frame.tsx:40-46`, `use-chart.ts:10-24`). But no guide says so, and every chart manifest describes the prop as `'Width of the component.'` (`area-chart.meta.ts:59`). `useChartSize` is *not* the answer and its own docstring says so. | D+C | WS-7 |
| 7 | `AreaChart` clips/overlays its right-hand axis | **CONFIRMED** | `axis.tsx:83-92`: an `orientation="y"` axis always draws ticks at `x=-4` and labels at `x=-8` with `textAnchor="end"`. `area-chart.tsx:494-499` translates that same axis to `translate(innerW,0)`, so a *right* axis renders its labels **inside the plot**. There is no `y-right` orientation. | — | WS-5 |
| 8 | `Stat` and `Kpi` are visually incompatible siblings | **CONFIRMED (and worse)** | `kpi.tsx:51-60` ships card chrome (`padding`, `border`, `borderRadius`) as **inline styles**; `stat.module.css:2-7` ships none. Inline styles outrank every `@layer`, so `Kpi` is also un-overridable — a CLAUDE.md layer-discipline violation that `unlayered:check` structurally cannot see (it scans `.css` files). | A | WS-12 |
| 9 | Cross-package name collisions | **CONFIRMED** | `Text` (`components/src/text/text.tsx:13` vs `charts/src/chrome/text.tsx:57`), `Calendar` (`components/src/calendar/calendar.tsx:100` vs `charts/src/charts/calendar/calendar.tsx:39`), `Glyph` (`icons/src/index.tsx:4` vs `charts/src/chrome/glyph.tsx:55`). `charts/src/index.ts` re-exports chrome with `export *`. | — | WS-13 |
| 10a | `data-theme` scoping unclear at point of use | **CONFIRMED** | Both forms are correct and each is documented in a different file. | C | WS-12 |
| 10b | No link-color token in the public catalog | **CONFIRMED** | `link.module.css:3` reads `var(--cascivo-link-color, …)`; the name is **declared nowhere** in `packages/tokens/src` and appears **0 times** in `tokens.catalog.json`. It is an undeclared override hook masquerading as a token. | A | WS-3 |
| 10c | `Input` overflows its grid cell | **CONFIRMED** | `input.module.css:2` `.wrapper` is a flex column with **no `min-inline-size: 0`**, and `.input:34` is `width: 100%` over a UA-intrinsic `size≈20ch`. A grid item's default `min-width: auto` then exceeds the track. **11 field-family components share the defect**; 15 other modules already use the `min-inline-size: 0` idiom. | — | WS-12 |
| 10d | `label` vs `ariaLabel` | **CONFIRMED (known, partially fixed)** | 07-25 WS-9 gave `IconButton`/`Sparkline` an exclusive union; `Filter`/`StructuredList`/`Progress` still take `aria-label`. | — | WS-9 |
| 10e | `OverflowMenu` uses `value`, not `id` | **CONFIRMED** | `overflow-menu.tsx:15` `value: string`. | — | WS-9 |

### §0.3 The audit false positives — reproduced

This is red flag #2 in report A and the one that poisons trust in `doctor` too, because the
docs recommend them as one CI gate. It reproduces on `main` in-process. Running
`findJsxPropViolations` + `findRequiredPropViolations` against a 30-line fixture, with the
contract built exactly as `loadContract` builds it from the bundled
`packages/cli/src/generated/audit-contract.json`:

```
unknown: [ shell.tsx:9  AppShell.nav      → "<AppShell> has unknown prop \"nav\"" ]
missing: [ shell.tsx:9  AppShell.children
           shell.tsx:11 SideNav.items
           shell.tsx:20 Field.children     ]
```

— i.e. **4 of the adopter's 6 errors, byte-for-byte**. The 5th (`<Link to>`) reproduces from a
second fixture. Four independent root causes:

1. **Duplicate display names collapse in the contract (Mechanism B).** The bundled contract
   contains **two** entries named `AppShell` (and two named `Calendar`):
   ```
   AppShell ["header*","nav","children*","footer","open","defaultOpen","onOpenChange"]   ← components/ (npm)
   AppShell ["footer","sideNavMode","header*","sideNav","aside","children*","persistKey","state"]  ← layouts/ (copy-paste)
   ```
   `buildContract` keys a `Map` by **display name**, so the copy-paste `layout/app-shell`
   silently overwrites the npm one. Every adopter of `@cascivo/react`'s `AppShell` is then
   audited against a component they do not have. Note the asymmetry: `scripts/llms/generate.ts:229-236`
   *already knows* about this collision and emits a "⚠ Name collision" block — the CLI contract
   just drops one entry.
2. **`children` is looked for in the opening tag.** `required-props.ts:35-46` computes
   `present` from `extractAttrNames(tag.attrs)` — attributes only. A component with
   `children` marked required is therefore reported missing **always**, unless someone writes
   `children={…}` as a prop.
3. **`required` has never been checked for parity (Mechanism A/B).** `side-nav.meta.ts:27`
   says `required: true` for `items`; `side-nav.tsx:98` says `items?: SideNavItem[]`.
   `scripts/checks/props-parity.test.ts` compares **names and types**, never `required`.
4. **Import aliases resolve to the pre-`as` name.** `jsx-props.ts:87-90` does
   `raw.trim().split(/\s+as\s+/)[0]`, so `import { Link as CascadeLink } from '@cascivo/react'`
   registers the tracked name **`Link`**, and the scan `<Link…` then matches the *router's*
   `Link`. Reproduced:
   ```
   tracked: [ 'Card', 'Link' ]
   unknown: [ 'link.tsx:7 Link.to' ]      // <Link to="/projects/a"> — TanStack Router's Link
   ```
   For any router-based app, `Link` collateral is near-guaranteed.

The 6th item (`hardcoded-value` on `width: '3rem'` in a `Column`) is also confirmed:
`css-literals.ts:19-33` treats `width`/`height` as visual props and matches any `px`/`rem`
literal, then suggests `--cascivo-space-12`. A table column width is not spacing.

### §0.4 Triage — report B (React Router)

| § | Report item | Verdict | Root cause (evidence) | Mech | WS |
| --- | --- | --- | --- | --- | --- |
| 1 | `ComboChart` unusable at dashboard scale | **CONFIRMED** | `combo-chart.tsx:52-54` — margins are `{...DEFAULT_MARGINS, right: secondAxis ? 60 : 8}`; it calls **neither** `leftMarginForLabels` **nor** `autoLabelStride`, both of which exist in `use-chart.ts:88-121` and both of which `AreaChart` uses (`area-chart.tsx:5,233`). `combo-chart.tsx:220-224` renders the band axis with no `labelEvery`. | A | WS-4 |
| 2 | `ComboChart` API inconsistent; a11y fallback incomplete | **CONFIRMED** | `combo-chart.tsx:12-20` — positional `bars`/`line`, no accessors, correlated by array index with no check (`:117-120` silently falls back to a fraction when `bars[i]` is missing). No `legend` prop. The SR fallback table (`:62-78`) has columns `Label` + `Bar value` only — **the line series is absent from the accessible representation**, in a package advertising WCAG 2.2-AA. | A | WS-4 |
| 3 | Two area series on different scales render a plot that contradicts the legend | **CONFIRMED** | `area-chart.tsx:27` — every solid series uses the same `fillOpacity: var(--cascivo-chart-fill-opacity, 0.25)` regardless of series count; `axis:'right'` is reachable (`:233-234`), so the configuration is legitimate and renders wrong. | — | WS-6 |
| 4 | Final x-axis label clipped on every time-axis chart | **CONFIRMED** | `use-chart.ts:73` `DEFAULT_MARGINS.right = 8`. The last tick sits at `x = innerW` with `textAnchor="middle"` (`axis.tsx:86-90`), so ~half of a `7/26/2026` label (≈35px) overhangs into an 8px margin. `leftMarginForLabels` has **no right-hand sibling**. | — | WS-5 |
| 5 | `autoLabelStride` collides with the always-drawn final label | **CONFIRMED** | `axis.tsx:48-53` keeps `i % labelEvery === 0 || i === last`. With 30 labels and stride 4 that yields …24, 28, **29** — the last two adjacent. `autoLabelStride` (`use-chart.ts:114-121`) computes the stride without accounting for the forced last tick. | — | WS-5 |
| 6 | Three vocabularies for "step/event progress" | **CONFIRMED** | `timeline.tsx:12` `'complete'\|'current'\|'upcoming'`; `steps.tsx:10` `StepState = 'pending'\|'active'\|'complete'\|'error'`; `status.tsx:7` `'success'\|'warning'\|'error'\|'info'\|'neutral'`. | — | WS-9 |
| 7 | Status-tone vocabulary inconsistent across display components | **CONFIRMED** | `badge.tsx:7` (`destructive`, no `info`); `tag.tsx:8` (`error`, has `info`); `notification.tsx` `NotificationVariant`; `status.tsx:7`. Four overlapping enums. | — | WS-9 |
| 8 | A generated docs example uses a prop that does not exist | **CONFIRMED** | `data-table.meta.ts:278` — `<Badge tone={…}>`; `badge.tsx:7` has only `variant`, and its values have no `info`. Generated verbatim into `apps/site/public/llms/data-table.md:119`. **Manifest `examples[].code` is never compiled by anything.** | A | WS-10 |
| 9 | `AppShell` has no `className`, so its own tokens have no application point | **PARTIALLY REFUTED — a manifest gap that reads as an API gap** | `app-shell.tsx:31` **does** declare `className?: string`. But `app-shell.meta.ts` documents **no** `className` prop, and `props-parity.test.ts:56` deliberately skips `className`/`style`/`children`, so no surface tells an adopter it exists. `style` genuinely is missing — `AppShellProps` does not extend `HTMLAttributes`, unlike every other layout primitive (`flex.tsx:7`). | D | WS-12 |
| 10 | `layout/page-header` copy-only; `toast` channel metadata disagrees with exports | **CONFIRMED** | `registry.json` gives `toast` `channels: ["copy"]`, yet `react/src/index.ts:58` re-exports the module and `toast.tsx:39,121,125` export `ToastProvider`, `useToast`, `dismissAllToasts`. `packageFor()` (`scripts/llms/generate.ts:191-194`) tests only `reactExports.has(displayNameOf(entry))` — the *display name* `Toast` — so an entry whose component is copy-only but whose provider/hook are importable is labelled wholly copy-only. Same proxy-instead-of-truth shape the 07-25 WS-6 fixed one level up. | B | WS-11 |
| 11 | `Card padding="none"` breaks `CardHeader`/`CardContent` | **CONFIRMED** | `card.module.css:6-9` sets `--_card-p: 0` on the card; `:36,:82,:90` have header/content read `var(--_card-p, var(--cascivo-space-6))`. `padding="none"` therefore zeroes the subcomponents it exists to hold. | — | WS-12 |
| 12 | `Sparkline` fixed default width fights flex layouts | **CONFIRMED** | `sparkline.tsx:27-28` `width = 120, height = 32`, with no `min-inline-size: 0` / percentage mode. | — | WS-12 |
| 13a | `PieChart` has no `tooltip` prop | **CONFIRMED** | `pie-chart.tsx` exposes `tooltipFormat` (`:40`) but no `tooltip` on/off, unlike Area/Bar/Line/Combo. | — | WS-12 |
| 13b | `Toggle.onChange` takes a `boolean`, not a `ChangeEvent` | **CONFIRMED (deprecated alias)** | `toggle.tsx:6` `Omit<…,'onChange'>`, `:10-12` `onValueChange` + a deprecated value-carrying `onChange`. CLAUDE.md forbids adding more of these; this one is pre-existing. `llms.txt`'s event-naming table omits it. | C | WS-9 |
| 13c | `StructuredList` takes `items`, `ContainedList` takes children | **CONFIRMED** | `structured-list.tsx:14` `items: StructuredListItem[]`. | — | WS-9 |
| 13d | `Search` renders full-width with no width affordance | **PARTIALLY REFUTED** | `search.module.css:9` `inline-size: var(--cascivo-search-width, 100%)` — the affordance exists, documented **only in a CSS comment** (`:7-8`) and absent from the token catalog. | D | WS-12 |
| 13e | `AppShell` is `100dvh` → `fullPage` screenshots capture the viewport | **CONFIRMED (by design, undocumented)** | Correct behavior; worth one line for visual-regression users. | — | WS-12 |
| RF7 | JS bundle size undocumented | **PARTIALLY REFUTED** | `docs/BENCHMARKS.md:17-24` publishes min+gzip JS/CSS vs shadcn and carbon. It is referenced from **neither** `llms.txt` nor `docs/README.md`, so neither adopter found it. | D | WS-12 |

### §0.5 What "done" means

1. Every **CONFIRMED** item fixed.
2. Every fix present on **all three surfaces** (§0.1) — checked by a guard, not by review.
3. Each of the four mechanisms has a guard that **fails a PR reintroducing its class**
   (WS-14), and each guard is observed failing on a deliberate revert.
4. **Published to npm** (WS-15a). A fix an adopter cannot `pnpm add` is not a fix (README
   rule 2) — but note the correction in the status header: for *this* round publishing was
   **not** the cause. `npm-parity` now makes that checkable rather than assumed.

### §0.6 Priority

**P0 (do these three first — they are the four red flags an adopter would actually quit over):**
WS-1 (the `.d.ts` surface) → WS-2 (audit stops failing correct code) → WS-3 (router links) →
WS-4 (ComboChart).
**P1:** WS-5, WS-6, WS-7, WS-8, WS-9, WS-10, WS-11.
**P2:** WS-12, WS-13.
**Always:** WS-14 (guards, landed with their workstream), WS-15 (publish).

---

## WS-1 (P0) — The shipped `.d.ts` becomes a first-class documentation surface

**Status: planned.** Mechanism **D**. Fixes A#1, and is the carrier for A#6, A#10b, B#9, B#13d.

### Problem

`packages/react/dist/index.d.ts` is a flat ~3.5k-line rollup that report A used as its primary
reference. 24.5% of documented props carry TSDoc; **284 props that have a documented default
carry none**. The manifests are excellent and the adopter never saw them.

### Design decision

Two directions were considered:

| | Manifest → TSDoc (codegen) | TSDoc → manifest (invert ownership) |
| --- | --- | --- |
| Migration cost | low — manifests already hold 1157 descriptions | high — 1157 descriptions move into 192 source files |
| Fits existing pipeline | yes — `pnpm regen` already writes generated artifacts and CI diffs them | no — `props-parity` / `regen` would invert |
| Risk | codegen edits component source (must be surgical, idempotent, diffable) | large one-time diff across the whole catalog |

**Recommendation: manifest → TSDoc codegen**, because the manifest is already the owner
(`props-parity`, `prop-defaults-parity`, `regen` all treat it as truth), and Mechanism C says
*one owner per fact*. Inverting would create a second owner mid-flight.

### Spec

1. **New generator** `scripts/regen/prop-tsdoc.ts`, run from `pnpm regen`:
   for each `*.meta.ts` prop that has a `description`, a `default`, or a `⚠`, write/refresh a
   TSDoc block immediately above the matching member in the component's exported `…Props`
   interface. Emit `@defaultValue` for `default`. Never touch a hand-written block that
   already contains the manifest text (idempotent: regenerate → `git diff --exit-code` clean).
   Delimit generated blocks so they can be re-derived, e.g. a trailing `@see` line, and treat
   a hand-written block as authoritative if it is *longer* than the manifest text (several
   already are, e.g. `card.tsx:34-40`, `chart-frame.tsx:40-46`).
2. **Interface-level passthrough contract.** Above every `…Props` interface, state whether it
   extends an `HTMLAttributes` interface — i.e. whether `className` **and** `style` pass
   through — and, when it does not, list what it does accept. This is the fact report B §9
   could not find. Derived from the `extends` clause, not written by hand.
3. **New guard** `scripts/checks/tsdoc-parity.test.ts`:
   - every manifest prop with a `default` or a `⚠` **must** have TSDoc on its interface member;
   - the TSDoc's `@defaultValue` must equal the destructuring default in the signature
     (reuse `prop-defaults-parity`'s extractor — do not write a second one);
   - fails on any prop whose manifest description is a **placeholder** (`Width of the
     component.`, `Height of the component.`, `Spacing token step`, and the rest of the
     blocklist) — this is what makes WS-7 stick.
   - Phase it: hard-fail on the `default`/`⚠`/placeholder subset immediately; warn-only on the
     remaining ~600 props with a dated ratchet.
4. **Ratchet.** Record the current TSDoc coverage count in the guard; the number may only go up.

### Tests

- `tsdoc-parity` fails when `flex.meta.ts`'s ⚠ is present and `flex.tsx`'s TSDoc is deleted.
- `regen-determinism` still passes (the generator is idempotent).
- A built-artifact assertion: `packages/react/dist/index.d.ts` contains the literal
  string `defaults to \`vertical\`` after `pnpm build`. This is the one that proves the fix
  reached report A's surface.

### Acceptance

`Flex.direction`, `Column.width`, every chart `width`/`height`, `AppShell.className`, and
`Search`'s `--cascivo-search-width` are all discoverable **from the `.d.ts` alone**, with no
site visit — and a revert of any one of them fails CI.

---

## WS-2 (P0) — `cascivo audit --ai` must not fail correct code

**Status: planned.** Mechanisms **B** + **A**. Fixes A#5 (red flag 2). Reproductions in §0.3.

### Spec

**2a — key the contract by registry id, not display name.**
`packages/cli/src/utils/contract-pure.ts` builds `components: Map<string, ComponentInfo>` keyed
by name. Change to: index by id, plus a `byName: Map<string, ComponentInfo[]>`. When a JSX name
resolves to more than one entry, prefer the entry whose channel is `@cascivo/react` (the only
one a Path-B adopter can have imported); if still ambiguous, **union** the prop sets and skip
`missing-prop` entirely for that name rather than guessing. Emit an `info` finding naming the
ambiguity. Affected today: `AppShell`, `Calendar`.

**2b — `children` is not an attribute.**
Remove `children` from `requiredProps` in `contract-pure.ts`, and add a dedicated check that a
component requiring children is not written self-closing (`<Field />`). `findOpeningTags`
already records whether the tag self-closed — carry that flag through instead of inferring.

**2c — `required` parity.**
Extend `scripts/checks/props-parity.test.ts` to compare `required` in both directions against
the TS interface's `?` modifier. Fix `side-nav.meta.ts:27` (`items` → `required: false`) and
sweep the whole catalog for the same drift in the same PR; report the count in the PR body.

**2d — resolve import aliases to the local binding.**
`jsx-props.ts:87-90`: for `X as Y`, track **`Y`** and remember it maps to cascivo's `X`. Also
build the set of names imported from **non**-cascivo modules in the same file and never scan
those, so a bare-name collision (`Link`) can't be audited against the wrong contract even
without an alias.

**2e — stop suggesting spacing tokens for non-spacing values.**
`css-literals.ts`: drop `width`/`height` from `VISUAL_PROPS` for **TSX object literals**
(keep them for `.css` files), or gate the suggestion on the property actually being a CSS
declaration. A `Column.width` is not a spacing token.

**2f — the structural guard: audit a realistic third-party app in CI.**
Add `apps/examples/audit-fixture` (or reuse an existing example): a router-based dashboard
using `AppShell` + `SideNav groups` + `Field` + an aliased cascivo `Link` alongside a router
`Link` + a `DataTable` with column widths. CI runs `cascivo audit --ai` against it and
**requires zero errors**. Every one of the four root causes above is caught by this one fixture
— which is precisely why the audit shipped broken: it had never been run against correct
third-party code.

**2g — severity hygiene.** `--ci` must fail only on `error`. Confirm `info`
(`spread-suppressed`) can never fail a build, and document it.

### Docs (three surfaces)

Only after 2f is green may `docs/*` and `llms.txt` recommend
`"lint": "cascivo doctor --ci && cascivo audit --ai src"`. Until then, **remove that
recommendation** — a gate that reddens a correct repo on day one costs more trust than it buys,
and it takes `doctor` (which the same report calls genuinely useful) down with it.

### Acceptance

Report A's exact six findings produce **zero** errors; a regression test pins each of the four
root causes with its own fixture.

---

## WS-3 (P0) — Router-link parity, and make the escape hatch findable

**Status: planned.** Mechanisms **A** + **D**. Fixes A#2 (red flag 1), A#3, A#10b.

### Problem

`setLinkComponent` covers the config-driven navs; the one component whose entire job is "a
link" is excluded. `Link` renders a literal `<a>` and has no `asChild`, so a router app has
three options and the adopter took the worst one (hand-rolled link CSS copied from tokens,
which will drift). Meanwhile **`asChild` exists on 8 components** — `Button`, `IconButton`,
`ContainedList`, `Item`, `Label`, `Popover`, `Tile`, `TreeView` — and is mentioned in **zero**
`docs/*.md`.

### Spec

1. **`Link asChild`** — same `Slot` shape as `button.tsx:37-41`. `<Link asChild variant="inline"><RouterLink to="/x">…</RouterLink></Link>` must produce a real router link carrying
   `data-variant`/`data-size` and the full `link` class.
2. **Fix the `asChild` underline (A#3).** Add `text-decoration: none;` to `.button` in
   `button.module.css` and to the icon-button rule. While there: an anchor cannot be
   `:disabled`, so mirror the disabled rule on `&[aria-disabled='true']` for all
   `asChild`-capable components — the same class of bug one attribute over.
3. **Publish `--cascivo-link-color` (A#10b)** — declare it in `packages/tokens/src` with its
   current effective default (`var(--cascivo-color-accent)`) so it lands in
   `tokens.catalog.json`, or delete the reference. An undeclared var that themeable CSS reads
   is a token in every respect except the one that makes it discoverable.
4. **Docs — the fix is 80% documentation, so treat it that way.** New guide
   `docs/USING-WITH-A-ROUTER.md`, and make it *impossible to miss*:
   - what `setLinkComponent` does and does **not** cover (navs vs in-content links) — the
     exact blind spot report A named;
   - the `asChild` pattern, with TanStack Router / React Router / Next.js snippets;
   - a table of every `asChild`-capable component (generated from source, see WS-14);
   - linked from `llms.txt` "Start here", `docs/README.md`, `docs/GETTING-STARTED.md`, the
     `setLinkComponent` TSDoc in `core/link.ts`, and `RECIPE-DASHBOARD.md`.
   - `AI-RULES.md` gains a one-line rule: *"an in-content link inside a routed app is
     `<Link asChild>` wrapping your router's Link — never a bare cascivo `Link href`."*

### Tests

- Render `<Link asChild>` over an `<a>`: class, `data-variant`, `data-size` present; the child's
  `href`/`to` preserved.
- jsdom computed-style assertion: `text-decoration-line: none` on an `asChild` `Button` anchor.
- `docs-links` covers the new page; a guard asserts every `asChild`-capable component appears in
  its table (WS-14).

### Acceptance

Report A's option 3 (hand-rolled `.app-link`) is unnecessary and the alternative is reachable
in one search from any of the three surfaces.

---

## WS-4 (P0) — `ComboChart`: fix it, and make the chart-chrome contract shared

**Status: planned.** Mechanism **A**. Fixes B§1, B§2 (red flags 1 and 2).

### Problem

The recipe sends adopters to `ComboChart` for dual-axis dashboards. It clips its left labels
(`60,000` → `),000`), smears its category labels, clips the right axis, has no legend, and
**omits its line series from the screen-reader table**. The library already exports the two
helpers that fix the first two problems, with docstrings describing these exact failures; three
other charts call them and this one does not.

### Spec

1. `combo-chart.tsx:52-54` → `leftMarginForLabels(barTickLabels, plain)`, plus
   `rightMarginForLabels(...)` from WS-5 when `secondAxis` is set (replacing the magic `60`).
2. Pass `labelEvery={xLabelEvery ?? autoLabelStride(labels, innerWidth)}` to the band axis, and
   add the `xLabelEvery` prop with the doc line report B asked for: *"omit this — it is
   auto-computed; pass it only to override."*
3. Add `legend` (reuse `chrome/legend.tsx`), defaulting **on** when both a bar and a line
   series are present. A two-metric chart with no legend is unreadable by construction.
4. **Accessible fallback must include every series** — add a `Line value` column (and one
   column per series generally). This is a WCAG 2.2-AA defect in a package that advertises AA.
5. **API convergence.** Add the accessor-driven form used by every other chart
   (`series: [{id,label,data}]` + `x`/`y` accessors); keep `bars`/`line` as deprecated aliases
   for one minor. Until the alias is removed, `dev-warn` (there is already
   `core/dev-warn.ts`) when `line.length !== bars.length` — today `:117-120` silently
   reinterprets the x values as fractions, which is silent wrong output.
6. **The structural fix — a shared chart-chrome contract.** ComboChart was missed because each
   chart implements its chrome independently. Add
   `packages/charts/src/core/chart-chrome.ts` exposing one `resolveChrome({leftLabels,
   bottomLabels, rightLabels, innerWidth, plain})` → `{margins, labelEvery}`, and migrate every
   chart to it. Then add `scripts/checks/chart-chrome.test.ts` (WS-14), a **table-driven test
   over every exported chart** asserting: left margin ≥ widest left label; stride applied when
   crowded; right margin reserved when a right axis exists or the last bottom label overhangs;
   the a11y fallback has one column per series. A new chart cannot opt out.

### Acceptance

Report B's 30-day requests+bandwidth ComboChart renders with unclipped left labels, strided
category labels, an unclipped right axis, a legend, and a two-column SR table — and the
contract test covers all 25 charts, not just this one.

---

## WS-5 (P1) — Axis chrome: the clipping is systemic

**Status: planned.** Fixes A#7, B§4, B§5.

1. **`orientation: 'y-right'` in `Axis`** — tick at `x=+4`, label at `x=+8`,
   `textAnchor="start"`. Today `axis.tsx:83-92` hardcodes the left-hand geometry and
   `area-chart.tsx:494-499` translates that same axis to the right edge, so right-axis labels
   render **inside the plot**. Migrate every right-axis call site.
2. **`rightMarginForLabels(labels, plain)`** in `use-chart.ts`, sibling to
   `leftMarginForLabels`. Two callers need it: a right axis (its full label width) and a
   bottom axis whose final tick overhangs (half its label width). Apply in every chart via
   WS-4's `resolveChrome`.
3. **`autoLabelStride` must account for the forced last tick.** Either choose a stride that
   divides `n-1` evenly, or drop the last strided label when it would sit within one label
   width of the forced final one. Report B's exact case: 30 labels, stride 4 → `…Jul 21 JulJ2526`.

**Tests:** numeric assertions on emitted `x` / `text-anchor` / resolved margins for each of the
three reported repros (right axis, `7/26/2026` final tick, 30-category stride), plus the
chrome-contract test from WS-4.

---

## WS-6 (P1) — Multi-scale `AreaChart` contradicts its own legend

**Status: planned.** Fixes B§3 (red flag 2 in report B). *Silently wrong data visualization is
worse than an error.*

1. Scale `fill-opacity` down with series count (e.g. `0.25` for one, `0.12` for 2+), or paint
   later series as strokes only. `area-chart.tsx:27` currently uses a single constant.
2. `dev-warn` when two series share an axis and their extents differ by more than ~20×, naming
   `axis: 'right'` + `secondAxis` as the fix.
3. Ensure the legend swatch color is the color actually painted, including when a fill is a
   gradient/pattern (`fillFor(...)`, `:409-465`) — report B saw legend swatches in colors that
   appear nowhere in the plot.
4. Recipe + `llms/area-chart.md` state the rule: two areas on a shared plot must share a scale;
   use a right axis or a `LineChart` for the second metric.

---

## WS-7 (P1) — The charts' responsive story is invisible

**Status: planned.** Mechanisms **D** + **C**. Fixes A#6 (red flag 4).

Charts **are** responsive by default; that fact exists only in `chart-frame.tsx:40-46` (an
internal prop) and `charts/src/index.ts:10` (a module docstring). Every per-chart manifest says
`'Width of the component.'` No guide says it. Report A therefore invented `width={720}`,
`width={420}`, `width={900}`, `width={440}` and wrapped every card in an overflow scroller.

1. Rewrite `width`/`height` descriptions in **all** chart manifests: *"Fixed SVG width in px.
   **Omit for a responsive chart** — the frame fills and tracks its container. A fixed width is
   clamped to the container so it cannot overflow its card."* WS-1 then puts that on the `.d.ts`.
2. `RECIPE-DASHBOARD.md` gains a **Sizing charts** section: omit `width`; set `height` for
   aspect; `useChartSize` is **not** needed (quote its own docstring), and correct the
   `Sparkline` row (`:29`), which currently says "default 120×32, pass `width`/`height` to
   resize" and implies fixed sizing is the only mode.
3. `llms.txt` chart section states it in one line.
4. **Guard:** WS-1's placeholder blocklist makes `'Width of the component.'` a build failure.

---

## WS-8 (P1) — `DataTable` column sizing must not be all-or-nothing

**Status: planned.** Fixes A#4.

`table-layout: fixed` (`data-table.module.css:120-122`, applied whenever paginated) gives
unsized columns only the leftover space with no content floor, and `overflow-wrap: anywhere`
(`:150`) removes the last defence, so a free-form column collapses to ~50px and wraps one
character per line.

**Spec**
1. Apply `table-layout: fixed` **only when every column declares a width**; otherwise
   `table-layout: auto` with declared widths as preferred widths (content minimums then hold).
   The fixed layout exists to keep columns stable across pages — that guarantee is preserved
   exactly when the caller has sized everything, which is the only case it can actually honor.
2. Add `Column.minWidth` (CSS length) and emit a `<colgroup>` rather than per-`th` inline
   widths, so sizing is expressed once per column.
3. Scope `overflow-wrap: anywhere` to columns that **declared** a width (identifier columns —
   the case it was added for); unsized columns get normal wrapping.
4. TSDoc + manifest + recipe state the semantics explicitly (three surfaces): what `width`
   means, that mixing sized and unsized columns is supported, and when the table scrolls
   horizontally instead.

**Test:** 7 columns, 6 sized, 1 free-form — the free column's resolved width is ≥ its
`min-content` width; and an all-sized table still renders `table-layout: fixed`.

---

## WS-9 (P1) — Vocabulary unification (the AI-first tax)

**Status: planned.** Fixes B§6, B§7, B§13b/c, A#10d, A#10e. *For a design system whose pitch is
AI-first, prop-name predictability **is** the product — an agent that cannot predict the prop
pays a compile round-trip per component.*

1. **One `Tone` union** in `@cascivo/core`, with per-component subsets:
   `'neutral' | 'info' | 'success' | 'warning' | 'danger'`. Accept the existing spellings as
   deprecated aliases (`destructive` → `danger`, `error` → `danger`) — no breaking change, one
   canonical name documented everywhere.
2. **One progress vocabulary:** canonical `'pending' | 'active' | 'complete' | 'error'`;
   `Timeline` accepts `current`→`active`, `upcoming`→`pending` as deprecated aliases.
3. **One accessible-name spelling:** `ariaLabel` everywhere, `aria-label` accepted, using the
   exclusive-union shape the 07-25 WS-9 already built for `IconButton`/`Sparkline`. Remaining:
   `Filter`, `StructuredList`, `Progress`.
4. **`OverflowMenu`** accepts `id` as an alias of `value` (`overflow-menu.tsx:15`).
5. **`Toggle`:** add it to the event-naming table in `llms.txt` and `AI-RULES.md` (it is the
   documented exception, currently missing) — do **not** add new value-carrying `onChange`
   props anywhere (CLAUDE.md).
6. **`StructuredList` vs `ContainedList`:** keep both shapes but cross-link them in both
   manifests and both TSDoc blocks — "items-driven; its sibling `ContainedList` takes children."
7. **Guard (WS-14):** `scripts/checks/vocabulary.test.ts` — a canonical map plus an explicit,
   reasoned allowlist; a new component introducing a tone/state value outside the canonical set
   fails CI.

---

## WS-10 (P1) — Manifest examples must compile

**Status: planned.** Mechanism **A**. Fixes B§8 (red flag 4 in report B).

`data-table.meta.ts:278` contains `<Badge tone={…}>`; `Badge` has only `variant`
(`badge.tsx:7`), and no `info` value. It is generated verbatim into
`apps/site/public/llms/data-table.md:119` — *the snippet an adopter is most likely to copy*.

**Spec:** a regen step extracts every `examples[].code` from every manifest into a generated
`.tsx` per package (imports resolved from `@cascivo/react` / `@cascivo/charts`), and `vp run -r
check` type-checks it. Fragments that are not self-contained expressions get a documented
wrapper convention; anything that genuinely cannot compile must carry an explicit
`// @example-skip: <reason>` and the count of skips is asserted not to grow.

**Also fix now:** the `Badge tone=` example, and sweep every manifest example for the same
class in the same PR (report the count).

**Acceptance:** deleting `variant` from `Badge` fails CI *via an example*, not just via
`props-parity`.

---

## WS-11 (P1) — Channel metadata must be symbol-level

**Status: planned.** Mechanism **B**. Fixes B§10.

`packageFor()` (`scripts/llms/generate.ts:191-194`) asks only whether the entry's **display
name** is exported. `toast`'s display name is `Toast`, which is not exported — but
`ToastProvider`, `useToast`, `dismissAllToasts` and `ToastOptions` all are
(`react/src/index.ts:58`, `toast.tsx:39,121,125`). So the recipe's channel column — which
report B explicitly says it *trusted because it is CI-checked* — is wrong for the one entry it
tested that way. This is the same proxy-instead-of-truth defect the 07-25 WS-6 fixed one level
up (path → export list); it now needs one more level (name → symbol set).

1. Derive an entry's channel from the intersection of **all** its public symbols with the real
   export list, and label partial entries precisely:
   `npm @cascivo/react (ToastProvider, useToast) · the Toast component itself is copy-paste`.
2. Extend `scripts/checks/llms-channels.test.ts` to symbol level, no allowlist.
3. `layout/page-header` (and `layout/section`, `layout/dashboard-layout`,
   `layout/settings-layout`, `layout/split-view`, `skip-nav`): **decide** — export from
   `@cascivo/react`, or keep copy-only. Report B hand-composed a page header in 30 lines on six
   routes; report A did the same. Two independent adopters hand-writing the same component is
   the signal. **Recommendation: export `PageHeader`** (it is `Heading` + `Text` + `Flex` +
   slots, no new dependency), and if the others stay copy-only, put the composition inline in
   `RECIPE-DASHBOARD.md` so nobody writes it blind.

---

## WS-12 (P2) — Component papercuts (each small, each hit in one build)

**Status: planned.**

| Item | Fix | Evidence |
| --- | --- | --- |
| `Card padding="none"` zeroes `CardHeader`/`CardContent` | Scope the private var: subcomponents fall back to their own default rather than inheriting `--_card-p: 0`. `padding="none"` should mean "no padding on the card box", not "no padding anywhere". | `card.module.css:6-9,36,82,90` |
| `Input` (and 10 siblings) overflow a grid track | Add `min-inline-size: 0` to `.wrapper` **and** the control in all 11 field-family modules (`input`, `search`, `number-input`, `combobox`, `date-picker`, `time-picker`, `multi-select`, `tags-input`, `otp-input`, `password-input`, `file-uploader`). 15 other modules already use this idiom — this is applying an existing convention, not inventing one. | `input.module.css:2-23,34` |
| `Sparkline` won't compress in flex | `min-inline-size: 0` + a percentage/fluid mode; document that the 120×32 default is a *preferred* size. | `sparkline.tsx:27-28` |
| `Kpi` ships card chrome as **inline styles** | Move to a CSS module in `@layer cascivo.component`. Inline styles beat every layer, so `Kpi` is currently un-overridable — a direct CLAUDE.md violation that `unlayered:check` cannot see because it only reads `.css`. Extend that check to flag **HTML** (non-SVG) inline visual styles in shipped components (WS-14). | `kpi.tsx:51-60` |
| `Stat` vs `Kpi` look like different products | Give `Stat` an opt-in `card` prop (or have `Kpi` drop its chrome), and say which is which in `RECIPE-DASHBOARD.md:28` in one sentence. | `stat.module.css:2-7` vs above |
| `AppShell` accepts no `style`; its tokens have no application point | Make `AppShellProps` extend `HTMLAttributes<HTMLDivElement>` like every other layout primitive (`flex.tsx:7`); document `className` in the manifest (see next row) and show where `--cascivo-shell-aside-inline-size` / `--cascivo-shell-panel-inline-size` are meant to be set. | `app-shell.tsx:13-32` |
| `className`/`style` invisible catalog-wide | `props-parity.test.ts:56` skips them by design, so no surface states them. Fix at the **interface** level via WS-1 §2 (one generated line per component) rather than adding 192 manifest entries. | — |
| `PieChart` has no `tooltip` prop | Add it for parity with Area/Bar/Line/Combo. | `pie-chart.tsx:39-40` |
| `Search` width affordance documented only in a CSS comment | Publish `--cascivo-search-width` in the token catalog + prop TSDoc. | `search.module.css:7-9` |
| `data-theme` scoping unclear at point of use | One owner (`THEMING.md`), included/linked from `GETTING-STARTED.md` and `llms.txt`: element-scoped vs `ThemeProvider`-on-`<html>`, and when each applies. | Mechanism C |
| `AppShell` is `100dvh` with an internal scroller | One line in the `app-shell` docs for visual-regression users (`fullPage` screenshots capture the viewport). | by design |
| JS bundle size "undocumented" | The numbers exist (`BENCHMARKS.md:17-24`). Link `BENCHMARKS.md` from `llms.txt`, `docs/README.md` and `GETTING-STARTED.md`, and add a Path-B real-app figure next to the CSS ones. Two adopters asked; neither found it. | Mechanism D |

---

## WS-13 (P2) — Cross-package name collisions

**Status: planned.** Fixes A#9.

`Text`, `Calendar` and `Glyph` each exist in two packages a dashboard file imports together;
`charts/src/index.ts` re-exports its chrome primitives with `export *`. Nothing breaks loudly —
`Text` silently resolving to the SVG chart primitive instead of the typography component is the
failure mode.

**Options:** (a) rename chart chrome to `ChartText` / `ChartGlyph` with deprecated aliases;
(b) move chrome primitives to a `@cascivo/charts/primitives` subpath and keep the root export
to charts only. **Recommendation: (b)**, then (a) for anything that must stay at the root — it
matches how the toolkit is described in `charts/src/index.ts:20-24` and needs no renames in
adopter code that imports charts only.

**Guard (WS-14):** a test that computes the exported-name intersection across
`@cascivo/react` / `@cascivo/charts` / `@cascivo/icons` and fails on any **new** collision, with
the current set as a dated, shrinking allowlist.

---

## WS-14 — Guards (each lands with its workstream, each observed failing on a deliberate revert)

| Guard | Catches | Mech | WS |
| --- | --- | --- | --- |
| `tsdoc-parity` (+ placeholder blocklist + coverage ratchet) | a fact documented in the manifest but absent from the `.d.ts` | D | WS-1 |
| built-`.d.ts` string assertion | the generated TSDoc not surviving the build | D | WS-1 |
| `audit-fixture` app audited in CI (zero errors) | every class of audit false positive, including ones nobody predicted | B | WS-2 |
| `props-parity` extended to `required` | manifest/interface optionality drift | B | WS-2 |
| `chart-chrome` contract test (all 25 charts) | a chart skipping margin/stride/legend/a11y-fallback duties | A | WS-4 |
| example type-check | a docs example that does not compile | A | WS-10 |
| `llms-channels` at symbol level | channel metadata disagreeing with real exports | B | WS-11 |
| `vocabulary` test | a new tone/state value outside the canonical set | — | WS-9 |
| `unlayered` extended to HTML inline styles | un-overridable component chrome | A | WS-12 |
| export-collision test | a **new** cross-package name collision | — | WS-13 |
| `asChild` doc-coverage test | an `asChild`-capable component missing from the router guide | D | WS-3 |
| grid-overflow sweep (extend `mobile-sweep`) | a control with no `min-inline-size: 0` inside a grid track | — | WS-12 |

**Rule:** a guard that has never been observed failing is not a guard. Each PR must record the
deliberate revert it was watched to catch.

---

## WS-15 — Publish, and close the carry-forward chain

**Status: open — inherited from the 07-25 plan's WS-15.**

1. Publish the 07-24 + 07-25 trains **and** this plan's fixes; flip every affected workstream
   header to `published vX.Y.Z`.
2. Run the deployed-docs freshness probe (`scripts/checks/deployed-freshness.sh`) and the
   npm-parity canary after each publish.
3. Finish the 07-23 WS-J Playwright browser leg.
4. Update `README.md`'s **Current live tracker** to point at this plan, and add a forward
   pointer in the 07-25 plan's header.

Both 07-26 adopters tested npm. Every recurrence in this chain has involved an adopter meeting
published artifacts that lagged the repo. **Nothing here is done until it is on npm.**

---

## §A — Refuted / partially refuted (do not "fix" these; fix their documentation)

| Claim | Reality | Action |
| --- | --- | --- |
| A#6 "charts have no fluid/container mode" | They are responsive by default — omit `width` (`chart-frame.tsx:40-46`) | WS-7 (docs) |
| A#1 "neither the interface nor `AI-RULES.md` states the `Flex` default" | The manifest, `registry.json`, `llms.txt` and the component index all state it with a ⚠; the **`.d.ts` does not** | WS-1 |
| B§9 "`AppShell` accepts no `className`" | `app-shell.tsx:31` declares it; the **manifest** omits it and `props-parity` skips it by design. `style` genuinely is missing | WS-12, WS-1 |
| B§13d "`Search` has no width affordance" | `--cascivo-search-width` exists (`search.module.css:9`), documented only in a CSS comment | WS-12 |
| B RF7 "JS bundle size is not documented at all" | `BENCHMARKS.md:17-24` publishes it; nothing links there | WS-12 |
| B "`turbo run format` reformats sibling apps" | not a cascivo issue (the adopter says so) | none |

## §B — Explicitly confirmed as working (do not regress)

Both reports independently praise, and these must stay true: zero-config SSR under TanStack
Start; `setLinkComponent` for config-driven navs; `npx @cascivo/docs` offline docs;
`RECIPE-DASHBOARD.md`'s need→component→registry-id→**channel** table; `AI-RULES.md`'s
reactivity contract (including "don't sprinkle `useSignals()`"); `useTheme()` as a tuple;
`themePreloadScript()` + `suppressHydrationWarning`; `cascivo doctor --ci`; per-component CSS
tree-shaking (measured 137 KB of a 273 KB sheet); `AppShell`/`CommandMenu`/`LogViewer`/
`DataTable` behavior completeness; the icon-name mapping table; `RelativeTime.now` for SSR
determinism; the `@layer` contract with an app-local slot. **Report B: "Would I adopt it? For
this task, yes — and that is not a close call."** The findings above are the last mile, not a
verdict on the core.
