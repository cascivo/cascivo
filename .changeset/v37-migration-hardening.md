---
'@cascivo/react': minor
'@cascivo/themes': minor
'@cascivo/tokens': minor
---

v37 migration hardening — fixes from the boringtools migration feedback.

**Fixed (#1):** `@cascivo/react`'s `exports["./styles.css"]` pointed at a
non-existent `./dist/cascade.css`; it now resolves to the emitted
`./dist/cascivo.css`. Strict bundlers (Vite 6 and any tool that enforces the
`exports` map) no longer need a `patch-package` patch to import the stylesheet.

**BREAKING (#2/#5):** the shipped CSS `@layer` namespace was renamed from
`cascade.*` to `cascivo.*` (`cascivo.base`, `cascivo.theme`, `cascivo.component`,
…). Any consumer that referenced the old `@layer cascade.*` names in their own
`@layer` ordering must rename them to `cascivo.*`. The brand is `cascivo`; the
old name leaked into consumers' stylesheets. See `docs/CSS-LAYERS-PITFALL.md` for
the recommended ordering (`cascivo.base < cascivo.theme < cascivo.component`).

A `brand:check` guard (`scripts/brand-guard.mjs`) now fails CI if the old
`cascade` brand reappears in shipped CSS layer names, package descriptions, or
the published `@cascivo/react` entry JSDoc.
