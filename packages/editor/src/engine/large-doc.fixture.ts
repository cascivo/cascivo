// Shared large-document generator for the benchmark (`scripts/bench-large-doc.mjs`)
// and the deterministic perf-regression test (`tokenize-perf.test.ts`). Keeping it
// in one place means the bench numbers and the test budget describe the *same*
// document shape. Pure and dependency-free (no grammar import, no DOM) so both a
// `.mjs` bench and a `.ts` Vitest test can import it.

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

/**
 * Build a Markdown document of `lines` mostly-UNIQUE lines (a real Markdown file
 * is not a repeated block). Each emitted line gets a unique `#${n}` suffix so the
 * per-line memo can't collapse the document down to a handful of distinct cache
 * keys — this is what exposes the true tokenization cost (and, historically, the
 * `MAX_CACHE = 5000` thrash cliff). Blank lines and ```` ``` ```` fence delimiters
 * are kept **verbatim**: they are state-significant, so padding them would change
 * cross-line grammar state.
 */
export function makeMarkdownDoc(lines: number): string {
  const block = BLOCK.split('\n')
  const out: string[] = []
  let n = 0
  while (out.length < lines) {
    for (const l of block) {
      out.push(l === '' || l.startsWith('```') ? l : `${l} #${n}`)
    }
    n++
  }
  return out.slice(0, lines).join('\n')
}
