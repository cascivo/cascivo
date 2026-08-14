---
'@cascivo/ai': patch
'@cascivo/charts': patch
'cascivo': patch
'@cascivo/core': patch
'@cascivo/docs': patch
'@cascivo/editor': patch
'@cascivo/eslint-config': patch
'@cascivo/flow': patch
'@cascivo/i18n': patch
'@cascivo/icons': patch
'@cascivo/mcp': patch
'@cascivo/platform': patch
'@cascivo/react': patch
'@cascivo/registry': patch
'@cascivo/storage': patch
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/vite-plugin': patch
---

Run the release train so the stranded 0.17.0 reaches npm and the recovery path
gets exercised on a real release.

No package source changed in this PR — the fixes are the Tag visual baselines
and `release.yml`'s new `Publish any stranded versions` step. But `release.yml`
only triggers on pushes that touch `.changeset/**`, so without a changeset
merging it would not start a release at all, and the step meant to unstrand
0.17.0 would sit unverified until some unrelated changeset happened to land.

Bumping the whole published set matches the 2026-08-11 changeset it lands
beside: npm is behind `main` on every package, not just the ones whose source
moved, and a partial bump would leave the rest still disagreeing.
