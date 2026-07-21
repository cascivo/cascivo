---
'@cascivo/react': patch
---

Fix the `exports` map so `import` and `types` resolve to parallel, top-level files.

`preserveModulesRoot` pushed the real entry to `dist/react/src/index.js` — a subtree
that didn't parallel the flat `dist/index.d.ts`, which `publint`/`arethetypeswrong`
flag (2026-07-20 report, #8). The build now emits a one-line re-export at
`dist/index.js`, and `exports["."]` points `import`/`default`/`types` at parallel
top-level files. A new `pack:check` release gate (publint + attw) guards against
exports-map regressions across all published packages.
