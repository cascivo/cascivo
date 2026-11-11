# cascivo-html: agent-written `.cv` → one static HTML file (Rust)

Status: draft for review · 2026-11-10

## Goal

A Rust library and CLI that turn a tiny, agent-written `.cv` text into one self-contained,
deterministic HTML file styled by real cascivo CSS and brandable via a template. Used by a Rust
CLI and a Rust web server. Static output only (no forms, no runtime data).

## Requirements

- Output: one `.html` file. HTML + inlined CSS; JS only for a component that cannot work
  without it, inlined, and only if that component is used.
- Input: `.cv` line format, minimal tokens. ViewConfig JSON (`@cascivo/render` v1) accepted
  behind the `json` cargo feature.
- Branding: colors, radius, gap/density, font, light/dark, base theme; from a template file
  or an inline `@brand` line.
- Deterministic: same input + same crate version → byte-identical output.
- Fast (sub-millisecond for typical pages), zero runtime deps in the default feature set.
- Self-describing for agents: the crate ships its own usage guide (see "Agent guide").
- 50 components in v1 (list below).

## Prior art (summary)

A2UI / json-render: closed catalog is the safe model; JSON envelope is verbose. TOON benchmarks:
cost is quotes, braces and keys; nested trees gain little from TOON, so an indentation format wins
for UI. MCP Apps already ship self-contained HTML. Rust: a parser + direct `String` writes beat any
template engine for this. Existing repo assets reused: `@cascivo/render` catalog + validation
ideas, `theme-kit` oklch math, `clientJs` manifest flag, `--cascivo-*` tokens.

## `.cv` format

```
@brand #5b5bd6 r8 gap4 font=Inter dark
cols 2
  card "Revenue"
    bar Q1:12 Q2:18 Q3:9
  card "Users"
    line 3 5 8 13
```

- One node per line: `name [positional args] [key=value] [flags]`; two-space indentation = children.
- Strings: bare word, or `"quoted"` when it has spaces. Trailing `"text"` after args = text child.
- Positional args per component are defined in the catalog (e.g. `card <title>`, `stat <label> <value> [delta]`).
- Data: `label:value` pairs or bare numbers for charts; tables use `|`-separated rows of
  `,`-separated cells, first row is the header: `table Name,Age | Ann,31 | Bob,42`.
- Repetition: `3x card "…"` repeats a node.
- Directives start with `@`: `@brand …`, `@brand-file path`, `@title "…"`, `@lang de`.
- Comments: `# …` at line start.
- Errors: `line:col: message` with did-you-mean for unknown names and props. Parsing never panics.

## Branding

`@brand` keys (all optional): `<hex>` primary color, `accent=<hex>`, `theme=<one of 12>`,
`light|dark|auto`, `r<n>` radius px, `gap<n>` default space step, `density=compact|normal|comfy`,
`font=<family>`, `mono=<family>`. A brand file is the same keys, one per line, so a template is
reusable across pages. Compiled to one `@layer cascivo.theme` block of `--cascivo-*` overrides.
Color scales come from a Rust port of `packages/theme-kit/src/css.ts` (oklch lightness table),
with static oklch values (no relative color syntax needed).

## Output

- `<!doctype html>`, `lang`, `<title>`, `data-theme`, one `<style>`, the body, optional one `<script>`.
- CSS: layer order + tokens + chosen theme + brand block + CSS for used components only,
  minified at asset-build time (not at render time).
- Charts: inline SVG (bar, line, area, pie, sparkline, gauge), colors from `--cascivo-chart-N`.
  Fixed viewBox, coordinates rounded to 2 decimals as in `packages/charts/src/engine/shape.ts`.
- Interactivity without JS: accordion/collapsible via `<details>`, tabs via radio inputs + `:has()`.
  JS snippets (each <1 KB, inlined once): data-table sorting.
- Ids from a per-document counter (`cv-1`, `cv-2`, …). No timestamps, no hash-map iteration.

## Fidelity to cascivo

- **CSS** – a TS asset script (run by `pnpm regen`) builds each v1 component's CSS module with
  fixed class names (`cv-<component>-<class>`), plus tokens, layers and themes, minified, into
  `crates/cascivo-html/assets/`. The crate embeds them with `include_str!`. CI fails on drift.
- **Markup** – hand-ported Rust emitters per component. A conformance test renders each
  component's manifest examples with React `renderToStaticMarkup` (fixed class names) and with
  Rust, normalizes whitespace and attribute order, and requires equality. Divergence = CI failure.
- **Catalog** – the asset script also emits `catalog.cv.json` (names, positional args, props,
  enums, defaults, one-line descriptions) from the manifests; parser validation and the agent
  guide both read it.

Rejected: calling Node/React from Rust (slow, heavy runtime); generating markup templates from
React output (prop combinations explode).

## v1 components (51)

- Layout (10): flex, grid, columns, auto-grid, center, section, page-header, dashboard-layout, separator, spacer
- Display (21): heading, text, prose, card, stat, kpi, badge, tag, avatar, avatar-group, image,
  list, data-list, structured-list, timeline, empty-state, blockquote, code, kbd, link, button
- Feedback (7): alert, notification, progress-bar, progress-circle, meter, skeleton, spinner
- Navigation/disclosure (5): breadcrumb, steps, accordion, collapsible, tabs (CSS-only)
- Data (1): table (static `data-table`, optional sort script)
- Charts (7): bar, line, area, pie (+donut), scatter, sparkline, gauge

Short aliases in `.cv`: `cols`=columns, `row`=flex horizontal, `col`=flex vertical, `h1..h3`=heading, `p`=text.

## Agent guide (no training needed)

- `cascivo_html::GUIDE`: a const string, generated from `catalog.cv.json` + grammar, target
  ≤1,500 tokens: syntax rules, brand keys, one line per component (`stat <label> <value> [delta] – KPI tile`), 3 examples.
- `cascivo_html::guide_for(name)`: full detail for one component (all props, enums, example).
- CLI: `cascivo-html guide [component]` prints the same.
- `skills/cascivo-html/SKILL.md`: Claude Code skill pointing agents at the CLI and guide.
- Error messages are written to be self-correcting (show the expected signature).
- A test enforces the token budget (approx. by character count) so the guide stays small.

## Crates and API

```
crates/cascivo-html/        lib, default features: none; feature `json` (serde_json)
crates/cascivo-html-cli/    bin `cascivo-html`
```

```rust
pub fn render(src: &str, opts: &Options) -> Result<String, Vec<Diagnostic>>;
pub fn parse(src: &str) -> Result<Doc, Vec<Diagnostic>>;
pub fn check(src: &str) -> Vec<Diagnostic>;
pub struct Options { pub brand: Option<Brand>, pub minify_html: bool }
pub const GUIDE: &str;
pub fn guide_for(component: &str) -> Option<String>;
```

CLI: `cascivo-html render [in.cv|-] [-o out.html] [--brand brand.cv]`, `check`, `guide [name]`.
Arg parsing by hand (no clap). Cargo workspace at repo root; the Rust edition and MSRV are pinned.

## Testing

- Unit tests for parser (golden diagnostics), brand math (vs theme-kit outputs), chart geometry.
- Snapshot tests: each example `.cv` → expected `.html`, byte-compared.
- Conformance tests vs React SSR (TS side, runs in `vp` test).
- Determinism test: render twice, plus once per thread on several threads, compare bytes.
- Guide budget test; catalog drift test; `cargo clippy -D warnings`, `cargo fmt --check` in CI.

## Work split (child sessions, each using subagents)

| # | Session | Model | Depends on |
|---|---------|-------|------------|
| S1 | Asset pipeline: fixed class names, per-component CSS, catalog.cv.json, drift check | Sonnet | – |
| S2 | `.cv` grammar, parser, AST, diagnostics | Opus | – |
| S3 | HTML emitters (layout, display, feedback, nav, table) + conformance tests | Sonnet | S1, S2 |
| S4 | SVG charts + brand/oklch port | Sonnet | S1, S2 |
| S5 | CLI, GUIDE generation, skill, examples, CI job | Sonnet | S3, S4 |

## Out of scope (v1)

Forms that submit, runtime data binding, JS-required components (modal, menus, tooltips),
streaming output, the other 160+ components.
