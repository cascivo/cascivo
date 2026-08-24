---
'@cascivo/react': major
'@cascivo/core': major
'@cascivo/charts': major
'@cascivo/editor': major
'@cascivo/flow': major
'@cascivo/i18n': major
'@cascivo/storage': major
'@cascivo/ai': major
---

Remove the deprecated surfaces the 1.0 contract clears, and give deprecation an expiry.

**Eleven removals.** Each has had a replacement shipping for at least one minor, each was
struck through in your editor, and `docs/RECIPE-DASHBOARD.md` already told adopters the
charts alias was "removed at 1.0".

- **A value-carrying `onChange` is gone from eight components** — `Combobox`, `DatePicker`,
  `Filter`, `NumberInput`, `Search`, `Swap`, `TimePicker`, `Toggle`. Use `onValueChange`; it
  receives exactly the same argument, and both have been accepted since the alias was added.
  This is the catalog's handler-naming rule (`onValueChange` carries a value, `onChange`
  carries a DOM `ChangeEvent`) applied to the components that predate it.

  `Toggle`, `NumberInput` and `TimePicker` extend an HTML element's attributes, and they keep
  `Omit<…, 'onChange'>` deliberately: dropping the Omit as well would let the native
  `ChangeEventHandler` take the name back, so an adopter passing a value-carrying handler
  would compile and then be called with an event — a silent break. The other five are plain
  interfaces with no HTML base, so `onChange` is simply not a prop. Either way, passing it is
  a compile error that names the fix.

- **`@cascivo/charts` no longer exports `Text` / `TextProps`** — use `ChartText` /
  `ChartTextProps`. This alias collided with `@cascivo/react`'s typography component and the
  wrong resolution was silent: the SVG primitive rendered where a paragraph was meant and
  nothing errored.

- **`BarChart` drops `xTicks` / `yTicks`** — use `valueAxisTicks` / `categoryAxisTicks`. The
  removed pair was named for where an axis is _drawn_, so its meaning swapped with
  `orientation`: `yTicks={1}` silently did nothing on a horizontal chart while `xTicks={1}`
  worked, and `xLabelEvery` did not swap at all (2026-07-28 report C17b). The role-named
  props mean the same thing on both orientations. `ScatterChart` keeps `xTicks`/`yTicks` —
  both of its axes are value axes, so screen-position naming is correct there.

- **`Dropdown` drops the `separator: true` flag on a row** — use a separate
  `{ kind: 'separator' }` entry. The flag marked the row _as_ a rule rather than drawing one
  above it, discarding its `label`, `value` and `icon`; an adopter lost a "Log out" item to it
  and only noticed because a smoke test counted rows (2026-08-22 report item 9). The dev-only
  warning that existed to catch that goes with it.

**`OverflowMenu` is NOT removed.** Its manifest promised removal "in v4", not at 1.0, and
breaking a published promise early is the same defect as letting one slip. It now carries
`removeIn: '2.0.0'`, keeps working for the whole `1.x` line, and `Menu` remains the
replacement.

**Deprecation gains an expiry.** `ComponentDeprecation` requires `removeIn` — the major that
removes the old name — alongside `since`. It renders on every surface the manifest feeds, so
the expiry is discoverable before you adopt the old name rather than after it disappears, and
`deprecation-surfaces` fails the build if a deprecation names no major or is still shipping in
the major it promised to leave. Both failure modes were verified by mutation. Before this,
`overflow-menu` carried "removed in v4" as free prose in a `note` — a version that exists on
no cascivo package — and nothing could tell whether it was overdue.
