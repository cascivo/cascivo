# Release Runbook

cascivo uses [Changesets](https://github.com/changesets/changesets) for versioning
and [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements)
(OIDC) for tokenless publishing with automatic provenance.

## Prerequisites (one-time manual setup)

### 1. Configure trusted publishers on npmjs.com

For each published package, you must configure a trusted publisher on npmjs.com
**before** the first automated publish. Go to each package page → Settings → Trusted Publisher:

| Package  | npm name          |
| -------- | ----------------- |
| ai       | @cascivo/ai       |
| core     | @cascivo/core     |
| tokens   | @cascivo/tokens   |
| themes   | @cascivo/themes   |
| icons    | @cascivo/icons    |
| i18n     | @cascivo/i18n     |
| storage  | @cascivo/storage  |
| react    | @cascivo/react    |
| mcp      | @cascivo/mcp      |
| registry | @cascivo/registry |
| cli      | cascivo           |

For each package, add a GitHub Actions trusted publisher with:

- **Organization:** `cascivo`
- **Repository:** `cascivo`
- **Workflow filename:** `release.yml`
- **Environment:** _(leave blank)_

### 2. First-publish bootstrap (completed — kept for reference)

> **Status:** this bootstrap has been done — all packages above are live on npm
> with trusted publishing attached. The steps below only apply again when a
> **new** package name is published for the first time.

npm requires a package to exist before a trusted publisher can be attached, so
the very first publish of a new package name must be done manually with a
short-lived token.

#### Step-by-step

```bash
# 1. Build all packages (dist/ must exist before publishing)
pnpm build

# 2. Bump versions and generate CHANGELOGs from the staged changeset
#    This consumes .changeset/initial-release.md and writes version 0.1.0
#    into each Tier-1 package.json.
pnpm changeset version

# 3. Commit the version bump (do not skip — changesets publish reads
#    package.json versions to determine what to push to the registry)
git add -A
git commit -m "chore: version packages 0.1.0"

# 4. Authenticate with npm (pick one):
#
#    Option A — browser login (simplest, no token management):
npm login
#    This opens a browser window, you approve the login, and credentials
#    are stored in ~/.npmrc. Nothing to create or delete.
#
#    Option B — granular automation token (CI-style, no browser):
#      npmjs.com → Account Settings → Access Tokens → Generate New Token
#      Type: Granular Access Token, Scopes: Read and write, Expiration: 1 day
#    Then pass it inline:
#      NODE_AUTH_TOKEN=<token> pnpm changeset publish
#    Delete the token on npmjs.com immediately after.

# 5. Publish all Tier-1 packages in one command (after Option A login above).
#    changeset publish handles workspace:^ → real version rewriting,
#    publishes in dependency order, and skips private packages.
pnpm changeset publish

# 6. (Only if you used Option B) Delete the token on npmjs.com.

# 7. Push the version-bump commit and the new git tags that changeset publish created.
git push --follow-tags
```

#### After the bootstrap

For each of the ten packages that are now live on npm:

1. Go to `npmjs.com/package/<pkg-name>` → **Settings** → **Trusted Publisher**.
2. Add a GitHub Actions publisher: org `cascivo`, repo `cascivo`, workflow `release.yml`.

From the second release onward the workflow publishes tokenlessly via OIDC — no token needed.

> **Note:** If npmjs.com adds support for pre-creation trusted-publisher configuration
> (where you can attach a publisher before a package exists), you can skip the bootstrap
> entirely. Check the npmjs.com UI before starting.

## Steady-state release flow

1. **Develop** — PRs land on `main` carrying `.changeset/*.md` entries
   (authored via `pnpm changeset` during development).
2. **Version PR** — the release workflow detects staged changesets and opens
   (or updates) a "Version Packages" PR. This PR bumps `version` fields and
   generates `CHANGELOG.md` files via `changeset version`.
3. **Merge** — merging the Version Packages PR triggers the workflow's publish
   path: `changeset publish` runs, packages are published to npm with provenance,
   git tags are created, and GitHub release notes are generated.

## Release cadence is a correctness property, not a preference

A fix that is merged but unpublished does not exist for an adopter. This is not a
theoretical concern — it is [Mechanism G](internal/feedback/README.md), and it is the reason
two adopters on 2026-08-08 re-reported four findings the recurrence ledger listed as closed:

| Date | Event |
| --- | --- |
| 2026-08-05 | `@cascivo/react@0.16.0` / `cascivo@0.7.1` published |
| 2026-08-06 | Report #12's nine workstreams **merged**, not published |
| 2026-08-08 | Two adopters build against `0.16.0` — the newest version that exists — and re-hit four of the fixed findings |
| 2026-08-10 | `0.16.1` / `0.7.2` published, carrying the fixes |

Four days of merged-but-unpublished cost two full adopter reports. Therefore:

1. **A plan whose workstreams are all `merged` triggers a release.** The plan's status header
   may not read `implemented` for more than one business day without either a published
   version or a stated reason in the header itself.
2. **The release PR sets `shippedIn` on every ledger row it publishes**
   (`docs/internal/feedback/recurrence.json`), then `pnpm regen`. Until it does,
   `RECURRENCE.md` lists the row under **"Closed — awaiting release"**, which is where it
   honestly belongs.
3. **Run `pnpm recurrence:shipped` before cutting the release and after publishing.** It is
   expected to be RED between merge and publish — that red *is* the backlog becoming
   visible. It goes green when step 2 is done. It is not part of `pnpm ready` because it
   needs the network and a contributor cannot clear it on their own.

## Verification after a release

```bash
# Check the new version on npm
npm view @cascivo/core version

# Every ledger row claiming to have shipped really has, and nothing is stranded
pnpm recurrence:shipped

# Check provenance (appears on the package page on npmjs.com)
npm view @cascivo/core dist-tags
```

A provenance/attestation badge should appear on each package's npm page after
the first publish with `NPM_CONFIG_PROVENANCE=true`.

## Adding a changeset

```bash
pnpm changeset
# follow the interactive prompt to select changed packages and bump level
```

Commit the generated `.changeset/<random-name>.md` alongside your PR.

## Troubleshooting

### Release fails with "Generated docs are stale at release time"

The workflow's first gate regenerates every artifact (`pnpm regen && pnpm exec vp check --fix`)
and refuses to publish if the result differs from what is committed. A real diff means someone
committed a manifest change without regenerating — run those two commands and commit the result.

A diff consisting **only** of `generatedAt` / "generated on \<date\>" stamps is not real drift:
it means a generator read the wall clock, so the artifacts differ from a regen on any later UTC
day. `pnpm regen` must be reproducible for a given checkout — the shared stamp lives in
`scripts/registry/generated-at.ts` and is keyed to the registry **version**, not the clock, so
it only moves when the version does (and `version-packages` regenerates as part of the bump).
`pnpm regen:check` guards this: no generator reachable from the `regen` chain may call
`new Date()` or `Date.now()`.

### A failed release left its changesets unconsumed

`release.yml` only triggers on pushes that touch `.changeset/**`, so fixing the cause of a
failed release does not restart it — the staged changesets sit unreleased until the next one
lands. Re-run it by hand: **Actions → Release → Run workflow** on `main`. With no staged
changesets it no-ops safely.

### Release fails with `TypeError: Cannot read properties of undefined (reading 'includes')`

Stack trace points at `isAlreadyPublishedError` / `internalPublish` inside
`@changesets/cli`. This happens during the publish step when `changeset publish`
re-attempts a version that is **already on npm** (its own `npm info` pre-check can
read stale registry data, so it tries to publish a version that already exists).
npm rejects the duplicate with an `E403`, and changesets is supposed to detect
"cannot publish over the previously published version" and skip it — but on the
npm versions used here the `E403` JSON body has no `error.summary`, so the
unguarded `output.includes(...)` throws instead of skipping. One crashed publish
leaves versions half-published, so every subsequent run hits the same
already-published package first and crashes again (a partial-publish loop).

This is an upstream bug in `@changesets/cli@2.31.0` (the latest release). We carry
a `pnpm patch` (`patches/@changesets__cli@2.31.0.patch`, wired in
`pnpm-workspace.yaml` under `patchedDependencies`) that:

- guards `isAlreadyPublishedError` against a non-string argument, and
- detects the "already published" message from `error.summary`, `error.detail`,
  **or** the raw publish `stderr` — so an already-published version is skipped
  gracefully and the release continues publishing the packages that are behind.

When bumping `@changesets/cli`, re-check whether the upstream `isAlreadyPublishedError`
crash is fixed; if so, drop the patch. Otherwise regenerate it with
`pnpm patch @changesets/cli@<version>`.
