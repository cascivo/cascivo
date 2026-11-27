# cascivo-html-cli

## 0.4.0

### Minor Changes

- Released in lockstep with cascivo-html (fixed group).

## 0.3.0

### Minor Changes

- Blitz render target: `Options::target` (`Target::{Browser, Blitz}`, default `Browser` with no output change). `Target::Blitz` rewrites `@container` to viewport `@media`, `:focus-visible` to `:focus`, moves SVG CSS (`fill`, `stroke`, `transform`, `var()`, `oklch()`) to presentation attributes and omits inline scripts. New `lint(src, target)` reports components that degrade on Blitz; public `lower_css` and `lower_svg`. CLI: `--target browser|blitz` on `render` and `check` (`check --target blitz` prints warnings).

## 0.2.0

### Minor Changes

- Released in lockstep with cascivo-html (fixed group).

## 0.1.2

### Patch Changes

- Released in lockstep with cascivo-html (fixed group).

## 0.1.1

### Patch Changes

- Released in lockstep with cascivo-html (fixed group).
