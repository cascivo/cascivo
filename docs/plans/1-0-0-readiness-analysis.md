# What is missing to release 1.0.0

**Date:** 2026-08-24
**Method:** every claim below is measured against this checkout (`cd655d2a`), the published
tarballs on npm, the live docs host, and the repo's own CI history. Nothing is estimated.
**Status: IMPLEMENTED except B4 — 2026-08-24.** Every blocker and every should-fix below is
on `main` apart from the stabilization window (B4), which is calendar time rather than work,
and the release itself. The remaining sequence is
[`../internal/RELEASING-1.0.md`](../internal/RELEASING-1.0.md). Two findings were refined once
the code was in hand, and both refinements are recorded inline: `OverflowMenu` is **retained**
with `removeIn: '2.0.0'` rather than removed (B2), and only two `docs/plans` files lacked a
status header rather than three (B6).

**Verdict:** the *engineering* is 1.0-grade. What is missing is almost entirely a **stability
contract** — a definition of what 1.0 promises, the deprecation removals that definition
implies, and a guard that can hold the promise. Two accessibility verification loops are open,
and a handful of release artifacts have drifted from what actually shipped.

---

## 1. What was run, and what it produced

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | ✅ clean |
| `pnpm build` (20 published packages) | ✅ exit 0 |
| `vp run -r check` (type check, 2505 files) | ✅ **0 errors**, 22 warnings |
| `pnpm test` | ✅ **3,354 tests passing**, 0 failures |
| `pnpm audit:bundle` | ✅ all 28 published artifacts within budget (`@cascivo/react` 167.7/200 KB gzip; `styles.css` 47.3/60 KB) |
| `pnpm visual:baselines:check` | ✅ 486 committed baselines (162 components × 3 themes) |
| `scripts/checks/deployed-freshness.sh` | ✅ npm `latest` = registry = `cascivo.com` = **0.18.0** |
| **Axe sweep, all stories** | ✅ **zero violations across 660 stories** |

The axe number is the significant one. `docs/internal/axe-baseline-2026-07.md` recorded **107 of
561 stories failing, 131 instances**. That backlog is gone: the nightly has been green for **18
consecutive runs** (2026-08-07 → 2026-08-24) and the full sweep re-run here is clean.

**Nothing is broken.** The gaps below are not defects; they are promises that have not been made,
or made and not yet kept.

---

## 2. Blockers

### B1 — There is no definition of 1.0. *(the prerequisite for everything else)*

`docs/UPGRADING.md` documents only pre-1.0 semantics:

> | **minor** | may include breaking changes — read the notes |

Nothing in the repo states what 1.0 *promises*. Missing, specifically:

- **The semver contract after 1.0** — what a major means, and that minors stop carrying breaks.
- **A deprecation policy** — how long a deprecated surface lives before removal, expressed in
  versions or time. Today `deprecated` in a manifest carries `since` and `replacement` but no
  `removeIn`, so "deprecated" has no expiry.
- **A supported-version window** — which minors get security fixes. `SECURITY.md` currently says
  "cascivo is pre-1.0 and ships from `main`", which is not a post-1.0 answer.
- **What the stability promise covers.** Public TS exports, yes. But does it cover the
  **rendered DOM** and the **`data-cascivo-*` styling hooks**? Adopters style against both, and
  0.15.0 shipped a change whose own note reads *"Breaking — the rendered DOM changed. The public
  component API is unchanged."* Under a 1.0 promise that sentence has to resolve to either
  "allowed in a minor" or "major only". It cannot stay ambiguous.

This is the first deliverable because every item below is judged against it.

### B2 — The deprecation backlog that 1.0 is already documented to clear

`docs/RECIPE-DASHBOARD.md` states of the `charts` `Text` alias: *"it is removed at 1.0."* That
promise is in shipped documentation. The full removal list is 12 surfaces:

| Surface | Replacement |
| --- | --- |
| Value-carrying `onChange` on **8 components** — `Combobox`, `DatePicker`, `Filter`, `NumberInput`, `Search`, `Swap`, `TimePicker`, `Toggle` | `onValueChange` |
| `@cascivo/charts` `Text` / `TextProps` | `ChartText` / `ChartTextProps` |
| `BarChart.ticks` | `valueAxisTicks` / `categoryAxisTicks` |
| `Dropdown` separator-via-`label` item | `{ kind: 'separator' }` |
| ~~`OverflowMenu`~~ — **retained**, see below | `Menu` |

Removing a value-carrying `onChange` is exactly the CLAUDE.md handler-naming rule
(*"Never give a new component a value-carrying `onChange`"*) applied to the components that
predate it. 1.0 is the only cheap moment to do it.

> **Refined during implementation — `OverflowMenu` is retained.** Its manifest promised
> removal *"in v4"*, not at 1.0. Removing it now would break a published commitment early,
> which is the same defect as letting one slip — so it carries `removeIn: '2.0.0'`, keeps
> working for the whole `1.x` line, and the count of removals is **11, not 12**. The charts
> `Text` alias is the opposite case: shipped docs said "removed at 1.0", so removing it
> *honours* a published promise.

**Also add `removeIn` to the `deprecated` manifest field** and let
`scripts/checks/deprecation-surfaces.test.ts` fail on a deprecation that has outlived it. Without
that, the next deprecation repeats this backlog.

### B3 — Nothing locks the public API surface

`@cascivo/react` exports 146 names and covers 209 manifests (197 components + 12 blocks). Every
other invariant in this repo has a guard — ~50 in `meta:check` alone, plus the drift job, the RSC
boundary walk, the isolated-install canary, the computed-style canary. **The public API surface
has none.**

Pre-1.0 that is survivable, because a minor may break. Post-1.0 it is the single highest-value
guard in the repo: an accidentally dropped export, a narrowed prop union, or a widened required
prop is a major-version event that nothing currently detects. It also cannot be caught by review
at this catalogue size.

**Recommend:** commit an API-surface snapshot (exported names + prop signatures, derived from the
built `.d.ts`) and diff it in CI, in the repo's existing guard idiom. A diff is not a failure —
it is a prompt to classify the change as patch/minor/major and record it in the changeset.

### B4 — The API is still moving too fast to promise stability

| Signal | Value |
| --- | --- |
| Minor releases of `@cascivo/react` | 18 (0.1.0 → 0.18.0) |
| Recent release cadence | ~3 days (0.15 → 0.18 across 2026-07-31 → 2026-08-17) |
| Breaking changes in the last 6 minors | `BadgeShape` → `BadgeVariant` (0.16); *"Breaking — the rendered DOM changed"* (0.15); `DataTable` controlled-selection reshaped across 12 components (0.17) |

A 1.0 tagged on top of that cadence is a promise the current process is not yet keeping.

**Recommend:** a measured stabilization window — a defined period (4–6 weeks is proportionate to
the cadence) during which no change requiring a major lands, with B3's snapshot as the instrument
that proves it rather than a judgement call.

### B5 — Two accessibility loops are open while the badge already says AA

The README carries a `WCAG 2.2 AA` badge and claims *"verified by a nightly axe sweep over every
story"*. The axe half of that is now **true and green** (§1). Two things still do not close:

**a) The axe sweep is still not a PR gate.** `.github/workflows/axe.yml` says:

> Not PR-blocking until the finding backlog is triaged — promote to `pull_request` once it runs clean.

It runs clean, and has for 18 straight nights. Its own stated promotion condition is met and
unactioned. Until it gates PRs, a regression can land and sit unnoticed until the next nightly.
This is the cheapest item on the list and it directly backs the badge.

**b) Screen-reader results have never been published.**
`apps/site/src/marketing/pages/accessibility/at-results.json` still reads `generatedAt: null`
with empty `results` for all 12 planned components, and has not been touched since **2026-07-31**.
Meanwhile the AT workflow has **succeeded ~20 times since 2026-08-03**, uploading per-OS artifacts
that a maintainer is supposed to merge, stamp, and commit. Nobody has. So the sweep is green, the
published accessibility page says "pending", and the README says "manual results pending".

The loop is open, not broken — the last manual step was never performed. Before 1.0, either merge
one real result set, or narrow the claim to what is proven (axe + APG conformance, which are
genuinely proven).

### B6 — Release artifacts have drifted from what shipped

`docs/internal/feedback/README.md` declares this **binding** (WS-K):

> The PR that publishes to npm flips a workstream from `merged` → `published vX.Y.Z`. A fix an
> adopter can't `pnpm add` yet is not done.

**Eight fix plans still read "not yet published."** At least four demonstrably shipped and are
live on npm right now:

| Plan | Reality |
| --- | --- |
| `fix-plan-vercel-dashboard-vite-react-router-2026-08-14.md` | shipped in `@cascivo/react` **0.18.0** (changeset `d009502`) |
| `fix-plan-adopter-pair-2026-08-08.md` | shipped in **0.17.0** (changeset `b59146f`) |
| `fix-plan-adopter-pair-2026-07-26.md` | shipped (charts changelog) |
| `fix-plan-vercel-tanstack-start-adopter-2026-07-25.md` | shipped (charts changelog) |

Two `docs/plans/*.md` files also carry no status header at all
(`ci-a11y-fix-plan.md`, `ssr-css-and-client-js-plan.md`) — and `ci-a11y-fix-plan.md` in
particular describes an axe backlog that §1 shows is fully burned down, so it reads as open
work that is actually finished. (`css-layering-architecture-review.md` was counted here in an
earlier draft; it does carry a status, in its italic preamble rather than a bold header.)

This is precisely the drift the rule exists to prevent, and the README names its consequence: it
is why adopters re-report defects that were already fixed. It costs an hour to correct and it is a
1.0 credibility item.

### B7 — Decide the DOM-breaking design work *before* 1.0, not after

Three items are queued that change rendered DOM or component contracts. Under a 1.0 promise each
costs a major; before 1.0 each is free.

- **`docs/plans/details-disclosure-plan.md` — status "proposed".** Rebuilds `Accordion` and
  `Collapsible` on `<details>`/`<summary>`. It changes their DOM, rewrites their tests, and moves
  both from `clientJs: 'required'` to `'enhancement'`. The plan is fully specified and gated. Ship
  it or explicitly defer it to 2.0 — do not leave it "proposed" across a 1.0 tag.
- **Three deferred outside-click migrations** — `Combobox`, `DatePicker`, `DateRangePicker` still
  use raw `document` listeners instead of `DismissableLayer`, tracked in the `primitive-adoption`
  allowlist. The deferral reason on record is that `DismissableLayer` wraps markup in its own
  element and *"needs a visual layout review"* — i.e. it is potentially DOM-affecting.
- **The composed `useMenu` / `useListbox` primitive** — deferred with a sound reason (*"API should
  be driven by a concrete migration, not designed speculatively"*). If it is not going to happen
  before 1.0, say so, because it is a public `@cascivo/core` addition either way.

---

## 3. Should fix, but need not block

### S1 — Claimed-but-unverified capabilities

| Claim | Evidence found | Recommendation |
| --- | --- | --- |
| **RTL throughout** (CLAUDE.md: logical properties everywhere) | Logical properties are genuinely universal — **1** physical-property site catalogue-wide. But there is **1** `dir="rtl"` reference in the entire repo, and no RTL test or baseline. | Add a `dir="rtl"` leg to the computed-style or visual sweep. The implementation is almost certainly correct; nothing proves it, and every other claim here is proven. |
| **i18n** | Exactly two catalogues ship: `en` + `de`. | Fine — but state it as "two reference locales, bring your own catalogue" so 1.0 does not imply breadth that isn't there. |
| **Astro** ⚠️ Partial | Investigated and confirmed **not** the export-condition bug; `ssr.noExternal` changes nothing. Probed by a CI job that reports without gating. | Document as a known 1.0 limitation. Do not block — the cause is upstream. |
| **Preact** ✅ CSR only | SSR/prerender explicitly unverified. | Either verify or keep the claim scoped exactly as written today. |

### S2 — Ship the pending work in the last 0.x, not in the 1.0 cut

Five unreleased changesets sit in `.changeset/`: `accessible-name-aliases`,
`eslint-prop-vocabulary`, `field-composition-and-silent-data-loss`, `prop-descriptions-sweep`,
`sparkline-subpath-and-area-fills`. At least one reads as a correctness fix.

Release these as **0.19.0**. A 1.0 that also carries feature work is two events in one tag; a 1.0
that carries only the removals from B2 and the contract from B1 is legible to adopters and
trivially reviewable.

### S3 — Decide version alignment

20 published packages span **0.0.4 → 0.18.0**. The 2026-07 adopter-pair report already flagged it:
*"Everything is pre-1.0 and versions don't align."*

Two coherent answers:

1. **Lockstep the stable core at 1.0.0** — `react`, `core`, `tokens`, `themes`, `charts`, `i18n`,
   `storage`, `icons`, `cli` — and leave genuinely experimental packages on 0.x. `@cascivo/platform`
   at **0.0.4** is clearly not 1.0 material and should stay behind.
2. **Tag only `@cascivo/react` + `@cascivo/core` 1.0** and let the rest float.

Option 1 is the one that makes `@cascivo/*` legible to an adopter reading a lockfile. Either way,
the decision belongs in B1's contract document.

### S4 — Close the one open issue

Issue **#163 "Docs freshness probe failing"** has been open since 2026-07-21. The probe passes
here (npm `latest` = registry = deployed docs = 0.18.0) and the nightly has been green since
2026-08-16. Close it, or record what is still failing. Shipping 1.0 with a stale red herring as
the only open issue is a bad look for a project whose whole thesis is verified claims.

---

## 4. What is already 1.0-grade

Stated explicitly, because the list above is long and the underlying engineering is not the problem.

- **Verification depth.** CI runs ~40 named guard steps plus a drift job; `meta:check` alone
  bundles ~50 checks. Several are things most design systems never build: an RSC module-graph
  boundary walk, an isolated-install canary that type-checks packed tarballs outside the repo with
  `skipLibCheck` off, a computed-style canary against shipped `dist` in a real browser, a bare-page
  hit-testing canary, a no-JS disclosure canary driven by a real keyboard.
- **Test coverage.** 3,354 tests; **131 of 132** component directories have tests (the exception is
  the `blocks` directory); 486 committed visual baselines.
- **The recurrence ledger.** 45 adopter findings, **45 closed**, each required to name a guard that
  exists and was demonstrated failing pre-fix. This is a stronger discipline than most 1.0 libraries
  have at any version.
- **Guard allowlists are nearly empty.** `dead-props`, `prop-defaults-parity`, `axis-parity`,
  aria-id and random-id allowlists: all empty. The rest carry 1–4 entries each with real reasons.
- **Release mechanics.** npm trusted publishing via OIDC, provenance on, changesets, generated
  `breaking-changes.json`, enforced docs-freshness invariant across npm/repo/deployed docs.
- **Governance.** LICENSE, SECURITY.md, SUPPORT.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue and
  PR templates all present.
- **Peer ranges.** Consistent and React 19-safe across all 11 packages that declare them
  (`@preact/signals-react >=3.0.0`, `react >=18.0.0`).
- **Bundle discipline.** Every published artifact under budget, including a dedicated
  sparkline-subpath size gate.

---

## 5. Recommended sequence

**Phase 1 — say what 1.0 means** *(no code)*
1. Write the stability contract: post-1.0 semver, deprecation policy with `removeIn`, support
   window, and an explicit ruling on whether rendered DOM and `data-cascivo-*` hooks are covered.
   Update `UPGRADING.md` and `SECURITY.md`. **(B1)**
2. Decide package-version alignment and record it in the same document. **(S3)**
3. Correct the eight drifted plan statuses and the three missing status headers; close #163.
   **(B6, S4)**

**Phase 2 — build the instrument, then ship the last 0.x**
4. Add the API-surface snapshot guard. **(B3)**
5. Promote the axe sweep to a PR gate. **(B5a)**
6. Merge one real AT result set, or narrow the README claim. **(B5b)**
7. Add the `dir="rtl"` verification leg. **(S1)**
8. Release **0.19.0** with the five pending changesets plus the above. **(S2)**

**Phase 3 — the 1.0 cut**
9. Decide `details`/`summary` and the three outside-click migrations: ship or defer to 2.0. **(B7)**
10. Remove all 12 deprecated surfaces; add `removeIn` enforcement. **(B2)**
11. Hold the stabilization window, with the snapshot from step 4 as the evidence that nothing
    major-worthy landed. **(B4)**
12. Tag 1.0.0.

Steps 1–3 are a day's work and unblock everything. Step 11 is the only item with unavoidable
calendar cost.
