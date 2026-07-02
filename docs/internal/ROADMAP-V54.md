# cascivo — Roadmap v54: Editor — Slash Commands (Trigger · Caret Positioning · Command Menu)

**Last updated:** 2026-06-28
**Status:** ✅ Shipped — T1–T5 implemented on the existing monospace `<textarea>` (no contenteditable rewrite, no
runtime dependency): a pure caret-coordinate primitive (`caret.ts`), reactive `/`-trigger detection
(`slash-trigger.ts`), a caret-anchored `role="listbox"` menu (`slash-menu.tsx`) bridged to `@cascivo/core`'s
`useAnchorPosition`, conditional Arrow/Enter/Tab/Escape navigation reusing the find-panel-while-open keymap pattern,
undoable insertion via `applyEdit`, and a public `commands` prop + `SlashCommand` type + `openCommandMenu()` handle.
Signals only (no banned hooks); 139 editor tests pass; `pnpm ready` + `breakpoint:check` green. Shipped in PR #106.
See the implementation log at the end. The roadmap below was produced by a prior study of `@cascivo/editor` against the
slash-command/typeahead patterns in CodeMirror, Monaco, ProseMirror/TipTap, Lexical, and the plain-`<textarea>`
libraries.
**Plan documents:** `docs/superpowers/plans/2026-06-28-v54-master-plan.md` + tranches 1–5
**Builds on:** the existing editor — the `CodeEditor` surface (`packages/editor/src/editor/code-editor/code-editor.tsx`),
its keymap seam (`code-editor/keymap.ts`), the `FindPanel` overlay (`code-editor/find-panel.tsx` +
`find-panel.module.css`), the offset helpers (`code-editor/find.ts` — `offsetToLineCol`), the imperative handle
(`applyEdit`/`getSelection`/`focus`), and the shared anchor primitive `useAnchorPosition` in `@cascivo/core`
(`packages/core/src/anchor.tsx`).

> **Source of this roadmap.** A structured study of how the editors teams actually use implement "slash commands"
> (type `/` → a filtered command menu opens at the cursor; arrow/enter to pick; the trigger text is replaced or an
> action runs). The reference points span the spectrum: [**CodeMirror 6**](https://codemirror.net/docs/ref/#autocomplete)
> (`@codemirror/autocomplete` — completion sources + trigger chars; **built-in `view.coordsAtPos(pos)`** for caret
> pixels), [**Monaco**](https://microsoft.github.io/monaco-editor/) (`registerCompletionItemProvider` with
> `triggerCharacters: ['/']` + a built-in suggest widget), [**ProseMirror/TipTap**](https://tiptap.dev/docs/editor/api/utilities/suggestion)
> (`@tiptap/suggestion`, `char: '/'` → a **virtual anchor** at `view.coordsAtPos` positioned by floating-ui/tippy — the
> canonical Notion slash menu), [**Lexical**](https://lexical.dev/docs/react/plugins) (`LexicalTypeaheadMenuPlugin` +
> `useBasicTypeaheadTriggerMatch`), and the plain-`<textarea>` libraries (`react-textarea-autocomplete`,
> `textarea-caret-position`, Tribute.js — the "mirror-div" caret hack). Measured against today's `@cascivo/editor`
> (a monospace `<textarea>` over a pixel-aligned highlight layer), they sharpen one question: **where does a slash-command
> feature actually need new machinery, and which of these libraries' ideas are adaptable to a textarea-based editor
> without a contenteditable rewrite or a new runtime dependency?** Each finding below is verified against the source.

---

## Why this roadmap exists

`@cascivo/editor`'s `CodeEditor` is a deliberately small surface: a **native `<textarea>` with `color: transparent`**
overlaid on a syntax-highlighted `<pre>` (`code-editor.tsx:546-572`). The browser owns editing, caret, IME, undo, and
a11y; JS only tokenizes, sync-scrolls, handles a few key chords, and drives the find panel. The feasibility study
found that this design is **unusually well-suited to slash commands** — more so than a contenteditable editor —
because four of the five sub-problems already have a home in the codebase, and the fifth (caret pixel positioning,
the universally hard part) is tractable here without the fragile mirror-div hack every textarea library resorts to:

- **Trigger detection** maps to a reactive `useSignalEffect` on the existing `caretOffset` + `text` signals
  (`code-editor.tsx:236, 297-324`) — no new event plumbing, but it must live *inside* the component (no public
  `onInput`/`onSelect` seam exists today).
- **Menu state + filtering** mirrors the existing find-panel signal pattern exactly (`findOpen`/`findQuery`,
  `code-editor.tsx:228-229`).
- **Keyboard navigation** reuses the editor's *existing* "add bindings only while an overlay is open" pattern — see
  `Escape` added `if (findOpen.value)` at `code-editor.tsx:507-512`. Arrow/Enter/Tab/Escape slot in identically.
- **Insertion on select** reuses the existing undoable imperative `applyEdit({from,to}, text)` (`code-editor.tsx:457-463`)
  to replace the `/query` span.
- **Caret → pixel positioning** is the one genuine gap. There is **no offset→pixel mapping today** (verified: 0 hits
  for `coordsAtPos`/`caretCoords`/`getCaretCoordinates`). But the editor is **monospace** (`--cascivo-font-mono`,
  `code-editor.module.css:10`), already measures `lineHeight` (`code-editor.tsx:285`) and `scrollTop`
  (`code-editor.tsx:288-294`), and ships `offsetToLineCol` (`find.ts`) — so caret pixels are `line × lineHeight` /
  `visualCol × charWidth` with a single one-time `charWidth` measurement, no mirror div. The pixel-aligned `.pre`
  highlight layer gives a second, DOM-`Range`-based path for tab/wrap fidelity.

### Framing: a textarea slash menu, not a contenteditable rewrite

The first job was to resist the obvious-but-wrong conclusion — "rebuild on ProseMirror/Lexical to get `coordsAtPos`
and a suggestion plugin for free." That would betray the editor's identity (a tiny, dependency-light textarea where
the browser owns editing/IME/a11y). So v54 takes the **transferable architecture** all five references share — detect
trigger → maintain a virtual anchor at the caret → position a floating menu → intercept nav keys → replace the trigger
range — and implements it natively on the textarea: a small **caret-coordinate primitive** (T1), reactive **trigger
detection + menu state** (T2), a **caret-anchored command menu** bridging to `useAnchorPosition` (T3), **keyboard
nav + undoable insertion** (T4), and the **public `commands` API + registry + docs** (T5). It **refuses** a
contenteditable/rich-text rewrite, a new runtime dependency (no floating-ui, no tippy, no `textarea-caret-position`),
LSP/async completion providers, and **never regresses** the signals-only rule, the undo history, or the textarea's
native a11y/IME.

---

## The findings, verified against today's code

Legend: ✅ a pattern/seam that already exists (reuse it) · ⚠️ present-but-needs-a-bridge · ❌ genuine gap (new code).
Severity is impact on *shipping a correct, accessible slash-command feature*.

### Lens 1 — the editors with first-class typeahead (CodeMirror · Monaco · ProseMirror/TipTap · Lexical)

| #   | Finding (severity)                                                    | Verified state today                                                                                                                              | Tranche |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| S-1 | No caret → pixel mapping (🔴)                                         | ❌ `grep -ri 'coordsAtPos\|caretCoords\|getCaretCoordinates' packages/editor/src` → 0. CodeMirror/ProseMirror expose this built-in; cascivo has none. Monospace + `lineHeight` + `offsetToLineCol` make it tractable (S-1 is the foundation). | T1      |
| S-2 | No trigger detection / typeahead match (🟠)                          | ❌ no `/`-trigger scan; no equivalent of `useBasicTypeaheadTriggerMatch` (Lexical) or `@tiptap/suggestion`. Must be reactive on `caretOffset`+`text` — and **internal**: no public `onInput`/`onSelect` seam exists. | T2      |
| S-3 | Floating menu needs a *virtual* anchor at the caret (🟠)             | ⚠️ `useAnchorPosition` exists (`core/anchor.tsx:102`, used by menubar/popover/context-menu) but requires a **DOM** `anchorRef` — a textarea caret is not a DOM node. Bridge via a 0×0 caret-proxy at the T1 coords (the ProseMirror "virtual element" pattern). | T3      |
| S-4 | Keyboard nav while open (Arrow/Enter/Tab/Escape) (🟢)                | ✅ the editor already adds bindings *conditionally while an overlay is open* (`Escape` when `findOpen`, `code-editor.tsx:507-512`); `chordOf` emits clean `'ArrowUp'`/`'Enter'`/`'Escape'` (`keymap.ts:32-47`). Reuse the pattern. | T4      |
| S-5 | Undoable insertion of the chosen command (🟢)                        | ✅ `applyEdit({from,to}, text)` routes through `commit` → history (`code-editor.tsx:457-463`); replacing the `/query` span is exactly this op. | T4      |
| S-6 | a11y: combobox/listbox semantics over a textarea (🟠)                | ⚠️ the `<textarea>` owns the `textbox` role + native IME; the menu needs `role="listbox"`/`option` + `aria-activedescendant` on the textarea (the ARIA combobox pattern). New, but well-trodden. | T3/T4   |

### Lens 2 — the plain-`<textarea>` libraries (react-textarea-autocomplete · textarea-caret-position · Tribute.js)

| #   | Finding (severity)                                                    | Verified state today                                                                                                                              | Tranche |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| S-7 | They all rely on the **mirror-div** caret hack (🟡 — we can do better) | ⚠️ `textarea-caret-position` clones the textarea's computed style into a hidden div + a marker span to measure the caret — fragile across fonts/scroll/wrap. cascivo's **monospace + measured `lineHeight` + the `.pre` layer** avoid it: arithmetic for the default path, a `.pre` DOM-`Range` for tab/wrap fidelity. | T1      |
| S-8 | No public command/menu API on the editor (🟠)                        | ❌ no `commands` prop, no `openCommandMenu()` on `CodeEditorHandle`, no `SlashCommand` type exported (`index.ts:24-35` exposes `CodeEditorProps`/`Handle`/`KeyMap`/`Decoration` only). Additive + small. | T5      |
| S-9 | Tabs/soft-wrap complicate the arithmetic caret (🟡)                  | ⚠️ a `\t` spans `tabSize` visual columns and `wrap` makes rows variable-height (`wrap` prop; `white-space: pre-wrap` at `code-editor.module.css:104`). Default config is `insertSpaces:true` + `wrap:false`, so the arithmetic path is correct by default; the `.pre` `Range` path covers the rest. | T1      |

**Net:** the one headline gap is **S-1, the caret → pixel primitive** — every reference editor has it built-in and
cascivo has none; it is the foundation T3 anchors against. Everything else is either an **existing pattern to reuse**
(S-4 keyboard, S-5 insertion, S-2's host signals) or a **small bridge/addition** (S-3 caret-proxy → `useAnchorPosition`,
S-6 combobox a11y, S-8 the public API). The plain-textarea mirror-div hack (S-7) is explicitly **not** adopted — the
monospace surface lets us do better. Tabs/wrap (S-9) are a bounded fidelity concern, not a blocker.

---

## Tranche map

| Tranche | Lens(es)                          | Theme                                                                                                                                                                  |
| ------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | CodeMirror/ProseMirror + textarea libs | **Caret coordinate primitive** — `code-editor/caret.ts`: a pure `caretCoords(text, offset, metrics)` (monospace `charWidth` × visual column, `lineHeight` × line, minus scroll) with tab-aware column expansion, plus a `.pre` DOM-`Range` path for wrap/tab fidelity, and a one-time `measureCharWidth(ta)`. The foundation. (S-1/S-7/S-9) |
| T2      | Lexical/TipTap                    | **Trigger detection + menu state** — `code-editor/slash-trigger.ts`: a pure `detectTrigger(text, caret)` → `{ start, query } \| null` (word-boundary `/`, query to caret, dismissal rules) + `filterCommands`; wired into the component as `slashOpen`/`slashStart`/`slashQuery`/`slashIndex` signals updated reactively. (S-2) |
| T3      | ProseMirror/TipTap + core         | **Caret-anchored command menu** — `code-editor/slash-menu.tsx`: a themed floating `role="listbox"` (mirroring `FindPanel` CSS conventions), anchored via a 0×0 caret-proxy at the T1 coords bridged to `useAnchorPosition`; ≥44px coarse targets; scroll-following. (S-3/S-6) |
| T4      | CodeMirror/Monaco                 | **Keyboard nav + undoable insertion** — conditional `ArrowUp`/`ArrowDown`/`Enter`/`Tab`/`Escape` bindings while open (reusing the `findOpen` pattern), `aria-activedescendant` on the textarea, and selection → `applyEdit` replacing the `/query` span (undoable). (S-4/S-5/S-6) |
| T5      | textarea libs + docs              | **Public API, registry & docs** — a `commands?: SlashCommand[]` prop + `SlashCommand` type + `openCommandMenu()` handle (exported from `index.ts`), i18n built-in strings, meta props/examples, README, regen (llms/registry), a Storybook story, and an `apps/site` EditorPage example. (S-8) |

Ordering rationale: **T1 first** — the caret primitive is the one true gap and the substrate T3 anchors against;
nothing visual works without it. **T2** is pure trigger/state logic, independently testable. **T3** renders + positions
the menu against T1. **T4** wires keyboard + insertion onto the open menu. **T5** is the public surface + docs. T1/T2
are independent and can land in parallel; T3 depends on T1; T4 depends on T2+T3; T5 depends on all.

---

## Out of scope

- **A contenteditable / rich-text rewrite.** The editor stays a **monospace `<textarea>`** where the browser owns
  editing, caret, IME, and undo. No ProseMirror/Lexical/Slate document model enters v54.
- **A new runtime dependency.** The caret math, trigger scan, menu, and positioning bridge are hand-rolled in
  `packages/editor/src/editor/code-editor/*` + the existing `@cascivo/core` `useAnchorPosition`. No floating-ui, no
  tippy, no `textarea-caret-position`, no `downshift`.
- **Async / LSP / network completion providers.** v54 ships a **synchronous, caller-supplied command list**
  (`commands` prop). Debounced async sources (Monaco's provider model, CodeMirror async `CompletionSource`) are a
  separate follow-up.
- **Rich block transforms (Notion-style "turn into heading").** This is a *code* editor; "slash commands" here means
  **snippet/command insertion or a side-effecting action**, not block-type mutation.
- **Multi-character / configurable trigger chars (`@`, `:`).** v54 ships the `/` trigger; a general typeahead-trigger
  registry (mentions/emoji) is a follow-up that reuses the T1/T2 primitives.
- **Regressing the signals-only rule or native a11y/IME.** No `useState`/`useEffect`/`useContext`/`useReducer`; the
  textarea keeps its native `textbox` role, IME composition, and undoable history.

---

## Definition of done (verified after T5)

- A pure `caretCoords(text, offset, metrics)` maps any offset to a `{ top, left }` pixel position (monospace path +
  a `.pre` `Range` path for tab/wrap), unit-tested without a DOM where possible; `measureCharWidth` runs once.
- Typing `/` at a word boundary opens a filtered command menu at the caret; typing narrows it; whitespace, caret
  movement away, backspacing past the `/`, or `Escape` dismisses it — all driven by `detectTrigger` + signals.
- The menu is a themed `role="listbox"` anchored at the caret via the caret-proxy → `useAnchorPosition` bridge,
  follows scroll, has ≥44px coarse targets, and sets `aria-activedescendant` on the textarea.
- `ArrowUp`/`ArrowDown`/`Enter`/`Tab` navigate + select, `Escape` closes; selecting a command replaces the `/query`
  span via `applyEdit` (undoable) or runs its action; focus returns to the textarea.
- A `commands?: SlashCommand[]` prop + `SlashCommand` type + an `openCommandMenu()` handle method are exported from
  `index.ts`; menu strings default from the `@cascivo/i18n` built-in catalog; the meta lists the new prop with an
  example.
- A Storybook story + an `apps/site` EditorPage example demonstrate the feature; `pnpm regen` drift is clean.
- `pnpm ready` green; the editor mobile sweep passes at 320/360/390/414; no off-scale `@media`/`@container` literals
  (`pnpm breakpoint:check`); **no runtime dependency added**; no banned hooks.

---

## Notes

- This roadmap began as a feasibility study (plan the gaps, do not implement) and is now **Shipped** — the tranche
  docs carry the task-by-task steps that were followed.
- The earlier feasibility analysis estimated **~2–3 days** for a solid v1, with the caret primitive (T1) and the menu
  UI/positioning (T3) as the bulk of the work and the rest reusing existing seams.
- A subtle correctness note carried into T2: the `/` keystroke **must type into the textarea normally** and be detected
  *reactively after input* — it must **not** be bound as a keymap command that `preventDefault`s, or the slash never
  reaches the document. (An early sketch got this wrong; the tranche pins it.)
- The verification figures (0 caret-to-pixel / trigger / slash-menu hits; the `findOpen`-while-open keyboard precedent;
  the monospace + `lineHeight` + `offsetToLineCol` foundation) were point-in-time reads of the branch at 2026-06-28 and
  were re-confirmed at implementation start.

---

## Implementation log (2026-06-28)

Shipped in one commit on `claude/slash-commands-research-dne00l` (PR #106); `pnpm ready` green (regen + format + build +
type-check + 139 editor tests) and `pnpm breakpoint:check` clean. **No runtime dependency added**; **signals only** (a
banned-hooks scan covers the new files).

- **T1 — caret coordinate primitive.** `code-editor/caret.ts`: a pure `caretCoords(text, offset, metrics)` (monospace
  `visualCol × charWidth` with tab-stop expansion, `line × lineHeight`, minus scroll), a `.pre` DOM-`Range` path
  (`caretRectFromPre`) for tab/soft-wrap fidelity, and a one-time `measureCharWidth` probe. 7 unit tests. **Closes S-1/S-7/S-9.**
- **T2 — trigger detection + menu state.** `code-editor/slash-trigger.ts`: pure `detectTrigger` (word-boundary `/`,
  whitespace-free query, backward scan stopping at the first whitespace/`/`) + `filterCommands`; wired into the component
  as `slashOpen`/`slashStart`/`slashQuery`/`slashIndex` signals updated by a `useSignalEffect` on `caretOffset`+`text`.
  The `/` types normally and is detected after input — never a keymap binding. 11 unit tests. **Closes S-2.**
- **T3 — caret-anchored command menu.** `code-editor/slash-menu.tsx` + `.module.css`: a themed `role="listbox"` mirroring
  `FindPanel`, positioned at a 0×0 caret-proxy (set to the T1 coords) bridged to `@cascivo/core`'s `useAnchorPosition`
  (`bottom-start`); ≥44px coarse targets. 3 component tests. **Closes S-3/S-6.**
- **T4 — keyboard nav + undoable insertion.** An `if (slashOpen.value)` keymap block (Arrow/Enter/Tab/Escape) added
  after the editable bindings so it overrides `Tab`/`Enter` while open — the same conditional-binding shape used for
  `Escape` when `findOpen`; `selectCommand` replaces the `/query` span via `applyEdit` (one undoable step) or runs
  `cmd.run(handle)`; `aria-expanded`/`aria-controls`/`aria-activedescendant` on the textarea; an Escape-dismissal guard
  (`slashDismissed`) so a dismissed trigger does not reactively reopen. 7 integration tests. **Closes S-4/S-5.**
- **T5 — public API, registry, i18n & docs.** A `commands?: SlashCommand[]` prop + the `SlashCommand` type +
  `openCommandMenu()` handle (exported from `index.ts`); `builtin.editor` menu strings (en + de); meta prop + example;
  a Storybook `SlashCommands` story; an `apps/site` EditorPage demo (+ the Preact `editor.d.ts` shim extended with
  `SlashCommand`/`commands`); regenerated registry/llms/context. **Closes S-8.**

### Notes from implementation (beyond the plan)

- **Stale-caret re-trigger.** An inserted snippet can itself contain `/` (e.g. `// TODO:`); a stale `caretOffset` would
  mis-read it as a new trigger. Fixed by syncing `caretOffset`/`selRef` after every programmatic slash edit
  (`selectCommand`, `openCommandMenu`) so detection sees the real post-insert caret.
- **`charWidth` is a signal, not a ref** — removing the only `useRef`-as-state gray area; refs are DOM-only.
- **apps/site shim.** The docs app types `@cascivo/editor` through a hand-written Preact shim
  (`apps/site/src/shims/editor.d.ts`); it was extended with `SlashCommand`, `CodeEditorHandle`, and the `commands` prop.
- **Anchored-menu mount visibility.** In the `useAnchorPosition` JS fallback (Firefox/Safari/jsdom; Chrome uses the CSS
  anchor path), a freshly-mounted floating element is `visibility:hidden` until first positioned — a known, accepted
  trait shared with `menu-button`/`popover`; the integration tests query the listbox with `{ hidden: true }` per the
  established convention.
