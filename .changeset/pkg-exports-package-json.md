---
'@cascivo/ai': patch
'@cascivo/charts': patch
'@cascivo/core': patch
'@cascivo/editor': patch
'@cascivo/flow': patch
'@cascivo/i18n': patch
'@cascivo/icons': patch
'@cascivo/mcp': patch
'@cascivo/registry': patch
'@cascivo/storage': patch
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/vite-plugin': patch
'cascivo': patch
---

Every published package now exports `./package.json`, so
`require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
`ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
tripped version probes, bundler plugins, and inspection tooling on the other packages.
