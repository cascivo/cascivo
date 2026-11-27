# cascivo-html

## 0.4.0

### Minor Changes

- Form controls in `.cv`: `field`, `input`, `textarea`, `select`, `checkbox` and the remaining native-tier components, each with an emitter matching the React markup and parity cases. Fixes the `image` element class that the contract-const migration changed.

- CSP-safe output and static-page fixes (#305). `Options::inline_styles = false` (CLI `--no-inline-styles`) replaces every `style=""` with a `data-cv-style` hook whose rules come from `Fragment::styles` and `style_rules`. `Options::script_src` (CLI `--script-src`, `cascivo-html script`) references client scripts instead of inlining them; `script_names` and `script_bundle` give the source. `\,`, `\|` and `\\` escape commas, bars and backslashes in row cells. `button href=…` renders a link styled as a button. `alert` and `notification` default to `role="note"`; `role=status|alert` opts into a live region.

- New `.cv` components with emitters matching React markup: `join`, `button-group`, `visually-hidden`, `chat-bubble`, `shimmer-text`, `stack`, `aspect-ratio`, `skip-nav`, `typing-indicator`, `ai-disclaimer`, `label`, `status`, `user`, `item`, `inline-loading`, `icon-button`, `context-meter`, `progress`, `progress-indicator`, `radial-progress`, `switcher`, `header`, `large-title-header`, `app-shell`, `dock`, `scroll-area`, `toc`. Fix: `image` emitted the wrapper class on its `<img>`.

- Rust emitters for `indicator`, `input-group`, `inline-citation`, `relative-time`, `qr-code` and `code-snippet` (ported QR encoder and highlighter); `.cv` strings accept `\n`; layouts join the `cv-*` contract.

- Add the `contract` module: generated `cv-<unit>-<local>` class consts and `data-*` value enums per unit (from `@cascivo/css` contract.json). Emitters use them instead of class literals, and components whose anatomy says `emit: 'auto'` (button) get generated emitters. Output is unchanged.

- Tabs emit the ARIA tablist (`role=tablist/tab/tabpanel`) inside `<cv-tabs>`, the same markup React renders; the `cv-tabs` script is added through `client_js`. Without it every panel stacks and the tablist is hidden. The radio-input markup and `tabs.css` are gone.

- cascivo-web strict-CSP output and theming (#305): `[build] inline_styles = false` moves component styles into `cascivo.css` (`data-cv-style` hooks); `[build] external_scripts = true` writes component scripts, `theme_script()` and `islands_script()` to `/cascivo.js`, `/cascivo-theme.js` and `/cascivo-islands.js` (the theme script stays blocking); `[build] hash_assets = true` gives `cascivo.css` and those scripts content-hashed `/_cw/` names; `dark_theme` adds a `prefers-color-scheme: dark` theme to `cascivo.css`; a `[brand]` table (`primary`, `accent`, `radius`, `gap`, `density`, `font`, `mono`) generates token overrides. The starter's 404 page is now `pages/404.md` with the layout. cascivo-html adds `theme_css` and `theme_names`.

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
