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

## Verification after a release

```bash
# Check the new version on npm
npm view @cascivo/core version

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
