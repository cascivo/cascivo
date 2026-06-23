# cascivo — Roadmap v44: `@cascivo/editor` — A Lightweight, CSS-Native Code Editor

**Last updated:** 2026-06-23
**Status:** 🟡 Planned (T1–T6). New standalone package **`@cascivo/editor`** — a lightweight, signal-driven
code editor (`CodeEditor`) plus a read-only `Highlight` primitive, built on the **transparent-textarea-overlay**
technique with a **tiny owned tokenizer** (zero runtime dependencies). Line numbers + syntax highlighting +
best-in-class performance for its weight class, themeable via tokens, AI-first, fully auto-generated into docs,
stories, registry, and MCP.
**Plan documents:** `docs/superpowers/plans/2026-06-23-v44-master-plan.md` + tranches 1–6
**Builds on:** the standalone-package convention proven by **`@cascivo/charts`** (own `package.json`/`vite.config.ts`,
`./styles.css` export, `src/<group>/<name>/<name>.{tsx,meta.ts,test.tsx}` layout scanned by
`scripts/registry/generate.ts`), the `@cascivo/core` signal/FSM primitives (`useSignal`, `useComputed`,
`useSignalEffect`, `useControllableSignal`, `useSignals`, `useRef`, `cn`), the three-level token system
(`@cascivo/tokens` → `@cascivo/themes` light/dark/warm), the `@cascivo/i18n` built-in catalog, and the
per-component **`component.meta.ts`** manifest pipeline that already feeds `registry.json`, the MCP server,
`llms.txt`, and the auto-docs.

---

## Why this roadmap exists

The brief: **add a new package for using an editor.** Study **CodeMirror** and **Monaco**, then ship a
**lightweight** editor that nevertheless delivers the essentials — **line numbers** and **syntax highlighting** —
with **best-in-class performance**, follows cascivo's principles (**HTML + CSS first, JS only when genuinely
needed**), integrates perfectly with the UI library (themes, tokens), ships **auto-generated** stories + docs,
**does not** try to match the full feature surface of the big editors, but **does** cover the basic set, and is
**easy to use** and **AI-first**.

### What the study found (CodeMirror vs Monaco)

| Dimension      | **Monaco** (the VS Code editor)                                   | **CodeMirror 6**                                                    |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Bundle         | **~2–10 MB** uncompressed (~2–5 MB gzipped); 1–3 s to interactive  | **~50 KB** basic → ~300 KB full; tree-shakeable                      |
| Editing model  | Custom view engine over a model; web-worker tokenizers            | Custom view engine; transactional state; DOM-managed                |
| Highlighting   | Monarch grammars / TextMate; worker-driven                        | **Lezer** — streaming **incremental** parser, reparses only changes |
| Feature set    | Full IDE: IntelliSense/LSP, multi-cursor, folding, minimap, diff   | Modular: add only the extensions you import                         |
| DX             | Heavy; AMD/worker setup; hard to theme to a design system          | Lightweight core; composable extensions; CSS-theme-friendly         |
| Fit for cascivo | ✗ Too heavy, owns its own DOM/worker stack, не CSS-native          | △ Closer, but still a parser/extension framework + its own DOM      |

**Honest headline:** both are **editor frameworks** that own their own DOM, view virtualization, and (Monaco)
web workers. They are the right tool when you need an **IDE in the browser**. They are the **wrong** tool for a
**CSS-native, signal-driven, copy-or-import design-system** editor whose job is "a beautiful, themeable
`<textarea>` that shows line numbers and syntax colors and stays fast." cascivo does not need a Lezer-class
incremental parser or a Monaco-class worker model to deliver the **basic set**.

### The technique cascivo adopts instead

The **transparent-textarea-overlay** pattern (proven by `react-simple-code-editor`, `vue-prism-editor`, and the
CSS-Tricks/DEV write-ups): a real, native **`<textarea>`** sits transparently on top of a syntax-highlighted
**`<pre><code>`** that mirrors its text. The user edits the textarea natively; a tiny tokenizer re-highlights the
`<pre>` underneath.

Why this is the cascivo-correct choice:

- **HTML + CSS first.** The editing surface is a native `<textarea>`. The browser provides the caret, selection,
  IME/composition, mobile keyboards, native undo/redo, spellcheck control, copy/paste, and the full a11y tree —
  **for free**, with **zero JS**. JS is used **only** for what HTML cannot do: tokenizing text into colored
  spans and syncing scroll. This is exactly "only HTML and CSS, and only JS if really needed."
- **Performance benefits from doing less.** Because the browser owns text editing, there is no custom view
  engine, no virtual DOM diff per keystroke, no worker round-trip. Re-highlighting is **per-line, memoized, and
  rAF-debounced**, so steady-state typing re-tokenizes one line, not the document. The package is a few KB,
  tree-shakeable by language — **best-in-class for its weight class.**
- **Themeable like the rest of cascivo.** The highlight layer is plain `<span class>` colored by CSS custom
  properties, so it inherits `data-theme` and the token system natively — no editor-specific theme API.
- **Zero runtime dependencies.** The tokenizer is **owned source** (a tiny regex/state-machine engine + small
  per-language grammars), not Prism / highlight.js / Lezer. `@cascivo/editor` keeps the zero-runtime-deps posture.

What we **give up** by choosing this technique (and accept, because it is out of scope) is documented in
"Explicitly out of scope" below.

---

## What `@cascivo/editor` ships (the basic set)

| Surface                  | Included                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `CodeEditor`             | Editable, controllable code field: native `<textarea>` overlay + highlighted `<pre>`               |
| `Highlight`              | Read-only highlighted code block (the same engine, no textarea) — for docs/snippets                 |
| Line numbers             | Optional synced gutter (`lineNumbers`), aligned to the text, scroll-locked                          |
| Syntax highlighting      | Tiny owned tokenizer + a small grammar set: `plaintext`, `json`, `javascript`/`typescript`, `css`, `html`, `markdown`, `bash` |
| Editing affordances      | Tab/Shift-Tab indent/dedent, current-line highlight, placeholder, read-only, word-wrap toggle, configurable `tabSize` |
| Theming                  | `--cascivo-editor-*` component tokens + a semantic syntax palette mapped across light/dark/warm      |
| Performance              | Per-line memoized tokenization, rAF-debounced re-highlight, language-tree-shaking, optional large-doc viewport windowing |
| A11y                     | Native textarea semantics, labelled, keyboard-complete (the textarea **is** the a11y surface)        |
| AI-first                 | `component.meta.ts` per export (with `intent`), registry `type: 'editor'`, MCP/`llms.txt`/auto-docs   |
| DX                       | One import, sensible defaults, beautiful out of the box: `<CodeEditor language="ts" />`               |

### Explicitly out of scope (what we deliberately do **not** match)

These are the things that make Monaco/CodeMirror big. cascivo intentionally omits them — the package is a
**lightweight editor**, not an IDE-in-a-box:

- **IntelliSense / autocomplete / LSP / hovers / signature help** — needs a language service; out of scope.
- **Multi-cursor / column selection** — native `<textarea>` has one caret; not emulated.
- **Code folding, minimap, sticky scroll** — IDE chrome; out of scope.
- **Diff / merge view** — separate concern; not in v44.
- **Find & replace UI, bracket matching, auto-close brackets** — deferred (bracket matching is a possible later
  enhancement; not a v44 deliverable).
- **Incremental/streaming parser (Lezer-class)** — the per-line memoized tokenizer covers the basic set; we do
  **not** build an incremental grammar framework.
- **Full 100k-line virtualization as a guarantee** — the overlay is fast for normal documents; large-doc
  **viewport windowing** (render only visible lines in the highlight layer) is included as a performance measure
  in T4, but we do not claim Monaco-scale document handling.

The line is deliberate: **basic set, done excellently**, not a partial clone of the big editors.

---

## What exists today (verified against the codebase)

| Area                        | State                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Editor package              | **None** — no code editor or syntax-highlight surface anywhere in the monorepo                      |
| Standalone-package template | **`@cascivo/charts`** (`packages/charts`) — own `package.json`/`vite.config.ts`, `./styles.css` export, `src/charts/<name>/<name>.{tsx,meta.ts,test.tsx}`, zero deps, built via `vp build` + type-flatten scripts |
| Registry scanning           | `scripts/registry/generate.ts` `ROOTS[]` scans `components`/`layouts`/`blocks`/`charts`/`sections`; `EntryType = 'component' \| 'layout' \| 'block' \| 'chart' \| 'section'` — **no `'editor'`** |
| MCP `list_components`        | `packages/mcp/src/server.ts` `type` enum: `component \| layout \| block \| chart`; category enum: `inputs \| display \| overlay \| navigation \| feedback \| chart` — **no `'editor'` type** |
| Docs pages                  | Standalone packages get a **hand-written** showcase page (`apps/docs/src/pages/ChartsPage.tsx` + route in `App.tsx` + nav) — not auto-routed from registry |
| Stories                     | `apps/storybook/stories/**/*.stories.tsx`, **hand-written** per surface (e.g. `stories/chart/*`)     |
| Vite source aliases         | `core`/`storage`/`i18n`/`ai`/`render`/`icons`/`charts`/`registry` aliased in `apps/docs`, `apps/landing`, `apps/storybook` — **no `editor`** |
| Tokenizer / grammars        | **None** — no highlighting engine exists                                                            |
| Token syntax palette        | `@cascivo/tokens`/`@cascivo/themes` have no `--cascivo-editor-*` or syntax-color tokens               |
| `pnpm regen`                | `registry:generate → schema → catalog → variants → specs → context → parity → tokens → readme:index → readme:generate → llms → sitemap` — picks up any new registry entry automatically once the package is wired |

---

## Target state (after v44)

| Concern                  | Today                          | Target                                                                                  |
| ------------------------ | ------------------------------ | --------------------------------------------------------------------------------------- |
| Packages                 | no editor                      | **`@cascivo/editor`** published package (`CodeEditor` + `Highlight`), `./styles.css`, zero runtime deps |
| Highlighting             | none                           | owned tokenizer + grammar set (`plaintext/json/js/ts/css/html/markdown/bash`), tree-shakeable |
| Tokens                   | no editor tokens               | `--cascivo-editor-*` component tokens + semantic syntax palette across light/dark/warm   |
| Registry / MCP           | no `'editor'` type             | `EntryType`/`ROOTS` gain `'editor'`; MCP `type` enum gains `'editor'`; entries auto-generated |
| Docs / stories           | none                           | hand-written `EditorPage` + route + nav; storybook `stories/editor/*`; vite aliases in 3 apps |
| Performance              | n/a                            | per-line memoized + rAF-debounced highlight; language tree-shaking; large-doc windowing; bench/bundle budget |
| AI-first                 | n/a                            | `meta` with `intent` per export; surfaced in `registry.json`, MCP, `llms.txt`, auto-docs  |

---

## Key open decisions (recommendations in the master plan)

1. **Editing technique — overlay textarea, contenteditable, or a custom view engine?** _Recommendation:
   **transparent-textarea-overlay**._ It is the only option that satisfies "HTML + CSS first, JS only when
   needed": the browser owns editing/caret/IME/undo/a11y; JS only tokenizes + syncs scroll. `contenteditable`
   reintroduces caret/IME/undo bugs and a11y pitfalls; a custom view engine is a Monaco/CodeMirror rebuild
   (rejected by scope).
2. **Tokenizer — vendor a library or own it?** _Recommendation: **own it** (a tiny regex/state-machine engine +
   small grammars), zero runtime deps._ Prism/highlight.js/Lezer are runtime dependencies and bring grammar
   surface we don't need. A per-line, restartable tokenizer is small, themeable, and tree-shakeable by language.
3. **Standalone package or copy-paste component?** _Recommendation: **standalone published package**
   (`@cascivo/editor`), like `@cascivo/charts`._ The editor has an engine + grammars + CSS that are awkward to
   copy-paste per file; an imported package with a `./styles.css` export and source aliases is the right model.
   (It is still owned-friendly — the source is on GitHub — but the install story is `import`, not `add`.)
4. **One component or two?** _Recommendation: **two** — `CodeEditor` (editable) and `Highlight` (read-only)._
   They share the engine; `Highlight` is the read-only renderer (great for docs/snippets) and falls out of the
   editor's render layer for free. No third "diff/viewer" surface in v44.
5. **Which languages ship?** _Recommendation: a **small set** — `plaintext`, `json`, `javascript`/`typescript`,
   `css`, `html`, `markdown`, `bash`._ Each grammar is tiny and tree-shakeable; a `registerGrammar` escape hatch
   lets advanced users add their own without bloating the default bundle.
6. **Line numbers — CSS counters or a JS gutter?** _Recommendation: a **synced gutter column** sized from the
   line count, scroll-locked to the textarea, alignment driven by shared line-height tokens._ Pure-CSS counters
   can't stay aligned with a scrolling, word-wrapping textarea; the gutter is a thin column with `aria-hidden`.
7. **Performance posture — how far?** _Recommendation: **per-line memoized tokenization + rAF-debounced
   re-highlight + language tree-shaking** as the baseline; **viewport windowing** for large docs as a measured
   add-on, not an open-ended virtualization engine._ Define a bundle budget (`audit:bundle`) and a typing-latency
   bench; do **not** chase Monaco-scale document sizes.
8. **Theming — editor-specific theme API or tokens?** _Recommendation: **tokens only**._ A semantic syntax
   palette (`--cascivo-editor-syntax-*`) mapped in light/dark/warm, plus `--cascivo-editor-*` chrome tokens. No
   bespoke theme objects — the editor themes exactly like every other cascivo surface, via `data-theme`.

---

## Cross-cutting rules

1. **HTML + CSS first; JS only when HTML can't.** The editing surface is a native `<textarea>`. JS is limited to
   tokenizing, scroll-sync, and indent/dedent key handling — each justified because no HTML/CSS equivalent
   exists. No custom caret, no custom selection, no contenteditable.
2. **No banned hooks.** Every export obeys CLAUDE.md: no `useState`/`useEffect`/`useContext`/`useReducer`;
   `useSignal`/`useComputed`/`useSignalEffect`/`useControllableSignal` + `useRef` only; `useSignals()` first in
   any component reading a signal during render. Scroll-sync and the rAF highlight loop run in `useSignalEffect`
   with cleanup — never `useEffect`.
3. **Zero runtime dependencies.** The tokenizer and grammars are vendored owned source. `@cascivo/editor` depends
   only on `@cascivo/core` + `@cascivo/i18n` (workspace), peers React + signals — mirroring `@cascivo/charts`.
4. **Themed via tokens, beautiful by default.** `--cascivo-editor-*` chrome + `--cascivo-editor-syntax-*` palette,
   mapped in all three themes; CSS uses tokens only (no literals), logical properties throughout (RTL-safe),
   progressive-enhancement CSS carries static fallbacks (`fallback:check`), reduced-motion-safe, no off-scale
   breakpoint literals (`breakpoint:check`), ≥44px coarse-pointer targets for any interactive chrome.
5. **Performance is a deliverable, not an afterthought.** Per-line memoized tokenization, rAF-debounced
   re-highlight, language tree-shaking, optional large-doc windowing; a bundle budget (`audit:bundle`) and a
   typing-latency/bench check; no unnecessary re-renders (signals).
6. **AI-first + easy to use.** Each export ships a `component.meta.ts` with an `intent` block; the package is
   wired into `registry.json` (new `type: 'editor'`), the MCP `type` enum, `llms.txt`/`context.json`, and the
   auto-docs. The default API is one line: `<CodeEditor language="ts" value={v} onValueChange={set} />`.
7. **Auto-generated artifacts stay in sync.** `pnpm regen` after wiring; drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready` (and
   `pnpm ready:ci` after the new workspace package) green before each commit.
8. **Additive only.** A net-new package; no existing component/package API changes and no behavior change to
   existing call sites.

---

## Definition of Done

### T1 — Package scaffold + highlight engine + grammars

- [ ] `packages/editor/` scaffolded like `@cascivo/charts`: `package.json` (name `@cascivo/editor`,
      `exports["."]`→`./dist/index.js`, `exports["./styles.css"]`→`./dist/editor.css`, `files:["dist"]`, zero
      runtime deps beyond `@cascivo/core`/`@cascivo/i18n`, peers React + signals), `vite.config.ts`
      (`cssFileName:'editor'`, externals, `'use client'` banner), `tsconfig.json`, `src/index.ts`, `setup.ts`,
      `css-modules.d.ts`, `readme.body.md`, `CHANGELOG.md`, the type-flatten scripts.
- [ ] `src/engine/` owns the tokenizer: token types, a per-line, restartable `tokenize(line, startState)` →
      `{ tokens, endState }`, and a grammar registry (`registerGrammar`/`getGrammar`). Pure, deterministic, zero
      deps.
- [ ] `src/grammars/` ships `plaintext`, `json`, `javascript`, `typescript`, `css`, `html`, `markdown`, `bash` —
      each a small grammar, individually importable (tree-shakeable).
- [ ] Engine + grammar unit tests (deterministic input → token spans, incl. multi-line state carry e.g. block
      comments/strings). `pnpm exec vp run @cascivo/editor#test` green.

### T2 — `CodeEditor` + `Highlight`

- [ ] `src/highlight/highlight.tsx` + `.module.css` + `.meta.ts` + `.test.tsx`: read-only highlighted
      `<pre><code>` from `value` + `language`, signal-driven, themeable, a11y (`role`/label), no banned hooks.
- [ ] `src/code-editor/code-editor.tsx` + `.module.css` + `.meta.ts` + `.test.tsx`: native `<textarea>` overlaid
      on the `Highlight` layer; controllable `value` (`useControllableSignal`), `onValueChange`,
      `language`, `lineNumbers`, `readOnly`, `placeholder`, `tabSize`, `wrap`, current-line highlight; Tab/Shift-Tab
      indent/dedent; scroll-sync (textarea→pre→gutter) via `useSignalEffect`; `useSignals()` first; no banned
      hooks.
- [ ] A11y: the `<textarea>` is the labelled editing surface; the highlight layer + gutter are `aria-hidden`;
      keyboard editing is fully native; WCAG AA; reduced-motion-safe; ≥44px coarse targets for any chrome.
- [ ] Both exported from `src/index.ts`; metas include an `intent` block. Tests green.

### T3 — Tokens + theming

- [ ] `@cascivo/tokens` gains `--cascivo-editor-*` chrome tokens (bg, gutter-bg, gutter-fg, fg, current-line,
      selection, border) and a semantic syntax palette
      (`--cascivo-editor-syntax-{keyword,string,number,comment,function,type,operator,punctuation,variable,tag,attr,...}`).
- [ ] `@cascivo/themes` `light.css`/`dark.css`/`warm.css` map the syntax palette + chrome tokens (legible, WCAG
      AA contrast in each theme).
- [ ] Editor CSS consumes tokens only (no literals); logical properties throughout; progressive declarations
      carry static fallbacks (`fallback:check`); reduced-motion-safe; `breakpoint:check` clean. Token catalog
      regenerated (`catalog:generate`).

### T4 — Performance hardening + bench

- [ ] Per-line tokenization memoization (cache keyed by line text + start-state) so steady-state typing
      re-tokenizes only changed lines; rAF-debounced re-highlight; no per-keystroke document re-tokenize; no
      unnecessary re-renders (signals).
- [ ] Optional large-doc **viewport windowing**: render only visible lines (+overscan) in the highlight layer
      while the textarea holds the full text; correctness preserved.
- [ ] A bundle budget entry (`audit:bundle`) for `@cascivo/editor` (core + one grammar tree-shakes small) and a
      deterministic typing-latency/memoization bench; memoization correctness covered by tests.

### T5 — Stories + docs page + app wiring

- [ ] `apps/storybook/stories/editor/*.stories.tsx` (hand-written): `CodeEditor` (languages, line numbers,
      read-only, themes), `Highlight`.
- [ ] `apps/docs/src/pages/EditorPage.tsx` + route in `apps/docs/src/App.tsx` + nav entry — a curated showcase
      (the `ChartsPage` pattern).
- [ ] `'@cascivo/editor'` source alias added to `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts`, and
      `apps/storybook/.storybook/main.ts`; each app builds without a prior full build
      (`vp run @cascivo/docs#build @cascivo/landing#build @cascivo/storybook#build`).

### T6 — AI-first registry/MCP + final gate

- [ ] `scripts/registry/generate.ts`: `EntryType` gains `'editor'`; `ROOTS[]` gains a `packages/editor/src/...`
      root (`type:'editor'`, `prefix:'editor/'`, `install:'@cascivo/editor'`). `packages/mcp/src/server.ts`
      `type` enum gains `'editor'`.
- [ ] `pnpm regen` populates `registry.json` (editor entries), `context.json`, `llms.txt`, specs/parity/readme/
      sitemap; metas carry `intent`; skills/README mention the editor.
- [ ] Full gate green: `pnpm ready` (and `pnpm ready:ci` — new workspace package, cold cache) → `vp check`,
      `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`,
      `audit:bundle`; drift gate clean; grep sweep confirms `@cascivo/editor`/`CodeEditor`/`Highlight` reached
      every registration surface (`src/index.ts`, `registry.json`, MCP enum, vite aliases, docs route, stories).
</content>
</invoke>
