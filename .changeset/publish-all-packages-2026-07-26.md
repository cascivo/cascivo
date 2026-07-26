---
'@cascivo/ai': patch
'@cascivo/charts': patch
'cascivo': patch
'@cascivo/core': patch
'@cascivo/docs': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
'@cascivo/i18n': patch
'@cascivo/icons': patch
'@cascivo/mcp': patch
'@cascivo/react': patch
'@cascivo/registry': patch
'@cascivo/storage': patch
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/vite-plugin': patch
---

Bump every published package so the next release run publishes the whole set. The
release drift gate had been failing on non-reproducible `regen` output (see PR #179),
so packages carrying no substantive change of their own were left behind at versions
older than the rest of the workspace. This changeset gives each of them a real new
version, keeping the published set in lockstep.
