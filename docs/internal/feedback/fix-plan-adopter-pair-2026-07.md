# Fix plan — paired adopter analyses (2026-07)

**Status:** Planning artifact only — no code changes. Written for an implementing agent
(Opus); every item carries file:line pointers, effort, and a verification gate.
**Source:** two external experience analyses of building apps with cascivo:

- **Analysis 1** — an agent-driven dashboard build against the *published* packages
  (`@cascivo/react` 0.3.8, `@cascivo/charts` 0.3.4, `@cascivo/themes` 0.2.7,
  `@cascivo/core` 0.2.3). Concrete, reproducible friction; verdict positive
  ("best machine-readable docs I've used") with three shipped footguns.
- **Analysis 2** — a strategic review (Vercel-dark-theme build). Higher-level;
  several claims are stale or unverifiable, and its four proposals need scoping
  against infrastructure that already exists.

**Verification:** every claim below was checked against current `main` (2026-07-11,
`@cascivo/react` 0.4.1, registry 0.4.1, 192 entries). A large fraction of Analysis 1's
complaints are **already fixed** on `main` (PRs #128/#130 and the changesets since the
adopter's pinned versions) — the triage table prevents re-fixing non-issues. What
remains real clusters into: **(A)** the charts `styles.css` footgun is absent from every
*generated* AI surface, **(B)** list keys use non-unique fields across ~18 components,
**(C)** distribution-channel opacity in the llms.txt index and CLI, **(D)** two API-shape
papercuts (Toggle `label`, `useToast`), and **(E)** four strategic proposals to scope.

---

## 0. Triage — claim → verdict (do not re-fix the refuted rows)

### Analysis 1

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 6.1 | Component index hides 3 distribution channels | **CONFIRMED (worse: 4 npm channels)** | llms.txt index emits no channel marker (`scripts/llms/generate.ts:438-447`); registry `type`+`install` fields exist but aren't surfaced. Channels: `@cascivo/react` (125 `component`), `@cascivo/charts` (25 `chart`), `@cascivo/flow` (10 `flow`), `@cascivo/editor` (2 `editor`) — all npm; `layout` (14), `block` (10), `section` (6) — copy-paste. |
| 6.1 | `app-shell` vs `layout/app-shell` unsignposted | **CONFIRMED (there are 3)** | `packages/components/src/app-shell/app-shell.tsx` (npm, `nav` prop, self-contained), `packages/layouts/src/app-shell/app-shell.tsx` (copy-paste, `sideNav`/`aside`/`ShellState`), plus `packages/components/src/blocks/app-shell/` (marketing block). No cross-links anywhere. |
| 6.2 | `@cascivo/charts/styles.css` required, undocumented; missing import shows raw data tables | **CONFIRMED** | Export at `packages/charts/package.json:39`; `packages/charts/src/index.ts` imports no CSS. Fallback `<table>` hidden only by `.fallback` class in `chart-frame.module.css:53-61` (rendered `chart-frame.tsx:244`) — no inline hiding. Import documented **only** in the hand-written `packages/charts/README.md:33`; absent from llms.txt, per-chart `.md` (`scripts/llms/generate.ts:154-165`), CLI `add` output (`packages/cli/src/commands/add.ts:247-254`), and registry entries. |
| 6.3 | Nav collections keyed by `href` → duplicate-key warnings | **CONFIRMED (broader)** | ShellHeader keys nav links by `href` (`shell-header.tsx:238`, menus by `label` :236, sub-items by `href` :160); SideNav keys by `label` (`side-nav.tsx:350,358,427,497`); ~14 more components key by `label`/`value` (list in Wave 1.1). No `id` field on any nav item interface except `ShellHeaderAction` (which has one and uses it, `shell-header.tsx:259`). |
| 6.4 | `useToast()` returns `{ toast }`, not callable | **CONFIRMED** | `packages/components/src/toast/toast.tsx:108-110`. |
| 6.4 | Toggle `label` renders visible text | **CONFIRMED** | `toggle.tsx:57`; `aria-label` passthrough already works (`...props` spread :52). Same pattern in Checkbox/Radio. |
| 6.4 | `Stack` name collision (card-pile vs layout) | **CONFIRMED** | npm `Stack` = card-pile with `offset` (`packages/components/src/stack/stack.tsx`, exported `packages/react/src/index.ts:142`); flex `layout/stack` copy-paste only (`packages/layouts/src/stack/stack.tsx`). `cascivo list` even tips "`cascivo add stack` resolves to `layout/stack`" (`list.ts:70-73`) — bare-name `stack` and import `Stack` are *different components*. |
| 6.5 | Human docs 404 (client-routed SPA) | **ALREADY FIXED** | `prerenderPages()` SSGs `/docs/components/*`, categories, themes, blog + writes SPA-shell `404.html` (`apps/site/vite.config.ts:530-708`, PRs #128/#130). No work. |
| 6.6 | `cascivo init` interactive, no CI flag, hangs non-TTY | **ALREADY FIXED / REFUTED** | `--yes`/`-y` + `stdin.isTTY` auto-default (`packages/cli/src/commands/init.ts:42,53-56`; help text `index.ts:63-70`). No work. |
| §8 | CLI reports `cascivo 0.0.0` | **REFUTED** | CLI is 0.3.2, read from its package.json at runtime (`packages/cli/src/index.ts:20-22`). The `0.0.0` is the deliberately-pinned private `@cascivo/components` (`scripts/registry/generate.ts:140-151`). Optional doc clarification only. |
| §8 | Versions don't align; pin + watch breaking-changes.json | **BY DESIGN, tooling exists** | Independent changesets versioning; `peerVersions` floors per registry entry + `cascivo doctor --drift` shipped in #130; `scripts/changes/generate.ts` emits `breaking-changes.json`. Residual work: a published compatibility statement (Wave 2.4). |
| §8 | Mandatory `@preact/signals-react` peer | **BY DESIGN** | Peer (not dep) of react/core/i18n/charts/ai. Documented in every install line. No change — re-litigating the reactivity model is out of scope. |

### Analysis 2

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 2.1 | Animated tab indicators / fluid dropdowns / layout transitions need manual wiring | **⅓ TRUE** | Dropdown is already fluid out of the box (`dropdown.module.css:18-81` — `@starting-style`, `allow-discrete`, anchor positioning). Tabs have an animated per-trigger indicator (scale-in, `tabs.module.css:33-65`) but **no sliding shared indicator**. **No** view-transition/FLIP helper exists anywhere (repo-wide zero hits for `startViewTransition`/`view-transition-name`); `packages/core/src/presence.tsx` only defers unmount. |
| 2.2 | Utilities scattered across packages incl. `@cascivo/headless`; no unified index | **PARTLY FABRICATED** | `@cascivo/headless` does not exist (repo-wide zero hits). 14 public packages is real, but llms.txt already indexes registry/context/tokens/icons/breaking-changes catalogs. Residual: channel clarity (Wave 0/2), not package consolidation. |
| 3.1 | No visual/structural regression checking in CI | **STALE / PARTIAL** | Playwright screenshot suite over all 192 components × 3 themes exists (`apps/site/test/visual.spec.ts`, baselines committed) — but **nightly-only, not PR-blocking** (`.github/workflows/visual.yml`, deliberate). Real gap: nothing structural runs on PRs. → Wave 3.1. |
| 3.2 | High-throughput streams cause flicker/blocking at the React boundary | **LARGELY ADDRESSED** | `createStreamBuffer`/`useStreamBuffer` (rAF-coalesced ring buffer, `packages/core/src/stream-buffer.ts`), `useStreamSeries` + LTTB decimation (`packages/charts/src/stream/use-stream-series.ts`), virtualized `LogViewer` (100k-line buffer). Real gap: no streaming bench scenario and no discoverability of these primitives in llms.txt guidance. → Wave 3.4. |
| P1 | Visual topology diffs in CI | Scope → Wave 3.1 (structural snapshots on PRs; pixel suite already exists nightly). |
| P2 | Property-based testing, chaos inputs | **PARTIAL** — fast-check already tests charts' numeric engine (`stats.test.ts`, `scale.test.ts`); declared-but-unused devDep in `packages/editor` + `packages/flow`. → Wave 3.2. |
| P3 | Runtime validation schemas (Zod-like) on data streams | **PARTIAL** — bespoke `validateView()` exists for the JSON-render pipeline (`packages/render/src/validate.ts`); charts engine has finite-number guards. → Wave 3.3 (dev-mode guards, **not** a schema library on every prop). |
| P4 | Production telemetry feedback loop for agents | **DECLINE as runtime telemetry** — no telemetry exists and adding phone-home to a component library is a trust/privacy/weight regression for a copy-paste-model system. Rationale + agent-visible alternative in Wave 3.5. |

---

## Wave 0 — Generated-docs truth fixes (S, one PR, highest value/effort ratio)

The single worst verified failure: an agent following **any** generated surface
(llms.txt, per-chart `.md`, `cascivo add` output) ships the visible-raw-data-table bug,
because the required charts CSS import exists only in a hand-written README.

### 0.1 Charts `styles.css` on every generated surface — S

- `scripts/llms/generate.ts:154-165` (chart branch of `componentMarkdown`): add
  `import '@cascivo/charts/styles.css'` to the install snippet, with the one-line
  consequence ("without it, the accessible data-table fallback renders visibly").
- `scripts/llms/generate.ts:342-371` (llms.txt "How to use it" / setup section):
  mention the charts stylesheet wherever `@cascivo/react/styles.css` is shown
  (":45,:61" in the generated `apps/site/public/llms.txt`), scoped "if you use charts".
- `packages/cli/src/commands/add.ts:247-254` (`type === 'chart'` branch): add a fourth
  printed line: `And import its stylesheet once: import '@cascivo/charts/styles.css'`.
- Check whether `@cascivo/flow` / `@cascivo/editor` have the same shape (a required
  CSS export not mentioned in their generated install blocks — the editor's generated
  md already includes it, e.g. `apps/site/public/llms/editor/code-editor.md:54`; make
  the generator emit the stylesheet line **from the package export map**, not
  hand-maintained per-type strings, so future npm packages can't regress).
- **Verify:** `pnpm regen`; grep every generated `apps/site/public/llms/chart/*.md` and
  `llms.txt` for `@cascivo/charts/styles.css`; CLI unit test asserting the `add
  chart/*` output contains the stylesheet line. `git diff` shows only generated files +
  the two generators + CLI.

### 0.2 Channel annotation in the llms.txt component index — S

`scripts/llms/generate.ts:438-447` currently emits
`- [name](…/llms/<name>.md) — <description>`. Append a channel marker derived from
`entry.type` + `entry.install` (the fields already exist in `registry.json`):

- `component` → `(npm @cascivo/react · or copy-paste)`
- `chart`/`flow`/`editor` → `(npm ${entry.install})`
- `layout`/`block`/`section` → `(copy-paste)`

Keep it terse — this index is the highest-traffic agent surface, and "which package
does this come from" was the #1 reported time sink. Apply the same marker to the
"Component intent summaries" section (lines 449-458) **only if** it doesn't bloat the
file beyond taste; the index is the must-have.

- **Verify:** `pnpm regen`; assert in `scripts/checks/` (extend an existing llms check
  if present, else a small node:test) that every index line for a `chart|flow|editor`
  entry names its npm package and every `layout|block|section` line says copy-paste.

### 0.3 Name-collision signposts: `stack`, `app-shell` — S

Pure metadata/docs; no renames in this wave (renames are Wave 2.2's decision).

- `packages/components/src/stack/stack.meta.ts`: description/intent must say
  "card-pile visual effect — **not** a flex layout; for vertical/horizontal stacking
  use `layout/stack`". `packages/layouts/src/stack/stack.meta.ts`: the mirror note.
  Use the meta `intent.related` / `whenNotToUse` fields (they render on ComponentPage
  and in context docs since #130).
- Same treatment for the app-shell trio: `app-shell` (npm, simple header+nav+drawer),
  `layout/app-shell` (copy-paste, persisted sidebar + ShellState + progress bar),
  `block/app-shell` (marketing demo block). Each meta's intent cross-references the
  other two with a one-line "choose this when…".
- `packages/cli/src/commands/list.ts:10-15` `TYPE_LABELS`: add the missing labels so
  groups don't render as raw keys — `chart: 'Charts (npm: @cascivo/charts)'`,
  `flow: 'Flow (npm: @cascivo/flow)'`, `editor: 'Editor (npm: @cascivo/editor)'`, and
  suffix the existing copy-paste groups: `layout: 'Layouts (copy-paste)'`, etc.
- **Verify:** `pnpm regen` (registry/context/llms pick up meta changes); `pnpm
  meta:check`; CLI `formatList` unit test covers the new labels.

### 0.4 API-surprise documentation: `useToast`, Toggle `label` — S

No API changes (see Wave 1.3 for the decision record).

- `toast.tsx:108-110`: JSDoc on `useToast` — "returns `{ toast }`; destructure:
  `const { toast } = useToast()`". Ensure `toast.meta.ts` examples show the
  destructure as the first line of the first example.
- `toggle.tsx` `label` prop JSDoc: "renders a **visible** label that is also the
  accessible name; when a visible heading already labels the control, omit `label`
  and pass `aria-label` instead." Add the same as `intent.antiPatterns` in
  `toggle.meta.ts` (mirrors the adopter's exact fix). Audit Checkbox/Radio JSDoc for
  the same wording since they share the pattern.
- **Verify:** `pnpm regen && pnpm meta:check`; generated `llms/toggle.md` and
  `llms/toast.md` contain the guidance.

---

## Wave 1 — Component correctness fixes (M, one PR)

### 1.1 Stable list keys across collection-rendering components — M

The reported symptom (`Encountered two children with the same key, "#"`) is one
instance of a class: keying by a caller-supplied, non-guaranteed-unique field. Fix the
class once, uniformly:

1. **Add optional `id?: string`** to the item interfaces that lack it:
   `SideNavItem` + `SideNavLinkSubItem` (`side-nav.tsx:20-55`), `ShellHeaderNavLink` +
   `ShellHeaderNavMenu` + `ShellHeaderNavMenuItem` (`shell-header.tsx:14-31`), and the
   action/link item types of the other affected components below. (`ShellHeaderAction`
   already has `id` — it is the template.)
2. **Key by `item.id ?? <existing field>`** everywhere, and where duplicates are
   plausible without `id`, fall back to the index-composite pattern Breadcrumb already
   uses (`breadcrumb.tsx:34`, `` key={`${index}-${item.label}`} ``). Concretely:
   nav-like static lists → `` item.id ?? `${i}-${item.href ?? item.label}` ``.
3. **Sweep list** (all confirmed by grep): `side-nav.tsx:350,358,427,497` (+ index-keyed
   sub-items :262-270,410-417 — fine as-is, static), `shell-header.tsx:160,236,238`,
   `header/header.tsx:48`, `data-table.tsx:352`, `fab.tsx:142`, `swipe-item.tsx:89`,
   `blocks/app-shell/app-shell.tsx:89`, `blocks/site-footer/site-footer.tsx:55`,
   `blocks/testimonials/testimonials.tsx:43`. The `value`-keyed option lists
   (combobox/select/dropdown/multi-select/segmented-control/toggle-group/filter/
   native-select) may keep `value` keys — `value` is semantically unique for option
   sets — but add `id` acceptance only if it falls out for free; do not churn them.
4. **Docs:** the item-type JSDoc for `id` states "used as the React key; provide when
   `href`/`label` may repeat (e.g. placeholder `#` links)".
5. This is **additive and non-breaking** (all-new optional field; key fallback
   preserves today's keys when items are unique).

- **Verify:** regression test per changed component rendering two items with identical
  `href`/`label` and asserting no `console.error` duplicate-key warning (spy pattern —
  Testing Library + vitest `vi.spyOn(console, 'error')`); `pnpm regen` (props tables
  update from types); full gate.

### 1.2 Charts a11y fallback must be hidden even without `styles.css` — S

Defense in depth for the footgun class 0.1 documents away: the visually-hidden clip
for the fallback table lives only in the CSS module (`chart-frame.module.css:53-61`).
Apply the same declarations as an **inline `style`** on the fallback wrapper in
`chart-frame.tsx:244` (position absolute, 1px, clip-path inset(50%), overflow hidden,
white-space nowrap — mirror the aria-live span at :259-269, which already inlines its
hiding and is why it never had this bug). Keep the class too (theming/consistency).
Now a missing stylesheet degrades charts *visually* (fonts/spacing) instead of dumping
raw `x / y` tables — "ugly" becomes "slightly less styled".

- **Verify:** unit test in `packages/charts` rendering a chart **without** the CSS and
  asserting the fallback wrapper's inline style hides it (assert on the `style`
  attribute; JSDOM won't compute layout). Existing `canvas-layer.test.tsx:68` table
  assertion still passes.

### 1.3 Decision record: `useToast` and Toggle stay as-is — no code

- Making `useToast()`'s return callable (`Object.assign(fn, { toast: fn })`) is cute
  but creates two documented shapes forever; the typecheck already catches misuse in
  seconds (the adopter said exactly that). **Keep `{ toast }`**, fix docs (0.4).
- A `labelHidden` prop on Toggle duplicates what `aria-label` passthrough already
  does. **No new prop** (CLAUDE.md simplicity rule), fix docs (0.4).

---

## Wave 2 — Distribution clarity (M, one PR + one decision)

### 2.1 Surface the channel in `cascivo view` and `add` — S

- `view` output: print a `Distribution:` line derived from `type`/`install`
  (npm package name, or "copy-paste via cascivo add").
- `add` for copy-paste types already copies; for npm types it prints (0.1 covers
  charts text; make flow/editor branches identical in shape).
- **Verify:** CLI unit tests on the formatted output for one entry per channel.

### 2.2 DECISION — rename the card-pile `Stack` export — needs maintainer sign-off

The collision is real and agent-hostile: `import { Stack } from '@cascivo/react'` is a
card-pile; `cascivo add stack` installs a flex Stack. Options:

- **(a) Recommended:** additive alias — export `CardStack` (new canonical name) from
  `packages/react/src/index.ts` alongside a deprecated `Stack` re-export
  (`@deprecated use CardStack; for flex layout use layout/stack` JSDoc). Registry
  entry renames to `card-stack` with an alias record if the registry schema supports
  aliases; otherwise keep entry name, change `meta.name` to `CardStack`. Remove the
  deprecated export at the next minor per the breaking-changes flow
  (`scripts/changes/generate.ts` picks it up from the changeset).
- (b) Do nothing beyond Wave 0.3 signposting.

If (a): changeset required; sweep internal usages (`apps/*`, storybook stories,
templates) — grep `from '@cascivo/react'` + `<Stack`. Do **not** touch
`layout/stack`.

### 2.3 AppShell — no rename, richer boundary docs — S

The npm `AppShell` and `layout/app-shell` serve different maturity tiers (drop-in vs
owned shell with persistence). Keep both; 0.3's cross-links are the fix. Additionally,
add a short "Which app shell?" paragraph to the layout's generated md via its meta
intent — the two prop surfaces (`nav` vs `sideNav`/`aside`) should be contrasted in one
table there.

### 2.4 Compatibility statement — S

One paragraph on the installation docs page + llms.txt: packages version
independently; per-entry `peerVersions` in `registry.json` is the compatibility truth;
`cascivo doctor --drift` diagnoses skew; `breaking-changes.json` is the feed to watch.
(All mechanisms exist since #130 — this is discoverability, and it converts
Analysis 1's "pin your versions" red flag into documented posture.)

- **Verify:** `pnpm docs-routes:check`, `pnpm regen` clean.

---

## Wave 3 — Strategic proposals, scoped to what's real (separate PRs, ordered by value)

### 3.1 PR-blocking structural snapshots (Analysis 2, Proposal 1) — L

The pixel suite (nightly `visual.yml`) intentionally doesn't block PRs. The cheap,
deterministic complement the proposal actually needs is a **DOM-structure snapshot**:

- New check (suggest `scripts/checks/` + a vitest project in `packages/components`):
  for each component with a meta example (or a curated subject list seeded from
  `scripts/registry/standalone-smoke.ts` `SUBJECTS`), render with Testing Library and
  serialize a normalized tree — tag, `role`, `aria-*`, `data-state`, `data-*` hooks —
  **no classes, no text, no styles** (those churn legitimately). Commit baselines as
  JSON (`test/structure/*.json`); diff in CI on PRs touching `packages/components`,
  `packages/layouts`, `packages/core`.
- Failure output = a readable tree diff, so an agent-authored PR that silently drops
  a `role` or unwraps a landmark fails with an explanation, not a pixel blob.
- Explicit non-goals: no screenshots on PRs (hosted-runner noise — the repo already
  learned this, see `bench.yml`'s `timing-informational` split), no Chromatic.
- **Verify:** deliberately remove an `aria-label` from a component locally → red;
  baseline-update path documented (`--update` flag writes new JSON, reviewed in diff).

### 3.2 Property-based/chaos testing expansion (Proposal 2) — M

- **Housekeeping first:** `fast-check` is a declared-unused devDep in
  `packages/editor/package.json:62` and `packages/flow/package.json:62` — either add
  one real property test per package (editor: tokenizer round-trip; flow: graph-layout
  invariants) or remove the deps. Don't leave them lying.
- Extend chaos-input properties where malformed input is a real boundary:
  - `packages/render/src/validate.ts` — fuzz view configs (unknown components, junk
    prop types, deep nesting): `validateView` must never throw, always return
    structured errors.
  - `packages/components/src/log-viewer` `parseAnsi` — arbitrary byte-ish strings
    never throw, output segments re-concatenate to input text.
  - `DataTable` — rows with extreme string lengths / missing fields render without
    throwing (property test at low iteration count; it's a DOM render).
- Explicit non-goal: "millions of randomized inputs in a shadow sandbox" (Analysis 2's
  wording) — CI budget stays sane; default fast-check runs (100 cases) per property.
- **Verify:** `pnpm test` green; each new property demonstrably catches a seeded bug
  (mutate the target locally → red) before merge.

### 3.3 Dev-mode data guards for charts/DataTable (Proposal 3) — S/M

Not a schema library. Follow the existing bespoke pattern (`render/validate.ts`,
`scale.ts:24` finite guards):

- A tiny dev-only helper in `packages/charts` (`process.env.NODE_ENV !== 'production'`
  gated, tree-shaken in prod builds) that warns once per chart instance when series
  data contains non-finite numbers, mixed types, or mismatched series lengths —
  naming the chart and the offending index. The engine already *tolerates* bad data
  (`stats.ts` `?? 0` fallbacks); the gap is that it does so **silently**, which reads
  as "wrong chart" not "bad data".
- Same shape for `DataTable`: dev warn when `rows` contain keys absent from `columns`
  accessors... **only if** a cheap check exists; skip if it requires walking every row
  per render — never add per-render O(rows) work for a warning. Sampling the first row
  is acceptable.
- Explicit non-goals: zod/valibot dependency in component packages; runtime validation
  in production paths; validating signal stores (`@cascivo/storage` payloads are the
  consumer's contract).
- **Verify:** unit tests asserting the warning fires once in dev on bad data and never
  in production mode; bundle-budget check (`pnpm audit:bundle`) unchanged for prod.

### 3.4 Streaming discoverability + bench scenario (Analysis 2 §3.2) — M

The primitives exist and are good (`stream-buffer.ts` rAF ring buffer,
`useStreamSeries` + decimation, virtualized `LogViewer`); the reviewer plainly didn't
find them. Two fixes:

- **Discoverability:** add a "High-throughput / streaming data" subsection to the
  llms.txt authoring-rules/how-to section (`scripts/llms/generate.ts` ~:342-430):
  name `useStreamBuffer`, `useStreamSeries`, `LogViewer`, and the anti-pattern they
  replace (`[...arr.slice(1), line]` per event). One paragraph + one snippet.
- **Bench:** add a streaming scenario to `apps/bench` (append N lines/sec into
  LogViewer + a live LineChart via the stream utilities; measure dropped frames /
  long tasks with the existing runner plumbing in `apps/bench/runner/src/scenarios.ts`),
  wired into the weekly `bench.yml` `deterministic` job **as render-count/allocation
  determinism** where possible, timing-informational otherwise. This turns "no
  flicker/thread-blockage under load" from a claim into a tracked number.
- **Verify:** scenario runs in `pnpm bench` locally; `ci-compare.ts` gains the new
  keys; docs regen includes the new llms.txt section.

### 3.5 Telemetry (Proposal 4) — DECLINED as runtime telemetry; agent-facing alternative — S

Runtime phone-home from a design-system library is rejected: privacy/consent burden,
bundle weight, and it contradicts the copy-paste "you own the code" model. Record this
in the plan and, if desired, one FAQ line. The *legitimate need* — "agents should see
how components behave in the wild" — is served by machine-readable **CI feedback**
that already exists and only needs indexing for agents: `breaking-changes.json`,
`apps/bench/results/results.json`, the axe sweep, visual-regression artifacts. Action:
add a short "Feedback signals for agents" list to llms.txt linking the machine-readable
CI outputs that are already public. Nothing else.

### 3.6 OPTIONAL (design decision) — sliding Tabs indicator

Analysis 2's only concrete component gap that survived verification: Tabs animate
per-trigger (scale-in ::after, `tabs.module.css:33-65`) rather than sliding a shared
indicator between triggers. A CSS-only sliding indicator is feasible with anchor
positioning (the codebase already uses `anchor-name` in dropdown) + `transition` on
`inset-inline`, progressive-enhancement-gated per the CSS rules in CLAUDE.md (static
fallback = current scale-in). Do **not** add JS measurement/FLIP. Ship only if design
signs off; otherwise close as working-as-intended.

---

## Suggested PR slicing & order

1. **PR 1 — Wave 0** (generators + CLI text + metas + JSDoc; mostly regenerated files).
2. **PR 2 — Wave 1** (keys sweep + charts inline hiding + tests).
3. **PR 3 — Wave 2.1/2.3/2.4** (CLI view/list + docs). Wave 2.2 lands separately
   after the maintainer decision, with a changeset.
4. **PRs 4-7 — Wave 3.x** independently, in the order 3.4 → 3.2 → 3.3 → 3.1 (value
   per effort; 3.1 is the big one). 3.5 is a paragraph inside PR 1 or 4. 3.6 only on
   design sign-off.

## Files touched (index)

**Wave 0:** `scripts/llms/generate.ts`, `packages/cli/src/commands/add.ts`,
`packages/cli/src/commands/list.ts`, `packages/components/src/{stack,app-shell,toggle,toast}/…{.meta.ts,.tsx}`,
`packages/layouts/src/{stack,app-shell}/…meta.ts`, regenerated `apps/site/public/llms*`, `registry.json`.
**Wave 1:** `packages/components/src/{side-nav,shell-header,header,data-table,fab,swipe-item,blocks/*}/…tsx` (+ tests),
`packages/charts/src/core/chart-frame.tsx` (+ test).
**Wave 2:** `packages/cli/src/commands/view.ts`, docs pages, (decision) `packages/react/src/index.ts` + changeset.
**Wave 3:** `scripts/checks/` (structure snapshots), `packages/{editor,flow}` (fast-check),
`packages/render/src/validate` tests, `packages/charts` dev guards, `apps/bench/runner/src/scenarios.ts`,
`scripts/llms/generate.ts` (streaming section).

## Gate before done (per CLAUDE.md — every PR)

`pnpm ready` (regen → `vp check --fix` → build → typecheck → tests) exits 0; commit
anything regen/`--fix` modified. After registry/CLI/generator changes, also
`pnpm ready:ci` (cold-cache, sequential builds). `pnpm regen && git diff --exit-code`
must be clean — Wave 0 is *mostly* generated output, so this is the main gate there.
