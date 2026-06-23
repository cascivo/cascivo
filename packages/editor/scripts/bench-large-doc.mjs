// Benchmark: how does the editor's tokenizer scale on huge Markdown documents?
//
// Measures the work the <CodeEditor> performs on every render: it calls
// `tokenizeDocument(grammar, fullText)` over the WHOLE document each render,
// regardless of DOM windowing. This script isolates that cost (cold vs warm
// cache) across realistic document sizes, then reports where the per-line memo
// (MAX_CACHE = 5000) stops paying off.
//
// Run: node --experimental-strip-types scripts/bench-large-doc.mjs
import { tokenizeDocument, clearTokenizeCache } from '../src/engine/tokenize.ts'
import { getGrammar } from '../src/engine/registry.ts'
import '../src/grammars/builtins.ts'

const grammar = getGrammar('markdown')

/** A representative Markdown block — mixed headings, prose, lists, code, links. */
const BLOCK = `## Section heading

Some **bold** and _italic_ prose with a [link](https://example.com) and \`inline code\`.

- list item one
- list item two with *emphasis*
- [ ] an unchecked task
- [x] a checked task

> a blockquote line that carries on for a while to look like real text

\`\`\`ts
const x: number = 41 + 1
function f(a: string) { return a.length }
\`\`\`

| col a | col b |
| ----- | ----- |
| 1     | 2     |

Trailing paragraph with some more words to pad the line length out a bit further.
`

// Build a doc of mostly-UNIQUE lines (a real Markdown file is not a repeated
// block). Each emitted line gets a unique suffix so the per-line memo can't
// collapse the document down to a handful of distinct cache keys — this is what
// exposes the true MAX_CACHE = 5000 thrash cliff.
function makeDoc(lines) {
  const block = BLOCK.split('\n')
  const out = []
  let n = 0
  while (out.length < lines) {
    for (const l of block) {
      // Keep blank lines / fence delimiters intact (state-significant); pad the
      // rest with a unique token so each is a distinct cache key.
      out.push(l === '' || l.startsWith('```') ? l : `${l} #${n}`)
    }
    n++
  }
  return out.slice(0, lines).join('\n')
}

function timeIt(fn, runs = 1) {
  const t0 = performance.now()
  for (let i = 0; i < runs; i++) fn()
  return (performance.now() - t0) / runs
}

const SIZES = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000]

console.log('Editor tokenizer scaling — markdown grammar, MAX_CACHE = 5000\n')
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

  const note = lines > 5000 ? 'CACHE THRASH (> MAX_CACHE)' : 'fully cached'
  console.log(
    String(lines).padStart(7),
    String(bytes).padStart(9),
    cold.toFixed(2).padStart(9),
    warm.toFixed(2).padStart(9),
    ' ' + note,
  )
}

// Single-line edit in a large doc: how much re-tokenizes when the cache is warm?
// (Mimics typing one character — only changed line + until state reconverges.)
console.log('\nSingle-keystroke re-tokenize (warm cache):')
for (const lines of [2000, 5000, 10000, 50000]) {
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
