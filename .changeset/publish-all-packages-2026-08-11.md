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

Bump every published package so the next release run publishes the whole set.

The 0.17.0 bump landed on `main` but never reached npm: the release job's build
died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
the workflow fix, so every package publishes from a release that runs its build
in a runner-owned step.
