// Benchmark: how does the editor's tokenizer scale on huge Markdown documents?
//
// Measures the work the <CodeEditor> performs on every render: it calls
// `tokenizeDocument(grammar, fullText)` over the WHOLE document each render,
// regardless of DOM windowing. This script isolates that cost (cold vs warm
// cache) across realistic document sizes, then reports where the per-line memo
// (MAX_CACHE = 5000) stops paying off.
//
// Run: node --experimental-strip-types scripts/bench-large-doc.mjs
import { tokenizeDocument, tokenizeRange, clearTokenizeCache } from '../src/engine/tokenize.ts'
import { createLineStateIndex } from '../src/engine/line-state.ts'
import { getGrammar } from '../src/engine/registry.ts'
import { makeMarkdownDoc as makeDoc } from '../src/engine/large-doc.fixture.ts'
import '../src/grammars/builtins.ts'

const grammar = getGrammar('markdown')

function timeIt(fn, runs = 1) {
  const t0 = performance.now()
  for (let i = 0; i < runs; i++) fn()
  return (performance.now() - t0) / runs
}

const SIZES = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]

console.log('Whole-document tokenization scaling — markdown grammar (pre-v47 per-render cost)\n')
console.log(
  'lines'.padStart(7),
  'bytes'.padStart(9),
  'cold ms'.padStart(9),
  'warm ms'.padStart(9),
  'warm/render note',
)
console.log('-'.repeat(70))

for (const lines of SIZES) {
  const doc = makeDoc(lines)
  const bytes = doc.length

  // Cold: empty cache (first paint / language switch).
  clearTokenizeCache()
  const cold = timeIt(() => tokenizeDocument(grammar, doc), 1)

  // Warm: cache already populated — the steady-state per-render cost while the
  // user scrolls or the highlight layer re-runs without the text changing.
  clearTokenizeCache()
  tokenizeDocument(grammar, doc) // prime
  const warm = timeIt(() => tokenizeDocument(grammar, doc), 5)

  const note = 'whole-document O(n)/render'
  console.log(
    String(lines).padStart(7),
    String(bytes).padStart(9),
    cold.toFixed(2).padStart(9),
    warm.toFixed(2).padStart(9),
    ' ' + note,
  )
}

// BEFORE (whole-document path): a single-line edit re-tokenizes the WHOLE document
// every render (what the editor did before v47). The cost is the full pass — and
// above MAX_CACHE the warm cache thrashed, so even a keystroke paid ~O(document).
console.log('\nSingle-keystroke re-tokenize — whole-document path (BEFORE, ms):')
for (const lines of [2000, 5000, 10000, 50000, 100000]) {
  const doc = makeDoc(lines)
  clearTokenizeCache()
  tokenizeDocument(grammar, doc) // prime full cache
  const arr = doc.split('\n')
  const mid = Math.floor(arr.length / 2)
  const edited = [...arr]
  edited[mid] = edited[mid] + ' x' // one-char-ish edit on a middle line
  const next = edited.join('\n')
  const ms = timeIt(() => tokenizeDocument(grammar, next), 5)
  console.log(`  ${String(lines).padStart(7)} lines → ${ms.toFixed(2)} ms`)
}

// AFTER (windowed path, v47): tokenize ONLY the visible window via tokenizeRange +
// a persistent LineStateIndex. A keystroke invalidates from the changed line and
// re-tokenizes the viewport-scoped window — bounded by the changed suffix, not the
// document length. VISIBLE ≈ visibleRows + OVERSCAN*2 for a typical viewport.
const VISIBLE = 50
console.log('\nSingle-keystroke re-tokenize — windowed path (AFTER, ms):')
for (const lines of [2000, 5000, 10000, 50000, 100000]) {
  const arr = makeDoc(lines).split('\n')
  const mid = Math.floor(arr.length / 2)
  const start = Math.max(0, mid - Math.floor(VISIBLE / 2))
  const end = Math.min(arr.length, start + VISIBLE)
  clearTokenizeCache()
  const index = createLineStateIndex(grammar)
  tokenizeRange(grammar, arr, start, end, index) // prime the window + prefix states
  const edited = [...arr]
  edited[mid] = edited[mid] + ' x'
  const ms = timeIt(() => {
    index.invalidateFrom(mid)
    tokenizeRange(grammar, edited, start, end, index)
  }, 5)
  console.log(`  ${String(lines).padStart(7)} lines → ${ms.toFixed(2)} ms`)
}
