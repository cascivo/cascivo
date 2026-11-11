# cascivo-html Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rust library + CLI that render agent-written `.cv` text into one deterministic, branded, self-contained HTML file using real cascivo CSS.

**Architecture:** A TS asset script (part of `pnpm regen`) compiles the v1 components' CSS modules with fixed class names and generates Rust sources (catalog + embedded CSS) into `crates/cascivo-html`. The Rust crate parses `.cv` into an AST validated against the catalog, emits HTML/SVG by hand-written emitters into a `String`, and inlines only the CSS used. Conformance tests compare Rust output with React `renderToStaticMarkup`.

**Tech Stack:** Rust (edition 2024, toolchain 1.97, zero default deps; `serde_json` behind feature `json`), TypeScript + `lightningcss@1.33` (already in lockfile) for assets, Vitest via `vp`.

**Spec:** `docs/superpowers/specs/2026-11-10-cascivo-html-design.md`

## Global Constraints

- Same input + same crate version → byte-identical output. No `HashMap` iteration, no time, no randomness; ids `cv-1`, `cv-2`… from a per-document counter.
- Default crate features: zero dependencies. `json` feature adds `serde_json` only.
- Library never reads files or network. `@brand-file` is resolved by a caller-supplied resolver (`Options::brand_resolver`); default resolver returns an error.
- Fixed class name pattern: `cv-<component>-<local>` (e.g. `.card` in `card.module.css` → `cv-card-card`).
- All emitted CSS stays inside the cascivo layers (`cascivo.tokens`, `cascivo.theme`, `cascivo.component`); brand block in `@layer cascivo.theme`.
- JS only for `table sort`; inlined once, < 1 KB.
- Parser never panics; every error is `line:col: message` (col counted in chars, 1-based).
- `GUIDE` ≤ 6,000 chars (≈1,500 tokens).
- Rust gates: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`. TS gates: `pnpm ready`.
- v1 set (51): layout `flex grid columns auto-grid center section page-header dashboard-layout separator spacer`; display `heading text prose card stat kpi badge tag avatar avatar-group image list data-list structured-list timeline empty-state blockquote code kbd link button`; feedback `alert notification progress-bar progress-circle meter skeleton spinner`; nav `breadcrumb steps accordion collapsible tabs`; data `data-table` (cv name `table`); charts `bar-chart line-chart area-chart pie-chart scatter-chart sparkline gauge` (cv names `bar line area pie scatter spark gauge`).
- Aliases: `cols`=columns, `row`=flex horizontal, `col`=flex vertical, `h1`/`h2`/`h3`=heading level 1/2/3, `p`=text.

## Review Focus

1. Tabs or odd indentation (3 spaces, dedent to unknown level) → diagnostic `indentation must be multiples of 2 spaces`, no panic. Test in Task S2.2.
2. Markup in user text (`card "<script>x</script>"`, `"` in attributes) → escaped. Test in Task S3.1.
3. Empty file / only directives / only comments → valid minimal HTML document. Test in Task S3.1.
4. Chart edge data (empty, single point, all zeros, negatives, 1e12) → no `NaN`/`inf` in SVG; empty data renders an `empty-state`. Test in Task S4.2.
5. `@brand-file ../../etc/passwd` with default options → error, no file read. Test in Task S4.1.

---

## S1 — Asset pipeline (TypeScript)

### Task S1.1: v1 list + CSS build

**Files:**
- Create: `scripts/html-kit/cv-spec.ts` (v1 list, cv names, aliases, positional args, children kind, css deps)
- Create: `scripts/html-kit/build-css.ts`
- Test: `scripts/html-kit/build-css.test.ts`
- Output: `crates/cascivo-html/assets/css/<component>.css`, `assets/css/base.css` (layers + reset + tokens + motion + properties + base), `assets/themes/<theme>.css` (12)

**Interfaces:**
- Produces: `export const CV_SPEC: readonly CvEntry[]` with `CvEntry = { component: string; cv: string; aliases: string[]; args: { name: string; kind: 'str'|'num'|'pairs'|'nums'|'rows'; required: boolean }[]; children: 'none'|'text'|'nodes'; css: string[] }`; `export function buildCss(component: string): string`.

- [ ] Step 1: tests — `buildCss('card')` contains `.cv-card-card` and `@layer cascivo.component`, contains no `@import` and no `_card_`; calling twice gives identical strings; `CV_SPEC.length === 51`; cv names + aliases are unique; every `component` resolves to an existing `*.module.css` under `packages/{components,layouts,charts}/src`.
- [ ] Step 2: run `vp test scripts/html-kit` → FAIL.
- [ ] Step 3: implement. `lightningcss.transform({ cssModules: { pattern: 'cv-<component>-[local]' }, minify: true })` with no `targets` (keep nesting, `@container`, `:has`). Concatenate all `*.module.css` in the component dir in sorted filename order. `css` deps list the other components whose classes the markup uses (e.g. `card` → none, `kpi` → `stat` if its TSX renders Stat).
- [ ] Step 4: run tests → PASS.
- [ ] Step 5: commit `feat(html-kit): fixed-name CSS for cascivo-html v1`.

### Task S1.2: Rust codegen (catalog + embedded CSS)

**Files:**
- Create: `scripts/html-kit/gen-rust.ts`, test `scripts/html-kit/gen-rust.test.ts`
- Output: `crates/cascivo-html/src/catalog_gen.rs`, `crates/cascivo-html/src/css_gen.rs`

**Interfaces:**
- Consumes: `CV_SPEC`, `registry.json` `components[].meta.props` (name, type, default, description), `meta.clientJs`, `meta.description`.
- Produces (Rust, types defined in S2 `src/catalog.rs`): `pub static CATALOG: &[CompSpec]` sorted by `cv` name; `pub static COMPONENT_CSS: &[(&str, &str)]` (component, `include_str!("../assets/css/<c>.css")`) sorted; `pub static BASE_CSS: &str`; `pub static THEMES: &[(&str, &str)]`.
- Prop kind mapping: TS union of string literals → `PropKind::Enum(&[...])`; `boolean` → `Bool`; `number` → `Num`; `string`/`ReactNode` → `Str`; function/`ref`/`className`/`style` props skipped. `summary` = first sentence of description, ≤ 80 chars.

- [ ] Step 1: tests — generated `catalog_gen.rs` contains `name: "card"` and `Enum(&["primary",` for button `variant`; every manifest prop default appears as `default: Some("…")`; output byte-identical on two runs; file starts with `// @generated by scripts/html-kit/gen-rust.ts — do not edit`.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: run → PASS.
- [ ] Step 5: commit `feat(html-kit): generate cascivo-html catalog and css sources`.

### Task S1.3: regen wiring + drift gate

**Files:**
- Modify: `package.json` scripts: add `"html-kit:generate": "node scripts/html-kit/build-css.ts && node scripts/html-kit/gen-rust.ts"`, append `&& pnpm html-kit:generate` to `regen`.
- Create: `scripts/checks/html-kit-assets.test.ts`

- [ ] Step 1: test regenerates into a temp dir and asserts equality with committed `crates/cascivo-html/assets/**` and `src/*_gen.rs`.
- [ ] Step 2: `pnpm regen && pnpm ready` → green. Step 3: commit `chore(html-kit): wire into regen with drift check`.

---

## S2 — `.cv` parser (Rust)

### Task S2.1: workspace + catalog types

**Files:**
- Create: `Cargo.toml` (workspace, members `crates/*`, `resolver = "3"`, `[workspace.package] edition = "2024", rust-version = "1.85"`), `rust-toolchain.toml` (`1.97`), `crates/cascivo-html/Cargo.toml`, `src/lib.rs`, `src/catalog.rs`, stub `src/catalog_gen.rs` (3 entries: `card`, `button`, `bar`; replaced by S1 output on merge), `.gitignore` += `target/`.

**Interfaces (`src/catalog.rs`):**
```rust
pub struct CompSpec { pub name: &'static str, pub component: &'static str, pub aliases: &'static [&'static str],
  pub args: &'static [ArgSpec], pub props: &'static [PropSpec], pub children: Children,
  pub client_js: ClientJs, pub css: &'static [&'static str], pub summary: &'static str }
pub struct ArgSpec { pub name: &'static str, pub kind: ArgKind, pub required: bool }
pub enum ArgKind { Str, Num, Pairs, Nums, Rows }
pub struct PropSpec { pub name: &'static str, pub kind: PropKind, pub default: Option<&'static str>, pub summary: &'static str }
pub enum PropKind { Str, Num, Bool, Enum(&'static [&'static str]) }
pub enum Children { None, Text, Nodes }
pub enum ClientJs { None, Enhancement, Required }
pub fn lookup(name: &str) -> Option<&'static CompSpec>;   // name or alias, exact
pub fn suggest(name: &str) -> Option<&'static str>;        // Levenshtein ≤ 2, ties → alphabetical
```
- [ ] Steps: test `lookup("cols")` resolves to columns (once S1 lands; stub test uses `card`), `suggest("crad") == Some("card")`; implement; `cargo test -p cascivo-html` PASS; commit `feat(cascivo-html): workspace and catalog types`.

### Task S2.2: lexer + AST + parser + diagnostics

**Files:** `src/diag.rs`, `src/ast.rs`, `src/lex.rs`, `src/parse.rs`; tests `tests/parse.rs`, golden diagnostics `tests/diag/*.cv` + `*.txt`.

**Interfaces:**
```rust
pub struct Diagnostic { pub line: u32, pub col: u32, pub msg: String }   // Display: "line:col: msg"
pub struct Doc { pub directives: Vec<Directive>, pub nodes: Vec<Node> }
pub enum Directive { Brand(Vec<BrandItem>), BrandFile(String), Title(String), Lang(String) }
pub struct BrandItem { pub key: String, pub value: Option<String> }    // "#5b5bd6" → key "#5b5bd6", "font=Inter" → key font
pub struct Node { pub spec: &'static CompSpec, pub args: Vec<Value>, pub props: Vec<(&'static str, Value)>,
  pub text: Option<String>, pub children: Vec<Node>, pub line: u32 }
pub enum Value { Str(String), Num(f64), Bool(bool), Pairs(Vec<(String, f64)>), Nums(Vec<f64>), Rows(Vec<Vec<String>>) }
pub fn parse(src: &str) -> Result<Doc, Vec<Diagnostic>>;
```
Rules (from spec): node line = `[Nx ]name args… key=value… flags… ["text"]`; 2-space indent; `#` comment lines; `"…"` strings with `\"` and `\\` escapes; a bare word equal to an enum value of exactly one enum prop sets that prop (`button Save primary`), equal to a bool prop name sets it true, otherwise error `unknown flag 'x' for button; expected one of: …`; ambiguous enum value → error naming both props. Alias defaults applied (`row` → `direction=horizontal`, `h2` → `level=2`). Arg kinds: `Pairs` = one or more `label:num` tokens; `Nums` = one or more numbers; `Rows` = rest of line split on ` | ` then `,`. Props props sorted by catalog order (determinism). Collect all diagnostics, don't stop at first.

- [ ] Step 1: tests — the spec example parses to 1 directive + `columns` with 2 `card` children; `3x card "A"` → 3 nodes; `table Name,Age | Ann,31` → Rows `[["Name","Age"],["Ann","31"]]`; `bar Q1:12 Q2:18` → Pairs; `line 3 5 8` → Nums; `card "<b>"` keeps raw text (escaping is the emitter's job); golden diagnostics: tab indent, 3-space indent, unknown component with suggestion (`crad` → `did you mean 'card'?`), unknown prop, bad enum value lists allowed values, missing required arg shows signature (`expected: stat <label> <value> [delta]`), unterminated string, children under a `Children::None` component; empty input → `Doc` with no nodes; a 10k-line random-bytes fuzz-ish test (fixed seed LCG) never panics.
- [ ] Step 2: `cargo test -p cascivo-html` → FAIL. Step 3: implement. Step 4: → PASS, `cargo clippy --all-targets -- -D warnings` clean.
- [ ] Step 5: commit `feat(cascivo-html): .cv parser with diagnostics`.

---

## S3 — HTML emitters (Rust + TS conformance)

### Task S3.1: document + render core

**Files:** `src/render.rs`, `src/html.rs` (escape, attr writer), `src/emit/mod.rs`; tests `tests/render.rs`.

**Interfaces:**
```rust
pub struct Options { pub brand: Option<Brand>, pub brand_resolver: Option<&'static dyn Fn(&str) -> Result<String, String>>, pub minify_html: bool }
pub struct Cx { next_id: u32, pub used: BTreeSet<&'static str>, pub scripts: BTreeSet<&'static str> }
impl Cx { pub fn id(&mut self) -> String }   // "cv-1", "cv-2", …
pub fn emit(node: &Node, cx: &mut Cx, out: &mut String);   // dispatch on node.spec.name
pub fn render(src: &str, opts: &Options) -> Result<String, Vec<Diagnostic>>;
```
Document: `<!doctype html><html lang=… data-theme=…><head><meta charset=utf-8><meta name=viewport …><title>…</title><style>BASE_CSS + theme + brand + used component CSS in sorted order</style></head><body>…</body>[<script>…</script>]</html>`.
- [ ] Tests: escape of `<>&"'` in text and attributes; empty doc valid; render twice equal; output CSS contains only used components' CSS (render `card` → no `cv-button-` in output). Implement; commit.

### Task S3.2–S3.5: emitters by group (one task each: layout, display, feedback, nav+table)

**Files per task:** `src/emit/<group>.rs`; Rust snapshot fixtures `crates/cascivo-html/tests/conformance/<cv>.cv` → `<cv>.html` (body fragment); React cases `scripts/html-kit/conformance/<cv>.case.tsx` exporting the equivalent element; TS test `scripts/html-kit/conformance.test.ts`.

- [ ] Each emitter reproduces the component TSX's DOM: same elements, `data-*` attributes, inline `--_*` custom properties, ARIA, with `cv-<component>-<local>` classes.
- [ ] Conformance test: `renderToStaticMarkup(case)` with vitest `css.modules.classNameStrategy: 'non-scoped'`, then normalize both sides (strip `cv-<c>-` class prefix, sort attributes, collapse whitespace, replace `useId` ids and `cv-N` with placeholders) and require equality.
- [ ] Tabs: radio inputs + labels + panels, CSS-only via `:has()`; added CSS snippet lives in `crates/cascivo-html/assets/extra/tabs.css` (inside `@layer cascivo.component`). Accordion/collapsible: `<details>/<summary>`.
- [ ] Table: `table [sort] <rows>`; `sort` adds `data-sortable` and the inline sort script (`assets/extra/table-sort.js`, < 1 KB, no globals except one IIFE).
- [ ] Commit per group: `feat(cascivo-html): <group> emitters`.

---

## S4 — Charts + brand (Rust)

### Task S4.1: brand

**Files:** `src/brand.rs`, `tests/brand.rs`.
**Interfaces:** `pub struct Brand { … }`, `pub fn parse_brand(items: &[BrandItem]) -> Result<Brand, Vec<Diagnostic>>`, `pub fn brand_css(b: &Brand) -> String`. Keys from spec: `<hex>`, `accent=<hex>`, `theme=<name>`, `light|dark|auto`, `r<n>`, `gap<n>`, `density=compact|normal|comfy`, `font=`, `mono=`. Hex → oklch (sRGB → linear → OKLab → OKLCH, 3 decimals), then the lightness/chroma table from `packages/theme-kit/src/css.ts` for accent, hover, active, subtle, muted, foreground.
- [ ] Tests: values equal `configToCSS` output for 3 fixtures (generated once by a TS test into `tests/brand/*.css`); `r8` → `--cascivo-radius-base: 8px`; `@brand-file` with default options → diagnostic `brand files need a resolver`; unknown key → did-you-mean. Commit.

### Task S4.2: SVG charts

**Files:** `src/emit/chart/{scale.rs,bar.rs,line.rs,area.rs,pie.rs,scatter.rs,spark.rs,gauge.rs}`, tests `tests/charts.rs`.
- [ ] Data: single series `bar Q1:12 Q2:18`; multi series `bar Q1,Q2,Q3 | Rev 12,18,9 | Cost 8,9,7` (first row = x labels, each next row = name + values). Options: bar `horizontal`, `stacked`; pie `donut`; line/area `smooth`; all `legend`, `h=<px>`.
- [ ] Port scales/nice ticks/curves from `packages/charts/src/engine/`; numbers formatted by one `fmt_num(f64) -> String` (2 decimals, trailing zeros trimmed, `-0` → `0`).
- [ ] Fixed `viewBox`, `preserveAspectRatio`, width 100%; colors via `var(--cascivo-chart-N)`; `<title>` + `role="img"` + `aria-label`; axis labels `<text>`.
- [ ] Tests: Review Focus #4 cases; snapshot per chart; conformance vs React SSR (fixed `width`/`height`) on element structure + classes with numeric tolerance 0.01. Commit.

---

## S5 — CLI, agent guide, skill, CI

### Task S5.1: GUIDE

**Files:** `scripts/html-kit/gen-rust.ts` (also emits `src/guide_gen.rs`), `src/guide.rs`.
**Interfaces:** `pub const GUIDE: &str`; `pub fn guide_for(name: &str) -> Option<String>`.
- [ ] GUIDE = syntax rules, brand keys, one line per component `name <args> [flags] – summary`, 3 examples (dashboard, landing, report). `guide_for` = all props with enums/defaults + one example.
- [ ] Tests: `GUIDE.len() <= 6000`; every catalog entry appears; each example in GUIDE renders without diagnostics. Commit.

### Task S5.2: CLI

**Files:** `crates/cascivo-html-cli/{Cargo.toml,src/main.rs}`, `tests/cli.rs`.
- [ ] `cascivo-html render [in.cv|-] [-o out.html] [--brand brand.cv]`, `check [in.cv|-]` (exit 1 + diagnostics on stderr), `guide [name]`, `--help`, `--version`. Hand-rolled args. CLI resolver reads brand files relative to the input file's directory only.
- [ ] Tests: stdin→stdout round trip; exit codes; `--brand` applied. Commit.

### Task S5.3: skill, examples, CI, docs

**Files:** `skills/cascivo-html/SKILL.md`, `crates/cascivo-html/examples/*.cv` (+ rendered `.html` snapshots), `crates/cascivo-html/README.md`, `.github/workflows/rust.yml` (fmt, clippy, test, determinism), `docs/internal/CONTRIBUTOR-REFERENCE.md` gate entry.
- [ ] SKILL.md tells agents: run `cascivo-html guide`, write `.cv`, run `check`, then `render`. Commit; `pnpm ready` + `cargo test --workspace` green.
