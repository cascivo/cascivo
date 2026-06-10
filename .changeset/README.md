# Changesets

Versioning and publishing are driven by [changesets](https://github.com/changesets/changesets).

- `pnpm changeset` — record a change (pick packages + semver bump + summary)
- `pnpm version-packages` — apply pending changesets (done by the Release PR in CI)
- `pnpm release` — build and publish to npm (done by CI on main)

Published packages: @cascade-ui/core, @cascade-ui/tokens, @cascade-ui/themes,
@cascade-ui/icons, @cascade-ui/react, @cascade-ui/mcp, cascade (CLI).
Private packages (components registry source, apps) are never published.
