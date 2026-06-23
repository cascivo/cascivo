# cascivo — Roadmap v46: Editor Parity — Closing the Gap-Analysis Findings

**Last updated:** 2026-06-23
**Status:** 📋 Planned (T1–T7).
**Plan documents:** `docs/superpowers/plans/2026-06-23-v46-master-plan.md` + tranches 1–7
**Builds on:** the existing **`@cascivo/editor`** package (`packages/editor/src/editor/code-editor/code-editor.tsx`
— a native `<textarea>` overlaid on a syntax-highlighted `<pre>`; `packages/editor/src/editor/highlight/highlight.tsx`
read-only renderer; the owned tokenizer in `packages/editor/src/engine/*` + grammars in
`packages/editor/src/grammars/*`), the docs `EditorPage` (`apps/docs/src/pages/EditorPage.tsx`), the registry
entry (`registry.json` → `editor/code-editor`), the i18n built-in catalog (`builtin.editor` in
`packages/i18n/src/builtin.ts`), and the `pnpm ready` gate.

> **Version note.** The latest shipped roadmap is **v45**; this document is filed as **v46** — the next
> sequential slot. It addresses the **Cascivo Editor — Gap Analysis (2026-06-23)** feedback in full.

---

## Why this roadmap exists

A gap analysis asked: *what is missing in `@cascivo/editor` so it could replace a CodeMirror-6-based Markdown
notes app?* It enumerated ten findings across three severities (🔴 blockers, 🟠 major, 🟡 minor). This roadmap
takes each finding, **verifies it against the current code** (the analysis was written against an earlier
snapshot and several findings are already addressed), and plans concrete, right-sized work for the gaps that
remain — **inside the editor's existing architecture**, not by adopting a code-editor engine.

### Framing: incorporate the findings, keep the architecture

The analysis correctly notes that `@cascivo/editor` is a **textarea-overlay** editor (the browser owns caret,
selection, IME, native undo, and the a11y tree; JS owns only a small tokenizer + scroll-sync) and that
CodeMirror is a full editor *engine*. The recommendation in the analysis was "keep CodeMirror." This roadmap
takes the **opposite, scoped** mandate the user set — *incorporate every feedback item* — and reads it as:
**close each architecturally tractable gap with an owned, zero-dependency, signal-driven solution that fits the
overlay model.** It does **not** chase full-engine parity (LSP/IntelliSense, multi-cursor, code folding,
minimap, vim mode) — those stay explicitly **out of scope** and remain the documented `whenNotToUse` boundary
in the component meta. The deliverable is an editor that can credibly drive a Markdown notes surface
(search, real history, echo-safe external sync, save/keymaps, themable + dynamic, bracket/active-line
affordances) while staying tiny and owned.

---

## The ten findings, verified against today's code

Legend: ✅ already addressed since the analysis snapshot · ⚠️ partially present · ❌ genuine gap.

| #   | Finding (analysis)                                  | Severity   | Verified state today                                                                                                  | Tranche |
| --- | -------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Markdown language support                          | 🔴 blocker | ✅ **exists** — `grammars/markdown.ts` is registered and exported; `language="markdown"` resolves. **Harden** it for notes use. | T6      |
| 2   | Find / search in document                          | 🔴 blocker | ❌ **gap** — no find/replace UI, no match highlighting, no `Mod-F`.                                                    | T3      |
| 3   | Robust undo/redo history                           | 🔴 blocker | ⚠️ native textarea undo only; **breaks** when `value` is set programmatically (controlled/remote sync). Needs an owned history. | T1      |
| 4   | Transactional sync that preserves selection (echo-safe) | 🔴 blocker | ❌ **gap** — controlled `value` replacement jumps the caret and can echo-loop. Needs a selection-preserving update path. | T2      |
| 5   | `Mod-S` save keybinding                            | 🟠 major   | ❌ **gap** — only a hardcoded `Tab`/`Shift-Tab` handler; no keymap system, no save hook.                              | T4      |
| 6   | Per-instance theming + dynamic switching           | 🟠 major   | ⚠️ themed globally via `data-theme`/tokens; **no per-editor theme object, no live switch** (Zen-mode shape).          | T5      |
| 7   | Large-document performance                         | 🟠 major   | ✅ **windowing exists** — `VIRTUALIZE_THRESHOLD = 1000` + overscan + rAF-debounced highlight. **Validate** + close the wrap-mode hole. | T6      |
| 8   | Active-line & gutter affordances; bracket matching | 🟠 major   | ⚠️ current-line **background** marker exists (`--cascivo-editor-caret-line`); **no active-line gutter highlight, no bracket matching.** | T5      |
| 9   | Line-wrapping control                              | 🟡 minor   | ✅ **exists** — `wrap` prop toggles soft wrap. **Validate** only.                                                     | T6      |
| 10  | Extensibility headroom                             | 🟡 minor   | ⚠️ `registerGrammar` extends *languages* only; no keymap/decoration extension seam.                                  | T4      |

**Net:** of the four 🔴 blockers, **one is already done** (Markdown) and **three are genuine** (search, owned
undo/redo, echo-safe selection-preserving sync). The 🟠/🟡 items are a mix of done (perf windowing, wrap) and
real but smaller (save keymap, per-instance theming, active-line gutter + brackets, extension seam). v46 does
the genuine work and **validates/hardens** the rest so no finding is left unverified.

---

## What exists today (verified against the codebase)

| Area                       | State                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CodeEditor`               | `<textarea>` over a highlighted `<pre>`; controllable `value`/`defaultValue`/`onValueChange` via `useControllableSignal`; `Tab`/`Shift-Tab` indent; rAF-debounced highlight; **line windowing** above 1000 lines (`virtualize` prop); current-line background marker; `wrap`, `lineNumbers`, `tabSize`, `insertSpaces`, `readOnly`, `disabled`, i18n `label`. Signals only — no banned hooks. |
| `Highlight`                | Read-only `<pre><code>` sharing the same tokenizer + `renderRows`/`Gutter` view layer. The analysis' recommended "use Highlight for rendered Markdown code blocks" surface — already shipped. |
| Tokenizer engine           | `engine/{types,tokenize,registry,memo}.ts` — pure, per-line memoized, stateful (carries `GrammarState` across lines for fenced blocks). `registerGrammar`/`getGrammar`/`listGrammars` public. |
| Grammars                   | `plaintext, json, javascript, typescript, css, html, markdown, bash` — all registered + exported. (The analysis predates `markdown`, `html`, `json`.) |
| Keymap                     | **None as a system** — a single inline `handleKeyDown` does Tab/Shift-Tab and forwards `onKeyDown`. No `Mod-*` bindings. |
| History                    | **Browser-native only.** Survives typing; **destroyed** by any programmatic `value` write (the controlled-update path this app needs). |
| Find/replace               | **None.**                                                                                                                                  |
| Per-instance theme         | **None.** Colors come from `--cascivo-editor-*` tokens resolved by the nearest `data-theme`; no `theme` prop, no runtime swap.              |
| Active-line gutter / brackets | Current-line **row** highlight only; gutter numbers are static; no matching-bracket decoration.                                          |
| Integration surfaces       | `apps/docs/src/pages/EditorPage.tsx`, `registry.json` (`editor/code-editor`), `builtin.editor` i18n (`label`, `code`), `code-editor.meta.ts`. |

---

## Target state (after v46)

| Concern               | Today                                       | Target                                                                                                          |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Undo/redo             | native only; dies on programmatic set       | **owned signal history** (snapshot text + selection), `Mod-Z`/`Mod-Shift-Z`, survives external `value` writes  |
| External sync         | replace `value` → caret jumps, echo risk    | **selection-preserving, echo-safe** controlled-value update + an imperative `applyEdit` ref API                |
| Search                | none                                        | **find & replace** panel: match highlight, next/prev, replace/replace-all, `Mod-F`, `Esc`, i18n strings        |
| Keymap                | hardcoded Tab only                          | **keymap dispatch** + public `keymap` prop; built-ins (`Mod-S` save, `Mod-F` find, `Mod-Z`/redo); Tab folds in |
| Save                  | none                                        | `onSave` prop bound to `Mod-S`, browser save dialog suppressed                                                  |
| Theming               | global tokens only                          | **`theme` prop** (object → scoped `--cascivo-editor-*` custom props on root) + reactive **dynamic switch** (Zen mode) |
| Active line / brackets | row marker only                            | active-line **gutter** highlight + **bracket-match** decoration (both opt-in, CSS-driven)                       |
| Extensibility         | grammars only                               | documented **decoration + keymap** extension seam (the same seam search/brackets use)                          |
| Markdown              | grammar exists                              | **hardened** for notes (ATX/setext headings, emphasis/strong, inline + fenced code with embedded language, links, lists, task lists, blockquotes) + tests |
| Performance           | windowing ≥1000 lines, rAF highlight        | **validated** with a large-doc test; wrap-mode windowing hole documented/closed where feasible                 |
| Out of scope          | —                                           | LSP/IntelliSense, multi-cursor, folding, minimap, vim — **stay out**; remain the meta `whenNotToUse` boundary   |

---

## Key open decisions (recommendations in the master plan)

1. **Owned history vs. lean on native undo?** *Recommendation: **owned history**, layered over native.* Native
   undo is fine while the user types, but the blocker is that programmatic `value` writes (controlled re-render,
   remote pull, reset) wipe the native stack and jump the caret. An owned signal-based ring buffer of
   `{ text, selectionStart, selectionEnd }` snapshots — coalesced by idle/again boundaries — restores both text
   **and** selection and is immune to external writes. Native `Ctrl-Z` is intercepted by the keymap and routed
   to the owned stack so there is one source of truth.
2. **How to make external `value` updates non-destructive?** *Recommendation: **diff + selection rebase**.* When
   the controlled `value` changes from outside (not from our own `onValueChange` echo), compute a minimal
   prefix/suffix diff and rebase the caret/selection offsets across it, then write via the textarea so native
   state stays coherent. Guard with an `isApplyingExternal` flag (the app's `isUpdatingFromStore` pattern,
   internalized) so our own change events never loop. Expose an imperative `applyEdit(range, text)` for callers
   that already have a transaction.
3. **Search UI — overlay panel or browser find?** *Recommendation: an **owned overlay find panel**.* The native
   highlight layer can render match decorations cheaply (it already maps offsets → spans). A small signal-driven
   panel (find field, next/prev, replace, count, `Esc`) gives `Mod-F`, in-document match highlight, and replace —
   none of which `Ctrl-F` browser find can do against a transparent textarea. i18n via `builtin.editor`.
4. **Keymap as a system, or more inline `if`s?** *Recommendation: a **tiny keymap dispatch**.* Replace the inline
   Tab handler with a `Map<chord, command>` resolved in `onKeyDown`; built-ins (Tab/Shift-Tab, `Mod-Z`,
   `Mod-Shift-Z`/`Mod-Y`, `Mod-F`, `Mod-S`) plus a merged-in public `keymap` prop. This is the seam that makes
   save (#5) and extensibility (#10) fall out for free. No external keybinding library.
5. **Per-instance theming shape?** *Recommendation: a **`theme` prop of `--cascivo-editor-*` overrides**.* A plain
   object `{ '--cascivo-editor-bg': '…', '--cascivo-editor-syntax-keyword': '…', … }` spread onto the root's
   inline style. Because the root is signal-rendered, swapping the object (or a `themeName`) **re-themes live** —
   the "Zen mode" Compartment behavior, without CodeMirror's Compartment/extension machinery. Global `data-theme`
   still works as the default; the prop only overrides.
6. **Active-line gutter + brackets — JS or CSS?** *Recommendation: **CSS-first, minimal JS**.* The caret line is
   already tracked (`--cascivo-editor-caret-line`); add a gutter active-line style keyed off it (no new JS for
   the gutter). Bracket matching needs a small offset computation (find the partner of the bracket adjacent to
   the caret) feeding two decoration spans in the highlight layer — opt-in via a `bracketMatching` prop.
7. **Extensibility surface — how much?** *Recommendation: **just decorations + keymap**, documented.* Expose the
   two seams the internal features already use: a `decorations` provider (offset ranges → CSS class, what search
   and brackets emit) and the `keymap` prop. No plugin lifecycle, no transaction filters — that is engine
   territory and out of scope. Document the seam and the `registerGrammar` language path together.
8. **Markdown depth for a notes app?** *Recommendation: **harden, don't gold-plate**.* Cover what a notes/wiki
   surface actually shows: ATX (`#`) + setext headings, `*`/`_` emphasis & strong, inline code, fenced code
   **with embedded-language highlight** (the tokenizer already carries state across lines), links/images, ordered/
   unordered lists, `- [ ]` task lists, blockquotes, HR, and `~~strike~~`. Add grammar tests; do not attempt full
   CommonMark/GFM table/footnote fidelity (diminishing returns for the surface).
9. **Imperative ref API — add one?** *Recommendation: **yes, a small `CodeEditorHandle`**.* `applyEdit`,
   `getSelection`, `focus`, `undo`/`redo`, `openFind`. The notes app drives external transactions; a typed handle
   via `forwardRef` is the clean seam and keeps the controlled-prop surface uncluttered. Refs are allowed
   (DOM/handle), not a state workaround.

---

## Cross-cutting rules

1. **Stay in the overlay model.** The `<textarea>` remains the editing surface and the source of truth for
   caret/IME/selection/a11y. v46 adds owned **history, sync, search, keymap, theming, decorations** *around* it —
   never a virtual document, never `contenteditable`, never a third-party editor engine.
2. **Zero runtime dependencies.** No CodeMirror, no keybinding lib, no diff lib. Everything is owned code in
   `@cascivo/editor`; the package keeps its peer-only deps and `"sideEffects": ["**/*.css"]`.
3. **Signals, not hooks (CLAUDE.md).** No `useState`/`useEffect`/`useContext`/`useReducer`. History, find state,
   decorations, theme are signals; DOM side effects use `useSignalEffect`; `useRef` only for the textarea/handle.
   Every React surface calls `useSignals()` first.
4. **Additive & backward-compatible.** No existing prop changes meaning; new behavior is opt-in
   (`onSave`, `theme`, `bracketMatching`, `keymap`, `decorations`, `ref`). Default render is byte-identical to
   today. `Highlight` is untouched except where it shares the view layer.
5. **i18n, never hardcoded English.** Find/replace, save affordances, and any new control label come from
   `builtin.editor` (extend the catalog + the `de` locale), overridable per-instance — same rule as every
   component.
6. **Accessibility holds.** The find panel is a labelled, keyboard-reachable region (`Esc` closes, focus
   returns to the editor); decorations are `aria-hidden` visual layers; ≥44px coarse tap targets on the find
   panel controls; respects `prefers-reduced-motion` and `forced-colors`. WCAG 2.1 AA.
7. **Full gate green before each commit.** `pnpm ready` (regen → `vp check --fix` → build → type check → tests),
   plus `breakpoint:check` and `fallback:check`. New strings flow through `pnpm regen`; drift gate clean.
8. **Out-of-scope stays out.** LSP, multi-cursor, folding, minimap, vim — not built; the meta `whenNotToUse`
   keeps pointing at a full engine for those. The README states the parity boundary honestly.

---

## Definition of Done

### T1 — Keymap dispatch + owned undo/redo history

- [ ] A keymap dispatch replaces the inline handler: `Map<chord, command>` resolved in `onKeyDown`, existing
      `Tab`/`Shift-Tab` indent re-expressed as commands (no behavior change).
- [ ] Owned signal history (ring buffer of `{ text, selectionStart, selectionEnd }`, idle/boundary coalescing);
      `Mod-Z` undo, `Mod-Shift-Z`/`Mod-Y` redo restore text **and** selection; native browser undo intercepted so
      there is a single source of truth. Survives a programmatic `value` change (regression test).
- [ ] No banned hooks; default behavior unchanged when no `Mod-Z` is pressed. Tests for coalescing, redo
      invalidation on new edit, and selection restoration.

### T2 — Transactional, selection-preserving controlled-value sync

- [ ] External `value` changes are applied via prefix/suffix diff with **selection rebase** (caret no longer
      jumps to end); an `isApplyingExternal` guard prevents `onValueChange` echo loops.
- [ ] Imperative `CodeEditorHandle` via `forwardRef`: `applyEdit(range, text)`, `getSelection`, `focus`,
      `undo`/`redo` (and `openFind` after T3). Typed + exported.
- [ ] Tests: external update preserves caret across an insertion/deletion before the caret; no echo loop; handle
      `applyEdit` updates text + history coherently.

### T3 — In-document find & replace

- [ ] A signal-driven find panel (find field, match count, next/prev, replace, replace-all, `Esc` to close,
      focus returns to editor) opened by `Mod-F`; matches highlighted in the overlay layer; `Mod-Alt-F`/`Mod-H`
      for replace per platform convention.
- [ ] All strings from `builtin.editor` (+ `de`); panel is accessible (labelled region, keyboard-only usable,
      ≥44px coarse targets) and reduced-motion safe.
- [ ] Tests: find highlights N matches, next/prev wraps, replace and replace-all mutate via the history-aware
      edit path (undoable). `breakpoint:check` clean.

### T4 — Save keybinding + extensibility seam (keymap + decorations)

- [ ] `onSave` prop bound to `Mod-S`, `preventDefault` suppresses the browser save dialog; no-op when absent.
- [ ] Public `keymap` prop merged over built-ins; public `decorations` provider (offset ranges → class) — the
      same seam search (T3) and brackets (T5) consume. Both documented.
- [ ] Tests: `Mod-S` fires `onSave` and prevents default; a custom keymap entry overrides/extends a built-in; a
      decoration provider renders a class span at the right offsets.

### T5 — Per-instance theming + active-line gutter + bracket matching

- [ ] `theme` prop (`Partial<Record<'--cascivo-editor-*', string>>`) spread to the root inline style; swapping it
      (or `themeName`) re-themes **live** (Zen-mode demo). Global `data-theme` still the default.
- [ ] Active-line **gutter** highlight keyed off the existing caret-line signal (CSS-first); `bracketMatching`
      prop decorates the matching pair adjacent to the caret via the T4 decoration seam.
- [ ] Tests: theme override changes a resolved custom property; switching the theme object updates it without
      remount; bracket match decorates the partner; active-line gutter reflects caret movement.
      `fallback:check`/`breakpoint:check` clean.

### T6 — Markdown hardening, perf/wrap validation, docs/registry/regen/gate

- [ ] `grammars/markdown.ts` hardened: ATX + setext headings, emphasis/strong, inline + fenced code (embedded
      language), links/images, ordered/unordered + task lists, blockquotes, HR, strikethrough; grammar tests for
      each. No full-CommonMark table/footnote scope.
- [ ] Large-document test confirms windowing + rAF highlight hold; the wrap-mode windowing limitation is closed
      where feasible or documented in the README + meta. `wrap` and `lineNumbers` validated.
- [ ] `EditorPage` demos the new features (find, save, theme switch, brackets); `code-editor.meta.ts`, `registry.json`,
      `builtin.editor` (+ `de`), `readme.body.md`/`README.md`, `CHANGELOG.md`, and `docs/ROADMAP-V46.md` status
      updated; `VERSION`/`package.json` bumped. `pnpm regen` + drift gate clean; full CI gate green; grep sweep
      confirms the new props/handle reached the meta, registry, docs, and i18n.

### T7 — Try-it-out variants in docs & Storybook

- [ ] **Storybook** (`apps/storybook/stories/editor/code-editor.stories.tsx`): `argTypes` exercise the new props
      (incl. `bracketMatching`, `onSave` action) and per-feature stories exist — `FindAndReplace`, `Save`,
      `UndoRedo`, `BracketMatching`, `ActiveLineGutter`, `Markdown`, `LargeDocument` — each with a caption noting
      the keyboard interaction.
- [ ] **Storybook interactive** stories demonstrate the stateful capabilities: `ThemeSwitch` (live per-instance
      re-theming / Zen mode), `ImperativeHandle` (`applyEdit`/`undo`/`openFind`), `Decorations` + `CustomKeymap`
      (the extension seam), and `ControlledSync` (caret preserved + no echo on a programmatic `value` set). React
      stories call `useSignals()`; no banned hooks.
- [ ] **Docs** (`apps/docs/src/pages/EditorPage.tsx`): new sections for Search, Save, live Theme switch, Bracket
      matching & active line, and a realistic **Markdown notes** scenario — within the existing `doc-section`
      layout, Preact-reactive, no banned hooks.
- [ ] Both apps build **without** a prior full build (editor source alias in `apps/storybook/.storybook/main.ts`
      and `apps/docs/vite.config.ts`); `pnpm breakpoint:check` and `pnpm ready` green; every interactive control is
      keyboard-reachable and ≥44px on coarse pointers.
