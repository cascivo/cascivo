# 02 — cascivo audit for a Blitz integration

Blitz = Rust native HTML/CSS renderer (Stylo + Taffy, no JS). Audit of what a new crate could reuse.
Paths relative to repo root. Counts are occurrences in `crates/cascivo-html/assets/**` (CSS is minified, one line per file; counted with `grep -o`).

## 1. `cascivo-html` (library)

- Zero dependencies, no file I/O, deterministic (`cv-1`, `cv-2`… ids). `edition.workspace`, MSRV 1.85. v0.1.2. `Cargo.toml` has no `[features]`.
- Input: `.cv` text (agent-oriented DSL). Output: ONE self-contained HTML string (inline `<style>`, optional inline `<script>`).

### Public API (`crates/cascivo-html/src/lib.rs`)

| Item | Use for Blitz |
|---|---|
| `render(src, &Options) -> Result<String, Vec<Diagnostic>>` | Full doc → feed to Blitz `HtmlDocument`. Easiest path. |
| `render_parts(src, &Options) -> Fragment {html, used, scripts}` | Body only + which CSS units/scripts used; host owns shell. Best seam for Blitz. |
| `render_fragment(src)` | Body only, no opts. |
| `stylesheet(theme, &used) -> String` | Base+theme+doc shell+used component CSS. Can be fed to Blitz as UA/author sheet. |
| `script(name) -> Option<&str>` | Inline JS source (only `table-sort`, 750 B). Skip in Blitz. |
| `check(src) -> Vec<Diagnostic>`, `parse`, `Diagnostic` | Validation. |
| `Options {brand, brand_resolver, minify_html, assets, asset_resolver, embed_urls, max_asset_bytes}` | Images are base64 `data:` URIs by default → no network needed. |
| `Brand`, `parse_brand_file` | Brand token overrides (CSS vars). |
| `catalog::{lookup, suggest, CompSpec, PropSpec, ClientJs…}` | Component metadata; `ClientJs::{None,Enhancement,Required}`. |
| `GUIDE`, `guide_for` | Agent cheat sheet. |
| `emit`, `html`, `asset`, `ast`, `path` modules | Public. |
| `css_gen::{COMPONENT_CSS, BASE_CSS, THEMES}` | **private** (`mod css_gen`); reachable only via `stylesheet()`. A Blitz crate wanting raw per-component CSS needs a small upstream `pub` or use `stylesheet`. |

### Where CSS comes from
- Generated: `scripts/html-kit/build-css.ts` → `crates/cascivo-html/assets/{css,themes,extra}` (216K / 96K / 12K); `scripts/html-kit/gen-rust.ts` → `src/css_gen.rs` (`include_str!`, `@generated`). Run via `pnpm html-kit:generate` (part of `pnpm regen`).
- Embedded: 46 component CSS modules, `base.css` (tokens), 12 themes (arcade, brutalist, corporate, cyberpunk, dark, flat, light, midnight, minimal, pastel, terminal, warm), `extra/image.css`, `extra/tabs.css`, inline `DOC_CSS` page shell (`src/render.rs`).
- Assembly order in `render.rs::stylesheet`: base → theme → (brand CSS inserted after theme) → DOC_CSS → used component CSS only. Tokens = `var(--cascivo-*)` (1424 `var(--` uses).
- Output has `<html data-theme=…>`; theme CSS keyed on that.

### JS in output
- Only one script: `assets/extra/table-sort.js` (750 B), emitted only for `table … sort` (`src/emit/nav.rs:335`). Everything else is static HTML/CSS.
- Catalog: 34 of 52 specs `ClientJs::None`; 18 `Enhancement` (accordion, alert, area, avatar, bar, breadcrumb, collapsible, gauge, image, line, notification, pie, scatter, spinner, steps, structured-list, table, tag); **0 `Required`**. For static emit the "Enhancement" ones still work without JS.
- Interactivity via native HTML: `<details>/<summary>` (accordion, collapsible; `src/emit/nav.rs:169,230`). Tabs deliberately CSS-only (`extra/tabs.css`). Blitz `<details>` support must be verified.
- Charts: pure inline SVG (`src/emit/chart/*.rs`: area bar gauge line pie scatter spark). Blitz needs SVG (resvg/usvg via `blitz-dom`'s svg feature).

## 2. Sibling crates: patterns to copy

| Aspect | `cascivo-html` | `cascivo-html-cli` | `cascivo-tui` | `cascivo-web` |
|---|---|---|---|---|
| Workspace | `members=["crates/*"]` (auto-picks new crate), resolver 3, edition 2024, MSRV 1.85 in `[workspace.package]` | same | MSRV override `1.88` (ratatui 0.30) w/ comment | `publish=false`, v0.0.0 spike |
| Cargo.toml fields | name, version, `edition/rust-version.workspace`, description, license MIT, repository, homepage (…/tree/main/crates/X), readme, keywords, categories, `exclude=["tests/", …]` | `[[bin]]`, `readme="../cascivo-html/README.md"`, path+version dep, optional dep `fetch` default feature | `exclude=["tests/"]` | optional `axum` feature; dev-deps tokio/tower |
| Tests | `tests/{assets,brand,charts,conformance,examples,guide,nav,parse,render}.rs` + `.snap` dirs; `UPDATE_SNAPSHOTS=1 cargo test --test examples` | `tests/cli.rs` | `tests/{cmds,docs,example_smoke,focusable,overlays,testing,widgets}.rs` + `snapshots/`; `docs.rs` = drift guard reading `docs/USING-CASCIVO-TUI.md` via `CARGO_MANIFEST_DIR/../../docs/` | `tests/{axum,dev,site}.rs`, `common/`, `fixtures/` |
| Docs | `README.md` (Install / Quick example / Library notes / Links / Development / Releasing) + `docs/USING-CASCIVO-HTML.md` (When to use, Install, format, CLI, library, Links) + `CHANGELOG.md` | `CHANGELOG.md` | `README.md` short, points to `docs/USING-CASCIVO-TUI.md` and `skills/cascivo-tui` | `README.md` |
| Extras | `examples/*.cv` + byte-compared `.html` snapshots | — | `examples/dashboard`; lib.rs doctests compile guide code blocks | — |

Generated-source convention: `// @generated by scripts/…` header + `#[rustfmt::skip]`; drift checked by `pnpm html-kit:check` / `pnpm tui-kit:check`.
Skills dir: `skills/cascivo-html`, `skills/cascivo-tui`. A new crate should add `docs/USING-CASCIVO-BLITZ.md`, README, CHANGELOG, `.changeset-rust/*.md`.

## 3. CSS feature usage (what Blitz/Stylo must handle)

Source: `crates/cascivo-html/assets/{css,themes,extra}/*.css`.

| Feature | Count | Where | Blitz risk |
|---|---|---|---|
| `@layer` | 63 (47 `cascivo.component`, 12 `cascivo.theme`, 1 each `base`, `reset`, `tokens`, plus order decl `cascivo.component,cascivo.platform,cascivo.theme,cascivo.blocks,cascivo.override`) | every `css/*.css`, `themes/*.css`, `base.css` | Stylo supports; verify order |
| CSS nesting (`&…`) | ~208 `&` selectors | all components (`&[data-variant=…]`, `&:has(…)`) | Stylo supports |
| `@container` | 12: `(width>=30/40/64/80rem)`, `(width<=40rem)`, `(width<=56rem)`, `scroll-state(stuck:top)` | `css/{columns,dashboard-layout,data-table,grid}.css` | Container queries: Stylo yes; Blitz layout re-eval uncertain; `scroll-state` surely not |
| `container-type` | 7 | `columns, dashboard-layout, data-table, grid, section` | same |
| `:has()` | 2 | `card.css` (`:has(>.cv-card-header,…)` padding), `link.css` (`[data-external]:not(:has(>svg:last-child))::after`) | Stylo gates behind pref; check |
| `color-mix()` | 32 (`in oklch`) | `alert, base, data-table, notification` + 7 themes (corporate dark light midnight pastel terminal warm) | Stylo yes |
| `oklch()` | 861 | `base.css` + all 12 themes + alert, notification | Stylo yes |
| `light-dark()` | 0 | — (theme via `data-theme` attr) | n/a |
| `@property` | 12 (`<color>` accent/primary/secondary/destructive + hover/active/on-*) | `base.css` | Stylo parses; registered props maybe ignored → fallback `initial-value` harmless |
| `@supports` | 16 (12 `color:contrast-color(red)`, 2 `text-box-trim`, 1 `subgrid`, 1 `container-type:scroll-state`) | 12 themes, `heading, text, grid, data-table` | Progressive; falls back |
| `contrast-color()` | 36 | themes | Likely unsupported → fallback path |
| `text-box-trim` | 4 | heading, text | fallback |
| `subgrid` | 2 | `grid.css` | Taffy no subgrid → fallback |
| Logical properties (`*-inline*`, `*-block*`, `inline-size`, `block-size`, `inset-inline`) | 269 | pervasive | Stylo yes |
| `@media` | 21 (min-width, prefers-reduced-motion etc.) | many | ok |
| `@keyframes`/`animation` | 3 / 8 | `base, arcade, cyberpunk`; spinner, skeleton, progress-bar, image, card, data-table | Blitz animation limited |
| `transition` | 17 files | ok / ignorable |
| `@starting-style` | 1 | `notification.css` | ignorable |
| `:focus-visible` | 14 files | ok |
| `:popover-open` / `popover` | 1 | `data-table.css` (column filter popover) | popover API unlikely in Blitz |
| `position:sticky` | 4 | `data-table.css` (sticky header) | check |
| `scroll-snap` | 1 | `tabs.css` | ignorable |
| `text-wrap` | 2 | heading, prose | ignorable |
| `content:"…" / ""` (alt text in content) | 2 | `link.css` ↗, one more | may drop declaration |
| Anchor positioning | 0 | — | n/a |
| `<dialog>` | 0 | — | n/a |
| View transitions | 0 | — | n/a |
| `aspect-ratio`, `backdrop-filter`, `field-sizing`, `@scope`, `display:contents`, `cqi/cqw` | 0 | — | n/a |

Takeaway: static subset is mostly mainstream (layers, nesting, logical props, oklch, color-mix, grid/flex). Watch: `@container` sizing, `:has()`, `contrast-color()`/`@property` fallbacks, `subgrid`, `<details>`, SVG charts, data-table popover.

## 4. CI / gates for Rust

| Gate | Where |
|---|---|
| Toolchain pin: `channel="1.97"`, components rustfmt+clippy | `rust-toolchain.toml` |
| `cargo fmt --check` | `.github/workflows/rust.yml`, `rust-release.yml` |
| `cargo clippy --workspace --all-targets --all-features -- -D warnings` | `rust.yml` (release workflow omits `--all-features`) |
| `cargo test --workspace --locked` | `rust.yml` |
| `cargo test -p cascivo-web --features axum --locked` (feature-gated crate tests need explicit step) | `rust.yml` — a feature-gated Blitz crate needs the same |
| Triggers: PRs touching `crates/**`, `Cargo.toml`, `Cargo.lock`, `rust-toolchain*`; push to main | `rust.yml` |
| Rust changeset required for crate `src/` or non-version Cargo.toml changes (`.changeset-rust/*.md`, or label `no-rust-changeset`) | `.github/workflows/rust-changeset.yml`, `scripts/rust-release/cli.ts` (`pnpm changeset:rust`) |
| Release/publish: `cargo publish -p <crate>` | `.github/workflows/rust-release.yml` |
| Generated-source drift: `pnpm html-kit:check`, `pnpm tui-kit:check` | `package.json` scripts; `html-kit:check` + `tui-kit:check` are in `pnpm ready`; `pnpm release:check` tests rust-release lib |
| `pnpm regen` includes `html-kit:generate` + `tui-kit:generate` | `package.json` |
| `pnpm ready` | JS-centric full gate; **does not run cargo**. Rust gated only by `rust.yml`. |
| Visual/screenshot CI (JS) | `visual.yml`, `screenshots.yml` — not Rust |

Notes: Blitz deps (Stylo, wgpu/vello, winit) are heavy; MSRV likely > 1.85 → set per-crate `rust-version` override like `cascivo-tui` (1.88). `Cargo.lock` is committed and CI uses `--locked`; `--all-features` clippy would pull every Blitz feature → gate carefully. Consider `publish = false` initially (like `cascivo-web`).
