---
'@cascivo/eslint-plugin': minor
'@cascivo/eslint-config': minor
'@cascivo/tokens': minor
'cascivo': minor
---

Enforce the styling contract: a `--cascivo-*` token or `data-cascivo-*` hook that does not
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
