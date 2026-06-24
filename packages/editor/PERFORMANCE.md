# Editor performance — large documents

Can `@cascivo/editor` edit very long Markdown files? **Up to ~5,000 lines (~125 KB)
it is comfortable. Past that it degrades sharply**, because the per-line memo cache
is bounded at 5,000 entries and the whole document is re-tokenized on every render.
This doc records the measurements and where the limits are.

Reproduce with:

```sh
node --experimental-strip-types scripts/bench-large-doc.mjs
```

(uses the real `tokenizeDocument` + the built-in `markdown` grammar, over a document
of mostly-unique lines — a real Markdown file, not a repeated block. The bench and the
perf-regression test share one document generator, `makeMarkdownDoc` in
`src/engine/large-doc.fixture.ts`, so they describe the **same** document shape.)

## Perf budget (enforced)

A deterministic Vitest guard (`src/engine/tokenize-perf.test.ts`) instruments the
tokenizer with a test-only per-line "lines tokenized this render" counter and asserts:

> **lines tokenized per render ≤ `visibleRows + OVERSCAN*2 + k`** (k = 8 slack)

for a 50,000-line document. This is the regression gate for the windowed tokenizer —
it is **not** a wall-clock millisecond assertion (those are flaky across machines/CI).
It **fails** on today's O(document) `tokenizeDocument` path (counter ≈ 50,000) and goes
green once the view path tokenizes only the visible window. See master-plan **Decision 8**
(perf guarded deterministically). The wall-clock before/after numbers in the tables below
are refreshed separately when the windowed path lands.

## What the editor does per render

The DOM is already virtualized: above `VIRTUALIZE_THRESHOLD` (1,000 lines, and when
`wrap` is off) only the visible slice of rows is rendered, with spacer padding to
keep the scroll height. So **the DOM is not the bottleneck.**

The bottleneck is tokenization. On every render `CodeEditor` calls:

```ts
const lines = tokenizeDocument(getGrammar(language), highlightText.value)
```

over the **entire** document — windowing only limits which rows are rendered, not
what is tokenized. `tokenizeDocument` splits the full text and walks every line,
threading each line's end-state into the next (so fenced code / block state carries
across lines). Each line goes through a per-line memo (`tokenize`) keyed by
`(grammar, startState, line)`.

That memo is bounded:

```ts
const MAX_CACHE = 5000 // packages/editor/src/engine/tokenize.ts
```

The highlight pass is `requestAnimationFrame`-debounced, so typing itself is never
synchronously blocked — but the tokenize work still lands on the main thread one
frame later, and if it takes >16 ms it stalls scrolling and input.

## Measured: tokenization cost vs. document size

Markdown grammar, mostly-unique lines. `cold` = empty cache (first paint / language
switch). `warm` = cache already primed (steady-state re-render while scrolling).

| lines   | size   | cold (ms) | warm/render (ms) | state                     |
| ------- | ------ | --------- | ---------------- | ------------------------- |
| 500     | 12 KB  | ~10       | 0.5              | fully cached              |
| 1,000   | 24 KB  | ~7        | 1.5              | fully cached              |
| 2,000   | 49 KB  | ~16       | 2.5              | fully cached              |
| 5,000   | 125 KB | ~32       | ~10              | fully cached (cache full) |
| 10,000  | 250 KB | ~74       | **~110**         | **cache thrash**          |
| 25,000  | 631 KB | ~223      | **~273**         | **cache thrash**          |
| 50,000  | 1.3 MB | ~498      | **~554**         | **cache thrash**          |
| 100,000 | 2.6 MB | ~1,098    | **~1,117**       | **cache thrash**          |

And the cost of a **single keystroke** (one edit on a middle line, warm cache):

| lines  | re-tokenize per keystroke |
| ------ | ------------------------- |
| 2,000  | ~2 ms                     |
| 5,000  | ~10 ms                    |
| 10,000 | **~106 ms**               |
| 50,000 | **~587 ms**               |

## Where the limits are

There are two distinct ceilings:

1. **Hard cliff at 5,000 distinct lines (`MAX_CACHE`).** Below it, after the first
   paint every subsequent render is cache hits, so re-renders are cheap (≤10 ms) and
   a keystroke re-tokenizes only the edited line until the state reconverges
   (≤10 ms). The moment a document has **more than ~5,000 distinct lines, the cache
   can no longer hold them all** — each full-document pass evicts the entries the
   next pass needs, so it collapses to a near-total recompute _every render_. At
   10k lines that's ~110 ms per render and ~106 ms per keystroke; at 50k it's
   ~550 ms / ~590 ms. That is well past the point of a responsive editor (>16 ms
   drops frames; >100 ms feels broken).

2. **An O(n) floor even with a perfect cache.** Even if every line is a cache hit,
   `tokenizeDocument` still allocates a key string and does a `Map` lookup per line,
   and rebuilds the full `Token[][]` array, on every render. That's ~0.6 µs/line, so
   even a hypothetical unbounded cache bottoms out around ~60 ms/render at 100k lines.

The native `<textarea>` holding the full multi-MB string and the controlled
`value={text.value}` round-trip add some cost at the very top end (multi-MB), but
they are secondary to tokenization.

### Practical guidance

- **≤ 5,000 lines (~125 KB): fine.** This covers the overwhelming majority of
  hand-written Markdown — READMEs, docs pages, long notes, changelogs.
- **5,000–10,000 lines: usable but laggy**, especially while typing. Acceptable for
  read/occasional-edit, not for sustained editing.
- **> 10,000 lines: not recommended** with the current defaults — typing latency
  exceeds 100 ms and grows linearly.

## Options to raise the ceiling (not yet implemented)

In rough order of effort vs. payoff:

1. **Raise / make `MAX_CACHE` adaptive** (e.g. `max(5000, lineCount * 2)`). Cheapest
   change; pushes the cliff out roughly in proportion to the cache size, at the cost
   of memory (each entry is a small token array). A 50k-line doc would need ~50k+
   entries to stay warm.
2. **Tokenize only the windowed range plus the threaded prefix states.** Keep a
   persistent array of per-line end-states; on an edit, re-thread states only from
   the changed line until reconvergence, and build `Token[]` arrays only for visible
   rows. This makes per-render work O(viewport) instead of O(document) and is the
   real fix, but it's a non-trivial refactor of the tokenize/window seam.
3. **Move tokenization off the main thread** (worker) for very large docs — biggest
   change, only worth it if 50k+ line editing is a real target.

The benchmark script (`scripts/bench-large-doc.mjs`) is the harness to validate any
of these.
