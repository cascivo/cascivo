# Release Runbook

cascivo uses [Changesets](https://github.com/changesets/changesets) for versioning
and [npm Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements)
(OIDC) for tokenless publishing with automatic provenance.

## Prerequisites (one-time manual setup)

### 1. Configure trusted publishers on npmjs.com

For each of the ten Tier-1 packages, you must configure a trusted publisher on npmjs.com
**before** the first automated publish. Go to each package page → Settings → Trusted Publisher:

| Package | npm name |
|---------|----------|
| core | @cascivo/core |
| tokens | @cascivo/tokens |
| themes | @cascivo/themes |
| icons | @cascivo/icons |
| i18n | @cascivo/i18n |
| storage | @cascivo/storage |
| react | @cascivo/react |
| mcp | @cascivo/mcp |
| registry | @cascivo/registry |
| cli | cascivo |

For each package, add a GitHub Actions trusted publisher with:
- **Organization:** `urbanisierung`
- **Repository:** `cascivo`
- **Workflow filename:** `release.yml`
- **Environment:** _(leave blank)_

### 2. First-publish bootstrap

All ten package names are unpublished. npm may require a package to exist before
a trusted publisher can be attached. If so, perform a one-time bootstrap:

1. Create a short-lived **granular automation token** on npmjs.com (scope: publish
   only, expiry: 1 day).
2. For each package: `npm publish --access public` (from the repo root after
   `pnpm build` and `pnpm changeset version`).
3. Immediately delete the token after the bootstrap publish.
4. Configure the trusted publisher for each package as described above.

From the second release onward, the workflow publishes tokenlessly via OIDC.

If npm allows pre-creation trusted-publisher configuration for new packages
(check the npmjs.com UI — this capability may be added), you can skip the
bootstrap entirely and proceed directly to Step 1.

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
