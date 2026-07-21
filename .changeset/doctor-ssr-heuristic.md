---
'cascivo': patch
---

`cascivo doctor`: warn when a Vite SSR framework is present without the cascivo
`ssr.noExternal` config.

On TanStack Start / vite-ssr / Remix, cascivo's per-component `.css` side-effect
imports crash a bare server-side ESM loader with `Unknown file extension ".css"`
unless the packages are marked `ssr.noExternal` (or the `cascivoSsr()` plugin is
used). `doctor` now detects the framework, checks the vite config, and prints the
one-line fix + recipe link when it's missing — turning the cryptic runtime crash
into an up-front diagnosis (2026-07-20 report, blocker #1).
