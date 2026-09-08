# @cascivo/eslint-plugin

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
