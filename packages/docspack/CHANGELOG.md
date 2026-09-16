# @cascivo/docspack

## 0.2.4

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

- ccab95a: Email: a button really does follow its cell now, and the preview can render your brand

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

## 0.2.3

### Patch Changes

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

## 0.2.2

### Patch Changes

- 5da5a77: Ship #235's docs surface, and make `cascivo-docs <topic>` fall back to a guide

  #235 was released as `@cascivo/email` only, but two other published packages carry
  part of that change and neither was named in a changeset — so the work is merged and
  invisible to adopters, which is the failure mode `docs/RELEASING.md` calls a
  correctness property rather than a preference.

  Both packages build their payload from `apps/site/public/` at publish time, so a
  version bump is the only way their content moves:

  - **`@cascivo/docs`** copies that surface into `content/`. #235 added the
    `recipe-email` and `email-client-support` guides and gave `llms.txt` /
    `llms-full.txt` their first `@cascivo/email` section. Without a release,
    `npx @cascivo/docs guide recipe-email` still answers "no doc".
  - **`@cascivo/docspack`** reshapes the same surface into its `.llms/` chunks, so
    `docspack ask` indexes the email package only from a published version.

  `@cascivo/docs` also carries a CLI fix from #235: a bare topic now falls back to a
  guide of the same slug, and an unresolved topic suggests near matches instead of
  dead-ending. An adopter typed `cascivo-docs email` and got `no doc for "email"` while
  `guide recipe-email` sat right there.

  No API change in either package — the bump exists to move already-merged content.

## 0.2.1

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

## 0.2.0

### Minor Changes

- 51ca93a: New package: `@cascivo/docspack` — cascivo's documentation in the [docspack](https://docspack.dev)
  format, so an agent can search it offline instead of reading it.

  `@cascivo/docs` ships the documentation as whole files to print. This ships the same
  documentation as a local search index: `pnpm add -D @cascivo/docspack docspack`, `npx docspack
sync`, and `npx docspack ask "<question>"` answers from `~/.docspack/store.db` with no network
  access, scoped to the versions the lockfile installed. One line in `AGENTS.md` or `CLAUDE.md` is
  the whole agent setup, and `npx docspack mcp` serves the same index over MCP for clients that
  prefer a declared tool.

  The payload is generated from the same `apps/site/public/` surface `pnpm regen` produces — ~600
  chunks covering every component, chart, block, layout, section, flow and editor reference, the
  concept guides, and the overview — so it cannot lag the source. Chunks carry the tags, variants,
  states and prop names from `registry.json`, which a generic Markdown build cannot know, and each
  one repeats its import line so a retrieved fragment still tells an agent where the component
  comes from. `docspack doctor --strict` and a 20-question retrieval eval both run in CI.
