---
'@cascivo/react': patch
'@cascivo/data': patch
'@cascivo/email-preview': patch
'@cascivo/eslint-config': patch
'@cascivo/icons': patch
'@cascivo/platform': patch
'@cascivo/registry': patch
'@cascivo/themes': patch
'@cascivo/vite-plugin': patch
'create-cascivo': patch
---

`@cascivo/react` is built with vite-plus 1.0. Its `dist/index.d.ts` now marks each declaration `export` where it is
written, instead of listing all of them in one trailing `export { … }`. The exported names and
their types are unchanged. Long component signatures, such as `DataTable`'s, now put one
parameter on each line so the file stays easy to grep.

The other packages listed here ship only a README change: the vite-plus 1.0 formatter removes
a blank line in the header block.
