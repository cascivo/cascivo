---
'@cascivo/core': patch
'@cascivo/react': patch
'@cascivo/charts': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
'@cascivo/i18n': patch
'@cascivo/storage': patch
'@cascivo/ai': patch
'@cascivo/tokens': patch
'@cascivo/themes': patch
'@cascivo/icons': patch
'@cascivo/mcp': patch
'@cascivo/registry': patch
'@cascivo/docs': patch
'@cascivo/docspack': patch
'@cascivo/eslint-config': patch
'@cascivo/eslint-plugin': patch
'@cascivo/vite-plugin': patch
'@cascivo/platform': patch
'cascivo': patch
---

Release every published package.

This changeset names all twenty published packages so the next release cuts a version for each
of them, including the four that no other pending changeset touches (`@cascivo/docs`,
`@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
that higher bump still wins.
