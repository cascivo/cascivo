# cascivo-html

## 0.3.0

### Minor Changes

- Blitz render target: `Options::target` (`Target::{Browser, Blitz}`, default `Browser` with no output change). `Target::Blitz` rewrites `@container` to viewport `@media`, `:focus-visible` to `:focus`, moves SVG CSS (`fill`, `stroke`, `transform`, `var()`, `oklch()`) to presentation attributes and omits inline scripts. New `lint(src, target)` reports components that degrade on Blitz; public `lower_css` and `lower_svg`. CLI: `--target browser|blitz` on `render` and `check` (`check --target blitz` prints warnings).

## 0.2.0

### Minor Changes

- Library API for cascivo-web: `render_parts`, `stylesheet`, `script` and the `path` module (safe relative paths).

## 0.1.2

### Patch Changes

- Crate README and docs.rs introduction: install steps, a quick example, the CLI and links to the full guide. No code changes.

## 0.1.1

### Patch Changes

- First release through the automated changesets-style release flow (Version PR → trusted publishing). No functional changes.
