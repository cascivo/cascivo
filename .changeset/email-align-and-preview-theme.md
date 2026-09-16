---
'@cascivo/email-preview': minor
'@cascivo/email': minor
'@cascivo/docs': patch
'@cascivo/docspack': patch
---

Email: a button really does follow its cell now, and the preview can render your brand

Two open items from the weeklyfoo newsletter's second report, both measured.

- **`Column` and `Section` were defeating their own `align` attribute.** They stated
  alignment twice — as the `align` attribute and again as `text-align` in the style — and
  the two do different things. `align` on a cell is a legacy presentational hint that also
  moves _block-level_ children, which is what every button, card and alert here is; a plain
  `text-align` does not, and being the explicit declaration it won. So `<Column
align="right">` full of a `Button` rendered hard left. The attribute is now the only
  statement of it. Measured in Chromium at all three alignments: `center` and `right` were
  both affected.

  `ButtonProps.align` claimed a button with no `align` follows its cell. Removing the old
  `'left'` default was only half of that, and the docstring shipped a release ahead of the
  behaviour — an adopter deleted their explicit props on the strength of it and their
  feedback row splayed again. It is true now, and the docstring says exactly when it is not
  (a cell aligned by hand with `style={{ textAlign }}`).

- **The preview can render a brand palette.** `renderEmail`'s `theme` takes `EmailTheme |
Palette` and the token docs call a `Palette` the way to rebrand, but the preview's dropdown
  only listed the shipped twelve — so the package's own answer to "how do I use my brand" was
  the one thing its preview could not express, and the byte gauge was wrong by whatever the
  palette costs (a measured 10% on a newsletter whose font stack is repeated 124 times).

  A template can now `export const theme`, beside `subject` and `previewProps`. It is the
  selected entry by default and resets on every template change, so a directory of
  differently-branded templates each renders right without anyone matching a global dropdown
  to a per-template design. `--theme <file>` adds shared palettes for a whole directory.

- **`--allow <file>` and a template-level `export const allow`** merge into the conformance
  panel's allowlist, so a project that waives a slug in CI stops seeing a finding its own
  lint does not report.

- **`className` on `Card` and `Text`**, the two elements the common responsive cases need a
  hook on — a panel that changes padding, a hero that changes size. The first cut gave
  classes to the layout primitives only.

- **`Container` takes a `breakpoint`**, defaulting to its own width, so a design spec that
  names 620px and the markup can say the same number.
