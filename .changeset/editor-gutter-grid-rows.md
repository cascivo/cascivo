---
'@cascivo/editor': minor
'@cascivo/tokens': patch
'@cascivo/eslint-plugin': patch
'cascivo': patch
'@cascivo/docs': patch
'@cascivo/docspack': patch
'@cascivo/mcp': patch
---

Editor: line numbers, the current-line highlight and the left gutter all survive a soft wrap

Reported from an adopter running `CodeEditor` with `wrap` over markdown, and reproduced in
Chromium against the shipped CSS: with soft wrap on, a single long line broke the whole left
edge of the editor.

- **Line numbers drifted one row per wrap.** The gutter was a separate column whose rows were
  one line box each, while the code column's rows grew with the text. A line that wrapped to two
  visual rows put `6` next to the continuation of line 5, and the last line got no number at all.
  The number and its line are now adjacent cells of **one CSS grid row**, so the row grows once
  and both grow with it — there is nothing left to keep in sync.
- **The current-line highlight lit only the first visual row** of a wrapped line: it was
  positioned by `caretLine * 1lh` and was `1lh` tall. Under wrap it is now placed on the caret's
  grid row and takes that row's height, so it covers every visual row of the line. Not wrapping,
  where rows are uniform and large documents window to a slice, keeps the arithmetic.
- **The gap between the border and the code could collapse to nothing.** It was padding on the
  gutter and on the highlight/edit layers, and a host reset — Tailwind Preflight's
  `* { padding: 0 }` is the one that hit — outranks `@layer cascivo.component`. The gutter's
  width is now a grid track, the gap after it a `column-gap`, and the textarea's alignment an
  `inset-inline-start`. A `padding: 0` reset can collapse none of the three, so the editing
  surface also cannot drift off the layer it is overlaid on.

Two new override points come with it, both documented on `CodeEditor` and `Highlight`:
`--cascivo-editor-gutter-width` (default: as wide as the widest line number) and
`--cascivo-editor-gutter-gap`. Line numbers stay `aria-hidden` and unselectable, so they are
neither announced nor copied with the code, and they now stay visible in forced-colors mode,
where the highlight layer used to be hidden wholesale.
