# v46 — Editor Parity: Closing the Gap-Analysis Findings — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the **Cascivo Editor — Gap Analysis (2026-06-23)** feedback and close every architecturally
tractable finding **inside** `@cascivo/editor`'s textarea-overlay model — owned, zero-dependency, signal-driven.
Add owned **undo/redo history**, **selection-preserving echo-safe external sync**, **find & replace**, a
**keymap dispatch** with a **`Mod-S` save** hook and a documented **extension seam** (keymap + decorations),
**per-instance theming with live switching**, **active-line gutter + bracket matching**, and **harden the
Markdown grammar** for a notes surface. Validate the items already shipped since the analysis snapshot
(Markdown grammar, line windowing, soft wrap, current-line marker). **Do not** build full-engine features
(LSP, multi-cursor, folding, minimap, vim) — they stay the documented `whenNotToUse` boundary. The companion
study (`docs/ROADMAP-V46.md`) verifies each finding against the current code and records the decisions.

Target state (verified after T6):

| Finding (severity)                                   | Today                                  | Target                                                                 |
| ---------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Markdown (🔴)                                         | grammar exists                         | hardened for notes (headings/emphasis/code/links/lists/tasks/quotes) + tests |
| Find / search (🔴)                                    | none                                   | overlay find & replace, match highlight, `Mod-F`, undoable replace      |
| Undo/redo (🔴)                                        | native only, dies on programmatic set  | owned signal history (text + selection), survives external writes       |
| Selection-preserving echo-safe sync (🔴)              | caret jumps, echo risk                 | diff + selection rebase + `isApplyingExternal` guard + `applyEdit` handle |
| `Mod-S` save (🟠)                                     | none                                   | `onSave` bound to `Mod-S`, browser dialog suppressed                    |
| Per-instance theming + dynamic switch (🟠)            | global tokens only                     | `theme` prop → scoped `--cascivo-editor-*` overrides, live swap (Zen)    |
| Large-doc performance (🟠)                            | windowing ≥1000 + rAF                  | validated (large-doc test); wrap-mode hole closed/documented            |
| Active-line gutter + bracket matching (🟠)            | row marker only                        | active-line gutter highlight + bracket-match decoration (opt-in)        |
| Line-wrapping control (🟡)                            | `wrap` prop exists                     | validated                                                              |
| Extensibility headroom (🟡)                           | grammars only                          | documented decoration + keymap extension seam                          |
| Full CI gate (`pnpm ready`)                          | green                                  | green                                                                  |

**Architecture & evidence (reproduced in-repo before planning):**

- **Editor surface:** `packages/editor/src/editor/code-editor/code-editor.tsx` — a `<textarea>` over a
  highlighted `<pre>`. State via `useControllableSignal` (`value`/`defaultValue`/`onValueChange`). A single
  inline `handleKeyDown` does `Tab`/`Shift-Tab` indent via `setRangeText` and forwards `onKeyDown`. Highlight is
  rAF-debounced (`highlightText` signal). Line **windowing** (`VIRTUALIZE_THRESHOLD = 1000`, `OVERSCAN = 12`)
  renders only the visible slice for big docs; disabled when `wrap` makes rows variable-height. A current-line
  **background** marker is positioned imperatively via `--cascivo-editor-caret-line` (set in a `useSignalEffect`
  scroll/caret listener). **No keymap system, no history, no find, no per-instance theme, no bracket match.**
- **View layer:** `packages/editor/src/editor/view.tsx` — `renderRows(lines, start, end)` maps tokenized lines to
  `<span>`s (absolute-index keys, windowing-safe); `Gutter` numbers `start+1…end` with spacers. **This is where
  decorations (search matches, bracket pair) attach** — extend `renderRows` to accept offset ranges → class.
- **Engine:** `engine/{types,tokenize,registry,memo}.ts`. `tokenizeDocument(grammar, text)` is per-line memoized
  and carries `GrammarState` across lines (fenced blocks already work). `registerGrammar`/`getGrammar`/
  `listGrammars` are the public language seam. Grammars: `plaintext, json, javascript, typescript, css, html,
  markdown, bash` (the analysis predates `markdown`/`html`/`json`).
- **Read-only twin:** `Highlight` (`editor/highlight/highlight.tsx`) shares the engine + view; it is the
  analysis' recommended "Markdown code-block preview" surface and is already shipped — leave it intact.
- **Integration surfaces:** docs `apps/docs/src/pages/EditorPage.tsx`; `registry.json` entry `editor/code-editor`
  (line ~19237); i18n `builtin.editor` in `packages/i18n/src/builtin.ts` (`label`, `code`, + `de` catalog);
  `code-editor.meta.ts` (props/tokens/intent). CSS tokens live in `code-editor.module.css`
  (`--cascivo-editor-bg/fg/gutter-*/current-line/selection/border` + `--cascivo-editor-syntax-*`).
- **CLAUDE.md constraints:** signals only (no `useState`/`useEffect`/`useContext`/`useReducer`); `useSignalEffect`
  for DOM side effects; `useRef` only for DOM/handle; React apps call `useSignals()` first; i18n built-ins, no
  hardcoded English; ≥44px coarse targets; reduced-motion + forced-colors safe; static fallback before any
  progressive CSS; no off-scale breakpoint literals.

**Tech Stack:** owned TypeScript in `@cascivo/editor` (no new runtime deps); `@cascivo/core` signals/`cn`;
`@cascivo/i18n` for strings; the existing tokenizer + `renderRows`/`Gutter` view; `forwardRef` for the
imperative handle; Vitest + Testing Library for tests; vite+ (`vp`) for check/build/test; `pnpm regen` + drift
gate for generated artifacts (registry/llms/README).

---

## Tranche Overview

| Tranche | Title                                                  | Goal                                                                                                                                  |
| ------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Keymap dispatch + owned undo/redo history              | Generalize `handleKeyDown` into a chord→command dispatch; add an owned signal history (text + selection) that survives programmatic `value` writes; `Mod-Z`/`Mod-Shift-Z`. Foundation for save, find, redo. |
| T2      | Transactional, selection-preserving controlled sync    | Diff + selection-rebase external `value` updates (no caret jump), `isApplyingExternal` echo guard, and a `forwardRef` `CodeEditorHandle` (`applyEdit`/`getSelection`/`focus`/`undo`/`redo`). |
| T3      | In-document find & replace                             | Signal-driven overlay panel (find/next/prev/replace/replace-all/`Esc`), match highlight via the decoration seam, `Mod-F`; i18n + a11y + mobile. |
| T4      | Save keybinding + extensibility seam                   | `onSave` on `Mod-S` (suppress browser dialog); public `keymap` + `decorations` props (the seam search/brackets use); documented. |
| T5      | Per-instance theming + active-line gutter + brackets   | `theme` prop → scoped `--cascivo-editor-*` overrides with live switch (Zen mode); active-line **gutter** highlight; `bracketMatching` decoration. |
| T6      | Markdown hardening, perf/wrap validation, docs & gate  | Harden `markdown.ts` (+ tests); validate windowing/wrap (large-doc test, close/document the wrap hole); update EditorPage/meta/registry/i18n/README/CHANGELOG/roadmap; `pnpm regen` + full gate + grep sweep. |
| T7      | Try-it-out variants in docs + storybook                | Comprehensive interactive showcase of every v46 capability across `EditorPage` (docs) and `Editor/CodeEditor` (Storybook): per-feature + interactive stories (find/save/undo/theme-switch/brackets/handle/decorations/keymap/large-doc/markdown) + argTypes for new props. |

Ordering rationale: **T1** builds the two foundations everything else needs — a keymap to hang commands on, and
a history that owns edits (search-replace and the imperative handle must record undoable edits). **T2** makes
external/controlled updates safe and adds the imperative handle (depends on history). **T3** (find) consumes the
keymap + decoration approach and the history-aware edit path. **T4** formalizes the public keymap + decoration
seam and adds save (search proved the seam; now expose it). **T5** adds theming + the decoration-based brackets
+ the gutter active-line (consumes T4's seam). **T6** hardens Markdown, validates perf/wrap, and lands all
docs/registry/i18n/regen + the full gate. T3→T4→T5 share the decoration seam and are sequenced for one reviewer;
T6 finalizes. **T7** depends on the full public surface (T1–T6) and makes every capability tryable across the
docs page and Storybook in many variants — T6 wires the minimal demos for the gate; T7 is the comprehensive
interactive showcase reviewers and users poke without writing code.

---

## Files Created / Modified per Tranche

### T1 — Keymap dispatch + owned undo/redo history

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/keymap.ts` (chord parse + command map types)          |
| Create | `packages/editor/src/editor/code-editor/history.ts` (owned signal history: snapshot/coalesce/undo/redo) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (dispatch via keymap; Tab→command; record/restore history) |
| Create | `packages/editor/src/editor/code-editor/history.test.tsx`, `keymap.test.tsx`                   |
| Modify | `packages/editor/src/editor/code-editor/code-editor.test.tsx` (undo/redo + programmatic-set regression) |

### T2 — Transactional, selection-preserving controlled sync

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/sync.ts` (prefix/suffix diff + selection rebase)       |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (`forwardRef` handle, external-update path, echo guard) |
| Modify | `packages/editor/src/index.ts` (export `CodeEditorHandle` type)                               |
| Create | `packages/editor/src/editor/code-editor/sync.test.tsx`                                          |
| Modify | `packages/editor/src/editor/code-editor/code-editor.test.tsx` (caret-preserve + no-echo tests) |

### T3 — In-document find & replace

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/find-panel.tsx` + `find-panel.module.css`              |
| Create | `packages/editor/src/editor/code-editor/find.ts` (match scan → offset ranges; replace helpers) |
| Modify | `packages/editor/src/editor/view.tsx` (`renderRows` accepts decoration ranges → class)         |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (find signal state, `Mod-F`, wire matches as decorations) |
| Modify | `packages/i18n/src/builtin.ts` (`builtin.editor` find/replace strings + `de`)                  |
| Create | `packages/editor/src/editor/code-editor/find.test.tsx`                                          |

### T4 — Save keybinding + extensibility seam

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (`onSave`/`Mod-S`; public `keymap` + `decorations` props merged in) |
| Modify | `packages/editor/src/editor/code-editor/keymap.ts` (merge public keymap over built-ins; export `Command`/`KeyBinding` types) |
| Modify | `packages/editor/src/index.ts` (export keymap + decoration types)                              |
| Modify | `packages/editor/src/editor/code-editor/code-editor.test.tsx` (save, custom keymap, decoration-provider tests) |
| Modify | `packages/editor/readme.body.md` (extension seam docs — provisional, finalized T6)             |

### T5 — Per-instance theming + active-line gutter + brackets

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/brackets.ts` (matching-bracket offset finder)          |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (`theme`/`themeName`, `bracketMatching`, active-line gutter) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.module.css` (active-line gutter style; bracket-match class) |
| Modify | `packages/editor/src/index.ts` (export `EditorTheme` type)                                     |
| Create | `packages/editor/src/editor/code-editor/theme.test.tsx`, `brackets.test.tsx`                    |

### T6 — Markdown hardening, perf/wrap validation, docs & gate

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/grammars/markdown.ts` (headings/emphasis/code/links/lists/tasks/quotes/HR/strike) |
| Modify | `packages/editor/src/grammars/grammars.test.ts` (markdown cases)                               |
| Modify | `apps/docs/src/pages/EditorPage.tsx` (find/save/theme/brackets demos)                          |
| Modify | `packages/editor/src/editor/code-editor/code-editor.meta.ts` (new props/tokens/keyboard/intent) |
| Modify | `registry.json` (editor entry props/description — via `pnpm regen` where generated)            |
| Modify | `packages/i18n/src/builtin.ts` (finalize editor strings + `de`)                                |
| Modify | `packages/editor/readme.body.md` (→ `README.md`), `CHANGELOG.md`, `package.json` `VERSION`/version, `docs/ROADMAP-V46.md` status |
| Verify | `pnpm regen`; drift gate; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`); grep sweep |

### T7 — Try-it-out variants in docs + storybook

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `apps/storybook/stories/editor/code-editor.stories.tsx` (new `argTypes` + per-feature stories) |
| Create | `apps/storybook/stories/editor/code-editor-playground.stories.tsx` (interactive: theme-switch/handle/decorations/keymap/controlled-sync — or fold into the file above) |
| Modify | `apps/docs/src/pages/EditorPage.tsx` (Search, Save, live theme-switch, brackets/active-line, Markdown-notes sections) |
| Verify | `apps/storybook/.storybook/main.ts` + `apps/docs/vite.config.ts` editor source alias; both apps build without a prior full build |

---

## Key Decisions

### Decision 1 — Stay in the textarea-overlay model; no engine adoption (firm)

The analysis' own recommendation was "keep CodeMirror." v46 instead closes the **tractable** gaps **inside** the
overlay model: the `<textarea>` stays the editing surface (caret/IME/selection/a11y are the browser's), and we
add owned history/sync/search/keymap/theming/decorations around it. **Decision: no CodeMirror, no
`contenteditable`, no virtual document, zero new runtime deps.** Full-engine features (LSP, multi-cursor,
folding, minimap, vim) are explicitly out of scope and remain the meta `whenNotToUse` boundary. Rejected:
swapping in an engine (defeats the package's reason to exist — tiny, owned, token-themed).

### Decision 2 — Owned history layered over native undo (firm)

The blocker is not typing-undo (native handles it) but that **programmatic `value` writes wipe the native stack
and jump the caret**. **Decision: an owned signal ring buffer of `{ text, selectionStart, selectionEnd }`,
coalesced on idle/word boundaries; `Mod-Z`/`Mod-Shift-Z` intercept native undo so there is one source of truth;
external writes push a snapshot instead of destroying history.** Rejected: relying on native undo (the exact
thing that breaks) and a full transaction log (engine territory).

### Decision 3 — External updates: diff + selection rebase + echo guard (firm)

A plain `value` replace sends the caret to the end and can echo-loop with `onValueChange`. **Decision: when the
controlled `value` differs from our last emitted value, compute a minimal prefix/suffix diff, rebase the
caret/selection offsets across it, and apply through the textarea under an `isApplyingExternal` guard so our own
change handler does not re-emit.** This internalizes the app's `syncDocPreservingSelection` +
`isUpdatingFromStore` pattern. Rejected: naive `value=` (caret jump), and forcing callers to always use the
imperative API (controlled usage must just work).

### Decision 4 — A tiny keymap dispatch is the spine (firm)

**Decision: replace the inline Tab handler with `Map<chord, command>` resolved in `onKeyDown`.** Built-ins:
Tab/Shift-Tab indent, `Mod-Z` undo, `Mod-Shift-Z`/`Mod-Y` redo, `Mod-F` find, `Mod-S` save. A public `keymap`
prop merges over built-ins. This single seam makes save (#5) and extensibility (#10) fall out and keeps each
command a small pure-ish function. `Mod` = `Cmd` on macOS, `Ctrl` elsewhere (detect via `event.metaKey`/
`ctrlKey`). Rejected: more inline `if`s (unmaintainable), an external keybinding library (dep).

### Decision 5 — Decorations are offset ranges → CSS class, attached in `renderRows` (firm)

Search matches, the bracket pair, and any future highlight are all the same shape: **offset ranges mapped to a
CSS class, rendered as extra spans in the existing highlight layer.** **Decision: extend `renderRows` to accept
a per-line decoration list and split token spans at decoration boundaries; expose a public `decorations`
provider prop.** This is windowing-safe (renderRows already slices) and `aria-hidden` (visual only). Rejected: a
separate absolutely-positioned overlay (alignment drift under wrap/scroll) and DOM ranges (fragile).

### Decision 6 — Per-instance theme = scoped custom-property overrides, signal-reactive (recommended)

**Decision: a `theme` prop of `Partial<Record<EditorCustomProp, string>>` spread onto the root's inline style;
because the root is signal-rendered, replacing the object (or a `themeName`) re-themes live** — the Zen-mode
Compartment behavior without Compartment machinery. Global `data-theme` remains the default and still works; the
prop only overrides the `--cascivo-editor-*` layer. Rejected: a CodeMirror-style theme/extension object (engine
concept) and per-editor `<style>` injection (heavier, SSR-awkward).

### Decision 7 — Active-line gutter is CSS-first; brackets are a small offset finder (recommended)

The caret line is already a tracked custom property. **Decision: style the active gutter line off
`--cascivo-editor-caret-line` (no new JS); bracket matching is a small function that finds the partner of the
bracket adjacent to the caret and emits two decoration ranges via Decision 5** — opt-in behind a
`bracketMatching` prop. Rejected: tracking active line in a machine/signal redundantly (CSS already has it) and a
full bracket-scope analysis (engine territory).

### Decision 8 — Harden Markdown, don't gold-plate (recommended)

**Decision: extend `markdown.ts` to the constructs a notes/wiki surface shows — ATX + setext headings, emphasis/
strong, inline + fenced code (embedded-language via the existing cross-line state), links/images, ordered/
unordered + `- [ ]` task lists, blockquotes, HR, `~~strike~~` — with grammar tests for each.** Do **not** pursue
full CommonMark/GFM table/footnote fidelity (diminishing returns for the surface). Rejected: rewriting to a spec
parser (scope creep) and leaving it as-is (the blocker is "good enough for notes," verified by tests).

### Decision 9 — Add a small imperative `CodeEditorHandle` (recommended)

A notes app drives external transactions (remote pull, reset, programmatic insert). **Decision: a `forwardRef`
`CodeEditorHandle` exposing `applyEdit(range, text)`, `getSelection`, `focus`, `undo`, `redo`, `openFind`** —
the clean seam for those, keeping the controlled-prop surface small. Refs are allowed for DOM/handles. Rejected:
piling more controlled props (awkward for imperative actions) and exposing the textarea node directly (leaks
internals, bypasses history).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **Overlay model, zero runtime deps.** The `<textarea>` stays the editing surface; everything added is owned
   code; no CodeMirror/keybinding/diff library; package keeps peer-only deps + `"sideEffects": ["**/*.css"]`.
3. **Signals, not hooks.** No `useState`/`useEffect`/`useContext`/`useReducer`; `useSignalEffect` for DOM side
   effects; `useRef` only for the textarea/handle; `useSignals()` first in every React surface.
4. **Additive & backward-compatible.** New behavior is opt-in (`onSave`, `theme`, `bracketMatching`, `keymap`,
   `decorations`, `ref`); default render byte-identical to today; `Highlight` untouched except the shared
   `renderRows` decoration param (which defaults to none).
5. **i18n, never hardcoded English.** All new user-visible strings via `builtin.editor` (+ `de`), per-instance
   overridable.
6. **Accessibility + responsive (CLAUDE.md).** Find panel is a labelled, keyboard-reachable region (`Esc` closes,
   focus returns); decorations `aria-hidden`; ≥44px coarse targets; reduced-motion + forced-colors safe; no
   off-scale breakpoint literals; static fallback before any progressive CSS; never `display:none` content away.
7. **Generated artifacts in sync.** New strings/props flow through `pnpm regen`; registry/llms/README regenerate;
   drift gate (`pnpm regen && vp check --fix && git diff --exit-code`) green; generated files committed.
8. **Out-of-scope stays out.** LSP, multi-cursor, folding, minimap, vim are not built; the README + meta keep
   pointing at a full engine for those — honesty about the parity boundary is part of the deliverable.
