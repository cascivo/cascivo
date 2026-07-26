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
   vX.Y.Z`.** A fix an adopter can't `pnpm add` yet is not done — every prior
   recurrence involved an adopter meeting artifacts that lagged the repo.
3. **Open items carry forward.** When a new report supersedes an older plan, list
   the still-open workstreams in the new plan so there is a single live tracker,
   and point the old plan's header at it.

This is the process analogue of the repo's generated-artifact **drift check**: the
status must not drift from what actually shipped.

## Current live tracker

`fix-plan-vercel-tanstack-start-adopter-2026-07-25.md` is the newest plan. It carries
the open items of the whole chain behind it — 07-20 → 07-22 → 07-23 → 07-24 → 07-25 —
in its WS-15 (publish the 07-24 release train, run the freshness + npm-parity canaries,
and the 07-23 WS-J browser leg). Every superseded plan's header points forward to here.

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
