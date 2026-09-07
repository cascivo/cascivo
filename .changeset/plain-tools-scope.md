---
'@cascivo/react': patch
---

`scripts/tsdoc/generate.ts` now searches only inside `export interface …Props` blocks, which
is what its own contract has always claimed ("Only `…Props` interfaces").

It was a whole-file `findIndex` on the member name, so whenever a sibling interface declared
_above_ the props one happened to share a member name, the sibling won. Two effects, both
shipped:

- **Wrong docs on a public type.** The boolean `loading` prop's `@defaultValue false` block
  landed on `ComboboxLabels.loading` and `MultiSelectLabels.loading`; the boolean `selectAll`
  prop's on `MultiSelectLabels.selectAll`; and the boolean `alpha` prop's "When true, enables
  alpha (opacity) selection / @defaultValue true" on `ColorPickerLabels.alpha` — all four are
  strings naming a control. That text feeds the generated props tables, `llms/*.md` and
  `context/*.md`, so the docs were stating a default that does not exist for the field it was
  attached to.
- **Missing docs on the real prop.** Whenever an item/option interface declaring the same
  member sat above the props one, the props member never received its block at all and
  rendered `—` for its default. `OverflowMenu`, `SegmentedControl`, `ToggleGroup`, `MenuButton`,
  `CommandMenu`, `ColorPicker`, `Candlestick` and `ScatterChart` are documented now.

The four wrongly-placed blocks are removed from source in the same change.
