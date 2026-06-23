# v44 — `@cascivo/editor` (Lightweight CSS-Native Code Editor) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new standalone package **`@cascivo/editor`** — a **lightweight** code editor that ships the
**basic set** (line numbers + syntax highlighting) with **best-in-class performance for its weight class**, built
the cascivo way (**HTML + CSS first, JS only when genuinely needed**, signals, owned code, zero runtime deps),
themed via the token system, **easy to use** and **AI-first**, with **auto-generated** stories, docs, registry,
and MCP entries. After studying **CodeMirror 6** (~50 KB–300 KB, Lezer incremental parser, modular extensions)
and **Monaco** (~2–10 MB, full IDE: IntelliSense/LSP, multi-cursor, folding, minimap, workers), the conclusion
(recorded in `docs/ROADMAP-V44.md`) is that both are **editor frameworks that own their own DOM/worker stack** —
the wrong tool for a CSS-native design-system editor. cascivo adopts the **transparent-textarea-overlay**
technique instead: a native `<textarea>` overlaid on a syntax-highlighted `<pre><code>`, so the browser provides
caret/selection/IME/undo/a11y for free and JS is limited to a **tiny owned tokenizer** + scroll-sync. The editor
deliberately does **not** match the big editors' IDE surface (no IntelliSense/LSP, multi-cursor, folding,
minimap, diff, incremental parser) — it does the **basic set excellently**.

Target state (verified after T6):

| Metric                                   | Today                              | Target |
| ---------------------------------------- | ---------------------------------- | ------ |
| Editor package                           | none                               | `@cascivo/editor` (`CodeEditor` + `Highlight`), `./styles.css`, zero runtime deps |
| Highlighting                             | none                               | owned tokenizer + grammars (`plaintext/json/js/ts/css/html/markdown/bash`), tree-shakeable |
| Tokens                                   | no editor tokens                   | `--cascivo-editor-*` chrome + `--cascivo-editor-syntax-*` palette across light/dark/warm |
| Registry / MCP                           | no `'editor'` type                 | `EntryType`/`ROOTS` + MCP `type` enum gain `'editor'`; entries auto-generated |
| Docs / stories                           | none                               | hand-written `EditorPage` + route + nav; `stories/editor/*`; vite aliases in 3 apps |
| Performance                              | n/a                                | per-line memoized + rAF-debounced highlight; language tree-shaking; large-doc windowing; bundle budget |
| Full CI gate (`pnpm ready` / `ready:ci`) | green                              | green |

**Architecture & evidence (reproduced in-repo before planning):**

- **Standalone-package template — `@cascivo/charts`** (`packages/charts`): own `package.json`
  (`"private": false`, `exports["."]`→`./dist/index.js`, `exports["./styles.css"]`→`./dist/charts.css`,
  `files:["dist"]`, `sideEffects:["**/*.css"]`, deps `@cascivo/core`+`@cascivo/i18n`, peers React + signals),
  `vite.config.ts` (lib build, `cssFileName:'charts'`, externals, `'use client'` banner), `tsconfig.json`
  (extends base, `paths` to core/i18n source), `scripts/flatten-types.mjs` + `check-types-flat.mjs`,
  `readme.body.md`, and `src/charts/<name>/<name>.{tsx,meta.ts,test.tsx}`. **`@cascivo/editor` mirrors this
  exactly**, swapping `charts`→`editor` and `src/charts`→`src/editor`.
- **Registry scanning — `scripts/registry/generate.ts`**: `EntryType = 'component' | 'layout' | 'block' |
  'chart' | 'section'`; `ROOTS[]` scans each source dir for `<name>/<name>.meta.ts`. Charts are wired as
  `{ dir: packages/charts/src/charts, type: 'chart', prefix: 'chart/' }` and tagged `install: '@cascivo/charts'`.
  **T6 adds `'editor'` to `EntryType` and a `{ dir: packages/editor/src/editor, type: 'editor', prefix:
  'editor/' }` root** (`install: '@cascivo/editor'`).
- **MCP — `packages/mcp/src/server.ts`** `list_components` `type` enum is `component|layout|block|chart`;
  category enum is `inputs|display|overlay|navigation|feedback|chart`. **T6 adds `'editor'` to the `type` enum**;
  `CodeEditor`'s meta uses `category: 'inputs'` and `Highlight`'s `category: 'display'` (both already valid).
- **Docs — hand-written page**: `apps/docs/src/pages/ChartsPage.tsx` + `Route path="/charts"` in
  `apps/docs/src/App.tsx` + a nav entry; **not** auto-routed from registry. **T5 adds `EditorPage.tsx` +
  `Route path="/editor"` + nav** the same way.
- **Stories — hand-written**: `apps/storybook/.storybook/main.ts` globs `../stories/**/*.stories.tsx`; charts live
  in `stories/chart/*`. **T5 adds `stories/editor/*`.**
- **Vite source aliases**: `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts`,
  `apps/storybook/.storybook/main.ts` each alias `@cascivo/charts` (and core/storage/i18n/ai/render/icons/
  registry) to its `src` entry because those apps build without a prior `pnpm build`. **T5 adds
  `'@cascivo/editor'` to all three** (its `exports["."]` resolves to `./dist/`).
- **Signal/FSM primitives — `@cascivo/core`**: `useSignal`, `useComputed`, `useSignalEffect`,
  `useControllableSignal`, `useSignals`, `useRef`, `cn`. `CodeEditor`'s value is a `useControllableSignal`; the
  scroll-sync + rAF highlight run in `useSignalEffect` (the only DOM side effects), never `useEffect`.
- **Tokens/themes**: three-level system in `@cascivo/tokens` (primitive→semantic→component) mapped per theme in
  `@cascivo/themes`. T3 adds the editor chrome + syntax palette at the semantic/component layers.
- **`pnpm regen`**: `registry:generate → schema → catalog → variants → specs → context → parity → tokens →
  readme:index → readme:generate → llms → sitemap`. Once the package is wired (T6), every artifact picks up the
  editor entries automatically.

**Tech Stack:** signal-driven TSX + CSS Modules; a vendored, zero-dep tokenizer (regex/state-machine engine +
small per-language grammars); native `<textarea>` overlay for editing; `@cascivo/core` signals throughout (no
`useState`/`useEffect`); `@cascivo/i18n` for default strings; vite+ (`vp`) lib build with a `./styles.css`
export; progressive-enhancement CSS with static fallbacks (`fallback:check`); no runtime dependencies.

---

## Tranche Overview

| Tranche | Title                                   | Goal                                                                                                  |
| ------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| T1      | Package scaffold + highlight engine     | Scaffold `@cascivo/editor` like `@cascivo/charts`; build the owned per-line tokenizer + grammar registry + a small grammar set (`plaintext/json/js/ts/css/html/markdown/bash`); engine/grammar unit tests. |
| T2      | `CodeEditor` + `Highlight`              | `Highlight` (read-only highlighted block) + `CodeEditor` (native textarea overlay): controllable value, line numbers, tab/dedent, read-only, placeholder, scroll-sync, current line; signal-driven, a11y; metas + tests. |
| T3      | Tokens + theming                        | `--cascivo-editor-*` chrome tokens + `--cascivo-editor-syntax-*` palette in `@cascivo/tokens`, mapped across light/dark/warm in `@cascivo/themes`; editor CSS tokenized, RTL/logical, fallbacks; catalog regen. |
| T4      | Performance hardening + bench           | Per-line memoized tokenization + rAF-debounced re-highlight; language tree-shaking; optional large-doc viewport windowing; bundle budget + typing-latency/memoization bench + correctness tests. |
| T5      | Stories + docs page + app wiring        | Hand-written `stories/editor/*`; `EditorPage.tsx` + route + nav in `apps/docs`; `@cascivo/editor` source aliases in docs/landing/storybook; each app builds. |
| T6      | AI-first registry/MCP + final gate      | `EntryType`/`ROOTS` + MCP `type` enum gain `'editor'`; `pnpm regen` (registry/context/llms/specs/parity/readme/sitemap); skills/README mention; full `pnpm ready`/`ready:ci` gate + drift + grep sweep. |

Ordering rationale: **T1** stands up the package and the engine (everything downstream needs it). **T2** builds
the two React surfaces on the engine. **T3** themes them (depends on the CSS structure from T2). **T4** hardens
performance (depends on the working editor). **T5** wires the apps (depends on the exports being stable). **T6**
registers the package into the AI/registry surfaces and runs the final gate (depends on everything, and on the
metas existing so `registry:generate` emits `type:'editor'` entries). T1→T2 are strictly sequential; T3 and T4
both depend on T2 and can be sequenced T3→T4 for a single reviewer; T5 depends on T2 (exports) and benefits from
T3 (themed); T6 is last.

---

## Files Created / Modified per Tranche

### T1 — Package scaffold + highlight engine

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/editor/package.json`, `vite.config.ts`, `tsconfig.json`, `readme.body.md`, `CHANGELOG.md` |
| Create | `packages/editor/scripts/flatten-types.mjs`, `scripts/check-types-flat.mjs` (copy charts' pattern) |
| Create | `packages/editor/src/index.ts`, `src/setup.ts`, `src/css-modules.d.ts`                  |
| Create | `packages/editor/src/engine/types.ts`, `tokenize.ts`, `registry.ts`, `tokenize.test.ts` |
| Create | `packages/editor/src/grammars/{plaintext,json,javascript,typescript,css,html,markdown,bash}.ts` + `*.test.ts` |
| Modify | `pnpm-workspace.yaml` (only if packages aren't globbed — verify; charts is already matched by `packages/*`) |

### T2 — `CodeEditor` + `Highlight`

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/highlight/highlight.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Create | `packages/editor/src/editor/code-editor/code-editor.tsx`, `.module.css`, `.meta.ts`, `.test.tsx` |
| Modify | `packages/editor/src/index.ts` (export `CodeEditor`, `Highlight`, public types)         |
| Modify | `packages/i18n/src/builtin.ts` (default editor `aria-label`/placeholder, if surfaced)   |

### T3 — Tokens + theming

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/tokens/src/*` (add `--cascivo-editor-*` chrome + `--cascivo-editor-syntax-*` palette) |
| Modify | `packages/themes/src/light.css`, `dark.css`, `warm.css` (map the editor tokens)         |
| Modify | `packages/editor/src/editor/**/**.module.css` (consume tokens; logical props; fallbacks) |
| Regen  | token catalog (`pnpm catalog:generate` via `pnpm regen`)                                |

### T4 — Performance hardening + bench

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/engine/tokenize.ts` (per-line memo cache, keyed by text+start-state) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (rAF-debounced highlight; optional viewport windowing) |
| Create | `packages/editor/src/engine/memo.test.ts` (memoization correctness)                     |
| Modify | bundle-budget config (`scripts/quality/bundle-check.ts` or its data) for `@cascivo/editor` |
| Create | a deterministic bench (under `packages/bench/*` or `scripts/`), per the existing bench pattern |

### T5 — Stories + docs page + app wiring

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Create | `apps/storybook/stories/editor/code-editor.stories.tsx`, `highlight.stories.tsx`        |
| Create | `apps/docs/src/pages/EditorPage.tsx`                                                     |
| Modify | `apps/docs/src/App.tsx` (add `Route path="/editor"`)                                     |
| Modify | docs nav (the `ChartsPage` nav entry's neighbor — `Layout.tsx`/nav tree)                 |
| Modify | `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts`, `apps/storybook/.storybook/main.ts` (add `@cascivo/editor` alias) |

### T6 — AI-first registry/MCP + final gate

| Action | Path                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Modify | `scripts/registry/generate.ts` (`EntryType` + `ROOTS` gain `'editor'`; `install:'@cascivo/editor'`) |
| Modify | `packages/mcp/src/server.ts` (`type` enum gains `'editor'`)                              |
| Modify | `docs/ROADMAP-V44.md` (status → in progress/done as tranches land)                       |
| Modify | `skills/*` / root README index (mention `@cascivo/editor`), `packages/editor/readme.body.md` |
| Verify | `pnpm regen` (registry/context/llms/specs/parity/readme/sitemap) — drift clean & committed |
| Verify | full gate: `pnpm ready` + `pnpm ready:ci`, `vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`, `audit:bundle`; grep sweep |

---

## Key Decisions

### Decision 1 — Do NOT port Monaco or CodeMirror; adopt the textarea-overlay technique (firm)

Monaco (~2–10 MB) and CodeMirror 6 (~50 KB–300 KB) are **editor frameworks** that own their own DOM view engine,
virtualization, and (Monaco) web-worker tokenizers, to deliver an **IDE in the browser** (IntelliSense/LSP,
multi-cursor, folding, minimap, diff). cascivo needs none of that to ship the **basic set**. **Decision: build a
lightweight editor on the transparent-textarea-overlay technique** — a native `<textarea>` overlaid on a
syntax-highlighted `<pre><code>`. The browser provides caret/selection/IME/composition/mobile-keyboards/undo/
copy-paste/a11y for free; JS is limited to tokenizing + scroll-sync + indent keys. This is the only design that
honors "HTML + CSS first, JS only when genuinely needed," and the reduced JS is precisely **why** it is fast and
tiny. Rejected: porting either library (heavy, owns its own stack, not CSS-native) and `contenteditable`
(reintroduces caret/IME/undo/a11y bugs HTML's `<textarea>` already solves).

### Decision 2 — Own the tokenizer (zero runtime deps), tree-shakeable grammars (recommended)

cascivo has no highlighting engine, and Prism/highlight.js/Lezer are runtime dependencies bringing grammar
surface we don't need. **Decision: vendor a tiny owned tokenizer** — a per-line, **restartable**
`tokenize(line, startState) → { tokens, endState }` engine (so multi-line constructs like block comments/strings
carry state across lines) + a small grammar registry — and a **small grammar set** (`plaintext`, `json`,
`javascript`, `typescript`, `css`, `html`, `markdown`, `bash`), each individually importable so consumers
tree-shake to the languages they use. A `registerGrammar` escape hatch covers custom languages without bloating
the default bundle. Rejected: bundling Prism/highlight.js (runtime dep, larger), and a Lezer-class incremental
parser (out of scope — per-line memoization covers the basic set).

### Decision 3 — A standalone published package, like `@cascivo/charts` (recommended)

The editor is an engine + grammars + CSS, awkward to copy-paste per file and naturally shared across consumers.
**Decision: ship `@cascivo/editor` as a versioned published package** mirroring `@cascivo/charts` exactly
(`exports["."]`→`./dist/index.js`, `exports["./styles.css"]`→`./dist/editor.css`, `files:["dist"]`,
`sideEffects:["**/*.css"]`, deps `@cascivo/core`+`@cascivo/i18n`, peers React + signals, `vite.config.ts` lib
build with `cssFileName:'editor'` + `'use client'` banner, the type-flatten scripts). The install story is
`import { CodeEditor } from '@cascivo/editor'` + `import '@cascivo/editor/styles.css'` — not `npx cascivo add`.
Rejected: a copy-paste `packages/components` entry (engine/grammars/CSS don't copy-paste cleanly) and an
unpublished internal package (the editor is a first-class consumer surface).

### Decision 4 — Two exports: `CodeEditor` (editable) + `Highlight` (read-only) (recommended)

**Decision: ship two surfaces sharing one engine.** `Highlight` renders a read-only, syntax-highlighted
`<pre><code>` from `value`+`language` (great for docs/snippets and the editor's own render layer); `CodeEditor`
overlays a native `<textarea>` on a `Highlight` layer for editing. `Highlight` falls out of the editor's render
layer for free, so there is no duplication. Rejected: a single editable component (loses the cheap read-only
renderer that docs need) and a third diff/viewer surface (out of scope for v44).

### Decision 5 — Ship a small language set + a `registerGrammar` escape hatch (recommended)

**Decision: ship `plaintext`, `json`, `javascript`, `typescript`, `css`, `html`, `markdown`, `bash`.** These
cover the overwhelming majority of design-system editor use (config, snippets, web languages), each grammar is
tiny and tree-shakeable, and `registerGrammar(name, grammar)` lets advanced users add languages without growing
the default bundle. Rejected: a large built-in grammar catalog (bundle bloat, maintenance) and a single
"auto-detect everything" grammar (inaccurate, larger).

### Decision 6 — Line numbers via a synced gutter column, not CSS counters (recommended)

A scrolling, optionally word-wrapping `<textarea>` cannot stay aligned with pure-CSS `counter()` line numbers on
the `<pre>`. **Decision: a thin `aria-hidden` gutter column** sized from the line count, scroll-locked to the
textarea (shared scroll-sync), alignment driven by shared line-height/padding tokens, toggled by `lineNumbers`.
Rejected: CSS counters (misalign on scroll/wrap) and rendering numbers inside the highlight layer (couples
concerns, complicates windowing).

### Decision 7 — Performance: per-line memo + rAF + tree-shaking + bounded windowing (recommended)

**Decision: make performance a deliverable with a defined ceiling.** Baseline: (a) **per-line memoized
tokenization** — cache keyed by line text + start-state, so steady-state typing re-tokenizes only changed lines;
(b) **rAF-debounced re-highlight** so fast typing doesn't re-tokenize per keystroke; (c) **language
tree-shaking** so the bundle is a few KB + one grammar; (d) **signals** so writes don't trigger unnecessary
re-renders. Add-on: **viewport windowing** (render only visible lines + overscan in the highlight layer while the
textarea holds the full text) for large docs. Guardrails: a `audit:bundle` budget for `@cascivo/editor` and a
deterministic typing-latency/memoization bench. Rejected: an open-ended virtualization/incremental-parse engine
(that is rebuilding CodeMirror — out of scope) and "no perf work, it's just a textarea" (fails the best-in-class
requirement on large inputs).

### Decision 8 — Theme via tokens only; no editor-specific theme API (recommended)

**Decision: the editor themes exactly like every other cascivo surface.** Add `--cascivo-editor-*` chrome tokens
(bg, gutter-bg/fg, fg, current-line, selection, border) and a semantic syntax palette
(`--cascivo-editor-syntax-{keyword,string,number,comment,function,type,operator,punctuation,variable,tag,attr,…}`),
mapped in `light.css`/`dark.css`/`warm.css` with WCAG-AA contrast, applied via `data-theme`. The highlight layer
is plain `<span class>` colored by these custom properties. Rejected: a bespoke theme-object API (Monaco/CodeMirror
style — duplicates the token system, breaks `data-theme` scoping).

### Decision 9 — Scope discipline: basic set only (firm)

**Decision: explicitly exclude** IntelliSense/autocomplete/LSP, multi-cursor, code folding, minimap/sticky
scroll, diff/merge view, find-&-replace UI, auto-close/bracket matching, an incremental parser, and Monaco-scale
100k-line guarantees. These are what make the big editors big; cascivo ships the **basic set excellently**.
Recorded in `docs/ROADMAP-V44.md` ("Explicitly out of scope"). Bracket matching is a possible **future**
enhancement, not a v44 deliverable.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit; `pnpm ready:ci` once the new
   workspace package exists (cold cache catches build-ordering bugs).
2. **HTML + CSS first; JS only when HTML can't.** Native `<textarea>` for editing; JS limited to tokenizing,
   scroll-sync, and indent/dedent keys. No custom caret/selection, no `contenteditable`.
3. **No banned hooks.** Every export obeys CLAUDE.md: no `useState`/`useEffect`/`useContext`/`useReducer`;
   `useSignal`/`useComputed`/`useSignalEffect`/`useControllableSignal` + `useRef` only; `useSignals()` first when
   a signal is read during render. Scroll-sync + the rAF highlight loop run in `useSignalEffect` with cleanup,
   SSR/no-DOM guarded — never `useEffect`.
4. **Zero runtime dependencies.** Tokenizer + grammars are vendored owned source; `@cascivo/editor` depends only
   on `@cascivo/core` + `@cascivo/i18n` (workspace), peers React + signals.
5. **Themed via tokens, beautiful by default.** `--cascivo-editor-*` + `--cascivo-editor-syntax-*` mapped in all
   three themes; CSS uses tokens only, logical properties (RTL-safe), static fallbacks before every progressive
   declaration (`fallback:check`), reduced-motion-safe, no off-scale breakpoint literals (`breakpoint:check`),
   ≥44px coarse targets for interactive chrome.
6. **Performance is a deliverable.** Per-line memoized + rAF-debounced highlight; language tree-shaking; bounded
   large-doc windowing; a `audit:bundle` budget + a deterministic bench; no unnecessary re-renders.
7. **AI-first + easy to use.** Each export ships a `component.meta.ts` with an `intent` block; the package is
   wired into `registry.json` (`type:'editor'`), the MCP `type` enum, `llms.txt`/`context.json`, and the
   auto-docs; the default API is one line.
8. **Auto-generated artifacts stay in sync.** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `brand:check` green.
9. **Additive only.** A net-new package; no existing component/package API changes and no behavior change to
   existing call sites.
</content>
