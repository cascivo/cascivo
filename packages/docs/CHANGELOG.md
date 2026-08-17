# @cascivo/docs

## 0.2.6

### Patch Changes

- d009502: Fixes for the 2026-08-14 adopter report (a Vercel-style dashboard on Vite +
  React Router).

  ## New: the vocabulary types are importable on the prebuilt path

  `Status.status` and `Badge.variant` are typed `ToneInput`, and every layout
  `gap` is a `SpaceStep` — but those types live in `@cascivo/core`, which is a
  _transitive_ dependency on the prebuilt path that the docs tell you not to
  install. So the first thing a typed dashboard writes had no supported import.

  ```ts
  import type { Tone } from '@cascivo/react/types'

  const DEPLOY_TONE: Record<DeployState, Tone> = {
    ready: 'success',
    error: 'danger',
  }
  ```

  `@cascivo/react/types` exports `Tone`, `ToneAlias`, `ToneInput`, `Progress`,
  `ProgressAlias`, `ProgressInput`, `SpaceStep` and `RovingOrientation`. On the
  copy-paste path keep importing from `@cascivo/core`. **Do not** add
  `@cascivo/core` to a prebuilt app to reach these — it is transitive there.

  They ship from a subpath rather than the main entry for a mechanical reason:
  component sources already import those names from core, so re-exporting them
  from `@cascivo/react` makes the dts bundler emit `ToneInput as ToneInput$1`
  and every prop switches to the aliased name.

  ## The router guide is now published

  `docs/USING-WITH-A-ROUTER.md` existed and was referenced from `Link`, `Tabs`
  and `setLinkComponent`, but was never published — so those pointers 404'd.
  It is now at <https://cascivo.com/docs/using-with-a-router.md> and in
  `npx @cascivo/docs`, along with three other guides that were also unpublished:
  `testing`, `css-layers-pitfall` and `third-party-css` (the last two cited by
  `@cascivo/react`'s own README and by `cascivo audit`).

  `setLinkComponent` gains a React Router recipe — its `to` is required, so the
  disabled-item case needs a fallback:

  ```tsx
  setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
  ```

  ## Components
  - `PageHeader.title` and `.description` accept `ReactNode`, not just `string`,
    so a page title can carry a status badge or a linked domain.
  - `CodeSnippet` accepts children as an alias for `code`
    (`<CodeSnippet>npm i foo</CodeSnippet>`). It stays a string — the content is
    tokenized for highlighting and handed to the clipboard.
  - `BreadcrumbItem` and `DockItem` gain the `id` escape hatch the other
    link-shaped item types already had. `Dock` previously keyed on the array
    index.
  - `Sparkline`'s documented default was 80 while the code applied 120; the docs
    now say 120 and that it is **fixed-width**, correcting a dashboard-recipe
    claim that it shrinks to fit.
  - `Stat` and `Kpi` now document the choice between them: `<Stat card>` matches
    `Kpi`'s chrome but **not** its layout, so pick one per app.
  - `label` visibility is now stated per component. It renders on screen for most
    components and is an invisible accessible name for a few (`Sparkline`,
    `Spinner`, `Fab`, …); nothing said which, and `<Toggle label>` duplicating a
    settings row's own heading is what the ambiguity cost.

  ## Charts

  `@cascivo/charts/styles.css` is **not** required on a bundler build — the entry
  imports its own stylesheet. It is required with no bundler, and on an SSR setup
  that externalises dependencies, where the CSS-free `node` twin loads. Several
  docs still called it unconditionally required. Also documents 13 chart and flow
  prop defaults that no generated table had ever shown.

  ## CLI
  - `cascivo create` emits the app shell as its own `src/Shell.tsx` with a
    `children` slot, so adding a router means deleting `App.tsx` and
    `src/sections/` rather than re-deriving the shell wiring.
  - The scaffold no longer imports the ~273 kB aggregate `@cascivo/react/styles.css`;
    per-component CSS auto-includes and tree-shakes on a bundler. A generated app
    now emits **39.65 kB** of entry CSS (6.90 kB gzip).
  - `create` inside an existing workspace detects the package manager from the
    surrounding lock file instead of always reporting npm under `npx`.
  - The browser tab title is title-cased rather than the raw directory name.

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

## 0.2.5

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

## 0.2.4

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.

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
