# Editor performance — large documents

Can `@cascivo/editor` edit very long Markdown files? **Yes — well past the old
~5,000-line comfort ceiling.** As of v47 the editor tokenizes only the **visible
window** on every render (O(viewport)), not the whole document (O(document)), and an
edit re-tokenizes only the **changed suffix** until the grammar state reconverges —
not the whole file. The old 5,000-entry per-line cache cap (the cliff) is gone. This
doc records the measurements and where the remaining limits are.

Reproduce with:

```sh
node --experimental-strip-types scripts/bench-large-doc.mjs
```

(uses the real `tokenizeDocument` / `tokenizeRange` + the built-in `markdown` grammar,
over a document of mostly-unique lines — a real Markdown file, not a repeated block.
The bench and the perf-regression test share one document generator, `makeMarkdownDoc`
in `src/engine/large-doc.fixture.ts`, so they describe the **same** document shape.)

## Perf budget (enforced)

A deterministic Vitest guard (`src/engine/tokenize-perf.test.ts`) instruments the
tokenizer with a test-only "lines re-tokenized this render" counter (incremented on a
real `grammar.tokenizeLine` call — a cache miss — not on a reuse hit) and asserts:

> **lines tokenized per render ≤ `visibleRows + OVERSCAN*2 + k`** (k = 8 slack)

for a 50,000-line document. This is the regression gate for the windowed tokenizer —
it is **not** a wall-clock millisecond assertion (those are flaky across machines/CI).
It **fails** on the pre-v47 O(document) `tokenizeDocument` path (counter ≈ 50,000) and
**passes** on the windowed path. A companion test (`code-editor/perf.test.tsx`) asserts
a mid-document **keystroke** is bounded by the changed suffix, not the document length.
See master-plan **Decision 8** (perf guarded deterministically).

## What the editor does per render

The DOM is virtualized: above `VIRTUALIZE_THRESHOLD` (1,000 lines, and when `wrap` is
off) only the visible slice of rows is rendered, with spacer padding to keep the scroll
height. So **the DOM is not the bottleneck.** This holds from the **first paint** too:
the textarea is measured in a post-paint effect, so until then the line height/viewport
are unknown — the initial render falls back to a cheap top slice (`INITIAL_WINDOW_ROWS`)
rather than committing every row, and the measurement narrows it to the real viewport on
the next frame. Resizes and late web-font loads re-measure (via `ResizeObserver` and
`document.fonts.ready`) so the windowed layer stays aligned with the textarea caret.

Since v47, tokenization is windowed too. On every render `CodeEditor`:

```ts
const allLines = highlightText.value.split('\n') // count only — no token arrays
// …compute the visible window [start, end) from scrollTop / lineHeight / viewport…
const rows = tokenizeRange(getGrammar(language), allLines, start, end, index)
```

`tokenizeRange` tokenizes **only `[start, end)`**, using a persistent `LineStateIndex`
(`src/engine/line-state.ts`) for the window's start-state instead of re-walking the
document from line 0. The index memoizes the grammar **end-state after each line**
(line `i`'s start-state is line `i-1`'s end-state), so:

- **Scrolling** never recomputes states above the window — they are read from the index.
- **Editing** invalidates the index from the first changed line (via v46's `diff`), and
  the next render re-threads only from there until the state reconverges or the window
  bottom is reached.

A **far scrollbar jump** to a region the index has not threaded yet is the one case that
would otherwise require walking every intervening line at once (a freeze proportional to
the jump distance). When the gap exceeds `WALK_BUDGET` lines the window paints
*approximately* (seeded from the grammar's initial state) and a per-frame catch-up effect
threads the prefix `WALK_BUDGET` lines per frame until it converges and the window turns
exact — so a 50k-line slam costs a handful of bounded frames, never one long freeze. The
highlight is only briefly approximate, and only if the jump lands inside an still-open
multi-line construct (block comment, fence). During momentum/fling scrolling — where
scroll events are throttled below frame rate — the scroll position is also resampled each
frame so the windowed highlight (the only visible text; the textarea is transparent)
stays pinned to the textarea instead of flashing blank.

The per-line memo (`tokenize`, keyed `(grammar, startState, line)`) is now **unbounded**
— the cliff-causing `MAX_CACHE = 5000` cap is removed. It no longer needs a cap because
`tokenizeRange` only ever builds token arrays for the window, so the memo grows with the
lines actually viewed and never evicts a line a later render still needs.

The highlight pass is `requestAnimationFrame`-debounced, so typing is never synchronously
blocked.

## Measured: whole-document vs. windowed

Markdown grammar, mostly-unique lines, measured on the bench harness above. The
whole-document numbers are the **pre-v47** per-render cost (every line tokenized); the
windowed numbers are the **v47** path (only the visible window).

Whole-document tokenization (BEFORE — the cost the windowed path avoids):

| lines   | size   | cold (ms) | warm/render (ms) |
| ------- | ------ | --------- | ---------------- |
| 5,000   | 125 KB | ~19       | ~2               |
| 10,000  | 250 KB | ~40       | ~4               |
| 25,000  | 631 KB | ~97       | ~10              |
| 50,000  | 1.3 MB | ~200      | ~21              |
| 100,000 | 2.6 MB | ~380      | ~44              |

Single-keystroke re-tokenize — **BEFORE vs. AFTER**:

| lines   | whole-document (BEFORE) | windowed (AFTER) |
| ------- | ----------------------- | ---------------- |
| 2,000   | ~0.6 ms                 | **~0.02 ms**     |
| 5,000   | ~1.8 ms                 | **~0.02 ms**     |
| 10,000  | ~4.8 ms                 | **~0.03 ms**     |
| 50,000  | ~22 ms                  | **~0.02 ms**     |
| 100,000 | ~48 ms                  | **~0.02 ms**     |

The windowed keystroke is **flat across document size** — it re-tokenizes only the
visible window (plus the changed suffix until reconvergence), so 100k lines costs the
same as 2k. (Historically, _with_ the old `MAX_CACHE = 5000` cap, a 50k-line keystroke
thrashed the cache and cost **~587 ms**; removing the cap and windowing the work is what
this roadmap, v47, did.)

## Where the limits are

The two pre-v47 ceilings are gone:

1. **The 5,000-line `MAX_CACHE` cliff is removed.** The line-state index supersedes the
   bounded memo for steady-state correctness and speed, and the memo itself is now
   unbounded, so there is no eviction thrash. Documents with far more than 5,000 distinct
   lines no longer collapse to a near-total recompute every render.

2. **The O(n) per-render floor is now O(viewport).** Per render the tokenizer builds
   `Token[]` arrays only for the visible window, not the whole document, so the cost is
   independent of document length. The remaining O(n) cost is the **`wrap` render path**
   (below) and the native `<textarea>` holding the full multi-MB string (secondary).

### `wrap` mode (soft-wrap)

With `wrap` on, row heights are **variable**, so DOM windowing is disabled and **every
row renders** — rendering is **O(n)** regardless of the tokenization win. This is
irreducible without wrap-aware pixel virtualization, which is out of scope (engine
territory). **Edits stay cheap** under `wrap` — the index/memo still re-tokenize only the
changed suffix — but the render cost grows with the line count. Content is never hidden
(no `display:none`). **Guidance:** disable `wrap` for very large documents (≳10k lines)
if sustained editing matters; read-only or occasional-edit wrapped viewing is fine.

### Practical guidance

- **Long-form Markdown — generated docs, concatenated books, big notes — is in scope.**
  Scrolling and typing stay smooth well past 50,000 lines with the default (windowed)
  path.
- **Disable `wrap` above ~10,000 lines** for sustained editing (render is O(n) under
  `wrap`).
- **Beyond ~100,000 lines with sustained editing**, reach for a full editor framework /
  dedicated worker pipeline (see below).

## Options considered

1. **Raise / make `MAX_CACHE` adaptive** — a complementary cleanup, **not** the fix. It
   would defer the cliff but keep every render O(document). Superseded: the cap is removed
   and the index makes per-render work O(viewport).
2. **Windowed (viewport-scoped) tokenization** — **shipped (v47).** A persistent
   `LineStateIndex` + `tokenizeRange` make per-render work O(viewport) and per-edit work
   O(changed suffix until reconvergence). This is the fix; everything above measures it.
3. **Move tokenization off the main thread (worker)** — **evaluated and deferred.** Now
   that per-render is O(viewport), the main-thread tokenization cost is small for realistic
   documents (sub-millisecond keystrokes even at 100k lines). A worker adds message-passing
   complexity and async token delivery (highlight flicker) for a case outside the editor's
   stated scope. **Trigger to revisit:** a real, sustained **100,000+-line editing** target
   (not read-only display). The bench script remains the harness to re-validate if that
   trigger fires.

The benchmark script (`scripts/bench-large-doc.mjs`) is the harness to validate any of
these.
