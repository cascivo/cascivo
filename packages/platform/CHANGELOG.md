# @cascivo/platform

## 0.0.5

### Patch Changes

- 5c89efa: Four silent-output defects fixed, and the guards that let them ship.

  **`Dropdown` separators no longer eat the item.** `{ label, value, separator: true }` renders
  only a rule — the label, value and icon are discarded, with no type error and no warning. An
  adopter lost a "Log out" entry to it and found out only because a smoke test counted rows.
  There is now a `{ kind: 'separator' }` union member that cannot carry data. The legacy flag
  renders exactly as before (no silent behaviour change on a minor) and dev-warns when it is
  combined with a non-empty label, which is the one unambiguous case.

  **`CalendarHeatmap` no longer crops its own grid.** Cell size came from the container width
  while height was a constant that never consulted it, so 119 days in a 1054px card drew 434px
  of grid inside a 160px viewBox and cut off rows 3–7 — output that reads as "this heatmap has
  three rows of data". Cells are clamped to the height budget, which changes the rendering _if
  and only if_ it was already clipping: a year-length range is untouched. New `maxCellSize` caps
  cells further and is opt-in with no default, because a fixed default would have shrunk ranges
  that render correctly today.

  **`Field` now names the control it wraps.** `TagsInput` hardcoded `aria-label="Tags"` on its
  inner input, and `aria-label` outranks a `<label for>` association — so `<Field
label="Production domains">` produced a control named "Tags" with its hint never announced, a
  WCAG 1.3.1/4.1.2 failure in the composition the guides prescribe. `Field` now also passes
  `aria-labelledby` pointing at its own `<Label>`, so a control drops its built-in fallback name
  only when something really is naming it, and a standalone control keeps its name. A new guard
  sweeps every form control through a `Field` and found four more with the same defect:
  `Search` (built-in label concatenated with the Field's), `Combobox` and `DatePicker` (own
  hint/error ids replaced the Field's instead of merging), `ColorPicker` and `Editable` (never
  took the wiring at all — `Editable` put it on a wrapper `div`, not the focusable element).

  **`DataTable` measures its own overflow** and dev-warns with the real `scrollWidth` /
  `clientWidth` and the sized columns to change. The sizing arithmetic depends on a container
  width the adopter cannot see, so a paragraph of rules of thumb could never be enough; three
  passes were reported. In production, where the warning is stripped, pure-CSS scrolling shadows
  mark the cut edge.

  **Line/AreaChart warn on epoch-millisecond x values.** `x` is typed `number | Date` and the
  scale is picked from the runtime type, so returning `Date.now()`-shaped numbers labels the axis
  `1,787,250,000,000`. The warning names the `Date` fix. The scale is deliberately _not_ inferred
  from magnitude: that would break genuinely numeric series with no opt-out, trading a visible
  wrong output for an invisible one.

  **One name, one meaning.** The 14 form controls with a visible `label` now also declare
  `ariaLabel`, so the invisible name is discoverable beside the visible one instead of arriving
  only through an undocumented spread `aria-label`. `Toggle.label` was already documented as
  visible on every surface — source TSDoc, manifest, `registry.json`, `llms.txt`, the site props
  table — and an adopter still got the text twice, because a doc only reaches someone who
  suspects they need it. `Filter` accepts `multiple` alongside `multi`, and `Steps` accepts
  `items` alongside `steps`: you cannot read the doc comment of a prop you do not know exists.

  **`ChartText` replaces `Text` in `@cascivo/charts`** — the last cross-package name collision,
  and the one whose wrong resolution was silent (the SVG primitive renders where a paragraph was
  meant). `Text` remains as a deprecated alias until 1.0.

  **The published `.d.ts` is greppable.** Import and export specifier lists are one name per
  line: the longest line drops from 7190 to 259 characters, `grep ThemeProviderProps` finds it
  (it previously matched nothing despite the name being present), and a component-name grep no
  longer dumps a 7.2 kB export list. `llms.txt`'s "self-contained" claim is corrected to state
  what is actually true — the vocabulary types come from `@cascivo/react/types`, because
  inlining them makes the dts bundler alias every prop to `ToneInput$1`.

  **Quick-starts recommend `@cascivo/themes/light-dark.css`.** They recommended `all.css` while
  describing it as "light & dark", which had been wrong since 0.14.0 — it is all twelve themes —
  so every new adopter was handed roughly twice the CSS they needed.

  `Step`, `ActionSheetAction`, `DateRangePreset`, `ProgressStep` and `SideNavGroup` gain `id`
  and are keyed on it, so reordering or inserting entries no longer re-uses the wrong DOM node.

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

- Updated dependencies [f1c8292]
- Updated dependencies [a0bb1cf]
  - @cascivo/tokens@1.0.0

## 0.0.4

### Patch Changes

- 00b74e9: Run the release train so the stranded 0.17.0 reaches npm and the recovery path
  gets exercised on a real release.

  No package source changed in this PR — the fixes are the Tag visual baselines
  and `release.yml`'s new `Publish any stranded versions` step. But `release.yml`
  only triggers on pushes that touch `.changeset/**`, so without a changeset
  merging it would not start a release at all, and the step meant to unstrand
  0.17.0 would sit unverified until some unrelated changeset happened to land.

  Bumping the whole published set matches the 2026-08-11 changeset it lands
  beside: npm is behind `main` on every package, not just the ones whose source
  moved, and a partial bump would leave the rest still disagreeing.

- Updated dependencies [00b74e9]
  - @cascivo/tokens@0.5.11

## 0.0.3

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/tokens@0.5.10

## 0.0.2

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/tokens@0.5.9
