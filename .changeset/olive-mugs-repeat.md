---
'@cascivo/editor': patch
---

Fix the current-line marker lagging the caret on large documents, and take the
remaining O(document) work out of the editor's hot paths.

Windowing the tokenizer left a second document-scale cost around it: every
offset-to-line question was answered by scanning or splitting the whole text.
`syncCaret` ran `value.slice(0, caret).split('\n').length` **three times per
keystroke** (`input`, `keyup`, `selectionchange`); the render re-split the document
on **every scroll frame**; and find decorations did one scanning lookup **per match**,
which is quadratic. Each also allocated one string per line — ~150,000 transient
strings per keystroke at 50k lines. The visible result was the current-line marker
trailing the caret, which on a transparent textarea is the only cue for where an edit
will land.

A new internal `LineIndex` (an `Int32Array` of line-start offsets, memoized by text
identity) makes line count a field and offset-to-line a binary search. On a
50,000-line document a caret move goes from ~6.4 ms to ~0.001 ms, a scroll frame
recomputes nothing, and find decorations over 50,000 matches go from ~258 s to
~7.5 ms. No public API change.
