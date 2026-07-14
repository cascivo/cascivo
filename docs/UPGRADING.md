# Upgrading cascivo

cascivo has two consumption paths, so it has two upgrade stories: **npm
packages** (`@cascivo/react`, `@cascivo/core`, …) upgrade with a version bump,
and **copied components** (installed via `cascivo add`) upgrade with a merge.
This page covers both, plus where changes are recorded.

---

## What a version bump means (pre-1.0)

Packages are versioned independently with
[Changesets](https://github.com/changesets/changesets). Everything is `0.x`,
and the convention is:

| Bump      | Pre-1.0 meaning                                        |
| --------- | ------------------------------------------------------ |
| **minor** | may include breaking changes — read the notes          |
| **patch** | fixes and improvements, safe to take                   |

npm's `^` range does not cross a minor while the major is `0` —
`"^0.3.8"` means `>=0.3.8 <0.4.0` — so the default save prefix already
protects you from breaking bumps. `pnpm up '@cascivo/*'` stays within your
ranges; review the notes below before widening them.

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
