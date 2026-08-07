# Adopter feedback & fix plans

This directory holds cold-adopter experience reports (`feedback-*.md`) and their
fix plans (`fix-plan-*.md`). Each fix plan triages every report item against
`main` with file:line evidence and specs the change.

## Status hygiene is binding (WS-K)

A fix plan's **status header** and its **per-workstream statuses are release
artifacts**, not notes. The recurring adopter complaint behind several reports is
_"this was raised before and always said to be fixed"_ — which is exactly what
happens when a plan says `planned — not implemented` after its fixes shipped, or
`implemented` while items it quietly skipped resurface. Both directions have
happened here (the 07-20/07-22 plans read `planned` after `0.10.0` shipped parts
of them; the dashboard plan read `implemented` while a skipped `useTheme` item
came back on 2026-07-23).

Therefore:

1. **The PR that implements or supersedes a workstream updates the plan's status
   header and that workstream's status in the same PR.** Not a follow-up.
2. **The PR that publishes to npm flips a workstream from `merged` → `published
   vX.Y.Z`.** A fix an adopter can't `pnpm add` yet is not done.

   **But do not reach for "not yet published" as the explanation without checking it.** That
   sentence was carried through three plans as the reason adopters kept meeting already-fixed
   defects. For the 07-26 pair it was tested by unpacking the published tarballs — every
   artifact matched `main` byte for byte, and the defects were genuinely shipped. The real
   cause was Mechanism D. `pnpm npm:parity` compares the published tarball against this
   checkout; run it before writing that sentence again.
3. **Open items carry forward.** When a new report supersedes an older plan, list
   the still-open workstreams in the new plan so there is a single live tracker,
   and point the old plan's header at it.

This is the process analogue of the repo's generated-artifact **drift check**: the
status must not drift from what actually shipped.

## The recurrence ledger is binding too

Status hygiene above tracks **plans**. It cannot see the failure mode the reports actually
complain about, because that one lives *between* plans: a finding is closed in plan N and
re-reported in plan N+2 without either plan being dishonest about itself.

[`RECURRENCE.md`](RECURRENCE.md) tracks **findings**, one row each, generated from
[`recurrence.json`](recurrence.json). One rule:

> **A finding may not be marked closed without naming a guard that exists.**

"Fixed in source" is not a closure. If no guard can express the invariant, the finding stays
open with a note saying why, and the next plan lists it. `pnpm recurrence:check` fails on a
closed row with a missing or unresolvable guard, and on any `feedback-*.md` report that no
row references — a new report has to be triaged into the table, not just filed.

When you close a row, the guard you name must have been **demonstrated failing on the
pre-fix state**. A guard that has only ever been green is untested, and an untested guard is
the same defect as no guard.

## Current live tracker

`fix-plan-vercel-dashboard-tanstack-start-adopter-2026-08-06.md` is the newest plan
(**implemented on `claude/ui-library-analysis-plan-dxg5tw`; not yet published** — all nine
workstreams landed; see its status header for the per-workstream guards and for where the
implementation disagreed with the plan). It triages the twelfth report: a Vercel-style dashboard on
TanStack Start 1.170, tested against registry `0.16.0` / CLI `0.7.1`, with 34 findings and 6
red flags. Nine routes shipped and hydrated clean; nothing was a hard blocker, and that is
the concern — every red flag is a thing an adopter had to work around silently.

It carried forward one item — the 07-28 plan's C1 `@types/react` mechanism — and that is now
**closed** (07-28 plan §0.6): it reproduces under pnpm `hoist: false`, and the peer that plan
shipped is what fixes it. **No finding in [`RECURRENCE.md`](RECURRENCE.md) is open.**

The 08-06 plan adds **Mechanism F** to the taxonomy below: *the guard re-implements the
adopter's tool instead of running it.* `pnpm lint:host-strict` was written specifically to
stop shipped source carrying lint failures adopters did not write — and it runs **oxlint**,
which does not implement the React-Compiler-backed `react-hooks/refs|purity|static-components`
where all 13 of the reporter's errors live. `@cascivo/eslint-config`'s `cascivoVendoredSource()`
has the same shape one layer up: authored from a list of rules someone had seen fire, never
executed against the source it claims to cover.

It also adds the process change the recurrence itself demands: a **finding-level ledger**
(`RECURRENCE.md`), with the binding rule that **a finding may not be marked closed without
naming the guard that keeps it closed.** The status hygiene below tracks *plans*; findings
recur *across* plans, which is invisible at plan granularity.

### Previous tracker

`fix-plan-incident-console-adopter-2026-07-28.md` (**implemented; not yet published; no open
items** — its last one, the C1 mechanism, closed on 2026-08-07; see its §0.6). It triages the eleventh report: a local-first incident console on Astro-then-Vite,
tested against published `0.13.0`, with 19 findings and 3 blockers.

It carries **nothing forward**. The 07-26 plan's only open item was WS-15a (publish), and it is
closed by observation: the 07-28 reporter's environment names `@cascivo/react` 0.13.0 ·
`@cascivo/core` 0.7.0 · `@cascivo/themes` 0.4.8 · `@cascivo/tokens` 0.5.5 · `@cascivo/icons`
0.3.5 · `@cascivo/charts` 0.7.0 — exactly `main`. The 07-20 → 07-26 chain is fully shipped.

The 07-28 plan adds **Mechanism E** to the taxonomy below: *the defect is only observable in a
consumer-shaped environment, and every guard runs in the monorepo.* Two of its blockers — the
`cascivo.reset` layer shipping empty, and closed popover panels swallowing clicks — were
invisible to the entire existing guard suite for exactly that reason. The third
(`@types/react`) was diagnosed as Mechanism E, and the fixture appeared to disprove it — then
on 2026-08-07 **the fixture turned out to be wrong**: it ran under pnpm's default hoisting,
whose hidden `.pnpm/node_modules` supplied React's types by accident. With `hoist: false` the
mechanism reproduces exactly and the peer is what fixes it (plan §0.6).

That reversal is the sharpest lesson in this directory. §0.5 was careful, honest, and wrong,
because nobody falsified the *passing* case — and a fixture that passes for the wrong reason
is more dangerous than one that fails, since it closes the question. It is why the ledger's
closure rule requires a guard **demonstrated failing on its pre-fix state**, not merely a
guard that is green.

**Keep this pointer current.** It went two plans stale (still naming the 07-23 plan after
the 07-24 plan landed, even though that plan's own §10c told the implementer to update it),
and a stale tracker is the same defect class as a stale status header: a reader lands on a
plan that looks live, and open items quietly lose their owner.

## Classify before you spec (from the 07-25 plan's §0)

Eight reports in, the recurrences are not eight unrelated bugs. Each one is an instance of
exactly one of three mechanisms, and each mechanism has a matching structural fix. When you
write the next plan, classify every finding first and name the guard — a plan that lists
fixes but no gates produces the next report:

- **A — a behavioral claim exists only as prose.** e.g. `docs/HEADLESS.md` promised twelve
  self-subscribing hooks; the test locking that promise covered three, and the two it was
  false for were the two the reactivity contract names first. A blocklist guard
  (`doc-api-drift`) structurally cannot catch a claim that was never true.
  → **Fix:** one machine-readable list + a bidirectional parity guard, so prose is checked
  against code rather than trusted.
- **B — a fact inferred from a proxy instead of derived from the truth.** e.g. the
  distribution channel inferred from a source path (wrong for six layout primitives that
  `@cascivo/react` does export); a prop default that is optional metadata rather than
  derived from the signature (126 undocumented across 73 components).
  → **Fix:** derive from the real source (the export list, the destructuring default) and
  add a parity guard. An inference that is right for 186 entries and wrong for 6 is
  indistinguishable from correct at review time; only a guard sees it.
- **C — the same fact stated independently in two places.** e.g. `llms.txt` requiring
  `ssr.noExternal` while `USING-WITH-VITE-SSR.md` says SSR is zero-config;
  `CSS-LAYERS-PITFALL.md` contradicting its own prose twenty lines later on where the
  app-local layer slot goes.
  → **Fix:** one owner per fact; every other surface includes it or is checked against it.
- **D — the fix landed on a surface the adopter does not read.** (Added by the 07-26 pair.)
  The 07-25 plan's WS-7 swept 231 prop defaults into the manifests and its guard is green — and
  the 07-26 TanStack adopter still hit `Flex`'s column default three times, because they built
  from the shipped `.d.ts`, where 284 of 373 defaulted props carry no TSDoc at all. The guard
  checked the surface the fix landed on. Every doc-only fix must land on all three surfaces —
  **types** (`@cascivo/react/dist/index.d.ts`), **machine** (`registry.json` / `llms/*`), and
  **human** (`docs/*.md`) — with a parity guard across them.
  → **Fix:** the Three-Surface Rule + `tsdoc-parity` (07-26 plan WS-1).
- **E — the defect is only observable in a consumer-shaped environment, and every guard runs in
  the monorepo.** (Added by the 07-28 incident console.) `apps/site` and `apps/storybook` ship
  their own `box-sizing` reset in app CSS, so no shipped surface has ever rendered on the
  browser default — which is how the `cascivo.reset` layer shipped empty for thirteen minors
  while `textarea` overflowed every viewport. `computed:check` mounts one component at a time
  in a 640px box, so a closed `MultiSelect` panel never has a `<Button>` underneath it to
  swallow. The guards are good; they all run in the one environment where these cannot happen.

  The third 07-28 blocker (`@types/react` unresolvable under pnpm) *looked* like this class
  and turned out not to be — see that plan's §0.5. **The fixture disproved it, which is the
  point:** a Mechanism-E hypothesis is a hypothesis until a non-monorepo fixture reproduces
  it. Build the fixture before writing the diagnosis.
  → **Fix:** a fixture that is **not** the monorepo — an isolated install of the packed
  tarballs (`isolated:check`) and a bare page with no app CSS and several stacked components
  (`bare-page:check`) — asserted in CI (07-28 plan WS-13). When a report's finding is
  "reproduced on a default install", check Mechanism E before anything else.
- **F — the guard re-implements the adopter's tool instead of running it.** (Added by the
  2026-08-06 Vercel dashboard.) `pnpm lint:host-strict` exists to stop shipped source carrying
  lint failures adopters did not write; its own header says it enforces those classes
  "**in oxlint**". oxlint does not implement `react-hooks/refs`, `react-hooks/purity`, or
  `react-hooks/static-components` — where all 13 of the reporter's errors were, across 41
  render-phase ref writes and 9 `getLinkComponent()` sites the guard has never been able to
  see. `@cascivo/eslint-config`'s `cascivoVendoredSource()` repeats the shape: it scopes off
  eight *stylistic* rules, was authored from a list of rules someone had seen fire, and has
  never been executed against the source it claims to cover. Mechanism F is E's sibling — E is
  "we never ran it in the adopter's *environment*", F is "we never ran the adopter's *tool*" —
  and it is worse, because the guard's existence reads as coverage.
  → **Fix:** run the adopter's actual tool, pinned, in CI, over the artefact the adopter
  receives. A re-implementation can only cover the intersection, and the gap is structurally
  invisible from inside it. Where a fragment claims to make a toolchain pass, a test must
  *run that toolchain* and assert zero findings — otherwise the claim is prose (Mechanism A)
  wearing a guard's clothes.
