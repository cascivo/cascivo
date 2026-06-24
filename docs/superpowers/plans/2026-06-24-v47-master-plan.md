# v47 — Editor Large-Document Performance: Windowed Tokenization — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@cascivo/editor` edit **long Markdown documents** (well beyond the current ~5,000-line comfort
ceiling) by changing per-render tokenization from **O(document)** to **O(viewport)**. v46 windowed the **DOM** but
still tokenizes the **entire** document on every render (`tokenizeDocument(grammar, fullText)`), which the v46
benchmark proved is the real limit: at 10k lines a keystroke costs ~106 ms, at 50k ~587 ms. Introduce a
**persistent per-line state index** + a **`tokenizeRange`** engine entry, switch the `CodeEditor`/`Highlight`
view path to tokenize only the visible window, wire it to the edit/controlled-sync path so an edit re-threads only
the changed suffix until state reconvergence, rework the bounded `MAX_CACHE = 5000` memo that causes the cliff,
handle the `wrap` hole, and guard the win with a **deterministic perf regression test**. Stay inside the
textarea-overlay + owned-tokenizer model — **zero new runtime deps**, identical highlighting output. **Do not**
build a worker offload, wrap-aware pixel virtualization, or any full-engine feature (LSP, folding, minimap,
multi-cursor, vim) — they stay the documented `whenNotToUse` boundary. The companion study
(`docs/ROADMAP-V47.md`) verifies each finding against the current code and records the decisions.

Target state (verified after T6):

| Finding (severity)                                      | Today                                          | Target                                                                          |
| ------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Tokenization O(document) per render (🔴)                | every line tokenized every render              | **O(viewport)** via `tokenizeRange` + line-state index                          |
| `MAX_CACHE = 5000` cliff (🔴)                           | thrash above 5k distinct lines                 | cache no longer the limiter; index supersedes it for the window                 |
| Keystroke latency on long docs (🔴)                     | 10k ~106 ms / 50k ~587 ms                       | re-thread only changed suffix until reconvergence — bounded, sub-frame common   |
| Start-state for window (🟠)                             | re-walked from line 0 each render              | persistent per-line end-states; `startStateOf(i)` is a read                     |
| Correctness across cross-line state (🟠)                | correct (full-document threading)              | **identical** windowed output, property-tested against `tokenizeDocument`       |
| `wrap` mode O(n) render (🟡)                            | windowing + tokenization both off              | edits still bounded by index; O(n) render documented + optional soft guidance   |
| Perf regression guard (🟠)                              | manual benchmark only                          | deterministic Vitest test asserts window-bounded lines-per-render               |
| Worker offload (scope)                                  | —                                              | evaluated + **deferred**, recorded in `PERFORMANCE.md` + meta                    |
| Full CI gate (`pnpm ready`)                            | green                                          | green                                                                            |

**Architecture & evidence (reproduced in-repo before planning):**

- **The bug:** `packages/editor/src/editor/code-editor/code-editor.tsx:309` —
  `const lines = tokenizeDocument(getGrammar(language), highlightText.value)` runs over the **whole** document on
  every render; `renderRows(lines, start, end, …)` then renders only `[start, end)`. `Highlight`
  (`editor/highlight/highlight.tsx:48`) does the same full-document call. Windowing (`VIRTUALIZE_THRESHOLD = 1000`,
  `OVERSCAN = 12`) limits the **DOM**, not the tokenization.
- **Tokenizer:** `engine/tokenize.ts` — `tokenizeDocument(grammar, text)` splits the text, threads `GrammarState`
  line-to-line, returns `Token[][]`. Per-line `tokenize()` is memoized in a `Map` keyed `(grammar, startState,
  line)`, **bounded `MAX_CACHE = 5000`** with approximate-LRU eviction. Above 5k distinct lines, each
  full-document pass evicts entries the next pass needs → near-total recompute every render (the cliff). Even with
  a perfect cache, the per-line key-build + Map-lookup + `Token[][]` rebuild is an ~0.6 µs/line **O(n) floor**.
- **View layer:** `editor/view.tsx` — `renderRows(lines, start, end, decorations)` and `Gutter` are already
  windowing-safe (absolute-index keys, spacer padding). They consume a `Token[][]`; they don't care whether it
  covers the whole doc or just the window — so feeding them a **range-scoped** `Token[][]` (indexed so
  `lines[start..end]` align) is the seam.
- **Edit/sync machinery (v46):** `editor/code-editor/sync.ts` exposes `diff(prev, next)` (prefix/suffix change) +
  `rebaseSelection`; `history.ts` owns undo/redo snapshots; `commit()`/the external-change `useSignalEffect` in
  `code-editor.tsx` are the single places text changes. These are the hooks for **invalidating the state index**
  from the first changed line.
- **Benchmark + findings:** `packages/editor/scripts/bench-large-doc.mjs` (cold/warm/keystroke across 500–100k
  lines) and `packages/editor/PERFORMANCE.md` (the two ceilings + three fix options; option #2 = this plan).
- **CLAUDE.md constraints:** signals only (no `useState`/`useEffect`/`useContext`/`useReducer`); `useSignalEffect`
  for DOM side effects; `useRef` only for DOM/handle/mutable infra; React apps call `useSignals()` first; i18n
  built-ins; reduced-motion + forced-colors safe; static fallback before progressive CSS; no off-scale
  breakpoint literals.

**Tech Stack:** owned TypeScript in `@cascivo/editor` (no new runtime deps); `@cascivo/core` signals/`cn`; the
existing tokenizer + `renderRows`/`Gutter` view; `useRef` for the line-state index (mutable infra, like v46's
history); Vitest + Testing Library for unit/property/perf tests; vite+ (`vp`) for check/build/test; `pnpm regen` +
drift gate for generated artifacts (registry/llms/README).

---

## Tranche Overview

| Tranche | Title                                                       | Goal                                                                                                                                                  |
| ------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1      | Benchmark fixture + perf budget + regression guard          | Promote `bench-large-doc.mjs` to a reusable fixture; add a **deterministic** Vitest perf test (instrumented "lines tokenized per render" counter, window-bounded budget) that **fails** on today's O(document) path. Locks the target before changing code. |
| T2      | Persistent per-line state index + `tokenizeRange`           | New pure `engine/line-state.ts` (`LineStateIndex`: end-states, `ensure`/`invalidateFrom`/`startStateOf`) + `tokenizeRange(grammar, lines, from, to, index)`. Property-tested to equal `tokenizeDocument(...).slice(from, to)` for adversarial cross-line inputs. `tokenizeDocument` untouched. |
| T3      | Window-scoped tokenization in the view path                 | Switch `code-editor.tsx` + `Highlight` to compute the window first, then `tokenizeRange` only `[start, end)` using a `useRef` index. T1 test goes green; highlighting output byte-identical; decorations/find/brackets/active-line still align. |
| T4      | Edit & controlled-sync integration + cache rework           | Invalidate the index from the first changed line (v46 `diff()`) on every edit path (typing, indent, undo/redo, find-replace, `applyEdit`, external `value`); lazily re-thread until reconvergence. Rework/remove the `MAX_CACHE` cap. Correctness tests (edit inside a fence, undo, programmatic swap). |
| T5      | Wrap-mode handling + very-large-doc strategy + measurement  | Bound re-tokenization under `wrap` (render stays O(n) — documented); evaluate + **defer** worker offload (recorded in `PERFORMANCE.md` + meta); re-run benchmark, record before/after, rewrite the cliff/floor section. |
| T6      | Docs, meta, registry, Storybook, regen & gate               | Refresh `PERFORMANCE.md`/README/CHANGELOG/version/meta; add a `LargeDocument` Storybook story (+ optional docs section) to scroll/edit a 50k-line doc; `pnpm regen` + drift + full gate + grep sweep; flip `docs/ROADMAP-V47.md` to Shipped. |

Ordering rationale: **T1 first** locks the target with a test that fails today and passes after T3 — the
test-first spine for a perf change. **T2** builds the pure, framework-free engine pieces (state index +
`tokenizeRange`) with a property test pinning correctness against the existing `tokenizeDocument` oracle — the
riskiest part (cross-line state) is proven in isolation before any wiring. **T3** swaps the view path to the
range tokenizer (the visible win; T1 turns green). **T4** makes edits cheap by invalidating only the changed
suffix and removes the cache cliff (consumes v46's `diff()`/`commit` seam). **T5** closes the `wrap` hole and
records the worker decision + measured before/after. **T6** lands all docs/registry/regen + the full gate and the
tryable Storybook demo. T2→T3→T4 share the engine seam and are sequenced for one reviewer; T6 finalizes.

---

## Files Created / Modified per Tranche

### T1 — Benchmark fixture + perf budget + regression guard

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/engine/large-doc.fixture.ts` (shared doc generator extracted from the bench script) |
| Create | `packages/editor/src/engine/tokenize-perf.test.ts` (deterministic window-bounded lines-per-render guard) |
| Modify | `packages/editor/scripts/bench-large-doc.mjs` (import the shared fixture; keep CLI output)     |
| Modify | `packages/editor/PERFORMANCE.md` (document the perf budget the test enforces)                  |

### T2 — Persistent per-line state index + `tokenizeRange`

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Create | `packages/editor/src/engine/line-state.ts` (`LineStateIndex`: end-states, `ensure`/`invalidateFrom`/`startStateOf`) |
| Modify | `packages/editor/src/engine/tokenize.ts` (`tokenizeRange(grammar, lines, from, to, index)`; optional test-only tokenized-line counter) |
| Modify | `packages/editor/src/index.ts` (export `tokenizeRange`, `LineStateIndex` type — engine seam)  |
| Create | `packages/editor/src/engine/line-state.test.ts`, `packages/editor/src/engine/tokenize-range.test.ts` (property test vs. `tokenizeDocument`) |

### T3 — Window-scoped tokenization in the view path

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (compute window → `tokenizeRange` over `[start,end)`; index in `useRef`) |
| Modify | `packages/editor/src/editor/highlight/highlight.tsx` (same range path; identical read-only output) |
| Modify | `packages/editor/src/editor/view.tsx` (only if `renderRows`/`Gutter` need a range-indexed input contract; otherwise untouched) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.test.tsx`, `highlight.test.tsx` (output-unchanged + window-bounded assertions) |

### T4 — Edit & controlled-sync integration + cache rework

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (invalidate index from first changed line on `commit`/external-sync/undo/redo/find-replace/`applyEdit`) |
| Modify | `packages/editor/src/engine/tokenize.ts` (rework/remove `MAX_CACHE`; the index supersedes it for steady state) |
| Modify | `packages/editor/src/editor/code-editor/perf.test.tsx` (keystroke re-tokenize bounded by changed suffix, not doc length) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.test.tsx` (edit-inside-fence recolor, undo highlighting, programmatic-swap re-seed) |

### T5 — Wrap-mode handling + very-large-doc strategy + measurement

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/src/editor/code-editor/code-editor.tsx` (wrap path uses the index for edit invalidation; no render-virtualization change) |
| Modify | `packages/editor/scripts/bench-large-doc.mjs` (add a windowed-path measurement mode if useful) |
| Modify | `packages/editor/PERFORMANCE.md` (before/after numbers; rewrite cliff/floor; `wrap` limit; worker deferred) |
| Modify | `packages/editor/src/editor/code-editor/code-editor.meta.ts` (`whenNotToUse`: worker/100k+ boundary) |

### T6 — Docs, meta, registry, Storybook, regen & gate

| Action | Path                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| Modify | `packages/editor/readme.body.md` (→ `README.md` via regen) large-document section             |
| Modify | `packages/editor/CHANGELOG.md`, `packages/editor/package.json` (`VERSION` + version bump)      |
| Modify | `packages/editor/src/editor/code-editor/code-editor.meta.ts` (intent/notes), `registry.json` (via `pnpm regen` where generated) |
| Create | `apps/storybook/stories/editor/code-editor-large-doc.stories.tsx` (or a `LargeDocument` story in the existing file) |
| Modify | `apps/docs/src/pages/EditorPage.tsx` (optional large-document section), `docs/ROADMAP-V47.md` (status → Shipped) |
| Verify | `pnpm regen`; drift gate; full gate (`vp check`, `pnpm build`, `vp run -r check`, `pnpm test`, `breakpoint:check`, `fallback:check`); grep sweep |

---

## Key Decisions

### Decision 1 — Windowed tokenization (option #2), not a bigger cache (firm)

`PERFORMANCE.md` lists three fixes. Option #1 (raise/adapt `MAX_CACHE`) only defers the cliff and **keeps every
render O(n)** — the ~60 ms floor at 100k lines stays, and memory grows to one cache entry per distinct line.
**Decision: implement option #2 — a persistent per-line state index + viewport-scoped `tokenizeRange`, making
per-render work O(viewport) and per-edit work O(changed suffix until reconvergence).** Raising/removing the cache
cap is a *complementary* cleanup in T4, not the fix. Option #3 (worker) is evaluated and deferred (Decision 7).
Rejected: shipping only a bigger cache (treats the symptom, not the O(n) cause).

### Decision 2 — A `LineStateIndex` of per-line end-states is the core data structure (firm)

**Decision: a mutable, framework-free `LineStateIndex` storing the `GrammarState` *after* each line.** The start
state of line `i` is the end-state of line `i-1` (line 0 starts at `grammar.initialState`). `ensure(lines, upto)`
computes states lazily up to a line index (memoizing as it goes); `invalidateFrom(line)` truncates known states at
an edit; `startStateOf(i)` returns the threaded start state (computing on demand). It lives in a `useRef` in the
component (mutable infrastructure, exactly like v46's `createHistory()` handle) — never render state, never a
banned hook. Rejected: recomputing states from line 0 each render (today's cost) and stuffing states into the
bounded per-line `Map` (the thing that thrashes).

### Decision 3 — `tokenizeRange` is a new engine entry; `tokenizeDocument` stays (firm)

**Decision: add `tokenizeRange(grammar, lines, from, to, index): Token[][]` to `engine/tokenize.ts`** — it ensures
states up to `from` via the index, then tokenizes `[from, to)` (reusing the per-line `tokenize()` for token reuse
within the window), updating the index with fresh end-states. **`tokenizeDocument` is left exactly as is** — it
remains the public whole-document API and, crucially, the **oracle** the T2 property test checks `tokenizeRange`
against. The view path returns a `Token[][]` aligned so index `start..end` map to the rendered rows (a sparse/
offset array or a `{ from, rows }` shape — chosen in T2 to keep `renderRows` simple). Rejected: overloading
`tokenizeDocument` with range params (muddies the oracle) and a separate parallel tokenizer (drift risk).

### Decision 4 — Edits invalidate from the first changed line via v46's `diff()` (firm)

**Decision: reuse `diff(prev, next)` from `sync.ts` to locate the first changed line on every text change, call
`index.invalidateFrom(changedLine)`, and let the next render's `tokenizeRange` lazily re-thread from there until a
recomputed end-state equals the stored one (reconvergence) or the window bottom is reached.** This is exactly the
"re-tokenize from the edit until states reconverge" behavior the per-line memo gave us *below* 5k lines — made
explicit and no longer bounded by cache size. All edit entry points funnel through `commit()` and the
external-change effect, so there is one invalidation site per path. Rejected: invalidating the whole index on any
edit (back to O(n)) and trying to diff at the character level for sub-line precision (line granularity is what the
tokenizer needs).

### Decision 5 — Identical output is proven by a property test against `tokenizeDocument` (firm)

Cross-line grammar state (fenced code, block comments, template literals) is the one place a windowed tokenizer
can silently corrupt highlighting — a window that starts mid-fence must begin in the fence state. **Decision: a
property test generates adversarial documents (unclosed fences, nested/adjacent fences, block comments crossing
the window boundary, edits inside a fence) and asserts `tokenizeRange(grammar, lines, from, to, index)` deep-equals
`tokenizeDocument(grammar, text).slice(from, to)` for arbitrary `[from, to)` and after arbitrary invalidations.**
This pins correctness independent of the component. Rejected: trusting manual cases (the boundary conditions are
exactly the easy-to-miss ones).

### Decision 6 — `wrap` mode: bound edits, accept O(n) render, document it (recommended)

With `wrap`, row heights are variable, so DOM windowing is off and every row must render — that O(n) render cost
is irreducible without wrap-aware pixel virtualization (engine territory, out of scope). **Decision: the state
index still makes *edits* cheap under wrap (only the changed suffix re-tokenizes), but rendering N rows stays O(n);
document the remaining limit in README/`PERFORMANCE.md` and optionally surface soft guidance ("disable wrap above
~N lines").** Never hide content. Rejected: building wrap-aware virtualization (scope/complexity) and silently
capping wrapped rendering.

### Decision 7 — Worker offload: evaluate, defer (recommended)

**Decision: once per-render is O(viewport), the main-thread tokenization cost is small for realistic documents; a
worker adds message-passing complexity and async token delivery (highlight flicker) for a case (>100k lines,
sustained editing) outside the editor's stated scope. Record the evaluation + the deferral in `PERFORMANCE.md` and
the meta `whenNotToUse`, with the explicit trigger to revisit (a real 100k+-line editing target).** Rejected:
building it speculatively now (premature; the overlay editor's niche is "tiny + owned").

### Decision 8 — Perf is guarded deterministically, not by wall-clock (firm)

Wall-clock ms assertions are flaky across machines/CI. **Decision: instrument the tokenizer with a test-only
"lines tokenized this render" counter and assert it is window-bounded (`≤ visibleRows + OVERSCAN*2 + k`) for a
50k-line document.** This is deterministic and fails precisely when the path regresses to O(document). The
wall-clock benchmark (`bench-large-doc.mjs`) stays the human-facing measurement, refreshed with before/after
numbers in T5. Rejected: asserting milliseconds (flaky) and trusting the manual benchmark alone (no CI guard).

---

## Cross-Tranche Rules

1. `pnpm exec vp check` after each tranche; `pnpm ready` green before each commit.
2. **Overlay + owned-tokenizer model, zero runtime deps.** No engine, no virtual document, no worker (this
   version), no diff/keybinding library; package keeps peer-only deps + `"sideEffects": ["**/*.css"]`.
3. **Signals, not hooks.** No `useState`/`useEffect`/`useContext`/`useReducer`; `useSignalEffect` for DOM side
   effects; `useRef` only for the textarea/handle/line-state index; `useSignals()` first in every React surface.
4. **Additive & backward-compatible.** `tokenizeDocument` stays exported + unchanged; `Highlight` stays read-only
   with **byte-identical** output; no prop changes meaning; `virtualize` semantics preserved; default render
   unchanged.
5. **Correctness is non-negotiable.** The windowed path must equal the full-document path for the same visible
   lines, including cross-line state — pinned by the T2 property test and re-checked in T3/T4 component tests.
6. **Perf guarded, not just measured.** The deterministic lines-per-render test (T1) gates the change; the
   wall-clock benchmark records before/after (T5). Neither uses flaky timing assertions in CI.
7. **Generated artifacts in sync.** Engine/prop/string changes flow through `pnpm regen`; registry/llms/README
   regenerate; drift gate (`pnpm regen && vp check --fix && git diff --exit-code`) green; generated files
   committed.
8. **Out-of-scope stays out.** Worker offload, wrap-aware pixel virtualization, LSP/folding/minimap/multi-cursor/
   vim are not built; the README + meta keep the parity boundary honest.
