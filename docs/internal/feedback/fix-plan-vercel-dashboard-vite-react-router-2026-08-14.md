# Fix plan — the 2026-08-14 Vercel-style dashboard (Vite + React Router)

**Status: implemented on `claude/ui-library-analysis-plan-eu3gzy`; NOT YET PUBLISHED.**
All nine workstreams have landed. Per [`README.md`](README.md), the PR that publishes to npm
sets `shippedIn` on each [`RECURRENCE.md`](RECURRENCE.md) row and flips this header — until
then every fix below is Mechanism G.

| WS | Status | Guard |
| --- | --- | --- |
| WS-1 publish the router guide | merged | `meta:check` (`doc-surface`), `doc-urls:check` |
| WS-2 prop-defaults-parity scope + sparkline | merged | `meta:check` (`prop-defaults-parity`, `handler-naming-parity`) |
| WS-3 vocabulary types on Path B | merged | `type-exports:check` |
| WS-4 one CSS story | merged | `meta:check` (`doc-surface`), `scaffold:check` |
| WS-5 `cascivo create` | merged | `scaffold:check`, `packages/cli/src/utils/config.test.ts` |
| WS-6 composition gaps | merged | `meta:check` (`link-item-id-parity`, `example-props`, `typedefs-parity`) |
| WS-7 Stat vs Kpi | merged | `meta:check` (`doc-surface`) |
| WS-8 `.d.ts` TSDoc | merged | `dts-tsdoc:check`, `meta:check` (`vocabulary`) |
| WS-9 roadmap + troubleshooting | merged | — (prose) |

### Where the implementation disagreed with this plan

Written down because a plan that quietly disagrees with what shipped is the defect §0 is
about:

- **§2a's SPA route was wrong and was not built.** The five sibling `USING-WITH-*` guides have
  no `DOCS_ROUTES` entry — they are static `.md` only. Adding one for the router guide would
  have made it *more* routed than any sibling and needed a new page component. Matching
  sibling parity (`GUIDES` + regen) is exactly what fixes the two 404s the adopter hit.
- **Publishing one guide was not enough: the guards found three more unpublished ones.**
  `doc-surface` found `docs/TESTING.md` (linked from three published guides); the new
  repo-relative-path guard found `docs/CSS-LAYERS-PITFALL.md` — cited by `@cascivo/react`'s own
  npm README and by `cascivo audit` — and `docs/THIRD-PARTY-CSS.md`, cited by the scaffold.
  17 published guides → 21.
- **§0.2 undercounted: there was a fourth `files[]` consumer, not a third.** The plan predicted
  others and told the implementer to sweep. `handler-naming-parity` resolved
  `entry.files ?? []` too, so the event-handler naming rule had never been checked against a
  single chart, flow node or editor component. Also: migrating `prop-defaults-parity` surfaced
  **13** undocumented defaults beyond the sparkline mismatch.
- **The coverage floor's metric changed.** The plan said to port `props-parity`'s floors
  verbatim. Ported literally they fail: `props-parity` counts entries that resolve a *props
  type*, while only 13 of 25 charts apply any signature default. The floor now counts entries
  whose *source resolved*, so it tracks resolver health rather than authoring choices.
- **§4's Option B was measured and rejected; the plan's premise was already true.**
  `@cascivo/core` is *already* external to the dts bundler, so the plan's "make it external"
  spike had nothing to do. The alias comes from the component sources importing those names
  directly, so a re-export binds the same external name twice. Both a dedicated
  `export type { … }` statement and folding the names into the existing
  `export { … } from '@cascivo/core'` block produce `ToneInput as ToneInput$1`, after which
  every prop reads the aliased name. Option A shipped.
- **§9's reproduce-first found no defect, which is the finding.** Report §5 is factually
  wrong: `npm pack @cascivo/react@0.17.0` — the exact artifact the adopter installed — carries
  `Toggle.label`'s full four-line note. H1 (build strips TSDoc) is disproved by 749 clean
  source↔dist pairs; H2 (Mechanism G) by the publish timestamp. No `labelVisibility` prop, no
  change to `Toggle`. The `dts-tsdoc-parity` guard landed anyway, as the plan required, and
  the real underlying issue — nothing states whether `label` renders — became its own fix.
- **§5c's bundle-size ceiling was not built.** The plan asked `scaffold:check` to assert a
  built-entry-CSS ceiling. The decision is "do not import the aggregate sheet", and a byte
  ceiling would mean a full install + `vite build` per CI run to observe a consequence of a
  line the test reads directly. Asserted on the import instead, plus a twin assertion that a
  theme import must still be present. The byte count was measured once, by hand, on a real
  generated app: **39.65 kB** entry CSS (6.90 kB gzip).
- **Deriving the link-item guard found a third instance.** `BreadcrumbItem` was the reported
  one; the derived sweep also found `DockItem`, keying on the raw array index.
- **§7d was two defects.** `PieChartDatum.id` is required in source but the manifest's
  `typeDefs` declared `required: false`, so every generated props table said optional — which
  is *why* the example omitted it. Two guards, not one; each found exactly one instance
  catalog-wide.
- **§8 confirmed the docs were already right.** `Stat.card`'s TSDoc already said "surface,
  border, radius, padding". Nothing needed correcting; the *decision* — which tile to pick, and
  that `card` does not unify layout — was what was missing.
- **Two existing scaffold guards were moved, not loosened.** The brand-length check reads
  `Shell.tsx` and gained a `<title>` assertion. `every generated import resolves to a declared
  dependency` correctly rejected a `react-router` import line inside `Shell.tsx`'s doc comment
  — an adopter copying it would need a package the scaffold does not install — so the comment
  points at the README instead of inlining the snippet.

Report: `feedback-vercel-dashboard-vite-react-router-adopter-2026-08-14.md` (the fifteenth).
Adopter stack: Vite 7 · React 19 · React Router 7 · TS 5.9, prebuilt path, registry v0.17.0
(`@cascivo/react` 0.17.0, `@cascivo/themes` 0.4.11, `@cascivo/charts` 0.17.0,
`@cascivo/icons` 0.3.8), started from `npx cascivo create --yes --theme dark`.

**No blockers. Every finding had a workaround inside the library.** That is the good news and
also the reason this plan is mostly about *guards*, not about *code*: nothing here is broken,
several things here are already fixed and unreachable, and two are fixed-with-a-guard where
the guard is structurally incapable of seeing the case that came back.

> ⚠ **Filing the report file is part of the implementation commit, not this one.**
> `scripts/checks/recurrence.test.ts:114` fails when a `feedback-*.md` dated ≥ 2026-07-28
> exists that no `recurrence.json` row references. Land the report, the ledger rows (§12)
> and the fixes together, or CI goes red on an otherwise clean tree.

---

## §0 — Read this first: why these came back

The user brief for this plan says the docs / CSS / theme-provider / dependency red flags "were
already mentioned multiple times, and it always was mentioned to be fixed." That is accurate
and it is measurable. Four of this report's findings are covered by a guard that **exists,
runs in CI, is green, and cannot see the defect**. Naming why is the whole value of this plan;
the individual fixes are mostly one-liners.

The taxonomy is in [`RECURRENCE.md`](RECURRENCE.md#mechanisms). This report adds no new
mechanism. It adds four new *instances* of a pattern the ledger already names, and one
observation that should change how guards get written here.

### 0.1 The surface registry conflates "a file in the repo" with "a channel an adopter can read" (Mechanism D)

This is the headline, and it is exact.

`scripts/checks/doc-surface.test.ts` exists to stop Mechanism D. Its own docstring says: *"A
fix that lands on one surface only is the most common way a finding comes back."* At line 73
it registers a surface:

```ts
{
  id: 'router-active-item-prefix-matching',
  report: '2026-08-08 A7 + B — both adopters hand-wrote the same matcher, both exact-only',
  surfaces: ['docs/USING-WITH-A-ROUTER.md'],
  pattern: /isActive|prefix-match/,
},
```

`docs/USING-WITH-A-ROUTER.md` is 222 lines, is good, covers React Router in seven places, and
is referenced from `link.tsx:25`, `link.meta.ts:37`, `tabs.tsx:110`, `AI-RULES.md:253` and
`:376`, `HEADLESS.md:194`, and six package CHANGELOGs.

It is on **zero** adopter-reachable surfaces:

| Channel | Reaches it? | Why |
| --- | --- | --- |
| `cascivo.com/docs/using-with-a-router.md` | ❌ 404 | not in `GUIDES` (`scripts/docs-md/generate.ts:30-48`), so `apps/site/public/docs/` never gets the file (18 files, confirmed) |
| `npx @cascivo/docs --list` | ❌ absent | `packages/docs/scripts/build-content.mjs:70-72` copies `apps/site/public/docs/` wholesale — same root cause, one hop downstream |
| the site's docs SPA | ❌ absent | `DOCS_ROUTES` has no entry |
| `llms.txt` / `context/` | ❌ absent | generated from manifests + `GUIDES` |
| the shipped `.d.ts` | ⚠️ names it | `link.tsx:25` tells the adopter to read a path they cannot resolve |

So the library ships a runtime instruction to read a document it does not distribute. The
adopter did exactly what the `.d.ts` said, twice, and got a 404 twice — which is precisely the
failure `doc-urls.test.ts` was built for ("a developer who hits the warning, does exactly what
it says, and lands on a 404 learns something worse than the original bug").

Why every guard missed it:

- `doc-urls:check` scans only `https://cascivo.com/...` literals. The dead references are
  **repo-relative paths** (`docs/USING-WITH-A-ROUTER.md`) shipped inside published `.d.ts`,
  `registry.json`, `llms-full.txt` and `context/link.md`. Unchecked class.
- `docs-links:check` resolves relative links *between* guides on disk. On disk the file exists,
  so it passes.
- `docs-routes:check` reconciles `DOCS_ROUTES` ↔ `ROUTE_HEAD` ↔ sitemap — three lists that
  agree with each other about a guide none of them contains.
- `doc-surface:check` asserts the *content* is in the file. It never asks whether the file is
  published.
- `aschild-docs.test.ts:20` regenerates a table **inside** this guide and fails if it drifts.

That last one is the sharpest statement of the defect: **the guide is guarded for correctness
and unguarded for existence on the adopter's path.** CI has been actively maintaining the
contents of a document no adopter can open.

**The rule this implies, which §2 makes mechanical:** a repo path is not a surface. A surface
is a channel an adopter can reach — a published URL, a `@cascivo/docs` guide slug, a
`.d.ts`, `llms.txt`. `doc-surface.test.ts` must classify its `surfaces` entries and reject a
`docs/*.md` path that is not in `GUIDES`.

### 0.2 The `files: []` dead branch was fixed in two of the three guards that share it (Mechanism F)

The ledger closes this row against `meta:check`:

> *37 npm-shipped registry entries have never been props-parity checked … props-parity and
> typedefs-parity resolved source through registry `files[]`, which is empty for npm-shipped
> packages, so both hit `if (tsx.length === 0) continue`.*

`resolveEntrySources()` (`scripts/checks/lib/registry-source.ts:67`) was written to fix it, and
`props-parity.test.ts:100-118` added a per-prefix coverage floor so an entry cannot quietly
drop back out.

**A third guard shares the identical dead branch and was not migrated.**
`scripts/checks/prop-defaults-parity.test.ts:72`:

```ts
for (const url of (component.files ?? []).filter((f) => f.endsWith('.tsx'))) {
```

That guard contains a test literally named **"no documented default contradicts the
signature"**. Its `ALLOWLIST` is empty (line 44). And:

- `sparkline.meta.ts` documents `width` default `'80'` → `registry.json` says `'80'`
- `sparkline.tsx:35` applies `width = 120`
- the registry entry for `chart/sparkline` has `files: []`

The guard that is designed to catch exactly this, with nothing suppressing it, is green —
because the loop body is unreachable for every `chart/*`, `flow/*` and `editor/*` entry. This
is report §4 verbatim, and it is a *re-report*: the 08-06 ledger row for `chart-frame-parity`
already states *"sparkline's documented default (80) did not match its code (120)."* It was
found, written down, marked closed against a guard, and the mismatch is still in the tree.

I swept the whole catalog for TSDoc `@defaultValue` vs signature-destructuring disagreement
(after normalising quoting). **Sparkline `width` is the only real mismatch in
`components` + `charts` + `layouts`.** So the fix is one number and the guard turns on clean.

### 0.3 Curated lists where a derived sweep is required (Mechanism B)

`scripts/checks/link-item-id-parity.test.ts:25-31` is the guard that closed *"Link-shaped item
types lack `id`, forcing href keys."* It works off a hand-written array of five:

```ts
const LINK_ITEM_TYPES: Array<{ file: string; type: string }> = [
  { file: 'side-nav/side-nav.tsx',       type: 'SideNavItem' },
  …
  { file: 'switcher/switcher.tsx',       type: 'SwitcherLink' },
]
```

`BreadcrumbItem` (`breadcrumb.tsx:6`) is `{ label: string; href?: string }` — the exact shape
the guard is about — and is not in the list. `breadcrumb.tsx:40` keys by
`` `${index}-${item.label}` ``, so no duplicate-key warning fires; the adopter is simply
holding an index key in a list they can reorder.

A guard that enumerates its own subjects can only ever catch the instances its author already
knew about. The `id` sweep missed `Switcher`; the guard written to close *that* missed
`BreadcrumbItem`. Same failure, one level up. The list must be **derived** (§8).

The report's own §13 contains the general form of this: *"No primitive expresses 'deployment
state'."* Same root — a catalog fact enumerated by hand rather than discovered.

### 0.4 Path B has parity for values and none for types (Mechanism D)

`path-a-parity.test.ts` and `path-b-parity.test.ts` both exist and both check *runtime*
exports. Nothing checks that a **type referenced by a published prop signature** is importable
by the consumer of that signature.

`Status.status` and `Badge.variant` are typed `ToneInput`. `@cascivo/react` re-exports
`LinkComponentProps`, `Responsive`, `Column`, `SortState` — and not `Tone`, `ToneInput`,
`SpaceStep` or `ProgressInput`. A prebuilt adopter writing `Record<DeployState, Tone>` — the
first thing every dashboard writes — has no supported import.

**This is not the one-line export the report assumes.** `packages/react/src/index.ts:281-286`
documents why, and it is a real constraint:

> *Not re-exported here: a separate re-export makes the bundler mint a second `SpaceStep$1`
> binding for the same external type.*

`packages/react/scripts/check-styles-complete.mjs:57-60` fails the build on any `$N`-suffixed
alias in the flat `index.d.ts`. So the naïve fix trades an adopter-facing gap for a build
failure. §4 specs the two ways out and picks one.

### 0.5 Mechanism G is still live, and it now costs an already-correct fix

`Toggle.label` (report §5) is **already documented**, in source and in shipped metadata:

- `toggle.tsx:21-25` — *"Renders a **visible** text label beside the switch … omit `label` …
  and pass `aria-label` instead"*
- `toggle.meta.ts:39` and `registry.json` carry the same sentence

Added 2026-07-29 (`3ec6aaf6`), before the adopter's registry v0.17.0. So either the note is not
reaching the published `.d.ts`, or the adopter's `.d.ts` predates it. **Both readings are
serious and neither is confirmed** — §10 makes this reproduce-first rather than spec-first,
because "the shipped `.d.ts` is the best documentation surface" is a load-bearing claim (the
report's own point 3 praises it) with **no guard asserting TSDoc survives the dts flatten**.

---

## §1 — Triage

Priority is adopter cost, per the report's own ranking. "Verified" means I read the source
line, not the report.

| # | Finding | Mech. | Pri | Verified root cause | WS |
| --- | --- | --- | --- | --- | --- |
| 2 | Router guide 404s on every channel | D | **P0** | not in `GUIDES` (`docs-md/generate.ts:30-48`); `doc-surface.test.ts:73` treats the repo path as a surface | WS-1 |
| 4 | Sparkline: 80 vs 120, shrink vs fixed | F | **P0** | `prop-defaults-parity.test.ts:72` dead for `files: []`; `sparkline.tsx:35` = 120, manifest = 80; `RECIPE-DASHBOARD.md:29` claims shrink-to-fit | WS-2 |
| 3 | `ToneInput`/`SpaceStep` unimportable on Path B | D | **P0** | no type-level Path-B parity; blocked by the `$N` alias rule (`check-styles-complete.mjs:57`) | WS-3 |
| 12 | Scaffold imports the 273 kB aggregate CSS | A | P1 | `create.ts:333`; getting-started calls it optional on the bundler path | WS-4 |
| 10 | Charts CSS: required or redundant? | C | P1 | `charts/src/index.ts:7` says `// required`; `llms/generate.ts:327,787` says skipping it is a common mistake; `css-contract:check` now *enforces* the entry imports it | WS-4 |
| 1 | `create` scaffolds a non-routed architecture | A | P1 | `create.ts:295,337` — module-level `signal<Section>` switcher, no `--router` flag | WS-5 |
| 11 | `create` loose ends (pm, title, config) | D | P1 | `config.ts` checks `npm_config_user_agent` **before** the lockfile walk-up; `create.ts:236` title = dir name | WS-5 |
| 9 | `BreadcrumbItem` missed by the `id` sweep | B | P2 | `link-item-id-parity.test.ts:25` curated list of 5 | WS-6 |
| 7 | `PageHeader.title`/`.description` are `string` | A | P2 | `page-header.tsx` — `breadcrumb`/`actions` are `ReactNode`, these are not | WS-6 |
| 8 | `CodeSnippet` takes `code`, not children | A | P2 | `code-snippet.tsx:2` `code: string`, children ignored | WS-6 |
| 6 | `Stat card` and `Kpi` still differ | A | P2 | genuinely different DOM (`stat.tsx` flat stack vs `kpi.tsx` head/valueRow); the `card` doc is *correct*, the guidance is missing | WS-7 |
| 5 | `Toggle.label` renders visibly, undocumented | G? | P2 | **already documented** in source + registry v0.17.0 — reproduce before speccing | WS-8 |
| 13 | PieChart `id`; deploy-state primitive; `@cascivo/core` unreachable to grep | A/B | P3 | recipe example omits required `id`; core is a transitive dep on Path B | WS-6, WS-9 |

---

## §2 — WS-1 · Publish the router guide, and make "surface" mean something (P0)

The report's #1-cost finding. Also the cheapest.

### 2a — Publish it

`scripts/docs-md/generate.ts`, `GUIDES`:

```ts
{ src: 'USING-WITH-A-ROUTER.md', slug: 'using-with-a-router' },
```

Place it directly after `USING-WITH-NEXTJS.md` — the generator emits in array order and the
router guide is the general case the three framework guides specialise.

Then `pnpm regen`, and commit `apps/site/public/docs/using-with-a-router.md`. That one line
also fixes `npx @cascivo/docs guide using-with-a-router`, because
`build-content.mjs:70-72` copies the directory wholesale.

Add the SPA route so the guide is reachable by a human, not only by `curl`: an entry in
`DOCS_ROUTES` (`apps/site/src/DocsApp.tsx`), `ROUTE_HEAD` (`seo.ts`) and `DOCS_STATIC_ROUTES`
(`scripts/sitemap/generate.ts`). `docs-routes:check` already enforces that all three move
together — let it.

### 2b — Make the guide easy to find, not merely present

The user brief is explicit that a docs fix must be *perfectly documented and easy to find*.
Publishing alone puts it at parity with seventeen siblings. Do all of these:

- **`docs/README.md`** already has the row (line 44). Verify the link survives regen.
- **Getting-started**: add a "Wiring your router" line to the next-steps section, with the
  one-liner. It is the second thing every app does after `ThemeProvider`.
- **The `.d.ts` pointers become resolvable URLs.** `link.tsx:25`, `link.meta.ts:37` and
  `tabs.tsx:110` currently say `docs/USING-WITH-A-ROUTER.md`. Change to
  `https://cascivo.com/docs/using-with-a-router.md` — an adopter reading a `.d.ts` in an
  editor cannot resolve a repo-relative path, and after 2a the URL resolves.
- **React Router gets a first-class example.** The guide covers it in prose; the
  `setLinkComponent` TSDoc shows only TanStack and Next. Add the exact working line the
  adopter derived, verbatim, since it is correct:
  ```tsx
  setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
  ```
- **`llms.txt` gets a "Routing" section** pointing at the slug. Agents read `llms.txt` first.

### 2c — The guard (this is the part that stops the recurrence)

Two new assertions. Both are cheap and offline.

**(i) `doc-surface.test.ts` must reject an unpublished surface.** Add to that file:

```ts
it('every docs/*.md surface is actually published to adopters', () => {
  // A repo path is not a surface. `docs/USING-WITH-A-ROUTER.md` was registered here as
  // the surface carrying the prefix-matching fact while being absent from GUIDES — so it
  // reached no URL, no `npx @cascivo/docs` slug and no SPA route. CI maintained the
  // contents of a document no adopter could open (2026-08-14 report §2).
  const guides = new Set(guideSourcesFromGenerator())   // parse GUIDES out of docs-md/generate.ts
  const unpublished = FACTS.flatMap((f) => f.surfaces)
    .filter((s) => s.startsWith('docs/') && s.endsWith('.md'))
    .filter((s) => !guides.has(s.slice('docs/'.length)))
  assert.deepEqual(unpublished, [], …)
})
```

**(ii) A repo-relative doc path shipped in a published artifact must be published.** Extend
`doc-urls.test.ts` — it already walks `packages/`, `docs/`, `scripts/` — with a second pattern
alongside the `https://cascivo.com` one:

```ts
/\bdocs\/[A-Z0-9-]+\.md\b/g
```

A match in any file that ends up in a published artifact (component `.tsx` TSDoc, `.meta.ts`
description, `llms/generate.ts`) fails unless the referenced guide is in `GUIDES`. Allowlist
`docs/internal/**` and `CONTRIBUTING*`, which are contributor-facing by design.

Guard (ii) is the general fix: it makes the *class* of "we shipped a pointer to something we
do not distribute" impossible, not just this instance.

### Acceptance

- `apps/site/public/docs/using-with-a-router.md` exists and is committed.
- `npx @cascivo/docs --list` includes `using-with-a-router` (19 guides, not 18).
- `/docs/using-with-a-router` renders in the SPA; `/docs/using-with-a-router.md` serves.
- Both new guards demonstrated failing on the pre-fix tree, then passing.
- `pnpm regen && git diff --exit-code` clean.

---

## §3 — WS-2 · Sparkline, and turning on the guard that was already written (P0)

### 3a — Fix the number

One real mismatch exists catalog-wide. `sparkline.tsx:35` applies `width = 120`; the manifest
and `registry.json` say `80`; `sparkline.tsx:16` says `@defaultValue 80` two lines under prose
that says `120`.

**Keep 120, correct the docs.** 120 is what ships, what the prose argues for, and what
`RECIPE-DASHBOARD.md:29` assumes. Changing the code would silently reflow every existing
adopter's tiles.

- `sparkline.tsx` — `@defaultValue \`120\``
- `sparkline.meta.ts:27` — `default: '120'`, then `pnpm regen`
- audit `bullet` and `meter` while here; the 08-06 ledger row names them as siblings that
  carried the same responsive boilerplate over a hard-coded width.

### 3b — Fix the behaviour claim

`RECIPE-DASHBOARD.md:29` says 120×32 *"is a preferred size — it shrinks to fit a narrow
flex/grid track rather than pushing siblings onto the next line."* The adopter observed the
opposite, and the source agrees with the adopter: `width` is an SVG attribute passed straight
through, with no container measurement. `sparkline.tsx:10-13` already states the truth
(*"This chart is fixed-width by default … The catalogue-wide 'omit for a responsive chart'
note does not apply to this chart"*).

Rewrite the recipe row to match the `.d.ts`, and say what to do instead — the adopter's actual
symptom was a sparkline pushing "Deployed 2 hours ago" onto two lines:

> `Sparkline` is **fixed-width** (120×32 by default) — it does not track its container.
> In a card header that must not wrap, give the sparkline a smaller explicit `width`, or
> put it in a flex item with `min-width: 0` and let the text take the remainder.

Add a `doc-surface.test.ts` fact row (`sparkline-is-fixed-width`) covering
`packages/charts/src/charts/sparkline/sparkline.tsx` **and** `docs/RECIPE-DASHBOARD.md` so the
two cannot diverge again. They have now diverged twice.

### 3c — The guard: migrate the third `files: []` consumer

`scripts/checks/prop-defaults-parity.test.ts:72` — replace the `component.files` loop with
`resolveEntrySources()` from `scripts/checks/lib/registry-source.ts:67`, exactly as
`props-parity.test.ts` does.

Then port the coverage floor from `props-parity.test.ts:100-118` verbatim — same prefixes,
same floors (`chart/` 20, `flow/` 8, `editor/` 2). Without it the migration can silently
regress to zero coverage again, which is the shape of the original bug.

**Demonstrate the guard failing before fixing 3a.** Run the migrated guard against the current
tree; it must report `chart/sparkline: 'width' — manifest says 80, signature says 120`. A guard
that goes green on its first run has not been shown to work — that is how
`scaffold-contract`'s "pre-wires the react-hooks/immutability escape" test passed for weeks
while linting zero files.

**Also sweep for other `files ?? []` consumers.** Grep `scripts/checks/` for
`component.files` / `files ?? []`. Two guards were migrated, one was not; assume there are
others and check rather than assume.

### Acceptance

- Migrated guard observed **failing** on `chart/sparkline` pre-fix, passing post-fix.
- Coverage floors present and passing.
- Zero `@defaultValue`-vs-signature mismatches in `components` + `charts` + `layouts`.
- No other `scripts/checks/*` guard resolves source through `files[]` alone.

---

## §4 — WS-3 · Make the catalog-wide types importable on Path B (P0)

The report calls this "one-line additions to the export list." **It is not**, and the
implementer must not try that first — `packages/react/src/index.ts:281-286` explains why and
`check-styles-complete.mjs:57-60` will fail the build with
`index.d.ts leaks an aliased type name "SpaceStep$1"`.

Missing on Path B: `Tone`, `ToneInput`, `ToneAlias`, `Progress`, `ProgressInput`,
`ProgressAlias`, `SpaceStep`. All live in `packages/core/src/index.ts:104,108`.
`@cascivo/core` **is** a real `dependencies` entry of `@cascivo/react` — so it resolves at
build time, but under pnpm's strict layout the adopter cannot `import` it without adding it,
and the docs explicitly tell prebuilt adopters not to.

### Option A — a `./types` subpath (recommended)

Add to `packages/react/package.json`:

```jsonc
"./types": { "types": "./dist/types.d.ts", "import": "./dist/types.js", "default": "./dist/types.js" }
```

backed by a `src/types.ts` that does nothing but
`export type { Tone, ToneInput, ToneAlias, Progress, ProgressInput, ProgressAlias, SpaceStep } from '@cascivo/core'`.

The `$N` alias rule is scoped to the flat `index.d.ts`; a separate entry point declares the
names once, in its own file, so no dedupe collision arises. Cost: adopters write
`from '@cascivo/react/types'`, one import line away from the ideal.

**Confirm before building it** that `check-styles-complete.mjs` only inspects `index.d.ts`
(line 57 reads a single `dts` string — verify what feeds it) and that adding a second entry
does not change `styles.css` aggregation.

### Option B — fix the dedupe and export from the root

Mark `@cascivo/core` external to the dts bundler so the flat `index.d.ts` emits a real
`import type { SpaceStep } from '@cascivo/core'` instead of inlining and renaming it. Strictly
better ergonomics (`from '@cascivo/react'` just works), strictly higher risk: it changes how
every core-owned type is emitted, and `isolated:check` runs with `skipLibCheck` **off**, so a
regression surfaces as an adopter type error.

**Pick A unless a spike shows B is clean.** If B works, do B — but time-box the spike and fall
back without sunk-cost.

### 4b — Document it where the adopter is looking

The adopter reached for this while typing a `Record<DeployState, Tone>`. Put the answer at that
moment:

- `AI-RULES.md` "Data and shape props" — a short **"Importing the shared types"** block showing
  the tone map, on both paths (`@cascivo/core` for Path A, `@cascivo/react/types` for Path B).
- `GETTING-STARTED.md` — one line in the prebuilt-path section.
- `llms.txt` — same fact; agents write these maps constantly.
- The `Status.status` / `Badge.variant` TSDoc — name the import inline. This is the surface the
  adopter was actually reading when they gave up and wrote
  `type Tone = NonNullable<StatusProps['status']>`.

### 4c — The guard: type-level Path-B parity

New `scripts/checks/type-exports-parity.test.ts`, run under `meta:check`:

> Every named type referenced in a **public prop signature** of a `@cascivo/react` export must
> be importable from `@cascivo/react` (or a documented `@cascivo/react/*` subpath), without
> installing a package the getting-started guide tells prebuilt adopters not to install.

Derived, not curated — walk the published `.d.ts` (or the props types via
`lib/component-props.ts`) for type identifiers, subtract what the entry points export,
subtract React/DOM built-ins, and fail on the remainder with an allowlist that carries reasons.
This is the missing twin of `path-a-parity` / `path-b-parity`, which cover values only.

### Acceptance

- In `isolated:check`'s strict non-hoisted fixture:
  `import type { Tone } from '@cascivo/react/types'` compiles and
  `const m: Record<'building'|'ready', Tone> = …` typechecks.
- `check-styles-complete.mjs` passes — no `$N` alias in `index.d.ts`.
- The new parity guard is observed failing on the pre-fix tree for `ToneInput`.

---

## §5 — WS-4 · Tell one story about CSS (P1)

Two findings, one cause: **two packages in the same install answer "how does CSS reach the
page?" differently, and the docs answer it a third way.** That is Mechanism C, and
`css-contract.test.ts` was written for this exact question after the 2026-07-28 C11 report.

### 5a — Establish ground truth first (do not skip)

`css-contract:check` now enforces: a published package shipping a stylesheet with
`sideEffects: ["**/*.css"]` **must import that stylesheet from its entry**, and must ship a
CSS-free `node/` twin. `packages/charts/package.json` has `sideEffects: ["**/*.css"]` and a
`"node": "./dist/node/index.js"` condition — i.e. the C11 fix landed.

**If that holds, `import '@cascivo/charts/styles.css'` is redundant on the bundler path** and
every doc calling it *required* is stale — describing the pre-C11 world.

Verify, do not assume, with a built tree:

```sh
pnpm build
grep -n "charts.css" packages/charts/dist/index.js     # expect a side-effect import
grep -n "charts.css" packages/charts/dist/node/index.js # expect NOTHING
```

Then confirm visually: render a chart in a Vite CSR app importing **only**
`@cascivo/react/styles.css` and a theme, and check the screen-reader data-table fallback is
hidden. That fallback rendering visibly is the stated symptom; it is the thing to observe.

### 5b — Write the answer down once, in a table

Whatever 5a shows, publish a single **"Which stylesheets do I import?"** table in
`GETTING-STARTED.md`, with a row per package and a column per path (bundler / no-bundler /
SSR-externalised). Reference it from `RECIPE-DASHBOARD.md`, `charts/src/index.ts`'s quickstart,
and `llms.txt`. Register it as a `doc-surface` fact so the copies cannot drift.

Then fix the stale copies: `charts/src/index.ts:7` (`// required`),
`scripts/llms/generate.ts:327` (*"required — without it the screen-reader data-table fallback
renders visibly"*) and `:783-787`.

**The `node` condition is the real subtlety and deserves its own row.** On the bundler path the
import is automatic; on a Vite-SSR/externalised path the `node` twin has no CSS by design, so
the explicit `@cascivo/charts/styles.css` import *is* required there. "Required or redundant"
has a per-path answer, and saying so is the fix.

### 5c — The scaffold should not hand every app the aggregate sheet

`create.ts:333` emits `import '@cascivo/react/styles.css'` into `App.tsx`. Getting-started
(`:245`) calls that sheet ~273 kB / ~37 kB gzip and describes it as the *no-bundler* option;
per-component CSS auto-includes and tree-shakes on the bundler path. The adopter deleted it and
went from ~273 kB to 59 kB of entry CSS with no visual change.

Drop the import from the scaffold. Leave a comment in `App.tsx` naming the trade — future
readers will otherwise re-add it:

```tsx
// No `@cascivo/react/styles.css` here: on the bundler path each component imports its own
// CSS, so you get exactly what you use. Import the aggregate sheet only if you drop the
// bundler (or use a CDN/no-build setup). See https://cascivo.com/docs/getting-started.
```

**Guard:** `scaffold:check` asserts a generated app's built entry CSS stays under a ceiling
(say 100 kB). The scaffold is the first thing every adopter sees; a bundle-size default is a
product decision that deserves a test. Do the theme import stay — that one is genuinely
required.

### Acceptance

- 5a resolved by observation on a built tree, written into the table.
- Charts render correctly in a CSR Vite app **without** the explicit charts CSS import (if 5a
  confirms), and the per-path table says so.
- A freshly generated `cascivo create` app builds with entry CSS well under 100 kB and renders
  identically. Verified in a browser, not by grep.

---

## §6 — WS-5 · `cascivo create` (P1)

### 6a — Decouple the shell from the section switcher (report §1)

Today `create.ts:295,337` generates an `App.tsx` holding a module-level `signal<Section>` and
three `sections/*.tsx` files. Any router prompt — "arguably most real apps" — means deleting
`App.tsx` and all of `src/sections/`, i.e. most of what `create` produced, and re-deriving the
`AppShell` + `ShellHeader` + `SideNav` wiring by hand. That wiring is the valuable part.

The report offers two fixes. **Do the smaller one; it subsumes most of the value:**

Extract the shell into its own `src/Shell.tsx` taking `children`, and have `App.tsx` compose
`<Shell>{…switcher…}</Shell>`. An adopter adding a router then deletes `App.tsx` and
`src/sections/`, keeps `Shell.tsx` untouched, and renders it from their route layout. This is a
pure refactor of generated output — no new flags, no new templates, no combinatorial matrix.

Then add to the generated `AGENTS.md` and `README.md`:

> **Adding a router?** Keep `src/Shell.tsx` and delete `src/App.tsx` + `src/sections/`. Render
> `<Shell>` from your root route's layout and register your `Link` once with
> `setLinkComponent` — see https://cascivo.com/docs/using-with-a-router.md.

A `--router react-router|tanstack|none` flag is the bigger fix and is **explicitly out of scope
here**: three router templates is three more surfaces to keep green, and WS-1 + the `Shell.tsx`
split gets most of the benefit. Note it in `ROADMAP.md`; do not build it in this plan.

### 6b — Package-manager detection (report §11)

Real defect, precisely located. `detectPackageManager` (`packages/cli/src/utils/config.ts`)
checks in this order: `override` → `CASCIVO_PACKAGE_MANAGER` → **`npm_config_user_agent`** →
lockfile walk-up → `packageManager` field → `npm`.

`create.ts:572-574` leans on that deliberately, because a brand-new project has no lockfile.
But `cwd` is the **parent** directory, and the walk-up would have found the root
`pnpm-lock.yaml`. The UA check short-circuits first: `npx cascivo create` sets a
`npm/…` user agent, so the adopter got `npm install` inside a pnpm workspace.

**Fix:** for `create` only, walk up from `cwd` for a lockfile *before* consulting the user
agent. Where the new project lands is a stronger signal than which launcher started the CLI.
Leave `init`/`add` ordering alone — they run inside an existing project where the UA is right.

Cleanest shape: an opts flag such as `{ preferLockfileOverUserAgent: true }`, so the behaviour
is named and testable, with a unit test asserting a `create` in a directory whose parent has
`pnpm-lock.yaml` prints `pnpm install` **even with** `npm_config_user_agent=npm/10`.

### 6c — Two small ones

- **`<title>` and `package.json` name.** `create.ts:236` uses the raw directory name, so
  `2026-08-14-vercel-dashboard-vite-react-router` shipped as the browser tab title. A
  title-casing helper already exists at `create.ts:89` ("*Take the leading words, title-case
  them, and stop*") — apply it to `<title>`. Leave `package.json.name` as the directory name;
  that one is conventional and npm-name-safe.
- **`cascivo.config.ts`.** `create.ts:529-533` deliberately omits it, with a good reason (its
  presence made `doctor` classify the app as copy-paste and told it to install packages the
  docs forbid). The gap is only that "Next steps" never says so. Add one line:
  > No `cascivo.config.ts` is written — this app uses the prebuilt `@cascivo/react` packages.
  > `npx cascivo add <component>` writes the config itself the first time you vendor source.

### Acceptance

- Generated app builds and renders; `Shell.tsx` is importable standalone.
- `create` inside a pnpm workspace prints `pnpm install` / `pnpm dev` under `npx`.
- `<title>` is title-cased; next-steps mentions the config.
- `scaffold:check` extended: `Shell.tsx` exists and `App.tsx` imports it.

---

## §7 — WS-6 · Composition gaps (P2)

### 7a — `BreadcrumbItem.id`, and derive the guard (report §9)

Add `id?: string` to `BreadcrumbItem` (`breadcrumb.tsx:6`) with the same TSDoc the other five
carry, and key on `item.id ?? \`${index}-${item.label}\`` at `breadcrumb.tsx:40`.

**The guard matters more than the prop.** Replace the curated `LINK_ITEM_TYPES` array
(`link-item-id-parity.test.ts:25-31`) with a derived sweep over
`packages/components/src/**/*.tsx`:

> Any **exported** interface with a `label`-ish field and an optional `href`, consumed as an
> array element by a component prop, must declare `id` — and the component must key on it.

Allowlist with reasons. Run it and expect it to find more than `BreadcrumbItem`; the two prior
sweeps each missed one, so assume a third.

### 7b — `PageHeader.title` / `.description` → `ReactNode` (report §7)

`page-header.tsx` types `breadcrumb` and `actions` as `ReactNode` and `title`/`description` as
`string`. The restriction reads accidental, and `RECIPE-DASHBOARD.md` explicitly tells adopters
*not* to hand-compose `PageHeader` from `Heading`/`Text`/`Flex` — so there is no sanctioned way
to put a status badge or a domain link beside a page title, which is the canonical deploy-console
header.

Widen both to `ReactNode`. Backward compatible (`string` is a `ReactNode`). Two things to check:

- Anything doing `title.length`, `title.trim()` or passing `title` to an attribute
  (`aria-label`, `document.title`, an SEO helper) breaks. Grep before changing.
- If `title` feeds an accessible name anywhere, keep a `string` escape hatch (e.g.
  `titleText?: string`) rather than silently degrading it.

Update the manifest, `pnpm regen`, and add an example to the TSDoc showing a badge beside a
title — that composition is the reason for the change.

### 7c — `CodeSnippet` should accept children (report §8)

`code-snippet.tsx` takes `code: string` and ignores children, alone among content components
(`Card*`, `Alert`, `Badge`, `Text`, `Status`). It was the adopter's only compile error.

Accept `children` as an alias: when `code` is absent, derive it from children if they are a
plain string; keep `code` for the copy-to-clipboard payload and for anything non-trivial.
Document that `code` wins when both are given, and that highlighting/copying need the string
form — do **not** silently accept arbitrary JSX children whose text cannot be copied. If that
constraint makes children genuinely wrong here, then say so in one sentence in the TSDoc and
close the finding as documented — but say it, because right now the shape is unexplained.

### 7d — Recipe correctness (report §13)

`RECIPE-DASHBOARD.md`'s `PieChart` example omits `id`, which `PieChartDatum` requires — the
example does not compile. `scripts/checks/example-props.test.ts` exists; check why it did not
catch this and extend it to typecheck fenced `tsx` blocks in the guides, or at minimum to
assert required props are present in chart examples.

---

## §8 — WS-7 · `Stat` vs `Kpi` (P2)

The report says *"Either the layouts should converge or the docs should say `card` fixes only
the chrome."* Verified: the `card` TSDoc (`stat.tsx:26-31`) **already** says exactly
*"surface, border, radius, padding"* — it is accurate and narrow. The layouts genuinely differ:

- `stat.tsx` — flat stack: `label`, `value`, `delta`, `helpText`, `visual`
- `kpi.tsx:66-78` — `head` (label + icon), then `valueRow` (value + delta on one line), then
  the sparkline below

So the docs are not wrong. What is missing is **which one do I use**, and that is the actual
adopter cost: their overview row (`Stat card`) and analytics row (`Kpi`) read as two different
tile designs in one app.

**Do not converge the layouts.** They are different components in different packages with
different data shapes (`Stat.delta` is a string you format; `Kpi.delta` is a number it formats)
— merging them is a large change this report does not justify.

**Do add the decision, on both TSDocs and in the recipe:**

> `Stat` (`@cascivo/react`) and `Kpi` (`@cascivo/charts`) are different tiles, not two skins of
> one. `Kpi` puts value and delta on one line with a sparkline below and formats a numeric
> `delta` for you; `Stat` stacks value → delta → help text with a trailing `visual` slot and
> takes a pre-formatted string `delta`. `<Stat card>` matches `Kpi`'s **chrome** only — the
> internal layout still differs, so **do not mix them in one app**. Pick `Kpi` when you have a
> numeric delta and a sparkline; pick `Stat` otherwise.

Register as a `doc-surface` fact across `stat.tsx`, `kpi.tsx` and `RECIPE-DASHBOARD.md`. Also
reconsider whether `Stat`'s `card` prop should mention that it does **not** unify layout — the
prop was introduced to cure this symptom and demonstrably did not.

---

## §9 — WS-8 · Reproduce before speccing: is TSDoc reaching the published `.d.ts`? (P2, but escalates)

Do not spec `Toggle.label` (report §5) until this is answered. The note the report asks for is
already in the tree and in `registry.json` at v0.17.0 (§0.5).

Two hypotheses:

- **H1 — the flatten drops TSDoc for some props.** `packages/react/package.json` builds via
  `vp build && node scripts/flatten-types.mjs`. `flatten-types.mjs` strips only `//#region`
  navigation comments (line 46), so if TSDoc is lost it is lost in `vp build`'s dts bundler.
  There is no `removeComments` in `tsconfig.base.json`.
- **H2 — the adopter's `.d.ts` predates 2026-07-29** (`3ec6aaf6`). Mechanism G again.

Repro:

```sh
pnpm build
grep -B12 "label?: string" packages/react/dist/index.d.ts | grep -c "Visible text label"
npm view @cascivo/react@0.17.0 dist.tarball   # then extract and grep the same
```

- **If H1** this is the most serious finding in the report and outranks everything above.
  "The shipped `.d.ts` is the best documentation surface" is a load-bearing claim the report
  itself praises (point 3) — and nothing asserts it. Add a
  `dts-tsdoc-parity` guard: **every prop with a non-empty manifest `description` must carry a
  doc comment in the published `index.d.ts`.** That is derived, cheap, and turns the
  documentation strategy into an invariant instead of a hope.
- **If H2** file it as Mechanism G, close it against the existing `recurrence:shipped` guard,
  and add nothing else.

Add the `dts-tsdoc-parity` guard **either way.** Under H2 it is the guard that would have let
us answer this in one command instead of a build.

Separately, and independent of the outcome: the accessible-name vocabulary is inconsistent.
`Sparkline` documents `label`/`ariaLabel` as two spellings of an *invisible* name; `Toggle`'s
`label` is *visible*. Both are defensible; the catalog-wide rule is not written down. Add a row
to the `AI-RULES.md` prop-name vocabulary table — *"`label` is visible unless the component's
TSDoc says otherwise; `ariaLabel` is always invisible"* — and extend
`scripts/checks/vocabulary.test.ts` to require any component with a `label` prop to state its
visibility in the manifest description. That is the general form of report §5, and it is worth
doing regardless.

---

## §10 — WS-9 · The two remaining §13 items (P3)

- **No primitive expresses "deployment state."** Every console in this space hand-writes the
  same `deploy state → tone → label` map; `Status` takes a tone, not a semantic state. This is
  a real product observation and a **roadmap item, not a fix** — a `DeploymentStatus` component
  bakes one vendor's vocabulary into a general design system. Record it in `ROADMAP.md`. The
  cheap 80% is WS-3 (§4): once `Tone` is importable, the hand-written map is three typed lines
  instead of an untyped string union.
- **`@cascivo/core`'s `.d.ts` is unreachable from a terminal on Path B.** True and inherent:
  core is a transitive dep, so it lives under `node_modules/.pnpm/@cascivo+core@…`. Ctrl-click
  works; `grep` does not without knowing pnpm's layout. Fix by **not requiring the trip** — WS-3
  puts the types on `@cascivo/react/types`, and `npx @cascivo/docs` is the offline channel for
  the rest. Add one line to `TROUBLESHOOTING.md` giving the resolve command
  (`node -p "require.resolve('@cascivo/core/package.json')"`) for anyone who does need it.

**Keep the version-stamp practice** (report §13, last bullet): the `registry v0.17.0` header on
every doc page and the per-package version list in `llms.txt` let the adopter confirm docs
matched their install in seconds. Named as good; do not regress it.

---

## §11 — What NOT to do

- **Do not add `ToneInput` to `packages/react/src/index.ts`'s export list.** It fails
  `check-styles-complete.mjs:57-60`. See §4.
- **Do not change `Sparkline`'s default to 80.** It reflows every existing adopter's tiles.
  Fix the docs. See §3a.
- **Do not converge `Stat` and `Kpi`.** Different packages, different data shapes, out of
  proportion to the finding. See §8.
- **Do not build `--router` templates.** `Shell.tsx` + WS-1 gets most of the value at a
  fraction of the maintenance. See §6a.
- **Do not mark any row closed against a guard you have not observed failing first.** Two
  findings in this report (§0.1, §0.2) are guarded-and-green today.

---

## §12 — Recurrence ledger rows

Add to `recurrence.json` **in the implementation commit**, alongside the report file. All rows
open in "Closed — awaiting release" until published (`shippedIn` set by the release PR).

| Finding | Reports | Mech. | Guard | How it holds |
| --- | --- | --- | --- | --- |
| A guide is content-guarded and unpublished, so its `.d.ts` pointers 404 | 1 (08-14) | D | `doc-surface:check`, `doc-urls:check` | `docs/USING-WITH-A-ROUTER.md` was registered as a doc *surface* while absent from `GUIDES` — reaching no URL, no `@cascivo/docs` slug, no SPA route, while `aschild-docs` regenerated a table inside it. Surfaces are now classified: a `docs/*.md` surface must be in `GUIDES`, and a repo-relative doc path shipped in a published artifact must resolve to a published guide. |
| A default documented as 80 and applied as 120 survived being found and "closed" | 2 (08-06, 08-14) | F | `meta:check` (`prop-defaults-parity`) | `prop-defaults-parity` has a test named "no documented default contradicts the signature" with an empty allowlist, and it was structurally dead for every npm-shipped entry — the same `files: []` branch closed for `props-parity` and `typedefs-parity` on 08-08 and not migrated here. Third consumer migrated to `resolveEntrySources()`, with the per-prefix coverage floor ported so it cannot drop back out. |
| Catalog-wide types are unimportable on the prebuilt path | 1 (08-14) | D | `meta:check` (`type-exports-parity`) | `path-a-parity`/`path-b-parity` covered values only, so `ToneInput` — the type of `Status.status` and `Badge.variant` — was reachable on neither path an adopter is told to use. The new guard derives every type named in a public prop signature and fails when it is not importable from a documented entry point. |
| A link-shaped item type is missed by the `id` sweep, again | 2 (08-08, 08-14) | B | `meta:check` (`link-item-id-parity`) | The guard that closed the `Switcher` miss enumerated its five subjects by hand, so `BreadcrumbItem` slipped the same way. The list is now derived from the source shape (`label` + optional `href`, consumed as an array element), not curated. |
| The scaffold hands every new app the 273 kB aggregate stylesheet | 1 (08-14) | A | `scaffold:check` | Getting-started calls the aggregate sheet the no-bundler option; the scaffold imported it anyway, so a fresh app carried ~273 kB where 59 kB was the real cost. Dropped, with the trade named in a comment, and a built-entry-CSS ceiling asserted so the default cannot regress silently. |
| `create` prints npm inside a pnpm workspace | 1 (08-14) | D | `packages/cli/src/utils/config.test.ts` | `detectPackageManager` consults `npm_config_user_agent` before the lockfile walk-up — right for `init`/`add`, wrong for `create`, where the new project's surroundings outrank the launcher. `create` now prefers the lockfile, tested with a conflicting user agent. |
| One CSS-loading story per package, three answers in the docs | 1 (08-14) | C | `doc-surface:check` | `css-contract:check` made charts auto-load its CSS on the bundler path; three doc surfaces still called the explicit import required, and getting-started said the opposite for `@cascivo/react`. A single per-path table now owns the fact, registered as a doc-surface fact, with the `node`-condition exception stated. |
| No guard asserts the `.d.ts` — the "best documentation surface" — carries the docs | 1 (08-14) | A | `dts-tsdoc-parity` (pending §9) | Every prop with a manifest description must carry a doc comment in the published `index.d.ts`. Open until §9's repro decides whether `Toggle.label` was H1 (flatten drops TSDoc) or H2 (Mechanism G). |

Report `feedback-vercel-dashboard-vite-react-router-adopter-2026-08-14.md` must be referenced
by at least one row (`recurrence.test.ts:114`).

---

## §13 — Sequencing

Guard-first within each workstream: **observe the guard failing on the current tree, then fix.**
Two of these findings exist because a guard went green without ever having been shown to work.

1. **WS-1 §2a** — one line + `pnpm regen`. Highest adopter value in the plan; land it alone.
2. **WS-2 §3c** — migrate `prop-defaults-parity`, watch it fail on `chart/sparkline`, then
   §3a/§3b. Sweep for other `files ?? []` consumers.
3. **WS-8 §9 repro** — run the build and the two greps. Cheap, and it may reorder everything
   below it.
4. **WS-1 §2b/§2c** — findability + the two new guards.
5. **WS-3 §4** — time-box the Option B spike, else Option A; then the docs and the parity guard.
6. **WS-4 §5a** — build and verify the charts CSS truth before writing the table.
7. **WS-4 §5b/§5c, WS-5 §6** — docs table, scaffold CSS drop, `Shell.tsx`, pm detection.
8. **WS-6 §7, WS-7 §8** — composition + the Stat/Kpi decision doc.
9. **WS-9 §10** — roadmap entries and the troubleshooting line.
10. **§12** — report file + ledger rows + `pnpm ready` + `pnpm ready:ci`.
11. **Release.** Until published this is all Mechanism G, and the ledger's
    "Closed — awaiting release" table is where it lives. Draining that table is a release,
    not a fix.

### Definition of done

- `pnpm ready` and `pnpm ready:ci` green.
- `pnpm regen && git diff --exit-code` clean.
- Every new/changed guard demonstrated failing on its pre-fix state — recorded in the PR body.
- A fresh `npx cascivo create` app, wired to React Router by following **only published docs**,
  reaches the router guide from `cascivo.com`, `npx @cascivo/docs` and the SPA; imports `Tone`
  without installing `@cascivo/core`; and builds with entry CSS under 100 kB.
- A "Where the implementation disagreed with this plan" section added to this file, per the
  08-08 plan's convention. Assume there will be one — the last two plans each had several,
  and §0.2 and §0.5 here exist because a previous plan's assumption was not written down.
