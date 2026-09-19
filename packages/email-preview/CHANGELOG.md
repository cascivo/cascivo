# @cascivo/email-preview

## 2.0.0

### Minor Changes

- ccab95a: Email: a button really does follow its cell now, and the preview can render your brand

  Two open items from the weeklyfoo newsletter's second report, both measured.

  - **`Column` and `Section` were defeating their own `align` attribute.** They stated
    alignment twice — as the `align` attribute and again as `text-align` in the style — and
    the two do different things. `align` on a cell is a legacy presentational hint that also
    moves _block-level_ children, which is what every button, card and alert here is; a plain
    `text-align` does not, and being the explicit declaration it won. So
    `<Column align="right">` full of a `Button` rendered hard left. The attribute is now the
    only statement of it. Measured in Chromium at all three alignments: `center` and `right`
    were both affected.

    `ButtonProps.align` claimed a button with no `align` follows its cell. Removing the old
    `'left'` default was only half of that, and the docstring shipped a release ahead of the
    behaviour — an adopter deleted their explicit props on the strength of it and their
    feedback row splayed again. It is true now, and the docstring says exactly when it is not
    (a cell aligned by hand with `style={{ textAlign }}`).

  - **The preview can render a brand palette.** `renderEmail`'s `theme` takes
    `EmailTheme | Palette` and the token docs call a `Palette` the way to rebrand, but the
    preview's dropdown only listed the shipped twelve — so the package's own answer to "how
    do I use my brand" was the one thing its preview could not express, and the byte gauge
    was wrong by whatever the palette costs (a measured 10% on a newsletter whose font stack
    is repeated 124 times).

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

### Patch Changes

- Updated dependencies [ccab95a]
  - @cascivo/email@0.4.0

## 1.0.0

### Minor Changes

- fc01c42: Email: a publishable preview, responsive layout primitives, and `cascivo email lint`

  Reported by the weeklyfoo newsletter after migrating four templates.

  - **`@cascivo/email-preview` is published, with a bin.** `npx @cascivo/email-preview ./emails`
    serves a directory of templates — default export rendered, optional `subject` and
    `previewProps` named exports, hot reload through Vite. The recipe used to document
    `pnpm --filter @cascivo/email-preview dev`, which is a workspace filter and worked only
    inside this monorepo; everyone else got "No projects matched the filters" and wrote their
    own preview server. The package moves from `apps/` to `packages/` so it reaches the drift
    feed and the packaging gates like every other published package.
  - **`Container` is responsive by default** and **`Column` takes `stack`.** A 600px table
    will not lay out below its contents' min-content width, so `max-width: 100%` never
    prevented the sideways scroll every mobile reader was getting. Measured at 320px: 280px of
    overflow before, none after. Both halves are needed — a fluid container does nothing for a
    `Row` until its columns stack, which is why `stack` exists rather than being implied.
  - **`className` on the layout primitives, and a `Style` primitive.** A media query needs
    something to select and somewhere to live; `Style` blocks are hoisted into `<head>` and
    deduplicated. This replaces the `[style*='--flag']` attribute-selector workaround an
    adopter had to invent, which is worse supported than a plain class.
  - **`Button` no longer defaults `align` to `'left'`.** A button is its own table carrying its
    own `align`, so that default beat the `align` of any `Column` around it and
    `<Column align="right"><Button/></Column>` rendered hard left. With no attribute emitted it
    follows the cell, verified in a browser.
  - **`cascivo email lint <file...>`** runs the conformance check on rendered HTML, fetching
    and caching the Can I email matrix so every adopter stops writing the same twelve lines.
    Reads stdin with `-`, takes a local matrix with `--data`, exits non-zero only on a blocked
    finding.
  - A Playwright suite now asserts no shipped template scrolls sideways at 320/360/390/414,
    with a negative control proving the rule is what prevents it. Nothing caught this class of
    bug before: the conformance lint reads CSS feature support, not layout.
  - `@cascivo/docs` and `@cascivo/docspack` carry the rewritten email recipe — the preview
    command that now works outside this repo, the responsive rules, and `simulate()`, which
    was exported and useful but documented nowhere outside the `.d.ts`.

### Patch Changes

- Updated dependencies [fc01c42]
  - @cascivo/email@0.3.0
