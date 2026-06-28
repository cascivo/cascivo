# v54 — Editor: Slash Commands (Trigger · Caret Positioning · Command Menu) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **slash commands** to `@cascivo/editor`'s `CodeEditor` — type `/` at a word boundary, a filtered command
menu opens at the caret; arrow/enter (or tab) picks one; the `/query` text is replaced (or an action runs), undoably —
per the feasibility audit in `docs/ROADMAP-V54.md`. The study measured the editor against the typeahead implementations
in [**CodeMirror 6**](https://codemirror.net/docs/ref/#autocomplete), [**Monaco**](https://microsoft.github.io/monaco-editor/),
[**ProseMirror/TipTap**](https://tiptap.dev/docs/editor/api/utilities/suggestion), [**Lexical**](https://lexical.dev/docs/react/plugins),
and the plain-`<textarea>` libraries, and confirmed cascivo's monospace-`<textarea>`-over-highlight design makes the
feature tractable **natively** (no contenteditable rewrite, no new dependency): four of five sub-problems reuse existing
seams, and the one real gap — caret → pixel mapping — is cheap here because the surface is monospace with already-measured
line metrics and a pixel-aligned `.pre` layer.

Governing thesis: **a native textarea slash menu, not a contenteditable rewrite.** Take the transferable architecture
all the references share — detect trigger → virtual anchor at the caret → floating menu → intercept nav keys → replace
the trigger range — and implement it on the textarea using the editor's own signals/keymap/`applyEdit` seams and
`@cascivo/core`'s `useAnchorPosition`. Add **no runtime dependency**, keep **signals-only** (no banned hooks), preserve
the textarea's native IME/undo/a11y, and ship a **synchronous caller-supplied command list** (async/LSP providers are
out of scope).

Deliver: **(T1)** a caret-coordinate primitive (`caret.ts`) — monospace arithmetic + a `.pre` `Range` path + a one-time
`charWidth` measurement; **(T2)** trigger detection + menu state (`slash-trigger.ts` + signals); **(T3)** a caret-anchored
command menu (`slash-menu.tsx`) bridged to `useAnchorPosition`; **(T4)** keyboard nav + undoable insertion via the
existing keymap-while-open pattern + `applyEdit`; **(T5)** the public `commands` API + `SlashCommand` type +
`openCommandMenu()` handle + i18n + docs/story/example. Every change stays **inside
`packages/editor/src/editor/code-editor/*` plus the editor docs surfaces that read from it** (the meta, `apps/storybook`,
`apps/site` EditorPage, generated llms/registry). **Do not** add a contenteditable model, a runtime dependency, an
async provider API, or regress the signals rule / native a11y / undo history.

Target state (verified after T5):

| Finding (lens · severity)                                       | Today                                              | Target                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| S-1 No caret → pixel mapping (CodeMirror/PM · 🔴)               | none (0 hits)                                      | pure `caretCoords` (monospace + `.pre` `Range`), `measureCharWidth` once                      |
| S-2 No trigger detection (Lexical/TipTap · 🟠)                  | none                                               | pure `detectTrigger` + `filterCommands` + reactive `slash*` signals                           |
| S-3 Floating menu needs a virtual caret anchor (PM · 🟠)        | `useAnchorPosition` needs a DOM anchor             | 0×0 caret-proxy at the T1 coords → `useAnchorPosition` bridge                                  |
| S-4 Keyboard nav while open (CodeMirror/Monaco · 🟢)            | `findOpen`-while-open pattern exists               | Arrow/Enter/Tab/Escape bound only while the menu is open                                       |
| S-5 Undoable insertion (· 🟢)                                   | `applyEdit` exists                                 | selection replaces the `/query` span via `applyEdit` (undoable) or runs an action             |
| S-6 Combobox/listbox a11y over a textarea (🟠)                  | textarea owns `textbox`                            | `role="listbox"`/`option` + `aria-activedescendant` on the textarea                            |
| S-7 Mirror-div caret hack (textarea libs · 🟡)                  | n/a                                               | **not adopted** — monospace + `.pre` replace it                                               |
| S-8 No public command/menu API (🟠)                             | none                                               | `commands` prop + `SlashCommand` type + `openCommandMenu()` exported                           |
| S-9 Tabs/soft-wrap fidelity (🟡)                                | n/a                                               | arithmetic correct for the `insertSpaces:true`/`wrap:false` default; `.pre` `Range` for the rest |
| Full gate (`pnpm ready`)                                        | green                                              | green                                                                                          |

**Architecture & evidence (reproduced in-repo before planning):**

- **The editing surface** (`packages/editor/src/editor/code-editor/code-editor.tsx`): a native `<textarea>` with
  `color: transparent` (`code-editor.module.css:81`) layered over a `<pre>` highlight (`code-editor.tsx:546-572`). The
  browser owns editing/caret/IME/undo/a11y. Caret offset is tracked reactively via the `caretOffset` signal + `selRef`,
  synced on `selectionchange`/`input`/`click`/`keyup` (`code-editor.tsx:236, 297-324`). `lineHeight` and `scrollTop`
  are measured signals (`code-editor.tsx:225, 285, 288-294`). **No offset→pixel function exists** (verified: 0 grep
  hits) — this is the T1 primitive.
- **The keymap seam** (`code-editor/keymap.ts`): `chordOf` normalizes events to chord strings (`'ArrowUp'`, `'Enter'`,
  `'Escape'`, `keymap.ts:32-47`); `dispatch`/`mergeKeymap` run a `Map<string, Command>`. The component **already adds
  bindings conditionally while an overlay is open** — `Escape` only `if (findOpen.value)` (`code-editor.tsx:507-512`).
  T4 reuses this exact pattern for the menu's nav keys.
- **The overlay precedent** (`code-editor/find-panel.tsx` + `find-panel.module.css`): an absolutely-positioned overlay
  inside `.codeArea` (`position: absolute`, `z-index: 2`, themed via `--cascivo-editor-*`, ≥44px coarse targets). The
  slash menu mirrors these CSS conventions but is anchored at the caret rather than a fixed corner.
- **State + insertion**: `findOpen`/`findQuery`/etc. signals (`code-editor.tsx:228-233`) are the template for the
  `slash*` signals. Insertion uses the existing imperative `applyEdit({from,to}, text)` → `commit` → history
  (`code-editor.tsx:457-463`); `getSelection`/`focus` are on the same handle.
- **The anchor primitive** (`packages/core/src/anchor.tsx:102`, `useAnchorPosition`): CSS-anchor-positioning primary
  path + a `getBoundingClientRect`/`computePosition` JS fallback, recomputed on scroll/resize in `useSignalEffect`.
  Used by menubar/popover/context-menu/menu-button/navigation-menu. **It requires a DOM `anchorRef`** (`anchor.tsx:10-16`)
  — a textarea caret is not a DOM node, so T3 renders a 0×0 caret-proxy at the T1 coords and feeds *that* as the anchor.
- **i18n**: `builtin.editor` already exists (`packages/i18n/src/builtin.ts:260`, `label: 'Code editor'`); T5 adds menu
  strings to it. **Docs surfaces:** `code-editor.meta.ts`, `apps/storybook/stories/editor/code-editor.stories.tsx`,
  `apps/site/src/pages/EditorPage.tsx`, generated `apps/site/public/llms/editor/*` + `public/r/*` via `pnpm regen`.
- **CLAUDE.md constraints (binding on every tranche):** signals only — `useSignal`/`useComputed`/`useSignalEffect`/
  `useMachine`; **no** `useState`/`useEffect`/`useContext`/`useReducer`; `useRef` for DOM only (the caret-proxy, the
  menu node, the `charWidth` measurement go through refs + `useSignalEffect`); the React example/bench apps call
  `useSignals()` first; touch targets ≥44px under `pointer: coarse`; no off-scale `@media`/`@container` literals;
  user-visible strings default from `@cascivo/i18n`; the surface is exported from the package index. **Dependency
  policy: no new runtime deps.**

**Tech Stack:** React 18+ `<textarea>` + the existing highlight/keymap/history in `@cascivo/editor`; signals via
`@cascivo/core`; positioning via `@cascivo/core`'s `useAnchorPosition`; i18n via `@cascivo/i18n`; CSS-token theming via
`--cascivo-editor-*`. Docs in `apps/site` + `apps/storybook`. No new runtime dependencies.

---

## Tranche Overview

| Tranche | Title                                   | Goal                                                                                                                                                                                                                                                                            |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Caret coordinate primitive              | `code-editor/caret.ts`: a pure `caretCoords(text, offset, { charWidth, lineHeight, scrollTop, scrollLeft, padTop, padLeft, tabSize })` → `{ top, left }` using monospace `visualCol × charWidth` (tab-expanded) and `line × lineHeight`, minus scroll; a `.pre`-`Range` path `caretRectFromPre(pre, offset)` for tab/wrap fidelity; and `measureCharWidth(ta)` (one-time, via a probe). Unit-tested. |
| T2      | Trigger detection + menu state          | `code-editor/slash-trigger.ts`: pure `detectTrigger(text, caret)` → `{ start, query } \| null` (a `/` at line-start or after whitespace, query = chars from `/`+1 to caret, no whitespace in the query) + `filterCommands(commands, query)`. In the component: `slashOpen`/`slashStart`/`slashQuery`/`slashIndex` signals updated in a `useSignalEffect` keyed on `caretOffset`+`text`; the `/` types normally and is detected *after* input (never a keymap binding). |
| T3      | Caret-anchored command menu             | `code-editor/slash-menu.tsx` + `slash-menu.module.css`: a themed floating `role="listbox"` of `option`s (mirroring `find-panel` CSS), rendered in `.codeArea` only while `slashOpen`. A 0×0 caret-proxy `<div>` is positioned at the T1 `caretCoords` (read off the live caret) and passed as `anchorRef` to `useAnchorPosition({ placement: 'bottom-start' })`; the menu is the `floatingRef`. ≥44px coarse targets; follows scroll via the existing scroll-sync. |
| T4      | Keyboard nav + undoable insertion        | While `slashOpen`, add `ArrowDown`/`ArrowUp` (move `slashIndex`, clamped), `Enter`/`Tab` (select the active command), `Escape` (close) to the keymap *exactly as the `findOpen` block does*. Selecting replaces `[slashStart-1, caret)` (the `/`+query) via `applyEdit` (undoable) or runs the command's `run(editor)`; focus returns to the textarea. Set `aria-activedescendant` on the textarea to the active option id. |
| T5      | Public API, registry, i18n & docs        | Add `commands?: SlashCommand[]` to `CodeEditorProps` and a `SlashCommand` type (`{ id, label, hint?, keywords?, insert?: string, run?: (editor: CodeEditorHandle) => void }`); add `openCommandMenu()` to `CodeEditorHandle`; export both from `index.ts`. Add menu strings to `builtin.editor`. Update `code-editor.meta.ts` (prop + example). Add a Storybook story + an `apps/site` EditorPage example. `pnpm regen`; drift clean. |

Ordering rationale: **T1 first** — the caret primitive is the one true gap and the substrate T3 anchors against. **T2**
is pure trigger/state logic (parallelizable with T1). **T3** renders + positions the menu against T1. **T4** wires
keyboard + insertion onto the open menu. **T5** opens the public surface + docs. T1/T2 independent; T3 ⟵ T1; T4 ⟵ T2+T3;
T5 ⟵ all.

---

## Files Created / Modified per Tranche

### T1 — Caret coordinate primitive

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/caret.ts` (`caretCoords` + `caretRectFromPre` + `measureCharWidth`) + `caret.test.ts` |

### T2 — Trigger detection + menu state

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/slash-trigger.ts` (`detectTrigger` + `filterCommands`) + `slash-trigger.test.ts` |
| Modify | `code-editor.tsx` (`slashOpen`/`slashStart`/`slashQuery`/`slashIndex` signals + the detection `useSignalEffect`) |

### T3 — Caret-anchored command menu

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/editor/code-editor/slash-menu.tsx` + `slash-menu.module.css` + `slash-menu.test.tsx` |
| Modify | `code-editor.tsx` (render the caret-proxy + `<SlashMenu>` in `.codeArea`; wire `useAnchorPosition`) |

### T4 — Keyboard nav + undoable insertion

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Modify | `code-editor.tsx` (`if (slashOpen.value)` keymap block: Arrow/Enter/Tab/Escape; `selectCommand` via `applyEdit`/`run`; `aria-activedescendant`) |
| Modify | `code-editor.test.tsx` (open → narrow → arrow → enter → text inserted + undoable) |

### T5 — Public API, registry, i18n & docs

| Action | Path                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| Modify | `code-editor.tsx` (`commands` prop + `SlashCommand` type + `openCommandMenu()` on the handle) |
| Modify | `packages/editor/src/index.ts` (export `SlashCommand`); `code-editor.meta.ts` (prop + example) |
| Modify | `packages/i18n/src/builtin.ts` (`builtin.editor` menu strings + locale catalogs touched by drift) |
| Modify | `apps/storybook/stories/editor/code-editor.stories.tsx` (a slash-commands story); `apps/site/src/pages/EditorPage.tsx` (example) |
| Modify | generated `apps/site/public/llms/editor/*` + `public/r/*` via `pnpm regen`; `docs/ROADMAP-V54.md` → Shipped |

---

## Key Decisions

### Decision 1 — Stay a monospace `<textarea>`; no contenteditable rewrite (firm)

The cheap way to get `coordsAtPos` + a suggestion plugin is to adopt ProseMirror/Lexical. **Decision: keep the native
`<textarea>` and implement slash commands natively** — the browser keeps owning editing/caret/IME/undo/a11y, and the
feature is additive. Rejected: a contenteditable/rich-text document model (a different, far larger product that
abandons the editor's identity and its native a11y/IME).

### Decision 2 — Detect the trigger reactively after input; never bind `/` as a command (firm)

**Decision: the `/` keystroke types into the textarea normally; trigger detection runs in a `useSignalEffect` on
`caretOffset`+`text` *after* the input lands.** Binding `/` as a keymap command that returns `true` would `preventDefault`
and swallow the slash so it never enters the document. Rejected: a `/` keymap binding (it breaks the very character the
feature is named for — an error an early sketch made).

### Decision 3 — Caret pixels by arithmetic, `.pre` `Range` for fidelity; no mirror-div (firm)

**Decision: the default `caretCoords` path is monospace arithmetic (`visualCol × charWidth`, `line × lineHeight`, minus
scroll), correct for the `insertSpaces:true`/`wrap:false` default; a `.pre` DOM-`Range` path (`caretRectFromPre`) covers
tabs and soft-wrap by measuring the already-rendered, pixel-aligned highlight layer.** Rejected: the
`textarea-caret-position` mirror-div hack (fragile, and unnecessary given the monospace surface + the `.pre` layer).

### Decision 4 — Bridge the caret to `useAnchorPosition` via a 0×0 proxy; reuse, don't reinvent (firm)

**Decision: render a 0×0 "caret-proxy" `<div>` absolutely positioned at the `caretCoords` inside `.codeArea`, pass it
as the `anchorRef` to the existing `useAnchorPosition`, and render the menu as the `floatingRef`** — exactly the
"virtual element" pattern ProseMirror uses with floating-ui, reusing cascivo's anchor primitive (CSS-anchor + JS
fallback, scroll/resize aware). Rejected: a bespoke positioner in the editor, or adding floating-ui/tippy (a new
dependency the core primitive already obviates).

### Decision 5 — Reuse the keymap-while-open pattern + `applyEdit`; no new mechanisms (firm)

**Decision: nav keys are added to the keymap only `if (slashOpen.value)` — the same conditional-binding shape the
editor already uses for `Escape` when `findOpen` — and selection inserts through the existing undoable `applyEdit`.**
Rejected: a parallel key-handling path or a second history mechanism (the seams already exist and keep edits undoable).

### Decision 6 — Synchronous, caller-supplied commands; no async/LSP providers (firm)

**Decision: v54 ships a `commands: SlashCommand[]` list the caller provides; filtering is a pure synchronous function.**
Monaco/CodeMirror-style async `CompletionSource`/provider registration (debounce, cancellation, LSP) is a separate
follow-up that can layer onto the same T1/T2 primitives. Rejected: an async provider API in v1 (scope creep; the
synchronous list covers the snippet/command use case).

### Decision 7 — `/` only in v1; the trigger is extensible later (recommended)

**Decision: ship the `/` trigger; structure `detectTrigger` so a future `@`/`:` mention/emoji typeahead can reuse it
with a different trigger char + matcher.** Rejected: a general multi-trigger registry now (YAGNI for the stated
slash-command goal; the primitive is built to allow it).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before any push; `pnpm ready:ci` before the final push
   if build config or workspace deps changed.
2. **Editor blast radius.** Changes stay in `packages/editor/src/editor/code-editor/*` plus the editor docs surfaces
   that read from it (`code-editor.meta.ts`, `apps/storybook/stories/editor`, `apps/site` EditorPage, generated
   `public/llms/editor` + `public/r`). `@cascivo/i18n` is touched only for the new built-in `editor` strings; no
   token-model or theming change.
3. **Zero new runtime dependencies.** Caret math, trigger scan, the menu, and positioning are hand-rolled in the editor
   + the existing `@cascivo/core` `useAnchorPosition` (Decisions 3–4). No floating-ui/tippy/downshift/textarea-caret.
4. **Signals, not hooks.** `useSignal`/`useComputed`/`useSignalEffect`/`useMachine`/`useRef`-for-DOM only. The caret
   measurement, the caret-proxy, the menu node, and any listeners go through refs + `useSignalEffect`; no
   `useState`/`useEffect`/`useContext`/`useReducer`. The slash menu is *not* an FSM — `slashOpen` is a controlled-ish
   signal driven by `detectTrigger`, not a machine (per the CLAUDE.md "the signal IS the state" rule).
5. **Native a11y/IME is the moat — never regress it.** The `<textarea>` keeps its native `textbox` role, IME
   composition, and undoable history. The menu adds `role="listbox"`/`option` + `aria-activedescendant` on the textarea
   (the ARIA combobox pattern); selection returns focus to the textarea. WCAG 2.2 AA. Keyboard-only operation works end
   to end.
6. **Undo integrity.** Insertion goes through `applyEdit` → `commit` → history, so a chosen command is a single
   undoable step; the `/query` removal + the inserted text are one transaction.
7. **The `/` must reach the document.** Trigger detection is reactive-after-input; `/` is never a `preventDefault`ing
   binding (Decision 2). Typing `/` in code (e.g. a comment or path) with no matching command must leave a literal `/`
   and silently no-op the menu.
8. **i18n.** New user-visible strings (menu aria-label, empty-state "No commands") default from the `@cascivo/i18n`
   built-in `editor` catalog; no hard-coded English. Re-run locale drift after adding keys.
9. **Responsive + breakpoints.** The menu respects the editor width, never overflows the viewport (the
   `useAnchorPosition` fallback recomputes on scroll/resize; clamp/flip is acceptable to defer but must not clip),
   options are ≥44px under `pointer: coarse`, and there are no off-scale `@media`/`@container` literals; the editor
   mobile sweep passes at 320/360/390/414.
10. **Single source of truth for docs.** The new prop/handle are documented in `code-editor.meta.ts`; after `pnpm regen`
    the drift check (`git diff --exit-code`) is clean; the surface is exported from `packages/editor/src/index.ts`.
11. **Out-of-scope stays out.** No contenteditable model; no runtime dependency; no async/LSP provider API; no block
    transforms; no extra trigger chars beyond `/` in v1; native IME/undo/a11y never regressed.
