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

`fix-plan-tanstack-router-dashboard-adopter-2026-07-23.md` is the newest plan and
carries the open items from the 07-20 and 07-22 plans.
