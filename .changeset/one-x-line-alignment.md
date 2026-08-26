---
'@cascivo/tokens': major
'@cascivo/themes': major
'@cascivo/icons': major
'cascivo': major
---

Join the `1.x` line.

These four carry **no breaking change**. The major is the version-alignment decision recorded
in [`docs/UPGRADING.md`](../docs/UPGRADING.md#which-packages-are-covered): the packages an
application depends on at runtime move to `1.x` together, so `@cascivo/*` reads as one system
in a lockfile instead of the `0.0.4`–`0.18.0` spread an adopter called out in the 2026-07 pair
report ("everything is pre-1.0 and versions don't align").

The lockstep family — `core`, `react`, `charts`, `editor`, `flow`, `i18n`, `storage`, `ai` —
reaches `1.0.0` through the changeset that removes the deprecated surfaces, and the
`fixed` group in `.changeset/config.json` keeps them on one version.

Tooling packages stay on `0.x` and say so: `@cascivo/mcp`, `@cascivo/registry`,
`@cascivo/docs`, `@cascivo/docspack`, `@cascivo/eslint-config`, `@cascivo/eslint-plugin`,
`@cascivo/vite-plugin` and `@cascivo/platform`. `@cascivo/platform` in particular is an early
experiment in platform-idiomatic geometry and motion; a 1.0 promise would be wrong for it.

Upgrading from the last `0.x` of any of these four is a no-op beyond the version number.
