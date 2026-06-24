# cascivo — Roadmap v47: Editor Large-Document Performance — Windowed Tokenization

**Last updated:** 2026-06-24
**Status:** 📋 Planned — T1–T6 specified (benchmark+budget, line-state index, window-scoped tokenization,
edit/sync integration, wrap-mode + very-large strategy, docs/regen/gate). Not yet implemented.
**Plan documents:** `docs/superpowers/plans/2026-06-24-v47-master-plan.md` + tranches 1–6
**Builds on:** the **`@cascivo/editor`** package as shipped in v46 — the tokenizer engine
(`packages/editor/src/engine/{tokenize,registry,types}.ts`), the view layer
(`packages/editor/src/editor/view.tsx` — `renderRows`/`Gutter`), the `CodeEditor`
(`packages/editor/src/editor/code-editor/code-editor.tsx`, with line windowing `VIRTUALIZE_THRESHOLD = 1000`,
`OVERSCAN = 12`), the read-only `Highlight` (`packages/editor/src/editor/highlight/highlight.tsx`), the
controlled-sync + history machinery from v46 (`sync.ts`, `history.ts`), the benchmark + findings doc
(`packages/editor/scripts/bench-large-doc.mjs`, `packages/editor/PERFORMANCE.md`), and the `pnpm ready` gate.

> **Version note.** The latest shipped roadmap is **v46** (editor parity). This document is filed as **v47** —
> the next sequential slot. It follows up the v46 large-document **finding #7** ("validate windowing") with the
> measured reality: windowing fixed the DOM, but **tokenization is still O(document) per render**, which is the
> real ceiling for long Markdown files.

---

## Why this roadmap exists

v46 shipped DOM windowing and a benchmark. The benchmark (`packages/editor/PERFORMANCE.md`) then showed that the
editor is comfortable only up to **~5,000 lines (~125 KB)** of real (mostly-unique-line) Markdown. Past that it
degrades sharply — at 10k lines a single keystroke costs **~106 ms** of tokenization, at 50k **~587 ms** — well
past the threshold of a responsive editor. Markdown notes / generated docs / concatenated books routinely exceed
5,000 lines, so this is a real limit for the editor's stated use case ("edit real documents… Markdown").

This roadmap takes the **most promising fix from PERFORMANCE.md option #2 — windowed (incremental) tokenization**
— and plans it out: make the per-render tokenization cost **O(viewport)** instead of **O(document)**, inside the
existing textarea-overlay + owned-tokenizer model, with zero new runtime dependencies.

### Framing: fix the algorithm, not the architecture

The editor already virtualizes the **DOM** (only the visible row slice is rendered). The bug is that it still
**tokenizes the entire document on every render** before slicing:

```ts
// code-editor.tsx (and highlight.tsx) — runs over the WHOLE document every render
const lines = tokenizeDocument(getGrammar(language), highlightText.value)
// …then renderRows(lines, start, end) throws away everything outside [start, end)
```

The fix keeps the overlay model, the owned tokenizer, the grammars, and `renderRows`/`Gutter` exactly as they
are. It changes only **which lines get tokenized per render** (the visible window) and adds a small **persistent
per-line state index** so the grammar state needed to start the window is available without re-walking the whole
document each frame. This is the CodeMirror/Monaco approach (a line-state cache + viewport tokenization) reduced
to the minimum this overlay editor needs — no engine, no virtual document.

It does **not** chase the absolute top end (multi-hundred-thousand-line files) as a primary goal; a worker
offload is evaluated and explicitly deferred unless 50k+ editing becomes a real target.

---

## The findings, verified against today's code

Legend: ✅ already addressed · ⚠️ partially present · ❌ genuine gap.

| #   | Finding                                                            | Verified state today                                                                                                          | Tranche |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | DOM cost of large docs                                             | ✅ **windowed** — `VIRTUALIZE_THRESHOLD = 1000` + `OVERSCAN = 12`; only the visible slice is in the DOM (`renderRows(lines, start, end)`). Not the bottleneck. | —       |
| 2   | Tokenization is O(document) per render                            | ❌ **gap** — `tokenizeDocument(grammar, fullText)` walks every line on every render; windowing only slices the result. This is the ceiling. | T2, T3  |
| 3   | Per-line memo is bounded at `MAX_CACHE = 5000`                    | ⚠️ helps ≤5k distinct lines; **thrashes** above it (each full pass evicts what the next needs) → near-total recompute every render. | T2, T4  |
| 4   | Keystroke latency on long docs                                    | ❌ **gap** — warm-cache re-tokenize: 10k lines ~106 ms, 50k ~587 ms per keystroke (measured).                                  | T3, T4  |
| 5   | O(n) floor even with a perfect cache                              | ⚠️ even all-hits, `tokenizeDocument` allocates a key + Map-lookup per line and rebuilds the full `Token[][]` (~0.6 µs/line ≈ 60 ms at 100k). | T3      |
| 6   | `wrap` mode disables windowing                                    | ⚠️ **by design** — variable row heights; all rows render *and* tokenize. Re-tokenization can still be bounded; render stays O(n). | T5      |
| 7   | No perf regression guard                                          | ❌ **gap** — the benchmark is a manual script; nothing fails CI if per-render work regresses to O(document).                   | T1      |
| 8   | Correctness across cross-line state (fenced code, block comments) | ✅ today's full-document pass threads `GrammarState` line-to-line correctly; the windowed path **must preserve this** (a window starting mid-fence needs the right start state). | T2, T3  |

**Net:** the DOM is solved; **tokenization is the genuine gap.** The fix is a persistent line-state index (T2)
feeding window-scoped tokenization in the view path (T3), wired to the edit/sync path so edits invalidate only
the affected suffix (T4), with the `wrap` hole and the very-large-doc strategy handled and documented (T5), all
guarded by a perf regression test (T1) and shipped with refreshed docs/benchmarks (T6).

---

## What exists today (verified against the codebase)

| Area                  | State                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenizeDocument`    | `engine/tokenize.ts` — splits full text, threads `GrammarState` across lines, returns `Token[][]`. Per-line memo `tokenize()` keyed `(grammar, startState, line)`, **bounded `MAX_CACHE = 5000`**, approximate-LRU. |
| `CodeEditor`          | Calls `tokenizeDocument(grammar, highlightText.value)` **every render** (`code-editor.tsx:309`); computes the window (`start`/`end` from `scrollTop`/`lineHeight`/`viewport`) and calls `renderRows(lines, start, end, …)`. Highlight is rAF-debounced; windowing off when `wrap`. |
| `Highlight`           | Same full-document `tokenizeDocument` call (`highlight.tsx:48`), then renders all rows (read-only; no windowing).                                                  |
| `renderRows`/`Gutter` | `view.tsx` — already windowing-safe (absolute-index keys, spacer padding). Accepts `(lines, start, end, decorations)`. **No change needed to its contract** beyond receiving window-scoped input. |
| Benchmark             | `packages/editor/scripts/bench-large-doc.mjs` — measures cold/warm/keystroke cost across 500–100k lines on the markdown grammar. Manual (`node --experimental-strip-types`). |
| Findings doc          | `packages/editor/PERFORMANCE.md` — records the two ceilings (5k cliff + O(n) floor) and lists three fix options; option #2 (windowed tokenization) is this roadmap. |

---

## Target state (after v47)

| Concern                         | Today                                                       | Target                                                                                                       |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Per-render tokenization         | O(document) — every line, every render                      | **O(viewport)** — only the visible window (+ overscan) is tokenized into `Token[]`                            |
| Start-state for the window      | recomputed by re-walking from line 0 each render            | **persistent per-line state index** — start state for the first visible line is read, not recomputed         |
| Keystroke cost (50k lines)      | ~587 ms                                                     | re-thread only from the edited line until state reconverges, then tokenize the window — **bounded, sub-frame in the common case** |
| `MAX_CACHE = 5000` cliff        | hard cliff; thrash above 5k distinct lines                  | **removed as the limiter** — the window path no longer depends on the bounded line cache for steady state     |
| Correctness (fenced/block state) | correct via full-document threading                        | **identical output** — windowed tokens byte-match the full-document tokens (property-tested)                 |
| `wrap` mode                     | windowing + viewport tokenization both off                  | re-tokenization still **bounded** by the state index; rendering stays O(n) — documented, optional soft cap    |
| Regression guard                | none                                                        | a **deterministic perf test** asserts per-render tokenization is window-bounded (fails if it regresses to O(n)) |
| Out of scope                    | —                                                           | worker offload (evaluated, deferred), LSP/folding/minimap/multi-cursor/vim — stay out                         |

---

## Key open decisions (recommendations in the master plan)

1. **Incremental state index vs. just raise `MAX_CACHE`?** *Recommendation: **a persistent line-state index**
   (option #2), not merely a bigger cache (option #1).* Raising `MAX_CACHE` to `lineCount` defers the cliff but
   keeps every render O(n) (the ~60 ms floor at 100k stays). A per-line state index makes the **per-render** cost
   O(viewport) and the **per-edit** cost O(changed suffix until reconvergence) — the actual fix. Raising/removing
   the cache cap is a complementary cleanup folded into T4, not the headline.
2. **Where does window-scoped tokenization live?** *Recommendation: **a new engine entry
   `tokenizeRange(grammar, lines, from, to, stateIndex)`** plus a `LineStateIndex` object, consumed by
   `code-editor.tsx` and `Highlight`.* Keep `tokenizeDocument` for callers that genuinely want the whole document
   (and for the property test's oracle). The view path switches to: compute window → ensure states up to `from`
   → tokenize `[from, to)`.
3. **How is the start state for the first visible line obtained?** *Recommendation: **store per-line end-states in
   the index**; the start state of line `i` is the end-state of line `i-1`.* On a cold index, states are computed
   once on first paint (O(n) once, like today's cold pass). On scroll, states above the window are already known —
   no recompute. On edit, invalidate states from the changed line down and lazily recompute only as far as needed
   (to the bottom of the current window, or until reconvergence).
4. **How is an edit localized?** *Recommendation: **reuse v46's `diff()`** (`sync.ts`) to find the first changed
   line; invalidate the state index from there; re-thread until a recomputed end-state equals the stored one
   (reconvergence) or the window bottom is reached.* This is the same "re-tokenize from the edit until states
   reconverge" the per-line memo gave us for free below 5k lines — made explicit and unbounded by cache size.
5. **Keep correctness identical?** *Recommendation: **a property test** asserting `tokenizeRange(...)` over any
   window equals the corresponding slice of `tokenizeDocument(...)` for adversarial inputs (unclosed fences,
   block comments spanning the window boundary, edits inside a fence).* Cross-line state is the one place a
   windowed tokenizer can go wrong; pin it.
6. **`wrap` mode?** *Recommendation: **bound re-tokenization, accept O(n) rendering, document it**.* With wrap,
   row heights are variable so DOM windowing is off and all rows must render. The state index still makes **edits**
   cheap (only the changed suffix re-tokenizes); the irreducible cost is rendering N rows. Document the remaining
   limit; optionally offer a soft cap / "disable wrap above N lines" note. Do **not** build wrap-aware pixel
   virtualization (engine territory).
7. **Worker offload?** *Recommendation: **evaluate, defer**.* Once per-render is O(viewport), the main-thread cost
   is small for realistic docs; a worker adds message-passing complexity and async token delivery (flicker) for a
   case (>100k lines, sustained editing) that is out of the editor's stated scope. Record the decision; revisit
   only if a real target appears.
8. **Perf budget + guard?** *Recommendation: **a deterministic Vitest perf test** with a generous, machine-stable
   budget* — assert the **count** of lines tokenized per render is window-bounded (deterministic), not wall-clock
   ms (flaky). Instrument `tokenizeRange`/the index with a test-only counter; assert ≤ `window + overscan*2 + k`.

---

## Cross-cutting rules

1. **Stay in the overlay + owned-tokenizer model.** No engine, no virtual document, no `contenteditable`, zero new
   runtime deps. The `<textarea>` remains the editing surface; the tokenizer stays owned and pure.
2. **Identical output, byte-for-byte.** The windowed path must produce exactly the tokens the full-document path
   does for the same visible lines — verified by a property test against `tokenizeDocument` as the oracle. No
   visible change to highlighting; default render unchanged.
3. **Signals, not hooks (CLAUDE.md).** The line-state index is mutable infrastructure held in a `useRef` (like
   v46's history), not render state; DOM side effects via `useSignalEffect`; `useSignals()` first.
4. **Additive & backward-compatible.** No prop changes meaning; `tokenizeDocument` stays exported and working;
   `Highlight` stays read-only with identical output. `virtualize` prop semantics preserved.
5. **Correctness across cross-line state is non-negotiable.** Fenced code, block comments, template literals that
   span the window boundary must highlight correctly — the whole point of the state index.
6. **Perf is guarded, not just measured.** A deterministic regression test fails CI if per-render tokenization
   returns to O(document). The manual benchmark is refreshed with before/after numbers in `PERFORMANCE.md`.
7. **Full gate green before each commit.** `pnpm ready` (regen → `vp check --fix` → build → type check → tests),
   plus `breakpoint:check`/`fallback:check`. Generated artifacts (registry/llms/README) in sync; drift gate clean.
8. **Out-of-scope stays out.** Worker offload, wrap-aware pixel virtualization, LSP/folding/minimap/multi-cursor/
   vim are not built; the README/meta keep the parity boundary honest.

---

## Definition of Done

### T1 — Benchmark harness as a fixture + perf budget + regression guard

- [ ] The ad-hoc `scripts/bench-large-doc.mjs` is promoted to a reusable fixture (shared doc generator) and a
      deterministic **perf regression test** is added: it instruments the tokenizer with a test-only "lines
      tokenized this render" counter and asserts the count is window-bounded for a 50k-line doc (fails on O(n)).
- [ ] A documented **perf budget** (lines-tokenized-per-render ≤ `visibleRows + OVERSCAN*2 + k`) is recorded in
      `PERFORMANCE.md` and referenced by the test. No wall-clock assertions (machine-stable).
- [ ] `pnpm exec vp run @cascivo/editor#test` green; the new test **fails** against today's full-document path
      (proving it guards the right thing) and will pass after T3.

### T2 — Persistent per-line state index (incremental state threading)

- [ ] A pure `LineStateIndex` (new `engine/line-state.ts`): stores per-line end-states; `ensure(lines, upto)`
      computes states lazily up to a line; `invalidateFrom(line)` drops states at/after an edit; `startStateOf(i)`
      returns the threaded start state for line `i`. Framework-free, unit-tested.
- [ ] An `tokenizeRange(grammar, lines, from, to, index)` engine function tokenizes only `[from, to)`, using the
      index for the start state and updating it. Returns `Token[][]` for the range.
- [ ] **Property test:** for adversarial docs (unclosed/Nested fences, block comments crossing boundaries) and
      arbitrary `[from, to)`, `tokenizeRange` output equals `tokenizeDocument(...).slice(from, to)`. Exported from
      `engine/index` paths as needed; `tokenizeDocument` unchanged.

### T3 — Window-scoped tokenization in the view path

- [ ] `code-editor.tsx` no longer calls `tokenizeDocument` over the full text per render. It computes the window
      (`start`/`end`) first, calls `tokenizeRange(grammar, allLines, start, end, index)`, and feeds the window
      tokens to `renderRows`. The line-state index lives in a `useRef`, seeded on mount and rAF-refreshed like the
      highlight text. `Gutter` count still reflects total lines.
- [ ] `Highlight` uses the same range path for its rendered window (read-only; identical output). Decorations,
      find-match highlighting, bracket matching, and the active-line gutter still align (they map offsets → the
      same rows).
- [ ] The T1 perf test now **passes** (per-render lines tokenized is window-bounded at 50k). Highlighting output
      is unchanged (snapshot/property check). No banned hooks.

### T4 — Edit & controlled-sync integration + cache rework

- [ ] On every edit (typing, indent, undo/redo, find-replace, `applyEdit`, external controlled `value`), the state
      index is invalidated from the first changed line (via v46's `diff()` in `sync.ts`) and lazily re-threaded —
      not rebuilt from line 0. Keystroke cost on a 50k-line doc is bounded by the changed suffix until
      reconvergence, **not** the document length (measured in `PERFORMANCE.md`).
- [ ] The bounded per-line memo `MAX_CACHE` is reworked: either removed (the index supersedes it for the window) or
      raised/justified — no path depends on a 5,000-entry cap for steady-state correctness or speed. Memory stays
      O(document end-states) ≈ a small int/array per line.
- [ ] Tests: editing inside a fenced block mid-document recolors correctly; undo/redo restore highlighting; a
      programmatic `value` swap re-seeds the index without a full-document stall; find/replace decorations still
      land on the right ranges.

### T5 — Wrap-mode handling + very-large-document strategy

- [ ] With `wrap` on, edits still re-tokenize only the changed suffix (the index applies); the irreducible O(n)
      **render** cost is documented in `README`/`PERFORMANCE.md`, with an optional, documented soft guidance
      ("disable wrap above ~N lines") — no behavior change that hides content.
- [ ] The worker-offload option is evaluated and **explicitly deferred** in `PERFORMANCE.md` + the component meta
      `whenNotToUse`, with the trigger that would reopen it (sustained 100k+-line editing).
- [ ] Re-run the benchmark; record **before/after** numbers (e.g. 50k-line keystroke from ~587 ms → bounded) in
      `PERFORMANCE.md`; the cliff/floor section is rewritten to reflect the windowed path.

### T6 — Docs, meta, registry, Storybook, regen & gate

- [ ] `PERFORMANCE.md` refreshed (post-fix table + methodology), `packages/editor/README.md`/`readme.body.md`
      large-document section updated, `CHANGELOG.md` + `package.json` version bumped, `code-editor.meta.ts` notes
      the large-document support, `docs/ROADMAP-V47.md` status flipped to Shipped.
- [ ] A **`LargeDocument`** Storybook story (and/or an `apps/docs/src/pages/EditorPage.tsx` section) lets a
      reviewer scroll/edit a 50k-line doc and feel the windowed path; React stories call `useSignals()`, no banned
      hooks; both apps build without a prior full build (editor source alias intact).
- [ ] `pnpm regen` + drift gate clean; full CI gate green (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`,
      `breakpoint:check`, `fallback:check`); grep sweep confirms the new engine surface reached the meta, README,
      and tests.
