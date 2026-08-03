---
'@cascivo/core': minor
---

Version the `@cascivo/core`-sharing family in lockstep.

`@cascivo/core`, `react`, `charts`, `editor`, `flow`, `i18n`, `storage` and `ai` now release
together at one version (`fixed` in `.changeset/config.json`). Seven of them depend on
`@cascivo/core`, and while they versioned independently an adopter could resolve two
non-overlapping `@cascivo/core` ranges — the package manager then nests a second copy, and
because cascivo's reactivity is a module-level signal registry, two copies means two
registries: a signal written through one is invisible to components subscribed through the
other, with no error at all.

Expect a one-time version jump as the family aligns (the lower-numbered packages catch up to
the highest). After that, a release bumps all eight together, which is an accurate reflection
of how they are actually supported: only ever as a set.

`linked` was considered and rejected — it aligns only packages bumped in the same release, so
drift remains possible, which is the state this fixes. `cascivo doctor`'s duplicate-core
check stays as defense in depth, since a carried-over lockfile can still hold a stale copy.
