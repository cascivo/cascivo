# Fix plan: the 2026-08-22 "Vercel-style dashboard, Vite + React Router" experience report

**Status: IMPLEMENTED, 2026-08-22.** All twelve workstreams shipped across five phases.
`pnpm regen` is deterministic (clean `git diff` on a second run), `meta:check` is 384/384, and
the workspace build, type check and test suite are green, plus `ssr` / `css-contract` / `rsc` /
`dts-tsdoc` / `type-exports` / `computed` / `scaffold` / `visual-baselines` / `lint:host-strict`.

The spec below is kept **as written** because it is the root-cause record — a spec quietly
rewritten to match what happened stops being evidence of anything. Where implementation
diverged, the divergences are listed immediately below rather than edited into the workstreams.

### Where implementation diverged from this spec

- **WS-8's "inline the core types into the flat `.d.ts`" was not done, and should not be.**
  The spec rejected "correct the claim instead" as giving up a property worth having. That was
  wrong on the facts: `flatten-types.mjs:84-92` records that the component sources already
  import those names from `@cascivo/core`, so a re-export makes the dts bundler emit
  `ToneInput as ToneInput$1` and **every prop switches to the aliased name** — measured, and
  rejected by `check-styles-complete`'s `$N` rule. That is why `@cascivo/react/types` exists.
  Shipped instead: the adopter's actual pain (greppability) is fixed by exploding specifier
  lists one name per line — longest line 7190 → 259 chars, `grep ThemeProviderProps` now finds
  it — and the published claim is corrected to state precisely what is true.
- **WS-5's scope decision (§2 D1) was validated by a staleness test, and 12 of its
  exclusions were wrong.** `NO_VISIBLE_LABEL_ALIAS` was seeded with 24 components; a staleness
  assertion added in the same commit proved 12 of them do not declare a visible `label` at all,
  so they were speculative. They were removed. The map ships with 12 real entries.
- **WS-2's guard was tautological on the first attempt and had to be rewritten.** It compared
  the *generated* vocabulary sentence against `registry.json` — both sides read the same
  source, so it could never fail. Caught by testing it against deliberate drift. It now reads
  the **published** `apps/site/public/llms.txt` and checks that against the registry in both
  directions, which fails on a hand-edit, on a missing `regen`, and on a component that
  declares the prop but is not named.
- **WS-3's clamp was one pixel conservative and its own guard caught it.** `(height - 6·GAP)/7`
  ignores that rects are drawn `cell - 1` tall; the exact budget is
  `(height - 6·GAP + 1)/7`. Without the `+1` a 180-day range at 600px — which renders correctly
  today — would have been shrunk. The guard's second assertion ("changes the rendering only
  where it was already clipping") is what surfaced it.
- **WS-4's Field signal changed from "an `id` was supplied" to an explicit `aria-labelledby`.**
  The `id` heuristic would have left a standalone `<Search id="q"/>` with no accessible name at
  all. `Field` now gives its `<Label>` an id and passes `aria-labelledby`, which is unambiguous
  and regression-free.
- **WS-4's sweep found four more components with the same defect, not just `TagsInput`.** The
  new `field-composition` guard failed on `Search`, `Combobox`, `DatePicker`, `ColorPicker` and
  `Editable`; all are fixed in the same commit. §WS-4.4 asked for the sweep; this is its result.
- **WS-2 also cleared two pieces of unrelated sweep debt.** Adding `typeDefs` for `Step` and
  the `Dropdown` union members made `typedefs-parity`'s `dropdown.items` and `steps.steps`
  allowlist entries stale, and they were removed rather than re-seeded.
- **WS-12's `apps/YYYY-MM-DD-<name>` convention is in the report author's own harness repo,
  not this one.** The generalisable rule — a package name derived from its directory cannot
  collide — is what shipped. All 20 apps already satisfied it, unwritten and unenforced.
- **`claims.test.ts` rejected the component counts** written into `AI-RULES.md`'s new
  vocabulary rows ("16 components", "7 components"). Correctly: a hardcoded count rots. The
  counts were removed; the generated `llms.txt` carries the current lists.

---

Every finding below is root-caused against current source with `file:line` evidence, verified
at `3139d5e3` (2026-08-22). Every workstream carries a design decision (with the rejected
options), implementation steps, an executable guard, and acceptance criteria.

**Source report:** an agent built a 12-route "Acme Deployr" console on `@cascivo/react@0.18.0`
+ `@cascivo/charts@0.18.0` + React Router 8.3, Path B (prebuilt). Clean build, zero type
errors, zero lint warnings, all 12 routes verified in a real browser. **No blockers.**
Thirteen numbered defects (#9–#21) and one repo-level note.

**Companion document:** `docs/plans/vercel-dashboard-2026-08-21-plan.md` — the *previous day's*
report on the *same* library version by a different agent. This plan builds directly on its
§0 layer ladder and, in §0.2, reverses one of its decisions on new evidence.

---

## §0 — The finding under the findings

The 2026-08-21 plan established the organising principle for this class of work:

> **The docs are doing work the API should eventually do itself.**

…and graded every fix by which layer it lands in, cheapest-to-consume first:

| Layer | Reaches an adopter who… |
| --- | --- |
| 1. **Type system** | never read anything; the compiler tells them |
| 2. **Runtime dev warning** | wrote code that compiles but looks wrong |
| 3. **JSDoc on the prop** | hovers, or Ctrl-clicks into the `.d.ts` |
| 4. **Manifest → every generated surface** | asked the MCP server / read `llms.txt` |
| 5. **Hand-written guide prose** | read the guide for that exact task |

**The 2026-08-22 report falsifies the ladder's middle.** Two of its findings are defects
whose documentation was already complete, correct, and present on *every* surface layers 3–5
can reach — and the adopter got both wrong anyway.

### §0.1 — The proof: two findings that were fully documented and still cost a cycle

**Report #13 — `Toggle.label` is visible, `IconButton.label` is invisible.**
The report says: *"Nothing in `ToggleProps` says the label is visible."* That claim is
**false**, and the falseness is the finding. `packages/components/src/toggle/toggle.tsx:20-26`
has carried this since 2026-07-29 (`4f4a4f4b`, confirmed an ancestor of the 0.18.0 release
commit `1fc1f766`, 2026-08-17 — so it shipped in the exact version under test):

```ts
/**
 * Renders a **visible** text label beside the switch that also becomes its
 * accessible name. When a visible heading already labels the control, omit
 * `label` (it would duplicate that text) and pass `aria-label` instead …
 */
label?: string
```

It is not only in the `.d.ts`. `registry.json` carries
`toggle.label → nameVisibility: 'visible'`, description *"Visible text label beside the
switch; it also becomes the accessible name."* — which `pnpm regen` republishes into
`llms/toggle.md`, `context/toggle.md` and the site props table. **Layers 3, 4 and 5 were all
correct and complete.** The adopter still wrote the duplicate label, and only found it by
looking at the rendered page.

**Report #14 — `Filter` uses `multi`, not `multiple`.**
The report says: *"`FilterProps.multi` has no doc comment."* Also **false** —
`packages/components/src/filter/filter.tsx:27-32` has carried
*"Allow multiple items to be selected simultaneously"* since the same 2026-07-29 commit.

### §0.2 — Why layer 3 failed, and the rule that follows

The ladder implicitly assumes one kind of reader: an adopter who **knows they don't know**.
That reader hovers, Ctrl-clicks, and layer 3 works for them. The 08-22 report is written by a
different reader — one who is **confidently wrong**:

- On `Toggle`, the adopter had a working, self-consistent prior: `IconButton.label` and
  `Sparkline.label` are invisible accessible names, so `label` means "accessible name". They
  had no reason to hover a prop they were certain about. A doc only reaches someone who
  suspects they need it.
- On `Filter`, they typed `multiple` — the HTML spelling. **You cannot read the doc comment
  of a prop you do not know exists.** The doc on `multi` is unreachable by construction from
  the wrong guess.

This yields the rule this plan is graded against, and it is a genuine addition to the ladder:

> ### The Confident-Wrong Test
>
> For each finding, ask: **if the adopter's wrong belief is confident and self-consistent,
> what makes them open the doc?**
>
> If the answer is "nothing", **layer 3 is not a fix** — no matter how well written. The fix
> must land at layer 1 (make the wrong guess compile, or fail with the answer in the error) or
> layer 2 (a warning that arrives unbidden, at the moment the mistake is made).

Two corollaries used throughout:

- **A name that is ambiguous across the catalog cannot be fixed by documenting both meanings.**
  Documenting both is what the catalog already does, correctly, and the collision persists.
  Only naming or an API affordance closes it (WS-5).
- **Rank defects by the signal they emit, not by severity of consequence.** In descending
  order of quality: *type error* > *dev warning* > *visible breakage* > **plausible wrong
  output**. Findings #9, #11 and #17 all produce plausible wrong output — output an adopter
  would ship. That is the worst category and it sets the P0s.

### §0.3 — The second recurrence mechanism: hand-maintained claim lists

Report #10 (`Steps` documented with the wrong prop) has a root cause the report identified but
under-stated. The failure is not a typo. Both the published claim **and its guard** are
hand-written lists that duplicate a fact already living in `registry.json`:

- `scripts/llms/generate.ts:1052` — a hardcoded prose sentence naming seven components.
- `scripts/checks/vocabulary.test.ts:352-380` — the guard that verifies it, whose subject list
  is a hardcoded `claims` array of **eight** pairs that does not include `Steps` at all.

This repo has already written down the principle that explains this, in
`scripts/checks/link-item-id-parity.test.ts:15-25`:

> **"A guard that enumerates its own subjects can only catch the instances its author already
> knew about, which is the failure it was written to prevent, one level up."**

That guard was fixed by deriving its subjects from source. `vocabulary.test.ts` was not. The
principle exists in the codebase; it simply was not applied here. WS-2 applies it.

**This investigation found the damage is larger than the report knew** (§0.4).

### §0.4 — Novel finding: the published vocabulary rule is wrong 2 ways out of 7, and wrong in kind

`scripts/llms/generate.ts:1052` publishes:

> a config-driven collection -> **`items`** (DataList, StructuredList, Timeline, Steps,
> CommandMenu, OverflowMenu, Switcher)

Checked against `registry.json`:

| Cited component | Actual collection prop | Verdict |
| --- | --- | --- |
| DataList | `items` | ✅ |
| StructuredList | `items` | ✅ |
| Timeline | `items` | ✅ |
| OverflowMenu | `items` | ✅ |
| Switcher | `items` | ✅ |
| **Steps** | **`steps`** | ❌ — found by the report |
| **CommandMenu** | **`groups`** | ❌ — **not found by the report; found here** |

Two of seven. `CommandMenu.groups` is a second wrong entry in the same sentence that the
adopter never tripped over only because they passed the palette items through a different
route.

Worse, the *rule itself* is a simplification that is false catalog-wide. The registry holds
three distinct collection-prop families plus outliers:

- **`items`** (16): Breadcrumb, DataList, Dock, Dropdown, MenuButton, NavigationMenu,
  OverflowMenu, SideNav, StructuredList, Switcher, Timeline, Toc, ToggleGroup, TreeView,
  VirtualList, FeatureGrid
- **`options`** (7): Combobox, Filter, MultiSelect, NativeSelect, SegmentedControl, Select,
  WheelPicker — every *choice control*
- **`data`** (12): CalendarHeatmap, Candlestick, Funnel, Heatmap, Histogram, PieChart, Polar,
  RadialBar, Sparkline, Sunburst, Treemap — every *chart*
- **outliers**: `DataTable.rows`, `Textarea.rows` (the HTML attribute),
  `Steps.steps`, `ProgressIndicator.steps`, `CommandMenu.groups`

An agent that follows the published rule literally will guess wrong on **22 of ~38**
collection-taking components. The rule is not a near-miss; it describes one family of three as
if it were the whole catalog. Note also that `vocabulary.test.ts:207` asserts *"no component
declares both `items` and `rows`… `DataTable.rows` is the one exception"* — `Textarea.rows` is
a second, benign exception the assertion's prose does not admit.

### §0.5 — What is genuinely healthy, and must not be regressed

The report's §1–§8 are unusually strong praise and they identify surfaces that are working.
Any fix below that would degrade these is wrong:

- `llms.txt` as the single onboarding fetch (§1).
- The shipped `.d.ts` carrying rationale and dated adopter citations (§2) — *"Where the `.d.ts`
  and any other surface disagreed, the `.d.ts` was right every time."*
- Zero framework friction on Vite + React Router; `setLinkComponent`; `asChild` on
  `TabsTrigger` (§3, §4).
- `RECIPE-DASHBOARD.md`'s bundle guidance, *"concrete, dated, and correct"* (§5).
- `useSignals()` never needed on Path B (§7).
- `import type { Tone } from '@cascivo/react/types'` (§8).

**Implementation note:** §2 and §0.1 are in tension only in appearance. The `.d.ts` is the best
surface in the system *and* it did not reach a confidently-wrong reader. Both are true. Do not
"fix" §0.1 by writing more `.d.ts` prose.

---

## §1 — Findings ledger

"Layer" is the §0 table. "CWT" = passes the Confident-Wrong Test (§0.2) — i.e. the fix reaches
an adopter who does not suspect they are wrong.

| # | Report item | Verdict | Signal emitted today | Layer of fix | WS | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | `DropdownItem.separator` deletes the item | **Confirmed — data loss** | plausible wrong output | 1 + 2 | WS-1 | **P0** |
| 11 | `CalendarHeatmap` clips its own grid | **Confirmed — rendering bug** | plausible wrong output | bug | WS-3 | **P0** |
| 16 | `TagsInput` hard-codes `aria-label`, ignores `Field` | **Confirmed — WCAG defect** | none | 1 + 2 | WS-4 | **P0** |
| 10 | `Steps` takes `steps`; `llms.txt` says `items` | **Confirmed + rule is 2/7 wrong** | type error | 1 + 4 | WS-2 | **P0** |
| 12 | Time-series charts render epoch ms | Confirmed | plausible wrong output | 2 + 5 | WS-6 | P1 |
| 13 | `Toggle.label` visible, `IconButton.label` invisible | **Confirmed; docs already complete** | visible breakage | 1 only | WS-5 | P1 |
| 17 | `DataTable` column sizing is trial and error | Confirmed | plausible wrong output | 2 | WS-7 | P1 |
| 19 | Flat `.d.ts` not self-contained; 8 kB export line | Confirmed — doc states a falsehood | none | 1 + 4 | WS-8 | P1 |
| 20 | `Text` collides between `react` and `charts` | Confirmed — last known collision | plausible wrong output | 1 | WS-9 | P1 |
| 21 | Docs disagree about `themes/all.css` | Confirmed | none | 4 | WS-10 | P1 |
| 14 | `Filter.multi` vs `multiple` | **Confirmed; doc already present** | type error | 1 | WS-5b | P2 |
| 15 | `ariaLabel` vs `aria-label` inconsistent | Confirmed — *partially shipped 08-21* | type error | 1 | WS-5 | P2 |
| 18 | `Sparkline` flex advice points the wrong way | **Confirmed — doc gives wrong advice** | visible breakage | 5 | WS-11 | P2 |
| — | Repo note: package name vs directory name | Confirmed (not a cascivo defect) | build failure | 5 | WS-12 | P2 |

### Report claims that must NOT be implemented as written

1. **#13's premise** — *"Nothing in `ToggleProps` says the label is visible"* — is factually
   wrong (§0.1). Do not "fix" it by adding a doc comment; one is already there and it is good.
   The fix is WS-5's API change.
2. **#14's premise** — *"`FilterProps.multi` has no doc comment"* — is factually wrong (§0.1).
   Same treatment.
3. **#15's list** puts `Toggle` under *"only `aria-label`, via the spread HTML attributes"*.
   That is accurate, but the 08-21 plan **deliberately** decided not to add `ariaLabel` to
   spread-based components. WS-5 reverses that decision on new evidence — it must be
   implemented as a reversal with the reasoning recorded, not as though the gap were an
   oversight.

---

## WS-1 — `DropdownItem.separator` silently deletes the item (P0, report #9)

### Finding — confirmed

`packages/components/src/dropdown/dropdown.tsx:24-30`:

```ts
export interface DropdownItem {
  label: string      // required
  value: string      // required
  icon?: ReactNode
  disabled?: boolean
  separator?: boolean
}
```

`dropdown.tsx:188-191` — when `separator` is true the item's `label`, `value` and `icon` are
discarded and only a rule is rendered:

```tsx
{items.map((item, index) =>
  item.separator ? (
    <div key={`sep-${index}`} role="separator" className={styles['separator']} />
  ) : ( …the real item… )
)}
```

`dropdown.tsx:71` and `:118` also exclude separator entries from keyboard navigation and
selection, so the entry is inert in every respect.

The prop name means "put a rule **above** this item" in every peer menu API. Here it means
"this entry **is** a rule". `label` and `value` stay **required**, so the sanctioned usage
forces a fake row: `{ label: '', value: 'sep', separator: true }`. The adopter lost "Log out"
and found it only because a smoke test counted rows.

**`Dropdown` is the only component in the catalog with this shape** — verified by sweeping all
component `.tsx` for a `separator?: boolean` member. `Menu` uses a `<MenuSeparator/>` element
child (`menu.tsx:241`), so the catalog's own precedent is already the other way.

### Design decision

**Model the separator as a discriminated-union member tagged `kind`, and make the legacy shape
warn rather than change behaviour.**

`kind` is the catalog's mandated union tag (`CLAUDE.md` "Prop-name vocabulary"; `type` is
reserved for HTML-ish meanings and `vocabulary.test.ts:340-350` enforces it).

```ts
export type DropdownItem =
  | {
      label: string
      value: string
      icon?: ReactNode
      disabled?: boolean
      /** @deprecated Use `{ kind: 'separator' }`. Setting this DISCARDS `label`/`value`/`icon`. */
      separator?: boolean
    }
  | { kind: 'separator' }
```

**Rejected — make `separator: true` render the rule *and* the item.** It reads as the obvious
"fix the data loss" move, and it is wrong: it silently changes the rendered output of every
existing adopter's menu, in a patch, with no compile signal. A silent behaviour change is the
same defect class this workstream exists to remove.

**Rejected — rename to `type: 'separator'`** (the report's own first suggestion). `type` is
prohibited as a union tag by the vocabulary rule; `kind` carries identical intent.

**Rejected — drop `separator` outright.** Breaking, and unnecessary: the deprecation path
costs one minor and emits a loud signal in the meantime.

### Implementation

1. `packages/components/src/dropdown/dropdown.tsx` — replace the interface with the union
   above. Add a `isSeparator(item)` helper (`'kind' in item || item.separator === true`) and
   route lines 71, 118 and 188 through it, so the three call sites cannot drift.
2. Add a **dev-only warning**, fired when `separator: true` is combined with a non-empty
   `label` — that combination is unambiguously the mistake and never intentional:

   ```
   [cascivo] <Dropdown>: item { label: "Log out", separator: true } renders ONLY a rule —
   its label, value and icon are discarded. `separator` marks the entry AS a separator, it
   does not add a rule above it. Use two entries:
     { label: 'Log out', value: 'logout' }, { kind: 'separator' }
   ```

   Follow the existing warning idiom in `packages/components/src/field/field.tsx:22-58`
   (dev-gated, deduped by key, names the fix rather than the rule).
3. Update `dropdown.meta.ts` — document `kind` and mark `separator` deprecated. `pnpm regen`
   republishes to `registry.json`, `llms/dropdown.md`, `context/dropdown.md`, the site props
   table and the `.d.ts`.
4. Add to `deprecation-surfaces.test.ts`'s subject set so the deprecation is surfaced
   catalog-wide like every other.

### Guard — `scripts/checks/config-item-data-loss.test.ts` (new)

Derived, not enumerated (§0.3). Sweep every exported config-item interface (an interface with
a **required** `label`) for a **boolean** member whose name matches
`/^(separator|divider|spacer|heading|group)$/` — a boolean that turns a data-carrying row into
a non-data row is the shape that loses data. Fail with the union rewrite as the remedy.

This generalises past `Dropdown`: it fires on the *next* component that invents the same shape,
which is the only reason a guard is worth writing here at all.

### Acceptance

- `{ kind: 'separator' }` type-checks with no `label`/`value`.
- A three-item menu with a trailing `{ kind: 'separator' }` renders three `role="menuitem"`
  and one `role="separator"`; keyboard nav visits exactly three items and wraps correctly.
- Legacy `{ label: 'Log out', value: 'logout', separator: true }` renders **exactly as it does
  today** (rule only) and logs the warning once in dev, never in prod.
- New guard fails on a deliberately reintroduced `separator?: boolean` on any config item.

---

## WS-2 — The vocabulary rule and its guard are hand-maintained lists (P0, report #10)

### Finding — confirmed, and larger than reported (§0.3, §0.4)

Three separate defects:

1. **`Steps` takes `steps`, not `items`** — `packages/components/src/steps/steps.tsx:20-21`.
2. **`CommandMenu` takes `groups`, not `items`** — same published sentence, not in the report.
3. **The rule describes one of three collection-prop families as if it were all of them** —
   22 of ~38 collection-taking components take `options` or `data`.

Plus two sub-findings the report raised on `Steps` specifically:

- **`Step` has no `id`** (`steps.tsx:14-18`) while `TimelineItem`, `SideNavItem`,
  `DataListItem` and `BreadcrumbItem` all do. `scripts/checks/link-item-id-parity.test.ts`
  exists precisely to sweep this — and derives its subjects as *"an exported interface with a
  `label` and an optional `href`"*. `Step` has `label` but **no `href`**, so it falls outside
  the discovery predicate. The guard is correctly built and its predicate is one clause too
  narrow.
- **`Step.state` is typed `ProgressInput`, not the `StepState` exported beside it**
  (`steps.tsx:16-17`). The doc comment explains this, and the adopter still guessed wrong —
  another §0.2 case.

### Design decision

**Generate the published sentence from `registry.json`, and derive the guard's subjects from
the registry too.** Neither the claim nor its verifier may be a hand-written list again.

Also: **accept `items` on `Steps` as an alias for `steps`.** The catalog already established
the alias idiom for exactly this reason — `steps.tsx:33-40` accepts `label` as an alias for
`ariaLabel` with the rationale *"`label` is the guess an adopter makes when they have not read
the convention, and an unaccepted guess costs a compile cycle for nothing"*. That reasoning
applies verbatim to `items`, and satisfies the Confident-Wrong Test: the wrong guess compiles.

**Rejected — rename `Steps.steps` to `items`.** Breaking, and `steps` is the better domain word.
Alias, don't rename.

**Rejected — fix the two wrong names in the sentence and move on.** That is the third
hand-edit of a hand-maintained list, and §0.3 is what happens next.

**Rejected — delete the rule.** It is load-bearing: it exists because nine wrong prop guesses
were reported on 2026-08-08, and the report's §6/§8 confirm the vocabulary discipline is a real
strength when it is true.

### Implementation

1. **`Steps` accepts `items`.** Add `items?: Step[]`, keep `steps?: Step[]`, resolve
   `const resolved = items ?? steps ?? []`. Make **at least one required** at the type level
   via an XOR union so an empty call still fails to compile:

   ```ts
   type StepsCollection = { steps: Step[]; items?: never } | { items: Step[]; steps?: never }
   export type StepsProps = StepsBaseProps & StepsCollection
   ```

   The `menubar` `ariaLabel`/`aria-label` XOR (`aria-label-universality.test.ts:47`) is the
   existing precedent for this pattern.
2. **`Step` gains `id?: string`**; use it as the React key when present.
3. **Widen `link-item-id-parity.test.ts`'s discovery predicate** from *"`label` + optional
   `href`"* to *"`label`, and either `href` or membership in an array-typed prop of an exported
   `…Props` interface"*. Re-run and fix **every** interface it newly finds — not just `Step`.
   Record the new count in the fixture assertion so a rename that empties the sweep still fails.
4. **`Step.state` accepts `StepState`.** Keep `ProgressInput` as the accepted superset (it is
   deliberate parity with `Timeline`), but list `StepState` first in the union so the hover and
   the error message name the type the adopter can find.
5. **Generate the vocabulary sentence.** In `scripts/llms/generate.ts`, replace the hardcoded
   string at :1052 with a builder that reads `registry.json` and emits the three families and
   their exceptions by name, e.g.:

   > a config-driven collection → **`items`** (16 components: Breadcrumb, DataList, …); a set
   > of choices on a form control → **`options`** (7: Combobox, Filter, MultiSelect, …); a
   > chart's series → **`data`** (12: PieChart, Sparkline, …); table rows → **`rows`**
   > (DataTable — it renders a `<table>`; `Textarea.rows` is the HTML attribute).
   > Exceptions, all of which also accept `items`: `Steps.steps`, `ProgressIndicator.steps`,
   > `CommandMenu.groups`.

   Regenerate `llms.txt` / `llms-full.txt`. Mirror the same generated block into
   `docs/AI-RULES.md` "Data and shape props" via the existing docs-generation path so the two
   cannot diverge.
6. **`CLAUDE.md`** — correct the "Prop-name vocabulary" bullet, which currently states the
   `items`-only rule and is the instruction contributors read.

### Guard — rewrite `scripts/checks/vocabulary.test.ts`'s claims test

Delete the hardcoded `claims` array (`:352-380`). Replace with: **parse the component names
out of the generated vocabulary block and assert each named component actually declares the
prop it is cited under, in both directions** — every component cited must have the prop, and
every component *with* the prop must be cited or explicitly excepted. Bidirectionality is what
would have caught `CommandMenu`.

Add a fixture assertion that the parse found a non-zero number of citations, so a formatting
change that makes the regex match nothing fails loudly rather than passing vacuously
(`link-item-id-parity.test.ts`'s own lesson).

### Acceptance

- `<Steps items={…}/>` and `<Steps steps={…}/>` both compile; passing neither, or both, fails.
- `pnpm regen` produces a vocabulary block naming `Steps.steps` and `CommandMenu.groups`
  correctly, and `git diff --exit-code` is clean on a second run (drift check).
- The rewritten guard **fails** when `Steps` is manually removed from the generated block, and
  **fails** when a new `items`-taking component is added without regeneration.
- `link-item-id-parity` reports a larger subject count than before and passes.

---

## WS-3 — `CalendarHeatmap` clips its own grid (P0, report #11)

### Finding — confirmed at line level

`packages/charts/src/charts/calendar/calendar.tsx`:

```
:78   const weeks = hasData ? Math.max(1, Math.ceil((end - start) / MS_DAY / 7)) : 1
:81   const resolvedHeight = height ?? (plain ? 48 : 160)      ← a CONSTANT
:136  height={resolvedHeight}                                  ← passed to the frame
:145  const cell = Math.max(2, (width - (weeks - 1) * gap) / weeks)   ← derived from WIDTH only
:156-159  <rect x={c.col*(cell+gap)} y={c.row*(cell+gap)} width={cell-1} height={cell-1}/>
```

Cell edge is a pure function of container **width** and week count. Grid height is always
`7 × (cell + gap)`. `resolvedHeight` never consults `cell`. The two are unrelated numbers, so
overflow is not an edge case — it is the default whenever
`width / weeks > (height - 6·gap) / 7`.

The report's numbers reproduce exactly: 119 days → `weeks = 17`; width 1054 →
`cell ≈ (1054 − 16·gap)/17 ≈ 59`; grid height `7 × 62 ≈ 434 px` inside `viewBox="0 0 1054 160"`.
Rows 3–7 are cropped. **The wrong output is plausible** — it reads as "the heatmap has three
rows of data", which an adopter will ship.

Neither documented workaround is discoverable: there is no `cellSize` or `maxCellSize` prop,
and computing a correct explicit `height` requires the container width, which the component
knows and the adopter does not.

### Design decision

**Clamp the cell to what the box can actually show, so clipping is unrepresentable — and add
`maxCellSize` for the aesthetic ceiling.**

```ts
const fitCell = (resolvedHeight - 6 * gap) / 7          // the height budget, 7 rows
const cell = Math.max(2, Math.min((width - (weeks - 1) * gap) / weeks, fitCell, maxCellSize))
```

With `maxCellSize` defaulting to **14** (GitHub ships ~11). A short range in a wide card now
renders a correctly-proportioned grid that does not fill the width — which is right, and is
what every calendar heatmap in the wild does.

**Rejected — derive `height` from the computed cell size** (the report's first suggestion). It
cannot be done where the height is needed: `resolvedHeight` is passed to the responsive frame
at `:136`, *before* the `({ width }) => …` render prop at `:143` yields a width. Making height
depend on width requires the frame to support intrinsic/aspect sizing — a much larger change to
shared chart infrastructure, for a strictly worse outcome (a chart whose height jumps on
resize breaks surrounding layout).

**Rejected — clamp cell size only, with no height budget term.** A fixed `maxCellSize` alone
still clips whenever the caller passes a small explicit `height`. Including `fitCell` makes the
invariant hold for *every* height, which is what lets the guard below be absolute.

**Rejected — warn on overflow and render it anyway.** A warning is right when the adopter has a
choice to make. Here there is exactly one correct rendering and the component can compute it.

### Implementation

1. `calendar.tsx` — add `maxCellSize?: number` (default `14`) to props; apply the three-way
   clamp at `:145`. Apply the identical clamp at `:120` (the non-responsive/`plain` path) —
   two call sites compute `cell` and both must use one helper, or they will drift.
2. Align the grid to the inline-start edge; do not stretch to fill leftover width.
3. `calendar.meta.ts` — document `maxCellSize` and state the invariant on `height`: *"a cap on
   the drawn grid, never a crop — cells shrink to fit."* `pnpm regen`.
4. Check `packages/charts/src/charts/heatmap/heatmap.tsx` for the same shape. Its `height`
   doc (`heatmap.meta.ts:35-37`) says height does **not** track the container, and it uses a
   `bandScale` over `inner.height` (`:160`), so it is likely sound — **verify and record the
   result rather than assuming.**

### Guard — `scripts/checks/chart-overflow.test.ts` (new)

Property-style, over the existing `property-seeds` harness. For `CalendarHeatmap` across a grid
of (day-count × container-width × height) — including the reported 119 × 1054 × 160 — render
and assert **`max(rect.y + rect.height) <= viewBox.height`** and the same for x/width. One
invariant, mechanically checkable, no prose predicate.

Extend the same assertion to every chart that draws a fixed-row grid, discovered from the
registry rather than listed.

### Acceptance

- 119 days at width 1054, default height: all 7 rows visible inside the viewBox.
- A full year (53 weeks) renders unchanged from today (cells were already below the cap).
- Explicit `height={80}` shrinks cells rather than cropping rows.
- The new guard fails when the clamp is reverted.
- Visual baselines regenerated for all three themes (`pnpm visual:baselines:check`).

---

## WS-4 — `TagsInput` hard-codes its accessible name (P0, report #16)

### Finding — confirmed; a real WCAG 2.2 AA defect

`packages/components/src/tags-input/tags-input.tsx:84`:

```tsx
<input ref={inputRef} className={styles['input']}
       aria-label={t(builtin.tagsInput.label)}   ← unconditional
```

`TagsInputProps` (`:8-21`) declares no `label`, no `ariaLabel`, and no `id`. It extends
`HTMLAttributes<HTMLDivElement>` and spreads `...props` onto the **root `<div>`**, not the
inner `<input>`.

`Field` (`packages/components/src/field/field.tsx:92-132`) clones its child with
`{ id, 'aria-describedby', 'aria-invalid' }`. Against `TagsInput` those land on the wrapper
div, where they do nothing for the control. The inner input keeps its hardcoded
`aria-label="Tags"`, and because `aria-label` outranks a `<label for>` association in accessible
name computation, **it wins even if the id were wired correctly.**

Net effect: a `<Field label="Production domains">` wrapping a `TagsInput` produces a control
whose accessible name is *"Tags"*, and whose hint/error text is not announced. The library
prescribes this exact composition, and `Field` already ships dev warnings for two *other*
composition mistakes (`warnIfDoubleLabel`, `warnIfDoubleHint`) — so the composition is
supported everywhere except here.

This is the report's #3-ranked finding and it is correctly ranked. It is the only WCAG defect
in the report.

### Design decision

**Forward field wiring to the inner control, and make the built-in name the last resort.**

Name precedence, most specific first:

1. `aria-labelledby` supplied by `Field` (via the cloned `id` ↔ label association)
2. `ariaLabel` / `label` declared on `TagsInput` (invisible name; both spellings, per the
   universality rule)
3. the `@cascivo/i18n` built-in `t(builtin.tagsInput.label)` — **only when nothing else names
   the control**

**Rejected — keep the hardcoded `aria-label` and add an override prop.** Leaves the default
path (the composition the library prescribes) still broken, and the adopter who wraps in a
`Field` has no reason to look for an override.

**Rejected — drop the built-in name entirely.** A bare `TagsInput` outside a `Field` would then
have no accessible name at all — trading one WCAG failure for another. `Field` had exactly this
defect (08-21 plan, WS-1c, `DataTable`), and the resolution there was precedence, not removal.

### Implementation

1. `tags-input.tsx` — accept `id`, `ariaLabel`, `label`, `aria-labelledby` and
   `aria-describedby`; forward `id`/`aria-describedby`/`aria-invalid` to the **inner
   `<input>`**, keep the rest of `...props` on the root div. Compute the name by the precedence
   above; emit `aria-label` **only** at step 3.
2. `Field` — confirm it clones onto a child that forwards, and add `TagsInput` to whatever
   fixture `field.test.tsx` uses for the supported-control matrix.
3. `tags-input.meta.ts` — declare `ariaLabel`/`label` with
   `nameVisibility: 'invisible'` (required by `vocabulary.test.ts` and asserted against source
   by `name-visibility-parity.test.ts`). `pnpm regen`.
4. **Sweep for the same shape.** Any component rendering an interactive element it does not
   expose an id for has this defect. Grep for `aria-label={t(builtin.` across
   `packages/components/src` and evaluate each hit — do not assume `TagsInput` is unique.

### Guard — `scripts/checks/field-composition.test.ts` (new). This is the highest-value guard in the plan.

Mount **every form control in the registry** inside `<Field label="Zork" hint="Hint text">` and
assert, on the focusable control:

- computed accessible name is exactly `"Zork"`, and
- `aria-describedby` resolves to text containing `"Hint text"`.

Subjects derived from the registry (`category === 'inputs'`, or any component whose manifest
declares a `value`/`onValueChange` pair) — never enumerated.

`Field` + control is a composition the library prescribes in its own guides; nothing currently
asserts it works for more than one control at a time. This guard would have caught #16 the day
`TagsInput` shipped, and it will catch the next one.

**Note on test environment:** jsdom does not implement accessible-name computation. Use the
existing `computed:check` / `bare-page:check` Chromium harness
(`scripts/checks/computed-style.test.ts`, `bare-page.test.ts`) rather than adding a jsdom
approximation — an approximate accessible name is exactly the "guard that asserts a lie" failure
mode from the 08-21 plan §0.1.

### Acceptance

- `<Field label="Production domains"><TagsInput …/></Field>` → accessible name
  *"Production domains"*; hint announced.
- Bare `<TagsInput/>` still has the built-in name.
- `<TagsInput ariaLabel="Domains"/>` and `label="Domains"` both work and both beat the built-in.
- The new guard passes for every registry form control, and fails when `TagsInput`'s hardcoded
  `aria-label` is restored.

---

## WS-5 — `label` means two opposite things, and the wrong guess does not compile (P1, reports #13, #14, #15)

### Finding — confirmed; and the documentation is already complete (§0.1)

Current state, from `registry.json`:

| Prop | `nameVisibility` | Reality |
| --- | --- | --- |
| `toggle.label` | `visible` | painted beside the switch |
| `icon-button.label` | `invisible` | → `aria-label` |
| `icon-button.ariaLabel` | `invisible` | alias of the above |
| `filter.label` / `filter.ariaLabel` | `invisible` | alias pair |

Every one of these is correctly declared, correctly described, and correctly published to the
`.d.ts`, `registry.json`, `llms/*.md`, `context/*.md` and the site props table. **The
information is complete and it did not work** (§0.1). `Toggle` declares no `ariaLabel` at all,
so the settings-row pattern's only escape hatch is `aria-label` arriving untyped-by-name
through the `HTMLAttributes` spread.

**Relationship to the 08-21 plan — this is a deliberate reversal.** That plan's WS-1 "Group D"
proposed adding `ariaLabel` to the ~25 components with a *visible* `label`, and it was dropped
on the reasoning that those components *"already accept the standard DOM `aria-label`: typed,
familiar, and not something a camelCase second spelling would make more possible… Adding 25
redundant props would have been surface without capability."*

That reasoning is sound about **capability** and wrong about **discovery**, and the 08-22 report
is the evidence. `aria-label` via spread is capability the adopter cannot see: it does not
appear in the props table, in `llms/toggle.md`, or beside `label` in the `.d.ts`. The adopter
reached for the escape hatch only *after* seeing the duplicate label in a browser. A declared
`ariaLabel` sitting immediately beside `label`, each carrying its generated
"Rendered on screen." / "Not rendered — screen readers only." suffix, is not redundant surface —
**the side-by-side contrast is the only thing in the system that can interrupt a confident-wrong
prior** (§0.2).

### Design decision

**Three changes, all at layer 1.**

**(a) Every component that declares a *visible* `label` also declares `ariaLabel`.** Revive
Group D. This is the reversal above; record it in the workstream so the next reader sees why the
08-21 reasoning was revisited rather than overlooked.

**(b) Publish the disambiguating rule, because one already holds catalog-wide.** The collision
is narrower than it looks:

> **If a component can render text, `label` is that text. If it renders no text of its own
> (`IconButton`, `Sparkline`), `label` is the accessible name.**

That is true of the catalog today and it is defensible: on an icon-only button there is nowhere
to paint a label, so no ambiguity exists. State it in `docs/AI-RULES.md` and in the generated
vocabulary block — as a *derived, guarded* statement (below), not prose.

**(c) `Filter` accepts `multiple` as an alias for `multi`** (report #14). The HTML spelling is
the guess; an unaccepted guess costs a compile cycle for nothing. This is the identical
reasoning `steps.tsx:33-40` already records for `label`/`ariaLabel`. Sweep for other
abbreviated booleans where the unabbreviated spelling is the natural guess.

**Rejected — rename `Toggle.label` to `labelText`/`visibleLabel`.** Breaking for the most-used
control in the catalog, and it does not generalise: ~25 components have a visible `label` and
they are all correct as named.

**Rejected — a dev warning when a `Toggle`'s visible label duplicates nearby text.** The
adopter's case was a hand-built settings row, not a `Field`, so there is no reliable ancestor to
compare against. Heuristic DOM-text matching would fire on correct patterns — the same trap that
killed the 08-21 plan's "both `label` and `ariaLabel` set" warning, which would have flagged the
WCAG-2.5.3-valid `label="Qty"` + `aria-label="Quantity in units"`.

### Implementation

1. Add `ariaLabel?: string` to every component whose manifest declares
   `label` with `nameVisibility: 'visible'`. Resolution: `aria-label` (spread) → `ariaLabel` →
   the visible `label`. Declare it `nameVisibility: 'invisible'` in each manifest.
2. **Narrow `aria-label-universality.test.ts`'s scope exclusion.** It currently exempts
   components that spread onto a real `<input>`/`<select>`
   (`aria-label-universality.test.ts:17-22`). Restrict the exemption to components that declare
   **no** `label` prop at all. A component that declares `label` is making a naming claim and
   owes the adopter the other half — which is exactly the `Toggle` gap.
3. `Filter` — accept `multiple` as a deprecated-spelling alias of `multi`; document `multi` as
   canonical.
4. `docs/AI-RULES.md` + the generated vocabulary block — add the (b) rule.
5. `pnpm regen`; verify `name-visibility-parity.test.ts` still passes (it cross-checks each
   declaration against where the JSX actually puts the value, and will fail if any new
   `ariaLabel` is wired into a text position).

### Guard — extend `name-visibility-parity.test.ts`

Add the (b) rule as a mechanical assertion, so the published sentence cannot become false:

> a component whose JSX contains **any** text position fed by props must not declare
> `label` with `nameVisibility: 'invisible'`.

The classifier in `scripts/checks/lib/name-visibility.ts` already distinguishes text positions
from `aria-label={…}` positions syntactically, and already reports `'unknown'` when a value is
forwarded to another component. Preserve that: assert nothing on `'unknown'`. A checker that
invents a verdict for what it cannot see is the failure mode being removed.

### Acceptance

- `<Toggle ariaLabel="Enable previews"/>` compiles and yields that accessible name with **no**
  visible text.
- `<Filter multiple .../>` compiles.
- Every registry component with a visible `label` also lists `ariaLabel` in its props table.
- `aria-label-universality` passes with the narrowed exclusion; the `NO_LABEL_ALIAS` entries
  (`data-table`, `menubar`) still hold with their reasons intact.

---

## WS-6 — Time-series charts render epoch milliseconds (P1, report #12)

### Finding — confirmed

`area-chart.tsx:363-370` selects the scale by **runtime type of the first x value**:

```ts
const usesDate = hasData && allX[0] instanceof Date
… usesDate ? timeScale([...]) : linearScale([...])
```

`AreaChartProps.x` is typed `(d: Datum) => number | Date` (`area-chart.tsx:96`), so returning a
`number` — the obvious choice for `Date.now()`-shaped data — is fully valid and yields an axis
labelled `1,787,250,000,000`. That was the adopter's first analytics screenshot.

The prop's own doc comment (`area-chart.tsx:91-95`) *does* say a `Date` switches to a time
scale. `RECIPE-DASHBOARD.md:31` — the page you read when building a dashboard — says only
*"Both support time scales"*, with no hint that it is opt-in by value type. Another §0.2 case:
the adopter had no reason to suspect, so the prop doc was unreachable.

### Design decision

**Warn at the moment the mistake is made, and fix the recipe.**

Dev-only warning when the x accessor returns a `number` in epoch-millisecond magnitude
(`>= 1e11`, i.e. ~1973 onward) and the chart has no explicit `format`:

```
[cascivo] <AreaChart>: `x` returned 1787250000000, which looks like epoch milliseconds but is
typed `number`, so the axis uses a LINEAR scale and labels it as a raw number. Return a Date
for a time axis: x={(d) => new Date(d.t)}. Pass `format` to control tick text.
```

**Rejected — infer a time scale from epoch magnitude** (the report's second suggestion). It
silently reinterprets data based on its value, so a genuinely large numeric series (bytes,
revenue in cents, nanoseconds) would render as dates in 2026 with no way to opt out. Replacing
one silent wrong output with another is not progress.

**Rejected — recipe fix alone** (the report's first suggestion). Layer 5; fails the
Confident-Wrong Test. Do it *as well*, not instead.

### Implementation

1. Add the warning to the shared x-domain resolution used by `LineChart` and `AreaChart` —
   one implementation, both charts (`area-chart.tsx:363`, `line-chart.tsx:394`). Fire once per
   chart instance per mount, dev-gated, stripped in production.
2. `RECIPE-DASHBOARD.md:31` — replace *"Both support time scales"* with the actionable form:
   *"Both support time scales — **return a `Date` from `x`** to get one; returning a `number`
   gives a linear axis labelled with raw values. Add `format` for sub-day buckets, whose
   built-in time format repeats the same label."* The `format` clause is the adopter's own
   follow-on finding and the prop doc already admits it.
3. Mirror the same one-liner into the charts section of `llms.txt` (`scripts/llms/generate.ts`).

### Guard — `scripts/checks/recipe-channels.test.ts` (extend)

Assert the recipe row for `LineChart`/`AreaChart` mentions `Date`. This guard already exists to
keep recipe rows honest about channels; the subject is the same kind of claim.

Add a unit test asserting the warning fires for `x: () => Date.now()` and does **not** fire for
`x: () => 42`, `x: () => new Date()`, or when `format` is supplied.

### Acceptance

- `x={(d) => d.ts}` with epoch values logs the warning once in dev, never in prod.
- `x={(d) => new Date(d.ts)}` is silent and renders a time axis (unchanged).
- Large non-time numeric series still render linearly and still warn — the warning names
  `format` as the opt-out, so it is actionable in that case too.

---

## WS-7 — `DataTable` column sizing is trial and error (P1, report #17)

### Finding — confirmed

`Column.width`'s doc comment (`data-table.tsx:25-47`) is two ⚠ blocks and a paragraph of rules
of thumb: *"leave the widest free-form column unsized, keep the sized columns to roughly two
thirds of the table, and give the free-form one a `minWidth`…"*. The adopter read all of it and
still needed **three** passes, landing on `minWidth: '17rem'` fitting at 1037 px of 1037 px
available.

Their diagnosis is exact and is the §0 thesis in one line:

> The arithmetic depends on the container width, which **the component knows and I do not**.

Failure mode 2 in their sequence — the table growing past its card with the last column cut off
and no visible scroll affordance — is plausible wrong output: it looks like a styling choice.

### Design decision

**Warn when the table actually overflows, naming the measured numbers.** The adopter asked for
precisely this (*"a dev warning when `scrollWidth > clientWidth` would beat a paragraph of rules
of thumb"*), and it is the one signal that is unambiguous: overflow is measured, not predicted.

```
[cascivo] <DataTable>: the table overflows its container (scrollWidth 1180px > clientWidth
1037px). Sized columns total ~62rem of ~65rem available. Drop a `width` from the widest
free-form column, or lower `minWidth` on "project".
```

Observe with `ResizeObserver` inside `useSignalEffect` (`useEffect` is banned catalog-wide);
dev-gated; deduped per instance per size; fire on a trailing debounce so a mid-resize transient
does not log.

**Rejected — a `sizing="fit"` / `auto` mode** (the report's first suggestion). Attractive but
underspecified: "fit" has at least three plausible meanings (shrink text, ellipsise, horizontal
scroll), each right for different data. Shipping a mode whose behaviour an adopter must
discover empirically recreates the problem one level up. Revisit only if the warning proves
insufficient — record it as a follow-up, not a silent drop.

**Rejected — trimming the doc comment.** It is accurate and the adopter valued it. It is layer 3
doing what layer 2 should do; add the layer-2 signal and leave the prose.

### Implementation

1. `data-table.tsx` — add the observer + warning. Include measured `scrollWidth`/`clientWidth`
   and the summed sized-column total; name the widest sized column as the suggested change.
2. Also warn on the **first** failure mode (mid-word wrapping in the free column) where it is
   cheaply detectable: the free column's `scrollWidth` exceeding its rendered width while a
   sized column has slack. If that cannot be measured reliably, ship only the overflow warning
   and say so — do not ship a heuristic that fires on correct tables.
3. Add a horizontal-scroll affordance (shadow/fade on the scroll container) so the cut-off
   column is at least *visible* as cut off in production, where the warning is stripped. This is
   the part that helps the adopter's end user, not just the adopter.

### Guard

Unit test: a table whose sized columns exceed the container warns; a table that fits does not.
Add the scroll affordance to the visual baselines for all three themes.

### Acceptance

- The adopter's failure mode 2 (six sized columns, `minWidth: '22rem'`) logs the warning with
  correct measured numbers.
- Their final passing configuration (`minWidth: '17rem'`, fits at 1037/1037) is **silent** —
  a warning that fires on the correct answer is worse than none.
- No warning in production builds.

---

## WS-8 — The flat `.d.ts` is not self-contained, and one line is 8 kB (P1, report #19)

### Finding — confirmed; a published claim is false

`scripts/llms/generate.ts:653` publishes:

> the shipped `@cascivo/react` `dist/index.d.ts` is a self-contained, flat rollup — every
> component `…Props` interface is real

`packages/react/scripts/flatten-types.mjs` inlines local types and strips vp's `//#region`
comments, but leaves `from '@cascivo/core'` re-exports intact. `ThemeProviderProps`, `Tone`,
`SpaceStep` and `LinkComponentProps` therefore resolve only through the pnpm store path. On
Path B, `@cascivo/core` is (correctly) not a direct dependency, so an editor Ctrl-click works
and `grep node_modules/@cascivo/react/dist/index.d.ts` does not — and grep is what an agent
uses.

Second defect: the file ends with a single ~8 kB `export { … }` naming all 197 components. Every
grep for a component name matches it and dumps the whole line. The adopter reports `grep -v` on
that line *"became a reflex within ten minutes"* — i.e. the best-praised surface in the system
(§0.5) is being actively worked around.

### Design decision

**Make the claim true, and make the file greppable.** Both are build changes, no API impact.

1. Inline the `@cascivo/core` types that `@cascivo/react` re-exports into the flat `.d.ts`. The
   set is small and already enumerated by `packages/react/src/types.ts`. Watch for the
   duplicate-identifier hazard the `types.ts` header documents (`ToneInput$1`) — the
   `check-styles-complete` / subpath-aware `external` guidance in `CLAUDE.md` covers the same
   trap.
2. Emit the trailing export list **one name per line**.

**Rejected — correct the `llms.txt` claim to say "mostly self-contained".** Cheaper, and it
gives up the property that makes the surface work for agents. The claim is worth making true.

### Implementation

1. `flatten-types.mjs` — inline the core-sourced types; keep idempotence (the drift check runs
   `pnpm regen` then `git diff --exit-code`).
2. Same file — reformat the final export statement to one specifier per line.
3. Re-run `pnpm dts-tsdoc:check` (comment preservation), `pnpm type-exports:check`,
   `pnpm isolated:check` (strict non-hoisted workspace, `skipLibCheck` **off** — this is the one
   that catches duplicate-identifier regressions), and `pnpm pack:check`.

### Guard — extend `scripts/checks/dts-tsdoc-parity.test.ts` or add `dts-selfcontained.test.ts`

Two assertions over `packages/react/dist/index.d.ts`:

- **no `from '@cascivo/…'` import or re-export remains** — this makes the published claim
  mechanically true instead of prose;
- **no line exceeds ~500 characters** — the greppability property, stated as a number.

Both need a prior build; skip cleanly when `dist/` is absent, matching the existing convention.

### Acceptance

- `grep "ThemeProviderProps" node_modules/@cascivo/react/dist/index.d.ts` returns a real
  declaration.
- `grep "Toggle" …/index.d.ts` returns a handful of readable lines, not one 8 kB line.
- `pnpm isolated:check` passes (no `ProgressInput$1`-style duplication).
- Bundle size of the published `.d.ts` recorded in the PR; a modest increase is expected and
  acceptable.

---

## WS-9 — `Text` collides between `@cascivo/react` and `@cascivo/charts` (P1, report #20)

### Finding — confirmed; the last known collision, already tracked

`scripts/checks/export-collisions.test.ts:26-29`:

```ts
const KNOWN: Record<string, string> = {
  Text: 'charts ships an SVG <text> primitive; @cascivo/react ships the typography component',
}
```

The guard's own header states the position: *"fail on a NEW collision. Renaming the current ones
is a breaking change and is tracked separately (07-26 plan WS-13)."* `Text` is the **only**
remaining entry. Resolution is silent — the wrong `Text` renders nothing useful and never
errors — and a dashboard file importing from both packages is the normal case. The adopter
avoided it only by reading the warning first.

### Design decision

**Rename the charts export to `ChartText`; keep `Text` as a deprecated alias for one minor,
then remove.** `Calendar` → `CalendarHeatmap` is the precedent the report cites and it is the
right one.

**Rejected — leave it and rely on the recipe warning.** The warning works only for adopters who
read that page before writing the import, which is the Confident-Wrong Test failing.

**Rejected — hard rename with no alias.** Unnecessary; a deprecation window costs one minor and
the guard keeps it from lingering.

### Implementation

1. `packages/charts/src/index.ts` — export `ChartText`; re-export `Text` as
   `@deprecated Use ChartText — it collides with @cascivo/react's typography component.`
2. Update charts internals, stories, examples and `docs/RECIPE-DASHBOARD.md`.
3. Add to `deprecation-surfaces.test.ts` so the deprecation is published everywhere.
4. `pnpm regen`.
5. **Leave `KNOWN` non-empty until the alias is removed** — `Text` is still a collision while the
   alias ships. Update the reason string to name the removal milestone. Remove the entry in the
   follow-up minor; the guard's stale-entry test then enforces that the map is empty.

### Acceptance

- `import { Text } from '@cascivo/charts'` still compiles, with a deprecation notice.
- `import { ChartText } from '@cascivo/charts'` is the documented form everywhere.
- The recipe's collision warning is rewritten to name the fix rather than the hazard.
- `export-collisions` passes; `ICON_OVERLAP_CEILING` is unchanged.

---

## WS-10 — Docs disagree about `@cascivo/themes/all.css` (P1, report #21)

### Finding — confirmed; the generator contradicts itself

Inside **one generated file**:

- `scripts/llms/generate.ts:749` — the primary quick-start snippet:
  `import '@cascivo/themes/all.css'  // tokens (once) + base typography + light & dark`
  The trailing comment says *"light & dark"*, which has been **wrong since 0.14.0** —
  `all.css` is all twelve themes.
- `scripts/llms/generate.ts:1040` — the theming section of the same file:
  *"`light-dark.css` = light + dark (**the common case**); `all.css` = all twelve themes"*.
- `docs/GETTING-STARTED.md:365,369` agrees with :1040 and flags the 0.14.0 change explicitly.

So the quick-start hands every new adopter ~2× the CSS they need, with a comment describing the
bundle it is *not*. The adopter noticed and used `light-dark.css`.

### Design decision

**Make the quick-start recommend `light-dark.css`, and derive the descriptive comment rather
than writing it.** The stale *"light & dark"* comment is the whole failure: a hand-written
description of a generated artifact's contents.

### Implementation

1. `scripts/llms/generate.ts:749` — switch the quick-start to:
   `import '@cascivo/themes/light-dark.css'  // tokens (once) + base typography + light & dark`
   and add the one-line pointer: *"swap for `all.css` only if you ship a theme picker (all
   twelve themes, ~2×)."*
2. Generate the theme-count phrasing from the actual bundle contents. `theme-bundle.test.ts`
   already asserts `all.css` contains all twelve themes, so the count exists as a checkable
   fact — read it rather than restating it.
3. Sweep every quick-start surface for the same snippet: `README.md`, `docs/GETTING-STARTED.md`,
   `packages/*/README.md`, the site quick-start route, `skills/`, and the CLI's `init` output.
   A fix that lands on some surfaces and not all is the recurrence mechanism this plan exists to
   break.

### Guard — extend `scripts/checks/getting-started-contract.test.ts`

That guard already enforces *"a first-day fact appears on every first-day surface"*. Add: **every
quick-start theme import across all first-day surfaces names the same bundle**, and that bundle's
inline description matches what `theme-bundle.test.ts` measures.

### Acceptance

- Every quick-start on every surface imports `light-dark.css` with an accurate comment.
- `llms.txt` §"How to use it" and §Theming no longer contradict each other.
- The extended guard fails if any one surface is changed in isolation.

---

## WS-11 — The `Sparkline` flex advice points the wrong way (P2, report #18)

### Finding — confirmed; the doc gives advice that produces the reported bug

`docs/RECIPE-DASHBOARD.md:30`:

> Give it a smaller `width`, or put it in a flex item with `min-width: 0` and let the text take
> the remainder.

`Sparkline` is fixed-width (120×32) and does not track its container. In a
`[text] [sparkline]` row, `min-width: 0` on the **sparkline's** item lets that item shrink below
its content — but the SVG has a fixed width attribute, so it does not visually shrink. The
flexible item becomes the **text**, which is the opposite of the stated intent. The adopter got
*"22 minutes ago"* wrapped to three lines in every project card.

What works, per the adopter: protect the text (`white-space: nowrap`, or `min-width: 0` plus
truncation) and let the chart hold its intrinsic size (`flex: 0 0 auto`).

### Design decision

**Correct the recipe, and verify the corrected snippet renders — do not hand-verify prose.** A
CSS recipe is exactly the kind of claim that is easy to write and easy to get backwards; this one
was.

### Implementation

1. `docs/RECIPE-DASHBOARD.md:30` — replace with the working shape:

   ```css
   .kpi-row      { display: flex; align-items: center; gap: 0.5rem; }
   .kpi-row time { white-space: nowrap; }   /* protect the text… */
   .kpi-row svg  { flex: 0 0 auto; }        /* …let the fixed-size chart hold its size */
   ```

   Keep the *"give it a smaller `width`"* alternative — that one is correct.
2. Add the pattern to an example app that already uses `Sparkline` in a KPI row —
   `apps/examples/pulse` or `apps/examples/trade` (both cited at `RECIPE-DASHBOARD.md:60-61`).
   A recipe snippet that also compiles in-repo cannot silently rot.

### Guard

Add the two-item row to the visual baselines of whichever example app adopts it, at 320/360/390
widths (the mandated mobile sweep). Wrapping regressions then show up as baseline diffs rather
than in the next experience report.

### Acceptance

- The snippet, pasted verbatim, keeps the timestamp on one line and the sparkline at 120 px.
- Verified at 320/360/390/414 (`pnpm breakpoint:check` unaffected; this is layout, not a
  breakpoint literal).

---

## WS-12 — Repo note: package name vs directory name (P2)

### Finding — confirmed; not a cascivo defect

`turbo` refused to run **anything, monorepo-wide**, because the adopter's `package.json` `name`
collided with another app's. `CLAUDE.md` prescribes the directory name
(`apps/YYYY-MM-DD-<short-name>`) but not the package name, and project isolation means an agent
**cannot look at sibling apps to avoid a collision**. The failure is total and its cause is
invisible from inside the sandbox.

### Design decision

Adopt the reporter's suggestion verbatim: **the package name *is* the directory name.** That
makes the convention collision-free by construction rather than by coordination — the only kind
of rule an isolated agent can follow.

### Implementation

1. `CLAUDE.md` — state the rule where the directory convention is stated, not in a separate
   section.
2. Extend `scripts/checks/registry-name-collisions.test.ts` (or the workspace scaffold check) to
   assert `package.json` `name` === directory basename for every `apps/*`, with the existing
   long-lived apps allowlisted by name and reason.
3. Fold the same rule into the app scaffold template so new apps get it for free
   (`scaffold-contract.test.ts` covers the template).

### Acceptance

- A new app whose package name differs from its directory fails a check locally, with the fix in
  the message.
- Existing apps are unaffected.

---

## §2 — Decisions (recommended, with the evidence; need sign-off)

All five were re-derived from measurement rather than judgement. **Two of the recommendations
carried in the first draft of this plan were wrong and are corrected here** — noted inline.

### D1. WS-5(a) scope — which components gain `ariaLabel`?

**Recommendation: the 14 `category: 'inputs'` components, not all 26, and not `Toggle` alone.**

Measured: **26** components declare a visible `label`, and **zero** of them declare `ariaLabel`
— a clean slate, no partial state to reconcile. They split:

| Category | Count | Components |
| --- | --- | --- |
| `inputs` | 15 | Checkbox, ColorPicker, Combobox, DatePicker, **Field**, FileUploader, Input, NumberInput, Radio, Search, Select, Slider, Textarea, TimePicker, Toggle |
| `chart` | 4 | Bullet, Histogram, Kpi, Meter |
| `display` | 3 | ContainedList, FlowEdge, Stat |
| `feedback` | 2 | InlineLoading, ProgressBar |
| `navigation` | 2 | HeaderPanel, MenuButton |

**The 08-21 "surface without capability" objection is correct for 12 of the 26** — you would
never render a `Stat`, `Kpi`, `Meter` or `InlineLoading` with no visible label, so an
invisible-name alias there is dead surface and the original objection stands. It is wrong only
where a visible label may legitimately be replaced by an external one, which is exactly the
form controls. That gives a predicate that is mechanically checkable rather than taste-based:

> **a component that renders an interactive control the adopter may label from outside** —
> `category: 'inputs'`, excluding `Field`, which *is* the labelling mechanism.

= **14 components.** `Toggle` (the reported case) is in the set.

**Handle the 4 chart widgets separately, not in this sweep.** Bullet/Histogram/Kpi/Meter have
the same heading-duplication pattern, but charts already use a *different* convention — `title`
is the accessible name and is explicitly **not** rendered (`area-chart.tsx:100-106`). Adding
`ariaLabel` beside an existing `title` risks two invisible-name props on one component, which is
the collision this workstream exists to remove. Check each for a `title` prop first and decide
then; do not blanket them.

### D2. WS-3 `maxCellSize` default — 14 px or 11 px?

**Recommendation: neither. Derive the cap from the height budget and default `maxCellSize` to
`undefined`.** *(This corrects the first draft, which proposed a default of 14.)*

`gap = 2` (`calendar.tsx:119,144`) and the default height is 160, so:

```
fitCell = (height - 6 * gap) / 7 = (160 - 12) / 7 = 21.1 px
```

This cap is provably exactly right, because `rawCell > fitCell` ⟺ 7 rows do not fit in the
box ⟺ **the chart is clipping today.** So the clamp changes rendering *if and only if* the
rendering is currently broken. Verified across real cases:

| Days | Container width | Weeks | `rawCell` today | Clamped | Effect |
| --- | --- | --- | --- | --- | --- |
| 119 | 1054 | 17 | 60.1 | 21.1 | **the reported bug — fixed** |
| 90 | 600 | 13 | 44.3 | 21.1 | also clipping today — fixed |
| 365 | 1054 | 53 | 17.9 | 17.9 | unchanged |
| 365 | 700 | 53 | 11.2 | 11.2 | unchanged |

**A fixed 14 px cap would have regressed the full-year view (17.9 → 14)** — the exact workaround
the reporting adopter fell back to and described as working. That is why the first draft's
proposal was wrong: it would have broken a currently-correct case to fix a broken one.

Ship `maxCellSize?: number` as an opt-in aesthetic ceiling with **no default**. Visual-baseline
churn is then limited to the cases that were already rendering wrong.

### D3. WS-9 — how long does the `Text` alias live?

**Recommendation: until 1.0, not one minor.** *(This corrects the first draft, which proposed
one minor.)*

Measured cadence from `packages/react/CHANGELOG.md`: releases on 2026-07-29, 07-31, 08-04,
08-05, 08-10, 08-11, 08-14, 08-17 — **8 minors in 19 days.** A one-minor deprecation window is
therefore about five days, which is not a deprecation; it is a break with extra steps. Pre-1.0
at this cadence, a minor is not a unit adopters track. 1.0 is the only boundary they will
notice.

Keep the `export-collisions` `KNOWN` entry for `Text` in place until removal, with its reason
string updated to name 1.0 as the milestone — the entry is the thing that keeps the debt visible
rather than forgotten.

### D4. WS-7 — overflow warning only, or also a `sizing="fit"` mode?

**Recommendation: warning only now.** Unchanged from the first draft, and the reasoning holds:
`fit` has at least three defensible meanings (shrink text / ellipsise / horizontal-scroll), each
correct for different data, so shipping it forces the adopter to discover its behaviour
empirically — recreating the problem one level up.

**Record it as an explicit deferred decision, not a silent drop**, with the three meanings named,
and revisit if the warning proves insufficient in a later report. The difference between a
deferral and a drop is whether the next reader can see the reasoning.

### D5. WS-2 — full component lists in the generated vocabulary block, or families plus a pointer?

**Recommendation: list every name, in full, for all three families.** *(The first draft hedged
toward families-plus-counts on a budget argument; the numbers do not support it.)*

Measured: the full three-family block is **440 bytes** against an `llms.txt` of **101,284 bytes**
— **0.43%**, for what the report series identifies as the single highest-frequency friction class
(nine wrong prop guesses on 2026-08-08; two more here).

The decisive argument is not size, though. **Full lists are what make the guard bidirectional.**
WS-2's rewritten check asserts both directions — every cited component has the prop, *and* every
component with the prop is cited. The second direction is the one that would have caught
`CommandMenu`, and it is only expressible if the block enumerates completely. A families-plus-
pointer block can only ever be checked in one direction, which is the weaker guarantee that
failed here already.

## §3 — Sequencing

Phases are ordered so that each guard is in place before the sweep it governs, and so the two
build-surface changes (WS-8) land before the packaging checks that would be re-run anyway.

| Phase | Workstreams | Rationale |
| --- | --- | --- |
| **1 — Stop the data loss** | WS-1, WS-3, WS-4 | The three P0s that emit no signal today. WS-4's `field-composition` guard is the highest-value artifact in the plan; land it first so the sweep in WS-4.4 has a verifier. |
| **2 — Break the recurrence mechanisms** | WS-2, WS-10 | Both are hand-maintained claim lists (§0.3). Generating them is what stops the third hand-edit. |
| **3 — Close the discovery gaps** | WS-5, WS-6, WS-7 | The Confident-Wrong Test cases: layer 1 aliases and layer 2 warnings. WS-5 is the largest diff and depends on the narrowed `aria-label-universality` scope. |
| **4 — Surface and packaging** | WS-8, WS-9 | Both touch the build; run `pnpm ready:ci` (cold cache, sequential) for this phase, per `CLAUDE.md`. |
| **5 — Docs and conventions** | WS-11, WS-12 | Layer-5 items that are legitimately layer-5: WS-11 is a CSS recipe, WS-12 is a repo convention. Neither has a lower layer available. |

### Per-phase gate

`pnpm ready` must pass at the end of every phase — not only at the end. Phases 1, 3 and 4 also
need the checks `ready` does not yet cover:

- Phase 1: `pnpm computed:check`, `pnpm bare-page:check`, `pnpm visual:baselines:check`
  (WS-3 changes rendering; WS-4's guard needs Chromium).
- Phase 3: `pnpm meta:check` in full (WS-5 touches ~25 manifests).
- Phase 4: `pnpm ready:ci`, `pnpm isolated:check`, `pnpm pack:check`, `pnpm dts-tsdoc:check`.

Commit regenerated artifacts alongside source in the same commit; the drift job runs
`pnpm regen && vp check --fix && git diff --exit-code`.

---

## §4 — How to tell this plan worked

Not "the findings are closed" — the 08-21 plan closed its findings and the 08-22 report arrived
the next day against the same version. The test is whether the **mechanisms** are gone:

1. **No hand-maintained claim list survives.** After WS-2 and WS-10, no published statement about
   the catalog enumerates components in prose that a human keeps in sync. Verify by grepping
   `scripts/llms/generate.ts` and `docs/AI-RULES.md` for component-name lists and confirming each
   is generated or guarded bidirectionally.
2. **No guard enumerates its own subjects.** `vocabulary.test.ts`'s `claims` array is gone;
   `link-item-id-parity`'s predicate is widened; the new `config-item-data-loss` and
   `field-composition` guards derive their subjects from the registry. Grep the new and modified
   guards for literal component-name arrays — each remaining one must be a *fixture asserting
   discovery still works*, never the subject list itself.
3. **Every P0 emits a signal before an adopter can ship the wrong output.** For each of #9, #11,
   #16, #17: reintroduce the defect on a branch and confirm a type error, a dev warning, or a red
   guard — and that the guard names the fix, not the rule.
4. **The Confident-Wrong Test is applied, not just cited.** No item in §1's ledger is closed with
   a layer-3-only fix. The two findings whose docs were already complete (#13, #14) are closed by
   an API change, not by rewriting prose that was already correct.

### What this plan deliberately does not do

- It does not add prose to `Toggle.label` or `Filter.multi`. Both are already well documented
  (§0.1) and more prose is measurably not the fix.
- It does not infer a time scale from numeric magnitude (WS-6) or auto-fit `DataTable` columns
  (WS-7). Both would replace a visible wrong output with a silent one.
- It does not rename `Toggle.label`, `Steps.steps`, or `Filter.multi`. Aliases carry the same
  benefit at no breaking cost, and the catalog already uses that idiom deliberately.
