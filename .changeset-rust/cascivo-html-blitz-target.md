---
'cascivo-html': minor
'cascivo-html-cli': minor
---

Blitz render target: `Options::target` (`Target::{Browser, Blitz}`, default `Browser` with no output change). `Target::Blitz` rewrites `@container` to viewport `@media`, `:focus-visible` to `:focus`, moves SVG CSS (`fill`, `stroke`, `transform`, `var()`, `oklch()`) to presentation attributes and omits inline scripts. New `lint(src, target)` reports components that degrade on Blitz; public `lower_css` and `lower_svg`. CLI: `--target browser|blitz` on `render` and `check` (`check --target blitz` prints warnings).
