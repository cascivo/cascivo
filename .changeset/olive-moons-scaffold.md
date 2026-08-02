---
'@cascivo/eslint-config': minor
'cascivo': minor
---

Add `@cascivo/eslint-config`, and fix the scaffolder + doctor to obey cascivo's own docs.

**New package `@cascivo/eslint-config`.** `eslint-plugin-react-hooks@7`'s
`recommended-latest` enables `react-hooks/immutability`, which reports every
`signal.value = next` — the idiom AI-RULES.md mandates — as
`Error: This value cannot be modified`. A stock 2026 React app therefore lints the
documented state idiom as an error on every piece of state the adopter wrote, and the docs
corpus had zero hits for "immutability". Spread `...cascivo` last in `eslint.config.js`.

**`cascivo create`** no longer writes `"latest"` for cascivo dependencies (exact pins are
baked in at build time), no longer declares or imports `@cascivo/core` / `@cascivo/tokens`
on the prebuilt path, now declares the `@preact/signals-react` peer its own `App.tsx`
depends on, no longer writes a `cascivo.config.ts` into a prebuilt-path app, declares the
`cascivo.example` layer its `AGENTS.md` tells agents to use, ships `lint`/`typecheck`
scripts and a pre-wired `eslint.config.js`, and seeds a short brand instead of the whole
directory name.

**`cascivo doctor`** infers the install path from evidence (`detectInstallPath`) instead of
treating any `cascivo.config.*` as proof of a copy-paste project. It no longer demands
`@cascivo/core`/`@cascivo/tokens` of a prebuilt app — it now reports them as
`[forbidden-dependency]` when present — so `doctor --ci` passes on a correctly-installed
Path B app and the documented CI gate is usable on day one.
