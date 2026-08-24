# Upgrading cascivo

cascivo has two consumption paths, so it has two upgrade stories: **npm
packages** (`@cascivo/react`, `@cascivo/core`, …) upgrade with a version bump,
and **copied components** (installed via `cascivo add`) upgrade with a merge.
This page covers both, plus where changes are recorded.

---

## The stability contract

cascivo's public API is **covered by semver from 1.0.0 onward**. Below 1.0 it was not:
a minor could break you. This section is the contract — what is promised, what is not,
and for how long.

### What a version bump means

| Bump      | From 1.0.0 onward                                                        | Before 1.0 (historical)                |
| --------- | ------------------------------------------------------------------------ | -------------------------------------- |
| **major** | may remove or change covered API; every removal was deprecated first     | n/a                                    |
| **minor** | adds API; never removes or changes covered API                           | may include breaking changes           |
| **patch** | fixes only                                                               | fixes and improvements, safe to take   |

From 1.0.0, `"^1.2.0"` is safe to widen across the whole `1.x` line. Below 1.0, npm's `^`
range does not cross a minor while the major is `0` — `"^0.18.0"` means
`>=0.18.0 <0.19.0` — so the default save prefix already protected you from breaking bumps.

### What the promise covers

These are public API. Changing or removing one requires a major:

- **Exported values and types** from every `1.x` package, on both the `@cascivo/react`
  prebuilt path and the copy-paste path.
- **Prop contracts** — a prop's name, its type, and whether it is required. Widening a type
  is a minor; narrowing it is a major.
- **Design tokens** — the `--cascivo-*` custom properties, at all three levels
  (primitive, semantic, component).
- **Style hooks** — the `data-cascivo-*` attributes documented in
  [`STYLING-INTERNALS.md`](./STYLING-INTERNALS.md) and listed in each component's manifest.
- **The canonical `@layer` names and their order** (`cascivo.reset` → `base` → `tokens` →
  `component` → `theme` → `blocks` → `override`).
- **The accessibility contract** — each component's ARIA role, its accessible-name
  requirement, and its documented keyboard map, as published in the manifest and enforced by
  `apg:check`.
- **The CLI's command surface** — `cascivo init | add | list | update | audit | doctor`
  and their documented flags.
- **`registry.json`'s shape**, which the CLI, the MCP server and agent tooling all read.

### What the promise does not cover

These may change in any release, including a patch:

- **Exact DOM nesting and element choice**, beyond the roles and style hooks above.
  Components ship CSS Modules with **hashed** class names — `_navWrapper_1r5fv_83` is not a
  selector you can target, and structural selectors like
  `div:has(> div > nav[aria-label='Main'])` will silently stop matching. Use a style hook;
  that is what they exist for.
- **Rendered visual output** — spacing, colour and motion may be tuned. Tokens are the
  stable surface, not the pixels they produce.
- **Anything not exported** from a package's entry points, including `@cascivo/core`
  internals.
- **Packages still on `0.x`** — see the table below.

### Supported versions

- The **current major** receives fixes on its latest minor.
- The **previous major** receives security fixes for **six months** after the next major
  ships. Report security issues per [`SECURITY.md`](../SECURITY.md).
- Older majors are unsupported. `cascivo doctor --drift` compares your installed versions
  against [`breaking-changes.json`](#breaking-changesjson--for-machines) and tells you where
  you stand.

### Which packages are covered

The `1.x` line covers the packages an application depends on directly or transitively at
runtime. Tooling packages stay on `0.x` until their own surfaces settle, and say so on npm.

| Line  | Packages                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `1.x` | `@cascivo/react`, `@cascivo/core`, `@cascivo/charts`, `@cascivo/editor`, `@cascivo/flow`, `@cascivo/i18n`, `@cascivo/storage`, `@cascivo/ai` (the lockstep family below), plus `@cascivo/tokens`, `@cascivo/themes`, `@cascivo/icons` and the `cascivo` CLI |
| `0.x` | `@cascivo/mcp`, `@cascivo/registry`, `@cascivo/docs`, `@cascivo/docspack`, `@cascivo/eslint-config`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`, `@cascivo/platform`                                                                                 |

`@cascivo/platform` in particular is an early experiment in platform-idiomatic geometry and
motion; treat its API as unsettled.

## Where changes are recorded

- **Per-package `CHANGELOG.md`** — changesets-generated, the source of truth
  (e.g. [`packages/react/CHANGELOG.md`](../packages/react/CHANGELOG.md)).
- **Root [`CHANGELOG.md`](../CHANGELOG.md)** — a generated index: every
  published package, its current version, latest feature release, and a link
  to its changelog.
- **[`breaking-changes.json`](https://cascivo.com/breaking-changes.json)** —
  the machine-readable surface, below.

## `breaking-changes.json` — for machines

Every **major and minor** release per package, with notes — patch noise is
deliberately excluded. Agents (and scripts) compare it against installed
versions to detect API drift:

```jsonc
// https://cascivo.com/breaking-changes.json
{
  "generatedAt": "2026-07-02",
  "packages": [
    {
      "name": "@cascivo/charts",
      "version": "0.3.4",
      "releases": [
        { "version": "0.3.0", "level": "minor", "notes": ["PieChart: donut …"] }
      ]
    }
  ]
}
```

So "what changed between my `@cascivo/charts@0.2.1` and current?" is: every
release in that package's `releases` array newer than `0.2.1`.

---

## The `@cascivo/core` family versions in lockstep

Eight packages release together at one version: **`@cascivo/core`, `@cascivo/react`,
`@cascivo/charts`, `@cascivo/editor`, `@cascivo/flow`, `@cascivo/i18n`, `@cascivo/storage`,
`@cascivo/ai`**. Seven of them depend on `@cascivo/core`.

**What this means for you: pin them all to the same version.** If `@cascivo/react` is
`0.15.0`, so is `@cascivo/charts`. A mismatched pair is not a supported combination, and
`cascivo doctor` will tell you if your install ended up with one.

**Why it is enforced rather than advised.** Independently-versioned 0.x packages could
resolve two non-overlapping `@cascivo/core` ranges, and the package manager then nests a
second copy. cascivo's reactivity is a module-level signal registry, so two copies means two
registries: a signal written through one is invisible to components subscribed through the
other. Nothing errors — handlers fire and the UI silently stops updating, which is the
hardest failure in this system to diagnose from symptoms.

`@cascivo/icons`, `@cascivo/themes`, `@cascivo/tokens`, `@cascivo/mcp`, `@cascivo/registry`,
`@cascivo/vite-plugin`, `@cascivo/eslint-config`, `@cascivo/docs` and the `cascivo` CLI keep
their own version lines — none of them link against the signal registry.

`scripts/checks/version-lockstep.test.ts` fails the build if a package starts depending on
`@cascivo/core` without joining the group, so the guarantee cannot erode as packages are
added.

## How cascivo renames things (the deprecation contract)

A rename is the most expensive change a component library can make, so the catalog uses
one mechanism for all of them. If you see any of these, this is what is happening and how
long you have.

1. **Both names work.** The old name stays as an alias for at least one minor. Your code
   keeps compiling and behaving identically.
2. **The old name carries `@deprecated`** in its TSDoc, naming the replacement. Your editor
   strikes it through; `tsc` stays silent.
3. **The deprecation names when it expires.** Every deprecation records `since` — the
   version that introduced the replacement — and **`removeIn`**, the major that removes the
   old name. Both appear in the manifest, and therefore in `registry.json`, the `llms/*.md`
   files and the docs site, so the expiry is discoverable before you adopt the old name
   rather than after it disappears.
4. **A changeset records it**, so it appears in the CHANGELOG and in
   [`breaking-changes.json`](#breaking-changesjson--for-machines) — the file
   `cascivo doctor --drift` reads.
5. **A guard keeps the pair honest.** The alias and its tracking entry are removed
   together; a check fails if one outlives the other, so an alias cannot quietly become
   permanent and a tracking note cannot go stale. The same guard fails the build if a
   deprecation is still shipping in the major named by its own `removeIn` — an expiry that
   can slip is not a policy.

**Removals only happen in a major.** A deprecation introduced during `1.x` is removed in
`2.0.0` at the earliest, so the alias is guaranteed to outlive the whole `1.x` line.

Aliases that only *add* a name (`ariaLabel` alongside `aria-label`, `value` alongside `id`)
are not deprecations — both spellings are supported indefinitely, and neither is
struck through. They exist because guessing the wrong one cost adopters a compile
round-trip.

Where a name is **required** for accessibility, an alias is expressed as an XOR union
(`{ label: string; ariaLabel?: never } | { ariaLabel: string; label?: never }`) rather than
making both optional — the compile-time guarantee that a control has an accessible name is
worth more than the simpler type.

## Upgrading copied components: `cascivo update`

Copied source is yours to edit — so upgrading it is a merge, not an overwrite.
The machinery is **`cascivo.lock`**, written by `cascivo add`: per component it
records the registry it came from, the installed version, and a
`sha256-…` hash of every copied file. **Commit it** — it is what lets the CLI
tell your edits apart from upstream changes.

### Check what changed upstream

```sh
npx cascivo update --check
```

Compares the registry's current per-file content hashes against the hashes in
`cascivo.lock` — accurate to the individual source edit, not just version
labels. Lists what changed and exits `1` if anything is outdated (CI-friendly);
exits `0` with "All components up to date." otherwise.

### Apply upstream changes

```sh
npx cascivo update button
```

Runs a **three-way merge**: the CLI fetches the *base* version recorded in the
lockfile (from the registry's versioned snapshots, `r/<name>@<version>.json`),
your local copy, and the current upstream, then merges upstream changes around
your local edits. Three outcomes per file:

- **unchanged** — your file already matches; nothing written.
- **clean** — upstream changes applied around your edits automatically.
- **conflict** — you and upstream touched the same lines; the file gets
  standard conflict markers to resolve by hand:

```
<<<<<<< local
your edit
=======
upstream change
>>>>>>> upstream
```

You are shown the per-file summary and asked to confirm before anything is
written; on apply, the lock entry is bumped to the new version (and flagged
`conflicted` until you resolve). With `--yes`, files that merged cleanly are
written and conflicted ones are **skipped** — nothing lands half-merged in CI.

Two fallbacks: if the base snapshot can't be fetched, or the component predates
the lockfile, `update` degrades to a two-way diff (shows upstream vs. local,
overwrite on confirm — your edits are not preserved automatically, so review
the printed diff).

---

## Version notes

Release-specific upgrade guides, newest first:

- **Upgrading `0.x` → `1.0.0`** — eleven deprecated surfaces are removed. Every one has a
  replacement that takes the identical argument, so each fix is a rename, and every removal
  is a *compile error* rather than a silent behaviour change.

  | Removed | Replace with | Affects |
  | --- | --- | --- |
  | `onChange` (value-carrying) | `onValueChange` | `Combobox`, `DatePicker`, `Filter`, `NumberInput`, `Search`, `Swap`, `TimePicker`, `Toggle` |
  | `Text`, `TextProps` | `ChartText`, `ChartTextProps` | `@cascivo/charts` |
  | `BarChart` `xTicks` / `yTicks` | `valueAxisTicks` / `categoryAxisTicks` | `@cascivo/charts` |
  | `Dropdown` item `separator: true` | a separate `{ kind: 'separator' }` entry | `@cascivo/react` |

  Two notes on the shape of these:

  - The eight components keep `Omit<…, 'onChange'>` on their prop types. Without it the
    native `ChangeEventHandler` would take the name back, and a value-carrying handler would
    compile and then be called with a DOM event — a silent break instead of a loud one.
  - `BarChart`'s removed pair followed *screen* position, so its meaning swapped with
    `orientation`: `yTicks={1}` did nothing on a horizontal chart while `xTicks={1}` worked.
    The replacements are named by role and mean the same thing either way. `ScatterChart`
    keeps `xTicks`/`yTicks` — both its axes are value axes, so screen naming is correct there.

  **`OverflowMenu` is not removed.** It is deprecated in favour of `Menu` and keeps working
  for the whole `1.x` line; its manifest carries `removeIn: '2.0.0'`.

- **`<Badge>` with no `variant` is no longer the brand colour** (`@cascivo/react` minor) —
  `neutral` (and its alias `default`, which is what you get when you pass nothing) now
  renders the subtle look instead of `--cascivo-color-accent`.

  Badge was the only one of the four tone-taking components that did this: `Tag`, `Status`
  and `Notification` all render `neutral` quietly, so a single domain enum driving all four
  produced a primary-blue pill in one place and a grey chip in the others. `pnpm tone:check`
  now enforces that a tone reads from its own token family in every component.

  Migration: if you were relying on the accent look, ask for it explicitly.

  ```tsx
  // before — accent, by accident
  <Badge>Production</Badge>
  // after — accent, on purpose
  <Badge variant="primary">Production</Badge>
  ```

  A neutral `<Tag>` also gains a 1px border, so it reads as a chip rather than as loose text
  on dark themes. No API change.

- **The theme runtime moved to `@cascivo/core`** (`@cascivo/core` minor, `@cascivo/react`
  unchanged) — `ThemeProvider`, `useTheme`, `setTheme`, `themeSignal`, `applyTheme` and
  `themePreloadScript` are now exported from `@cascivo/core`, so the copy-paste path can
  reach them without installing the whole prebuilt component distribution.

  **No migration needed.** `@cascivo/react` re-exports all of them under the same names.
  `persistedSignal` and the synchronous drivers moved the same way and are still re-exported
  from `@cascivo/storage`; the persisted value format is unchanged, so stored themes survive
  the upgrade.

- **`useTheme()` returns a string, not a signal** (`@cascivo/react` minor) — the
  first tuple element of `useTheme()` is now the theme **name** (a plain `string`)
  instead of a `Signal<string>`. Migration: drop `.value`.

  ```tsx
  // before
  const [theme, setTheme] = useTheme()
  theme.value === 'dark'
  // after
  const [theme, setTheme] = useTheme()
  theme === 'dark'
  ```

  TypeScript flags every site (`.value` on a `string` is an error). If you passed
  the signal itself into `computed()`/`effect()` or a Preact component, get it from
  the new `themeSignal()` export instead. The setter is unchanged.
- **`@cascivo/themes` now installs with `@cascivo/react`** (`@cascivo/react` minor)
  — it moved from a peer/optional install to a real dependency, so `pnpm add
  @cascivo/react` brings it along. You still import a theme CSS file once (or import
  the now-self-contained `@cascivo/react/styles.css`, which bundles tokens + light +
  dark); skipping the import renders components grayscale, and `ThemeProvider` now
  warns about exactly that in dev. No action needed unless you were installing
  `@cascivo/themes` separately — you can drop it from your `package.json`.
- **`cascivo.blocks` layer slot** (`@cascivo/tokens` minor) — the canonical
  `@layer` order gained a declared `cascivo.blocks` slot between `cascivo.theme`
  and `cascivo.override`, and the `@function` helpers moved from an undeclared
  `cascivo.functions` layer into `cascivo.tokens`. Shipped blocks and functions
  now sit **below** `cascivo.override` instead of silently above it. If you relied
  on a block's CSS beating your `@layer cascivo.override { … }` rules, that was a
  bug — your override now wins as documented. See
  [CSS-LAYERS-PITFALL.md](./CSS-LAYERS-PITFALL.md#canonical-layer-ordering).
- [v37 — Consumer Upgrade Guide](./v37-CONSUMER-CHANGES.md) — migration
  hardening: the `cascade.*` → `cascivo.*` `@layer` rename (the one breaking
  change), `styles.css` export fix, app-shell adoption, token-name stability.

## See also

- [GETTING-STARTED.md](./GETTING-STARTED.md) — the two install paths.
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — "a component looks different
  than the docs" is usually version drift.
- [RELEASING.md](./RELEASING.md) — how releases are cut (maintainers).
