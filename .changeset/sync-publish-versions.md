---
'@cascivo/ai': patch
'@cascivo/charts': patch
'cascivo': patch
'@cascivo/core': patch
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

Force a version bump across every published package to verify the changesets
publish patch fix (see the release workflow fix in PR #168): several packages
had been stuck re-publishing their already-released version on every release
run and failing with a spurious E403, because the "already published" error
detection missed pnpm's actual error shape. This changeset gives every
package a real new version so the next release run exercises a genuine
publish for all of them, not just the ones with substantive changes.
