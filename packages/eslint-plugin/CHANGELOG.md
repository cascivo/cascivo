# @cascivo/eslint-plugin

## 0.2.1

### Patch Changes

- a076a68: Editor: line numbers, the current-line highlight and the left gutter all survive a soft wrap

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

## 0.2.0

### Minor Changes

- 00c1a9e: Enforce the styling contract: a `--cascivo-*` token or `data-cascivo-*` hook that does not
  exist is now reported instead of silently doing nothing.

  CSS drops an unknown custom property without a word, and a selector that matches nothing is
  not an error either — so a misspelled token had no diagnostic anywhere in the toolchain. It
  found `--cascivo-button-bg`, taught as the worked example of the override ladder's first rung
  in four guides and defined by no stylesheet in the repo.

  - **`@cascivo/eslint-plugin`** adds `cascivo/token-values`, which reports an unknown
    `--cascivo-*` custom property in a JSX `style` prop (through the `as CSSProperties` cast
    React forces) and names the token that exists, including when the words are in the wrong
    order (`--cascivo-text-color` → `--cascivo-color-text`).
  - **`@cascivo/eslint-config`** enables it at `warn` as `cascivoTokenValues`.
  - **`@cascivo/tokens`** publishes `./style-contract` and `./style-contract.json`:
    `CascivoComponentToken`, `CascivoAnyToken`, `CascivoStyleHook`, and `CascivoTokenStyle` for
    `satisfies`-checking an inline style before the cast erases the name.
  - **`cascivo`** adds the `unknown-token` and `unknown-style-hook` audit rules at error level,
    covering CSS files as well as TSX.

  All four read one generated name set, so they cannot disagree with each other or with the
  shipped CSS.

  **Button gains the per-variant background tokens the docs had been promising.**
  `--cascivo-button-{primary,secondary,ghost,destructive}-bg`, plus `-bg-hover` for each and
  `-bg-active` for primary, each falling back to the semantic default it replaced — so nothing
  changes until you set one. This is the rung-1 lever for restyling one button family without
  moving `--cascivo-color-primary` under every other primary surface in the subtree. The
  foreground deliberately stays on the semantic tier: a background light enough to need dark
  text still needs `--cascivo-color-primary-fg` set alongside it.

## 0.1.1

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.
