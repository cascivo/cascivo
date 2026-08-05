# @cascivo/docs

## 0.2.3

### Patch Changes

- 97da94e: Repair the two CI gates failing on `main`, and refresh the generated registry artifacts.

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

## 0.2.2

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.

## 0.2.1

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs

## 0.2.0

### Minor Changes

- 5c55ba7: Ship the entire docs surface as an npm package so it's reachable with no website.

  - **New package `@cascivo/docs`** bundles the complete generated documentation — `llms.txt`, `llms-full.txt`, per-component `llms/*.md`, `context/*`, the concept guides, `registry.json`, the token/icon catalogs, and a `versions.json` snapshot. Use it with **no install**: `npx -y @cascivo/docs` prints the index, `npx @cascivo/docs <component>` one reference, `npx @cascivo/docs guide <slug>` a guide, `npx @cascivo/docs --full` the whole library, `--list`/`--dir` to enumerate/grep. It reaches an adopter through the npm registry — the one channel proven to work when `npmjs.com` and `cascivo.com` are 403'd, proxied, or offline. Raw-tarball and installed (`exports`-map) consumption are supported too.
  - **`@cascivo/mcp` gains `list_guides` and `get_guide`** — the concept guides (getting-started, theming, troubleshooting, …) are reachable through MCP for the first time, resolved offline-first (monorepo → `@cascivo/docs` → bundled → network). The MCP server now depends on `@cascivo/docs`.
  - The offline docs channel is now referenced from every package README, the `dist/index.d.ts` quickstart, `llms.txt`, GETTING-STARTED, and TROUBLESHOOTING, enforced by a new `docs-package-refs` guard in `pnpm meta:check`.
