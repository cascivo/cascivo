# Fix plan — the 2026-08-08 adopter pair (Vercel dashboards on TanStack Start and React Router)

**Status: implemented on `claude/ui-library-analysis-plan-5emlbu` and **published** — `@cascivo/react` 0.17.0 and the matching train (2026-08-14).**
All nine workstreams have landed. Per [`README.md`](README.md), the PR that publishes to npm
sets `shippedIn` on each [`RECURRENCE.md`](RECURRENCE.md) row and flips this header — until
then every fix below is Mechanism G, which is the mechanism this plan exists to name.

| WS | Status | Guard |
| --- | --- | --- |
| WS-1 render-phase prop mirrors | merged | `primitives:check` (`render-phase-mirror.test.ts`), `data-table.controlled.test.tsx` |
| WS-2 scaffold toolchain | merged | `scaffold:check` (`scaffold-lint.test.ts`, runs real ESLint) |
| WS-3 CSS/layout defects | merged | `computed:check`, `unlayered:check` |
| WS-4a timeScale ticks | merged | `scale-time.test.ts`, `axis.time.test.tsx` |
| WS-4b chart manifest parity | merged | `meta:check` (`props-parity`, `typedefs-parity`) |
| WS-5 prop vocabulary | merged | `meta:check` (`vocabulary.test.ts`) |
| WS-6 docs findability | merged | `meta:check` (`doc-surface.test.ts`) |
| WS-7 composition gaps | merged | `meta:check` (`link-item-id-parity`), `area-chart.test.tsx` |
| WS-8 the four unreproduced items | merged | `computed:check` |
| WS-9 Mechanism G ledger | merged | `recurrence:check`, `recurrence:shipped` |

### Where the implementation disagreed with this plan

Written down because a plan that quietly disagrees with what shipped is the defect §0 is
about:

- **`useControllableSignal` was NOT the fix for `DataTable`, and the plan's step 2 was the
  reason that was caught.** The primitive performs the same render-phase write; an eager-write
  variant was tried and reverted because it broke `useDisclosure`'s contract, letting a
  parent-rejected change flash on screen. Selection now reads the controlled prop directly —
  nothing derives from it, so the mirror bought nothing at all.
- **`rows`/`columns` DO need their mirror.** The plan said to delete it and read the props
  directly in the computeds. That is wrong: `useComputed` memoises across renders, so a
  computed closing over a plain prop serves the first render's value forever. Doing it the
  plan's way froze the flow example's search filter while all 1221 component tests passed —
  caught only by an example-app test.
- **The mirror guard found four sites the plan's grep missed** (`app-shell`, `search`, `swap`,
  `toc`), for twelve total rather than nine.
- **`timeScale` had a second, independent defect.** `tickFormat()` was dead code — declared,
  implemented, called by nothing — so every time axis fell through to `toLocaleDateString()`
  and would have rendered the same label on every tick even with the tick ladder fixed.
- **The parity scope fix surfaced far more than `format`:** 39 undocumented props and 114
  missing `typeDefs` entries across 20 components, in charts, flow AND editor.
- **A trailing-slash bug in the new resolver briefly made the whole sweep look clean.**
  `REPO_ROOT` carries a trailing slash in the test but not in a probe, so a `slice`-based
  path calculation silently produced unloadable paths that read as "no source found" — the
  same false-clean shape as the `continue` it replaced. Fixed with `path.relative`.
- **WS-8 landed, and two of its four items were not what the report said they were.**
  Zebra striping was not "too subtle in dark": `--cascivo-color-bg-subtle` is aliased to
  `--cascivo-color-surface` in *every* theme, so the stripes were exactly the colour they were
  striping (measured ΔL 0.0000 ×3). The `Field` misalignment was real at 13.6px but had nothing
  to do with the description's position — `Field` renders label → control → description, so the
  description is *below* the input; the cause was `.field`'s rows absorbing slack from a taller
  grid row. Both diagnoses changed the fix, which is why the plan required a probe before a spec.
- **The first zebra replacement named a token that does not exist.** `--cascivo-color-fg` is not
  a cascivo token; an invalid `color-mix` computes to transparent, which looks *identical* to the
  bug being fixed. It was caught only because the probe measures painted alpha rather than the
  declaration — a source-level or manifest-level check would have gone green on it.

Reports (thirteenth and fourteenth):

- [`feedback-vercel-dashboard-tanstack-start-adopter-2026-08-08.md`](feedback-vercel-dashboard-tanstack-start-adopter-2026-08-08.md)
  — TanStack Start 1.168 / Router 1.170 / Vite 8 / React 19.2, SSR, Path B. 6 routes. 8 findings + 5 red flags.
- [`feedback-vercel-dashboard-react-router-adopter-2026-08-08.md`](feedback-vercel-dashboard-react-router-adopter-2026-08-08.md)
  — Vite 7 / React 19 / React Router 8.3, CSR, Path B, scaffolded with `npx cascivo create`. 5 routes. 9 findings + 4 red flags.

Both tested **registry `0.16.0` / CLI `0.7.1`**. Both built, typechecked, and linted clean,
and neither hit a hard blocker. That is again the concern rather than the comfort: every red
flag is something an adopter silently worked around.

**Carried forward:** [`RECURRENCE.md`](RECURRENCE.md) showed `Open — 0` as of the 08-06 plan.
This plan re-opened nothing on the merits — all fifteen closed rows stayed fixed on `main`.
It adds **sixteen** rows: one for the blind spot the ledger structurally could not see (§0.1,
Mechanism G) and fifteen for the findings below. Every one is `closed` with a guard that was
demonstrated failing on its pre-fix state, and every one currently sits under **"Closed —
awaiting release"** — which is the honest state until this ships, and is what
`pnpm recurrence:shipped` reports.

---

## §0 — Read this first: why the ledger said `Open — 0` and two adopters still hit closed findings

The user's framing has not changed across three plans now: *"the red flags were already
mentioned multiple times, and it always was mentioned to be fixed."* The 08-06 plan answered
that with the finding-level ledger and the binding rule (*no closure without a guard that
exists*). The ledger worked — and two adopters still re-reported closed findings two days
later. Both reasons are structural, both are verified below, and neither is "the fix
regressed".

### 0.1 The new mechanism — **G: closed on `main`, absent from the registry the adopter installs**

The ledger's `status: closed` is a property of the **working tree**. An adopter's experience
is a property of the **published tarball**. Nothing connects them, so the ledger can read
`Open — 0` while every fix it names is unreachable by `pnpm add`.

`README.md` explicitly warns against reaching for "not yet published" without checking it,
because that sentence was carried through three plans as an unverified excuse. So it was
checked, from the npm registry rather than from memory:

| Package | Version the reports used | Published | Version carrying the 08-06 fixes | Published |
| --- | --- | --- | --- | --- |
| `@cascivo/react` | `0.16.0` | 2026-08-05T09:11:55Z | `0.16.1` | **2026-08-10T05:09:39Z** |
| `cascivo` (CLI) | `0.7.1` | 2026-08-05T09:11:50Z | `0.7.2` | **2026-08-10T05:09:33Z** |

Both reports are dated **2026-08-08**. `0.16.1` did not exist for another two days. The
adopters were on the newest version that existed; the 08-06 plan's fixes had been `merged`
for days and `published` for none of it.

This is not a scheduling complaint — it changes the triage. Four findings in these two
reports are **already fixed and, as of today, already published**. Re-fixing them would be
the same waste as re-reporting them:

- Report B §1 — the scaffold's `reactHooks.configs['recommended-latest']` crash. Fixed at
  `packages/cli/src/commands/create.ts:403`, which now emits `reactHooks.configs.flat[…]`
  with a comment naming the trap. Shipped in CLI `0.7.2`.
- Report B "Minor" — the scaffold's layer statement omitting `cascivo.platform`. Fixed at
  `create.ts:230-231`; the statement now matches `packages/tokens/src/layers.css:48`.
- Report A §8 — `Card padding="none"` not removing padding under `CardContent`. Not a bug:
  `card.module.css:16-27` splits `--_card-p` (the card box) from `--_card-inner-p`
  (subcomponents) *deliberately*, with the rationale in a source comment. The **docs gap is
  real and stays open** — see WS-6.
- Report A §5 — `AreaChart` overlapping opaque fills. Partially mitigated:
  `area-chart.tsx:44-46` already drops multi-series fills to
  `--cascivo-chart-fill-opacity-overlap` (0.12). The *structural* half — no per-series mark
  type — stays open, see WS-7.

**The fix for Mechanism G is a guard, not a promise.** See WS-9.

### 0.2 The old mechanisms recurred through **guard scope**, not guard absence

Three findings landed in places a guard already existed but structurally could not reach.
This is Mechanism F's sibling: not *the guard re-implements the adopter's tool*, but *the
guard is scoped to exclude the site where the defect lives.*

1. **`props-parity` and `typedefs-parity` skip every chart.** Both resolve a component's
   source from its registry `files[]` entry and bail when it is empty:

   ```
   scripts/checks/props-parity.test.ts:83   if (tsx.length === 0) continue // npm-installed (charts/flow/editor): no source
   scripts/checks/typedefs-parity.test.ts:121  (identical line)
   ```

   Charts ship via npm, so `files` is `[]` for all **26** `chart/*` registry entries
   (verified: `registry.json` → `chart/area-chart` has `files: []`). The guard whose whole
   job is "manifest props match the TS interface, both directions" has never once run against
   a chart. That is precisely how `AreaChart.format` — which exists at
   `area-chart.tsx:210` with a doc comment citing the 2026-07-28 report — is absent from
   `area-chart.meta.ts`, from `registry.json`, and therefore from `llms.txt`,
   `llms-full.txt` and `cascivo.com/llms/chart/area-chart.md`. Report B found it only by
   grepping the `.d.ts`. **WS-4.**

2. **`scaffold-contract` asserts the config's *text*, never runs ESLint.**
   `scripts/checks/scaffold-contract.test.ts:187` — *"pre-wires the react-hooks/immutability
   escape so `lint` passes on a fresh app"* — string-matches the generated
   `eslint.config.js`. It therefore passes green on a config that registers no TypeScript
   parser and no `files` pattern, so ESLint 9 skips every `.ts`/`.tsx` in a TypeScript-only
   app. Report B: `pnpm lint` exits 0 having inspected **zero files**. This is Mechanism F
   again, one plan after F was named for exactly this shape — and the repo already owns the
   cure (`lint:host-eslint` runs real ESLint). It was simply never pointed at the scaffold.
   **WS-2.**

3. **`unlayered:check` scans shipped package CSS, not CLI-generated templates.** So
   `create.ts:248-252` still emits

   ```css
   html, body, #root { height: 100%; }
   ```

   unlayered — in the same generated file that declares the layer order, and whose sibling
   `AGENTS.md` says *"never emit it"*. **WS-3.**

### 0.3 One house rule is violated in shipped source, and nothing checks it

`CLAUDE.md` § *"Syncing a controlled React prop into a signal"* is unambiguous: do **not**
hand-roll `const s = useSignal(open); s.value = open`; use `useControllableSignal` (render
reads) or `useEffectPropSignal` (effect reads). It names the seven components where that
exact shape once ran `showModal()` mid-render.

`packages/components/src/data-table/data-table.tsx:191-201` does it four times, under a
comment that states the anti-pattern as the intent:

```
191  // Sync props into signals during render so computeds see fresh data.
193  rowsSignal.value = rows
195  columnsSignal.value = columns
198  if (sort !== undefined) sortSignal.value = sort
201  if (selection?.selected !== undefined) selectedSignal.value = selection.selected
```

Line 201 is the one Report A bisected to: controlled selection warns, uncontrolled does not —
and uncontrolled is exactly the branch where line 201 does not execute. There is **no guard**
for this rule; `primitives:check` covers aria ids and outside-click listeners only. Eight
further call sites share the shape (`side-nav.tsx:378`, `tabs.tsx:27`, `date-picker.tsx:138`,
`accordion.tsx:42`, `calendar.tsx:146-147`, `combobox.tsx:105`). **WS-1.**

### 0.4 The docs findings are a *vocabulary* problem, and the guard for it covers the wrong half

Report A's single largest cost was nine wrong prop-name guesses, one of which
(`gap="4"` vs `gap={4}`) produced 20 type errors in one run. `scripts/checks/vocabulary.test.ts`
exists and is the right shape — but it guards prop **values** (the `Tone` and `Progress`
unions, six components). Prop **names** — `items` vs `rows`, `variant` vs `shape`, `kind` vs
`type` as the discriminant — are unguarded. **WS-5.**

Per the user's instruction that docs fixes must be *perfectly documented and easy to find*,
every docs workstream below states its **surfaces** explicitly and is guarded by a
multi-surface assertion in the shape of `getting-started-contract`. A fact that lands on one
surface only is Mechanism D, which is already in the taxonomy.

---

## §1 — Triage

Every item in both reports, with a verdict against `main` at registry `0.16.1`. `Fixed`
means verified fixed in the working tree **and** published. Evidence is `file:line`.

### Report A — TanStack Start

| # | Finding | Verdict | Evidence | Mech. | WS |
| --- | --- | --- | --- | --- | --- |
| A1 | 9 unpredictable prop names | **Open** | `badge.tsx:7` `BadgeShape` names a type that is not the `shape` prop | A | WS-5 |
| A2 | `DataTable` controlled selection → setState-in-render | **Open (P0)** | `data-table.tsx:201` render-phase write | — | WS-1 |
| A3 | `AppShell` `<main>` has zero padding | **Open** | `app-shell.module.css:87-91`; no `padding` prop in `app-shell.tsx` | A | WS-3 |
| A4 | `Card` is not `position: relative` | **Open (P0)** | `card.module.css:2-14` — no `position` | A | WS-3 |
| A5 | `AreaChart` `secondAxis` → two opaque fills | **Partly fixed** | `area-chart.tsx:44-46` opacity mitigated; `AreaChartSeries` (54-75) still has no mark type | — | WS-7 |
| A6 | `Switcher` keys by `href`, no `id` | **Open** | `switcher.tsx:7-12` — `SwitcherLink` has no `id`, unlike 5 sibling link types | D | WS-7 |
| A7 | `SideNav` active state must be hand-computed | **Open (docs)** | `USING-WITH-A-ROUTER.md` has no prefix-match recipe | A | WS-6 |
| A8a | `Card padding="none"` keeps `CardContent` padding | **Fixed (by design) — docs open** | `card.module.css:16-27` deliberate, rationale in comment only | A | WS-6 |
| A8b | `DataTable zebra` invisible in dark | **Unverified** | needs a computed-style probe per theme | — | WS-8 |
| A8c | `density="compact"` barely distinguishable | **Won't fix** | row height is content-driven; document instead | A | WS-6 |
| A8d | `Button` wraps children in an inner `<span>` | **Open (docs)** | `button.tsx:70` | A | WS-6 |
| A8e | Icon+text in `Button` gets no automatic gap | **Unverified** | needs repro; likely `:has()` selector gap | — | WS-8 |
| A8f | `Select` needs `aria-label`, not `label` | **Open (docs)** | labelling contract differs across `Field`/`Select`/`Search`/`Toggle` | C | WS-5 |
| A8g | `DataTable` checkbox covered by decorative span → `.check()` times out | **Open** | `checkbox.module.css:15-16` `.input` absolute, `.control` has no `pointer-events: none` | A | WS-3 |
| A9 | `vite build` succeeds with type errors | **Open (scaffold)** | scaffold `build` script does not run `tsc` | D | WS-2 |

### Report B — React Router

| # | Finding | Verdict | Evidence | Mech. | WS |
| --- | --- | --- | --- | --- | --- |
| B1 | Scaffold ESLint config crashes | **Fixed, published 0.7.2** | `create.ts:403` uses `configs.flat[…]` | C | — |
| B2 | Scaffold lints zero files | **Open (P0)** | `create.ts:394-410` — no TS parser, no `files` | F | WS-2 |
| B3 | `react-hooks/immutability` ordering trap | **Open (docs)** | only surfaces after B1+B2 are fixed | D | WS-2 |
| B4 | `timeScale` returns 1 tick for any sub-day domain | **Open (P0)** | `scale-time.ts` `pickInterval` has no step multiples | — | WS-4 |
| B5 | `AppShell` padding; scaffold models it with an inline style | **Open** | same as A3; scaffold `Dashboard.tsx` uses inline `style` | D | WS-3 |
| B6 | `format` missing from published chart docs | **Open (P0)** | `area-chart.tsx:210` exists; absent from `area-chart.meta.ts` → `registry.json` | B+F | WS-4 |
| B7 | `DataListItem` looks like a component, is an interface | **Open (docs)** | `data-list.tsx:7-8` `{label,value}`; flat export list | A | WS-5 |
| B8 | Route code-splitting defeated by sparklines on the landing page | **Open (docs)** | `RECIPE-DASHBOARD.md` gives two mutually exclusive recommendations | C | WS-6 |
| B9a | `DataTable` free-form column squeeze | **Open (docs)** | sizing guidance under-specifies leftover distribution | A | WS-6 |
| B9b | `Field` rows not baseline-aligned in a `Grid` | **Unverified** | needs computed-style probe | — | WS-8 |
| B9c | `GridItem` children don't stretch | **Unverified** | needs computed-style probe | — | WS-8 |
| B9d | Layer statement omits `cascivo.platform` | **Fixed, published 0.7.2** | `create.ts:230-231` | C | — |
| B9e | Unlayered CSS in generated `index.html` | **Open** | `create.ts:248-252` | D | WS-3 |
| B9f | Scaffold ships no formatter | **Open** | no prettier config or `format` script in `create.ts` | — | WS-2 |
| B9g | Peer-dependency noise | **Not ours** | sibling workspace package | — | — |

---

## §2 — WS-1 · `DataTable` controlled selection (P0, correctness)

**Report:** A2. **Guard:** `data-table.controlled.test.tsx` + `render-phase-mirror.test.ts`.

### Root cause

`data-table.tsx:201` writes a signal during render. Preact signals run subscriber
notifications **synchronously on write**, so a render-phase write can drive an update into a
component that has already rendered — which is what React 19 reports as *"Cannot update a
component while rendering a different component."* The bisection in the report matches
exactly: the uncontrolled path never executes line 201.

### ⚠ Do not assume `useControllableSignal` is the fix

`packages/core/src/controllable.ts:43` performs **the same render-phase write**
(`if (isControlled) sig.value = value as T`). Swapping the call site may relocate the
warning rather than remove it. The difference that may matter is that the primitive calls
`useSignals()` itself (line 32), so the writing component is guaranteed to be a subscriber
and the update is a legal same-fiber render-phase update.

**Therefore step 1 is a reproduction, not an edit.** Implementer sequence:

1. Write `data-table.controlled.test.tsx`: React 19, a parent holding
   `useState<string[]>([])`, `selection={{ mode:'multi', selected, onChange:setSelected }}`,
   click a row checkbox, assert `console.error` was not called. **Demonstrate it failing on
   the current source** — the ledger rule requires it.
2. Add the same test for `useControllableSignal` directly in `packages/core`.
   - If the primitive **also** warns, fix the primitive (defer the mirror, or guard the
     write with an identity check so an unchanged value never notifies). This fixes all
     nine call sites at once and is the preferred outcome.
   - If the primitive is **clean**, the defect is DataTable's hand-roll and the fix is the
     migration below.
3. Migrate `data-table.tsx:200-201` to `useControllableSignal`, and `198` (`sort`) with it.
4. `rowsSignal`/`columnsSignal` (192-195) are unconditional render-phase writes of props
   that already arrive fresh. Delete them and read `rows`/`columns` directly inside the
   `useComputed` bodies — a computed closing over the current render's props needs no mirror.

### Guard

- `packages/components/src/data-table/data-table.controlled.test.tsx` — asserts no
  `console.error` under controlled selection, and that `onChange` receives the right ids.
- `scripts/checks/render-phase-mirror.test.ts` — **new**, repo-wide. Fails on
  `<name>Signal.value = <expr>` or `if (x !== undefined) <sig>.value = x` at statement level
  in a component body, outside a handler or `useSignalEffect`. Allowlist
  `packages/core/src/{controllable,machine,theme}.ts` (the primitives that own the pattern)
  with a reason. Add to `primitives:check`.
- Migrate the eight other call sites listed in §0.3 in the same PR, or the new guard cannot
  be turned on.

### Acceptance

`data-table.controlled.test.tsx` red before, green after. `primitives:check` fails if any
component reintroduces the shape.

---

## §3 — WS-2 · The scaffold's toolchain (P0)

**Report:** B2, B3, B9f, A9. **Guard:** `scaffold-lint.test.ts` (runs real ESLint).

`cascivo create` is the first command an adopter runs. It currently produces a project whose
`lint` inspects nothing and whose `build` accepts type errors.

### 2a — Lint TypeScript

`create.ts:394-410` emits `js.configs.recommended` + react-hooks + `...cascivo` + `ignores`.
ESLint 9's default `files` is `**/*.{js,cjs,mjs}`; nothing here adds a TS parser or a
`files` pattern, so every `.ts`/`.tsx` is skipped with *"File ignored because no matching
configuration was supplied."*

Emit `typescript-eslint` in the template and in the scaffold's `devDependencies`:

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import cascivo from '@cascivo/eslint-config'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,          // registers the TS parser + files
  reactHooks.configs.flat['recommended-latest'],
  ...cascivo,                                // LAST — flat config is last-wins
]
```

Keep `...cascivo` last (the existing comment explains why) and keep the `.flat` comment.

### 2b — `build` must typecheck

Report A5 flags that `vite build` went green with 37 type errors. The scaffold already ships
a `typecheck` script (`scaffold-contract.test.ts:202`). Make `build` run it:
`"build": "tsc --noEmit && vite build"`.

### 2c — Ship a formatter

Emit `.prettierrc`, `.prettierignore` (including `src/components/ui/`, matching what
`cascivo init` already writes per `init.test.ts:103-117`) and a `format` script. The scaffold
already emits code in a consistent no-semicolon / single-quote / 100-col style; it should own
that rather than imply it.

### 2d — Order the immutability explanation

B3's ordering trap: the adopter meets `@cascivo/eslint-config` before ever seeing the rule it
suppresses, so it reads as an unexplained dependency. Add one comment line in the generated
`eslint.config.js` pointing at `USING-WITH-STRICT-ESLINT.md`, and one line in the generated
`README.md`.

### Guard — this is the Mechanism-F correction

`scripts/checks/scaffold-lint.test.ts` — **new**. Scaffolds into a temp dir, installs, and
runs the **real** ESLint binary over the generated `src/`, then asserts:

1. exit code 0, **and**
2. the number of files ESLint reported on is > 0 and equals the count of `.ts`/`.tsx` under
   `src/` — the assertion that would have caught B2 and that no text check can express;
3. a fixture file containing `signal.value = 1` produces **no** `react-hooks/immutability`
   error (proving `...cascivo` is effective, not merely present);
4. a fixture file containing an unused local **does** error (proving rules run at all).

Model it on `lint:host-eslint`, which already owns the "run the adopter's real tool" pattern.
Demonstrate it failing on the current template.

### Acceptance

`pnpm scaffold:check && pnpm exec node --test scripts/checks/scaffold-lint.test.ts` green;
assertion (2) demonstrated failing before 2a lands.

---

## §4 — WS-3 · The four CSS/layout defects every adopter hits

**Report:** A3, A4, A8g, B5, B9e. **Guard:** `computed:check` additions + `unlayered:check` scope.

### 3a — `Card` gets `position: relative` (P0)

`card.module.css:2` — add `position: relative`. The stretched-link pattern (`::after {
position:absolute; inset:0 }`) is *the* dashboard card idiom; without a containing block the
overlay resolves against the viewport and swallows every click on the page, silently. Report A
found it only because a Playwright click timed out. `overflow: hidden` is already on the rule,
so this changes no existing layout.

**Guard:** `computed:check` case — render a `Card` containing an `<a>` with a stretched
`::after`, assert `document.elementFromPoint()` outside the card is not the anchor.

### 3b — `AppShell` content padding

Both reports, independently, wrote the same wrapper div; the CLI's own generated
`Dashboard.tsx` works around it with an **inline style** that the sibling generated
`AGENTS.md` forbids. Three of the last four reports have raised this.

Add `padding?: SpaceStep | 'none'` to `AppShellProps`, defaulting to a token step
(`--cascivo-space-6`), applied to `.main`. Defaulting rather than documenting is the call
here: the documented-only option has now been chosen twice and re-reported twice.

Remove the inline style from the generated `Dashboard.tsx` in the same PR.

**Guard:** `computed:check` — assert `main#cascade-main` has non-zero `padding` by default and
`0px` at `padding="none"`; `scaffold-contract` — assert no `style={{` in generated source.

### 3c — `Checkbox` decoration must not eat pointer events

`checkbox.module.css` — add `pointer-events: none` to `.control`. `.input` is
`position:absolute` (line 15-16) beneath it, so every `page.getByRole('checkbox').check()` in
every adopter's suite needs `{ force: true }`. Real users click the label, so this is a
testing defect rather than a UX one — which is why it survived: no human notices, every CI
does.

**Guard:** `computed:check` — `elementFromPoint` at the control's centre resolves to the
`<input>` or its `<label>`, never to `.control`. Also document in `TESTING.md` (WS-6).

### 3d — No unlayered CSS in generated templates

`create.ts:248-252` still emits `html, body, #root { height: 100% }` unlayered, in the file
that declares the layer order. Move it into the existing `@layer cascivo.reset` block at
`create.ts:239`.

**Guard:** extend `scripts/checks/unlayered.test.ts` to scan CSS emitted by
`packages/cli/src/commands/*.ts` template literals, not only shipped package CSS. This is the
scope fix from §0.2.

---

## §5 — WS-4 · Charts: the unguarded manifest and the time scale (P0)

**Report:** B4, B6. **Guard:** `props-parity` scope fix + `scale-time.test.ts`.

### 4a — `timeScale` produces one tick for any sub-day domain

`packages/charts/src/engine/scale-time.ts`, `pickInterval`:

```ts
for (const interval of INTERVALS) if (span / interval.ms <= count * 1.5) return interval.unit
```

`INTERVALS` holds **one entry per unit** with no step multiples. For a 23-hour span and
`count = 5`: `hour` yields 23 ticks (rejected), `day` yields ~1 (accepted). Verified by hand
against the source — `hour` is only selected once `count ≥ 16`, so `ticks(3…12)` all return a
single midnight tick, exactly as the report's reduction shows. `tickInterval()` and
`tickFormat()` compound it by hardcoding `pickInterval(5)` and ignoring the caller's count.

This makes *"requests over the last 24 hours"* — the canonical deploy-dashboard chart —
unreadable, and it is reproducible at the exported primitive, independent of any component.

**Fix:** give each unit a step ladder and choose the `(unit, step)` pair whose resulting tick
count is closest to the request, the way every mature tick algorithm does:

```ts
const STEPS = {
  minute: [1, 5, 15, 30], hour: [1, 2, 3, 6, 12], day: [1, 2],
  week: [1], month: [1, 3], quarter: [1], year: [1, 2, 5, 10],
}
```

`floorToInterval`/`addInterval` already take an `n`, so `addInterval` needs no change and
`floorToInterval` needs to snap to a multiple of the step. `tickFormat()` must derive from
the **chosen** `(unit, step)` — a 3-hour step needs `{hour:'numeric'}`, not
`{month:'short',day:'numeric'}` — and `tickInterval()`/`tickFormat()` must accept the same
`count` the caller passed to `ticks()`.

**Guard:** extend `packages/charts/src/engine/scale-time.test.ts` with a domain table —
1h, 6h, 23h, 24h, 3d, 2w, 6mo, 3y — asserting for each that `ticks(n).length` is within
±50% of `n` for `n ∈ {4,6,8,12}`, never < 2, and that `tickFormat()` distinguishes ticks
that fall on the same day. Demonstrate the 23h row failing first.

### 4b — Chart manifests have never been parity-checked

`props-parity.test.ts:83` and `typedefs-parity.test.ts:121` skip any component whose registry
`files[]` is empty. All 26 `chart/*` entries are npm-shipped, so `files: []`, so **zero chart
props have ever been checked against their TS interface**. `AreaChart.format`
(`area-chart.tsx:210`) is the visible consequence: real, documented in TSDoc, invisible to
`registry.json` / `llms.txt` / `llms-full.txt` / the docs site. It is also the fix for 4a's
symptom, so the one prop an adopter needed most was the one the guard could not see.

**Fix:** resolve source for npm-shipped registry entries from the workspace path implied by
`dependencies[0]` (`@cascivo/charts` → `packages/charts/src`) instead of `continue`-ing.
Keep a narrow, *reasoned* allowlist for anything genuinely sourceless, and assert the
allowlist is non-growing.

Expect this to surface more than `format` across 26 charts. **Fix every prop it finds in the
same PR** — a guard turned on with exceptions is the shape that produced this.

**Guard:** `props-parity` / `typedefs-parity` themselves, once scoped. Add an assertion that
the number of parity-checked components is ≥ the number of registry entries minus the
allowlist, so a future `files: []` cannot silently re-exempt a package.

---

## §6 — WS-5 · Prop-name vocabulary (the highest-frequency friction)

**Report:** A1, A8f, B7. **Guard:** `vocabulary.test.ts` extension + `llms.txt` section.

Nine wrong guesses in one small app; `gap="4"` alone cost 20 type errors. Every one is a
compile round-trip, and for an AI-first system prop predictability *is* the product. The
existing `vocabulary.test.ts` guards prop **values**; this extends it to prop **names**.

### 5a — Fix the two outright traps

- **`badge.tsx:7`** — `type BadgeShape = 'secondary'|'outline'|'primary'` sits directly above
  `BadgeProps` and is the type of the **`variant`** prop. Rename to `BadgeVariant`. A type
  named for a prop that does not exist is a trap of our own making, and it cost the reporter
  four files.
- **`StructuredList`** takes `items` while `DataTable` next door takes `rows`
  (`structured-list.tsx:24` already carries a "pass `items`, not children" comment from a
  previous round — the comment was added, the inconsistency was not). Pick `items` as
  canonical for config-driven lists; add `rows` as a deprecated alias on `StructuredList`
  only if telemetry warrants. Do **not** rename `DataTable.rows` — a table's rows are rows.
  Document the split instead (5b).

### 5b — Publish the vocabulary, on every surface

Add a **"Prop vocabulary"** table next to the existing (and, per both reports, excellent)
event-handler-naming table. Surfaces, all of them:

- `docs/AI-RULES.md` — the published contract.
- `scripts/llms/generate.ts` — so it lands in `llms.txt` **and** `llms-full.txt`.
- `CLAUDE.md` § *Component Authoring Rules* — so new components inherit it.

Contents, each with the *why*, because these are the nine that were actually guessed wrong:

| Concept | Canonical | Not | Note |
| --- | --- | --- | --- |
| Config-driven collection | `items` | `rows`, `data` | `DataTable.rows` is the sole exception — it renders a `<table>` |
| Visual style enum | `variant` | `shape`, `kind`, `type` | `BadgeShape` is being renamed |
| Discriminated-union tag | `kind` | `type` | applies to `annotations`, and to every new union |
| Space/size scale | numeric `SpaceStep` (`gap={4}`) | `gap="4"` | ⚠ every *other* size prop is a string union — call this out explicitly |
| Accessible name, no visible text | `ariaLabel` | `label` | `label` renders **visible** text on `Toggle`, `Select`, `Field` |
| Rich replaceable slot | `actions: ReactNode` | `action: {label,onClick}` | `Alert.action` is the exception; note it |
| Body text on a feedback component | `description` | children | `Notification` renders nothing for children |

Also document that `DataList`/`StructuredList`/`Timeline` are **items-prop-driven** while
`ListItem`/`ContainedListItem`/`MenuItem` are **children-driven**, and that `DataListItem` is
an *interface*, not a component (B7). Mark types vs components in the export list the docs
generate.

### Guard

Extend `scripts/checks/vocabulary.test.ts` with a prop-name axis over all registry manifests:

1. no component declares both `items` and `rows`;
2. no prop named `shape` where `variant` exists, and no exported type named `<X>Shape`
   unless the component has a `shape` prop;
3. every discriminated union in a manifest prop type uses `kind` as its tag;
4. a prop named `label` is either visible-text or `ariaLabel`, never a silent accessible name;
5. every row of the published table resolves to a real prop on a real component — so the
   table cannot rot (the `getting-started-contract` pattern).

---

## §7 — WS-6 · Docs that must be *easy to find*, not merely present

**Report:** A7, A8a, A8c, A8d, B8, B9a, plus 3c. **Guard:** `doc-surface.test.ts`.

The user's instruction is explicit: if it is a docs issue, it must be **perfectly documented
and easy to find**. Each item below names its surfaces; the guard asserts *all* of them, which
is the standing cure for Mechanism D.

| Item | Fact to document | Surfaces |
| --- | --- | --- |
| A7 | Canonical prefix-matching active-nav helper (`/projects/x` must light `/projects`; query strings ignored). Both reports hand-wrote it. | `USING-WITH-A-ROUTER.md`, `SideNav` TSDoc, `RECIPE-DASHBOARD.md` |
| A8a | `padding="none"` strips the **card box's** padding; `CardHeader`/`CardContent`/`CardFooter` keep their own by design. For a flush child, skip `CardContent`. | `Card.padding` TSDoc → manifest → `registry.json` |
| A8c | `density="compact"` changes row padding only; tall cell content dominates. | `DataTable.density` TSDoc |
| A8d | `Button` wraps children in an inner `<span>`; target `> span` at your peril. Give the wrapper a `data-cascivo-*` hook and document it. | `Button` TSDoc, `STYLING-INTERNALS.md` |
| B8 | Sparklines on the landing page and route-splitting charts are mutually exclusive — the recipe currently recommends both. Either add a `@cascivo/charts/sparkline` subpath that does not pull the engine, or state the trade-off. | `RECIPE-DASHBOARD.md` |
| B9a | Column sizing: leftover width distribution when sized columns nearly fill the table. | `Column.width` TSDoc |
| 3c | Selecting a `DataTable` row in Playwright: click the label, or `{ force: true }` — with the reason. | `TESTING.md` |

**Guard:** `scripts/checks/doc-surface.test.ts` — a table of `(fact-id, [surfaces], regex)`
asserting each fact appears on every listed surface. This is `getting-started-contract`
generalised beyond first-day facts; reuse its machinery.

---

## §8 — WS-7 · Composition gaps

**Report:** A5, A6.

- **`SwitcherLink` needs `id`.** `switcher.tsx:7-12` has `{label, href, active?, icon?}` while
  `SideNavItem`, `ShellHeaderNavLink`, `ShellHeaderNavMenuItem`, `HeaderLink` and `CommandItem`
  **all** carry an `id` with a doc comment explaining it exists for placeholder `#` links.
  `Switcher` was missed by that sweep — Mechanism D exactly. Add `id?: string`, key on
  `id ?? href`. **Guard:** a manifest sweep asserting every link-shaped item type exposes `id`,
  in the shape of `ref-parity`.
- **`AreaChart` per-series mark type.** `AreaChartSeries` (`area-chart.tsx:54-75`) has
  per-series `color`, `axis` and `y`, but no mark type, and `fill` is chart-level (line 223).
  A requests-vs-errors dual-axis chart therefore cannot render errors as a line, and
  `ComboChart` is bar+line, not area+line. Add `type?: 'area' | 'line'` to `AreaChartSeries`
  (narrower and more useful than per-series `fill`). Manifest + parity guard from WS-4 apply.

---

## §9 — WS-8 · Reproduce before speccing

Four items are plausible but unverified; each needs a probe before it gets a fix. Listing
them as work rather than as findings, because speccing an unreproduced defect is how the
07-28 `@types/react` item cost two plans.

**Outcome: all four reproduced, and two of the four diagnoses were wrong.** That is the
return on requiring the probe — each wrong diagnosis pointed at a different fix.

| Item | What the probe found | Fix |
| --- | --- | --- |
| A8b `DataTable zebra` invisible in dark | **Worse and not theme-specific.** Every theme aliases `--cascivo-color-bg-subtle` to `--cascivo-color-surface`, so striping a table on a surface repainted each row its own colour. ΔL exactly `0.0000` in all three. | Translucent foreground overlay that adapts per theme |
| A8e Icon+text `Button` gap inconsistent | **Reproduced at 0.00px.** All children go into ONE inner `<span>`, so the button's flex `gap` applied between the Spinner and that wrapper, never between an icon and its label. | The wrapper is a flex row inheriting the gap |
| B9b `Field` baseline misalignment in `Grid` | **Reproduced at 13.6px, wrong cause.** `Field` renders label → **control** → description, so the description is *below* the input and cannot push it down. `.field`'s own rows were absorbing slack from a taller grid row. | `align-content: start` on `.field` |
| B9c `GridItem` children don't stretch | **Reproduced (74px vs 250px).** The item stretched to the row, but a block container cannot pass that height to its child — which is why the reporter's `Grid align` attempt did nothing. | `.grid-item` is a grid container |

The zebra probe deserves one more note: the **first** replacement named `--cascivo-color-fg`,
which is not a cascivo token. An invalid `color-mix` computes to `transparent`, so the "fix"
rendered identically to the bug. Only a probe that measures **painted alpha** catches that —
one asserting on the declaration, the manifest, or the source would have gone green.

---

## §10 — WS-9 · Close Mechanism G: make the ledger know what shipped

**This is the workstream that stops the next report.** Without it, every fix below can be
`closed` with a guard and still be invisible to an adopter for a week.

1. **`recurrence.json` gains `shippedIn`** (a semver string) per finding, alongside `guard`.
2. **`recurrence:check` gains a published-version assertion**: for every `status: closed` row,
   `shippedIn` must be ≤ the version currently on npm `latest` for the package the guard
   covers. Rows that are closed on `main` but not yet published render in a new
   **"Closed — awaiting release"** section of `RECURRENCE.md`, not under "Closed".
   Reuse `pnpm npm:parity` (`scripts/checks/npm-parity.test.ts`), which already talks to the
   registry; run this assertion in the daily `docs-freshness` workflow rather than in `ready`,
   so an offline `ready` stays offline.
3. **`RECURRENCE.md`'s header states the published floor** — "closed rows are shipped as of
   `@cascivo/react@X.Y.Z`, published `<date>`" — derived, never hand-written.
4. **Release cadence:** the 08-06 plan sat merged-unpublished for four days across two
   adopter runs. Add to `RELEASING.md`: *a plan whose workstreams are all `merged` triggers a
   release; the plan's status header may not read `implemented` for more than one business day
   without either a published version or a stated reason.*
5. **Amend `README.md`'s mechanism list** with G, and amend the warning about "not yet
   published": the sentence remains banned *as an unchecked excuse*, and is now required
   *as a checked fact* — `npm view <pkg> time --json` is the check, as used in §0.1.

---

## §11 — Recurrence ledger rows

All sixteen are in `docs/internal/feedback/recurrence.json` and `closed`, each naming a guard
that **was demonstrated failing on its pre-fix state** before the row was closed — including
`link-item-id-parity`, which was written after its fix and so had only ever been green until
the fix was reverted to watch it fail.

All sixteen also carry `shippedIn: null`, so [`RECURRENCE.md`](RECURRENCE.md) lists them under
**"Closed — awaiting release"** rather than under "Closed — shipped". That is the honest state,
and draining it is a release (§10), not a fix.

Four rows beyond the twelve originally planned came out of WS-8, whose items the plan had
declined to spec before reproducing them.

| id | Title | Mech. | Guard (must exist before closing) |
| --- | --- | --- | --- |
| `closed-on-main-not-published` | Findings closed in the ledger are unreachable by `pnpm add` for days | **G** | `recurrence:shipped` (npm-verified) + `recurrence:check` shippedIn assertions |
| `render-phase-prop-mirror` | Components hand-roll the forbidden render-phase prop mirror | — | `render-phase-mirror.test.ts` |
| `scaffold-lints-nothing` | `cascivo create`'s ESLint config inspects zero TypeScript files | F | `scaffold-lint.test.ts` (runs real ESLint, asserts file count) |
| `scaffold-build-skips-typecheck` | Scaffold `build` goes green with type errors | D | `scaffold-contract.test.ts` |
| `chart-manifests-unguarded` | 37 npm-shipped entries have never been props-parity checked | F | `props-parity` (scoped), `typedefs-parity` (scoped) |
| `timescale-subday-one-tick` | Sub-day time domains render a single date tick | — | `scale-time.test.ts` domain table |
| `card-no-containing-block` | `Card` is not `position: relative`; stretched links cover the viewport | A | `computed:check` `elementFromPoint` case |
| `appshell-no-content-padding` | `AppShell` content sits flush; every adopter writes the same wrapper | A | `computed:check` + `scaffold-contract` no-inline-style |
| `checkbox-decoration-eats-pointers` | Decorative control intercepts pointer events, breaking `.check()` | A | `computed:check` `elementFromPoint` case |
| `unlayered-css-in-cli-templates` | Generated `index.html` emits unlayered CSS | D | `unlayered:check` (scoped to CLI templates) |
| `prop-name-vocabulary` | Prop **names** are unpredictable across the catalog | A | `vocabulary.test.ts` prop-name axis |
| `link-item-id-parity` | Link-shaped item types lack `id`, forcing `href` keys | D | `link-item-id-parity.test.ts` |
| `zebra-token-aliased-to-surface` | Zebra striping paints rows the colour they already are | E | `computed:check` painted-alpha probe |
| `button-icon-label-no-gap` | An icon next to a label inside a Button renders touching | A | `computed:check` |
| `griditem-child-does-not-stretch` | A Card in a spanning GridItem leaves a hole in the row | E | `computed:check` |
| `field-rows-absorb-grid-slack` | Fields in a Grid row put their inputs at different heights | E | `computed:check` |

---

## §12 — Sequencing

Independent; parallelise freely. **WS-9 first** — it is the one that decides whether any of
the rest reaches an adopter.

| Order | WS | Why here |
| --- | --- | --- |
| 1 | WS-9 (§10) | Without it the rest can ship to `main` and never to npm |
| 2 | WS-1 (§2), WS-4a (§5) | The two correctness bugs; both need a failing test first |
| 3 | WS-2 (§3), WS-3 (§4) | First-run experience; all one-file, high blast radius |
| 4 | WS-4b (§5) | Scope fix; expect a burst of manifest work across 26 charts |
| 5 | WS-5 (§6), WS-6 (§7) | Docs + vocabulary; depend on WS-4b for chart props |
| 6 | WS-7 (§8), WS-8 (§9) | Composition gaps and the unreproduced four |

### Definition of done for this plan

| # | Criterion | State |
| --- | --- | --- |
| 1 | Every workstream row reads `merged` | ✅ all nine |
| 2 | `pnpm ready` green | ✅ exit 0 |
| 3 | `pnpm recurrence:check` green, every new row `closed` with a guard **demonstrated failing first** | ✅ sixteen rows |
| 4 | Every CI gate outside `ready` that these changes touch, run directly | ✅ see below |
| 5 | The plan header names the **published** version | ⛔ **not done — this is a release** |
| 6 | `RECURRENCE.md` shows no row under "Closed — awaiting release" | ⛔ **sixteen rows waiting** |

Criteria 5 and 6 are one action: merge, let the changeset cut the Version PR, publish, then
set `shippedIn` on the sixteen rows and flip this header. **Until that happens, every fix in
this plan is Mechanism G** — fixed, guarded, and unreachable by `pnpm add`. That is not an
observation about process hygiene; it is the exact state in which the 08-06 plan's fixes sat
while the two reports this plan triages were being written.

`pnpm recurrence:shipped` reports it, and is expected to be red until then.

#### Criterion 4 — the gates `pnpm ready` does not run

`CLAUDE.md` notes that `ready` is not a strict superset of CI, and says to run the absent
gates directly if you touched what they cover. These changes touch component CSS, charts, the
CLI templates and the manifests, so all of them apply. Every one was run on the final tree:

| Gate | Result | Why it applies here |
| --- | --- | --- |
| `bare-page:check` | ✅ 6 | Card/AppShell/Checkbox/zebra CSS, against shipped `styles.css` and nothing else |
| `no-js:check` | ✅ 7 | server HTML never hydrated — the `clientJs: 'enhancement'` contract |
| `isolated:check` | ✅ 4 | packed tarballs type-checked outside the repo with `skipLibCheck` OFF |
| `pack:check` | ✅ 18 pkgs | publint + attw over the packed artifacts |
| `docs:coverage` | ✅ 1362 props | the 39 newly documented props land here |
| `audit:stories` | ✅ 113/130 | stories are generated from the manifests this plan edited |
| `deps:check` / `deps:smoke` | ✅ | manifest dependency edits across charts/flow/editor |
| `audit:animation` | ✅ | `prefers-reduced-motion` over the changed CSS |
| `audit:signals` | ✅ | the twelve `useSignals()` call sites the mirror migration touched |
| `links:check` | ✅ 25 routes | new doc sections and cross-links |
| `fallback:check` | ✅ | the new `color-mix` zebra declaration |
| `breakpoint:check` | ✅ 2 | no off-scale literals in the new CSS |
| `demos:storage:check` | ✅ 6 | unchanged, run for completeness |

`npm:parity` is deliberately **not** in that list: it compares the published tarball against
this checkout, so it is red by construction until the release. That is the same fact criteria
5 and 6 record, measured a different way.
