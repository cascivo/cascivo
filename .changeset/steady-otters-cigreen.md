---
'@cascivo/ai': patch
'@cascivo/charts': patch
'cascivo': patch
'@cascivo/core': patch
'@cascivo/docs': patch
'@cascivo/editor': patch
'@cascivo/eslint-config': patch
'@cascivo/flow': patch
'@cascivo/i18n': patch
'@cascivo/icons': patch
'@cascivo/mcp': patch
'@cascivo/react': patch
'@cascivo/registry': patch
'@cascivo/storage': patch
'@cascivo/themes': patch
'@cascivo/tokens': patch
'@cascivo/vite-plugin': patch
---

Repair the two CI gates failing on `main`, and refresh the generated registry artifacts.

No package's runtime code changes here — every bump in this release is version-only.

**`drift`** — `clientJs` reached the component manifests, but the 103 generated
per-component files under `apps/site/public/r/` came from a branch cut before it, so merging
the two left every one of them a field short. Regenerated; no other artifact moved.

**`verify`** — `isolated:check`, the canary that type-checks packed tarballs in a strict,
non-hoisted consumer workspace, was dying in `pnpm install` rather than in the type check it
exists to run:

```
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for
@cascivo/core@^0.15.0 while fetching it from https://registry.npmjs.org/
```

`pnpm pack` rewrites `workspace:^` to `^<version>`, so the packed `@cascivo/react` asked the
registry for a version that does not exist until release day — the fixture broke on every
version bump that landed ahead of a publish, which is exactly what happened. Every
inter-cascivo edge is now pinned to the tarball built from the commit under test, via
`overrides` in the fixture's `pnpm-workspace.yaml`. The location matters: pnpm 10+ no longer
reads the `pnpm` field from `package.json` and only warns about it, so the `pnpm.overrides`
spelling silently does nothing.

That also closes a quieter hole. Even when the versions did resolve, the fixture type-checked
the freshly-built `@cascivo/react` against the last **published** `@cascivo/core` rather than
the one just built — a mix, not the build under test.

A new guard fails the fixture if any `@cascivo/*` dependency falls outside its `PACKAGES`
list, since such an edge would slip back to registry resolution unnoticed — the silent-skip
failure mode a canary must never have.
