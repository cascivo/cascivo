---
'@cascivo/react': patch
---

Two invariants that were documented and not enforced are now guarded.

**The public API surface is snapshotted.** `api-surface.json` records every exported name,
its kind, and its normalized type text across the nine packages on the `1.x` line, extracted
from the built `.d.ts` an adopter installs. `pnpm api:check` compares built against committed
on every CI run. A diff is a semver decision rather than a defect — name added, optional prop
added or type widened is a minor; a removal, a prop made required or a narrowed type is a
major — and the failure message says so. This closes the gap where a dropped export or a
quietly-required prop could reach `main` with every other check green.

**RTL is verified rather than asserted.** `pnpm rtl:check` fails on any physical inline
property in shipped CSS (one allowlisted case: `ContextMenu` positions from the pointer's
viewport x), and separately mounts components in real Chromium under `dir="ltr"` and
`dir="rtl"`, requiring every asymmetric inline box to swap. `docs/COMPATIBILITY.md` documents
the guarantee and its two exclusions.

No runtime behaviour changes.
