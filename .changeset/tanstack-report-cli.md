---
'cascivo': minor
---

CLI adopter-friction fixes from the TanStack Start experience report:

- **Package-manager detection now works in workspaces.** `init`/`add`/`create`
  detect the package manager by `--package-manager`/`--pm` flag,
  `CASCIVO_PACKAGE_MANAGER`, the invoking PM (`npm_config_user_agent`), then an
  upward walk for a lock file or `packageManager` field — so a pnpm/yarn/bun
  monorepo where the lock file lives at the repo root no longer falls back to
  `npm` and crashes. Failed installs print the exact command to run by hand.
- **`init` installs and states the complete dependency set** —
  `@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, the
  `@preact/signals-react` peer, plus `cascivo` as a dev dependency for the
  generated config's type import — and prints a one-line dependency summary.
  `--no-install` writes files and prints the install commands instead.
- **`cascivo add chart/*` now installs `@cascivo/charts`** (deduped, via the
  detected PM) and prints the import lines, instead of printing instructions and
  adding nothing. `--no-install` restores print-only.
- **`cascivo add stack`** prints a note clarifying that `Stack` is a z-axis
  card-pile, not a vertical spacing layout (use `Flex`).
- **`cascivo doctor`** in an adopter project now verifies the runtime
  dependencies copied source needs (including the `@preact/signals-react` peer)
  are declared, turning an opaque "cannot find module" build failure into a
  diagnosed condition with a fix.
- All install hints now use the detected package manager instead of hardcoded
  `npm install`.
