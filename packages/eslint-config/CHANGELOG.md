# @cascivo/eslint-config

## 0.2.4

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

## 0.2.3

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

## 0.2.2

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.

## 0.2.1

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

## 0.2.0

### Minor Changes

- 9841d27: Add `@cascivo/eslint-config`, and fix the scaffolder + doctor to obey cascivo's own docs.

  **New package `@cascivo/eslint-config`.** `eslint-plugin-react-hooks@7`'s
  `recommended-latest` enables `react-hooks/immutability`, which reports every
  `signal.value = next` — the idiom AI-RULES.md mandates — as
  `Error: This value cannot be modified`. A stock 2026 React app therefore lints the
  documented state idiom as an error on every piece of state the adopter wrote, and the docs
  corpus had zero hits for "immutability". Spread `...cascivo` last in `eslint.config.js`.

  **`cascivo create`** no longer writes `"latest"` for cascivo dependencies (exact pins are
  baked in at build time), no longer declares or imports `@cascivo/core` / `@cascivo/tokens`
  on the prebuilt path, now declares the `@preact/signals-react` peer its own `App.tsx`
  depends on, no longer writes a `cascivo.config.ts` into a prebuilt-path app, declares the
  `cascivo.example` layer its `AGENTS.md` tells agents to use, ships `lint`/`typecheck`
  scripts and a pre-wired `eslint.config.js`, and seeds a short brand instead of the whole
  directory name.

  **`cascivo doctor`** infers the install path from evidence (`detectInstallPath`) instead of
  treating any `cascivo.config.*` as proof of a copy-paste project. It no longer demands
  `@cascivo/core`/`@cascivo/tokens` of a prebuilt app — it now reports them as
  `[forbidden-dependency]` when present — so `doctor --ci` passes on a correctly-installed
  Path B app and the documented CI gate is usable on day one.
