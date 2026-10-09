# bench-agent

What an agent spends to build an app with cascivo, by surface: the measurement behind the
blueprint work (`docs/plans/app-blueprints-and-workbench-research.md`, §6).

```sh
pnpm build                                        # at the repo root: the CLI and MCP under test
pnpm --filter bench-agent bench --dry-run         # check the harness: no model, no key
ANTHROPIC_API_KEY=… pnpm --filter bench-agent bench --runs 3 --publish
```

## Method

- **Five fixed prompts** (`src/prompts.ts`): admin console, SaaS settings, marketing site, CRUD
  table, auth flow. A changed prompt makes earlier results incomparable; add one instead.
- **Two arms** (`src/arms.ts`), identical except for two tools:
  - `today`: the cascivo MCP server without `compose_app` and `list_blocks`. The agent scaffolds
    a shell with `create_app` and writes every page as TSX.
  - `blueprints`: the same server with both, so a page can be a registry block.
- **Each run** starts in an empty directory with `claude -p --bare --strict-mcp-config`: no user
  settings, hooks or CLAUDE.md, only the MCP server built from this checkout and the file tools
  (no Bash, so no installs or dev servers). `npx cascivo`, which the MCP server spawns, resolves
  to this checkout's CLI.
- **Recorded:** input tokens (billed plus cache writes and reads), output tokens, cost, wall
  time and turns, from the CLI's own JSON; then `tsc --noEmit` errors and `cascivo audit --ai`
  errors and warnings on the app the run left. The app links one dependency tree installed
  once from this checkout's packed packages (`src/env.ts`), so no run pays for an install.
- **Reported:** the median of each prompt and arm. `--publish` writes
  `docs/AGENT-BENCHMARKS.md`.

A dry run replays a scripted tool call per arm (`src/dry-run.ts`) through the same scaffold,
link, `tsc` and audit, so it proves the pipeline and measures nothing about a model. Its
results are not committed.

A full run is 5 prompts × 2 arms × `--runs` agent sessions, on the key's account.
