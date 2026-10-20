# bench-agent

How well an agent builds an app with cascivo. Two harnesses live here:

- **The published eval** (`pnpm --filter bench-agent eval …`): hidden Playwright tests, three arms,
  Claude only. It feeds the `/evals` page of the docs site and `docs/AGENT-BENCHMARKS.md`.
- **The legacy surface benchmark** (`pnpm --filter bench-agent bench …`): what an agent spends,
  by cascivo surface. See [Legacy: the surface benchmark](#legacy-the-surface-benchmark).

## The published eval

A re-runnable number for "how often does an agent build a correct app with cascivo", against a
shadcn/ui + Tailwind control and against cascivo used without its AI context. The design is
`docs/internal/superpowers/specs/2026-10-20-w6-published-eval-design.md`; the results are on
[cascivo.com/evals](https://cascivo.com/evals).

### Arms

Defined in `src/arms.ts`. Every arm runs `claude -p --bare --restricted --strict-mcp-config` with
only the `Read` and `Edit` file tools, confined to its own directory, and gets the same arm-neutral
task text, one sentence naming its design system, and the same kind of project file list.

| Arm            | Starting point                                                            | MCP tools                                                                 |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cascivo`      | the cascivo scaffold with its AI context files (`AGENTS.md`, `CLAUDE.md`) | the 21 read-only tools of the cascivo MCP server built from this checkout |
| `cascivo-bare` | the same scaffold without `AGENTS.md`, `CLAUDE.md` and `.mcp.json`        | none                                                                      |
| `shadcn`       | the shadcn 4.22.1 Vite starter with every component added                 | the 3 read-only tools of the shadcn MCP server                            |

The gap between `cascivo` and `cascivo-bare` is the value of cascivo's AI context. A `today` arm
stays in the code for internal comparison and is not published.

### Tasks

Eight, in `tasks/<id>/`, each with a `PROMPT.md` the agent sees and a hidden `EVAL.ts` it never
does: `admin-console`, `saas-settings`, `marketing-site`, `crud-table`, `auth-flow`,
`form-validation`, `delete-confirm`, `filter-empty-state`. `EVAL.ts` uses role, label and text
locators only, so every arm can pass. A published task never changes; a changed task gets a new id.

### Scoring

An attempt passes when `vite build` succeeds, `tsc --noEmit` reports no errors, and `EVAL.ts`
passes against the app served by `vite preview`. Its status is the first that applies of
`infra-error` (a CLI crash, a session over 10 minutes, a harness failure), `fail-build`,
`fail-types`, `fail-eval`, then `pass`.

- **pass@1** is the mean of the attempt outcomes and is the headline. **pass@3** is whether any of
  three attempts passed; a model with fewer than three attempts shows no pass@3.
- **Axe** violations (`@axe-core/playwright`) and **cost** are secondary and never decide pass or
  fail.
- A run is **incomplete** once spend reaches `--max-usd` and **invalid** when more than 10% of its
  attempts are `infra-error`. Neither is published.

### Subcommands

`pnpm --filter bench-agent eval <subcommand>` (`src/eval-cli.ts`):

| Subcommand                                                                                                    | What it does                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate --out <dir> [--models a,b] [--arms a,b] [--tasks a,b] [--attempts n] [--max-usd n] [--timeout min]` | Runs the `claude -p` sessions into `<dir>`. Needs `ANTHROPIC_API_KEY`. Defaults: both models, the three arms, all tasks, 3 attempts, `$50`, 10 minutes. It builds and runs nothing a session wrote. |
| `score --in <dir> --out <results.json> [--concurrency n]`                                                     | Builds, type-checks and drives what `generate` left, with axe, and writes the results file. Needs Chromium; no key.                                                                                 |
| `publish --results <file> [--expect-model id]`                                                                | Writes `results/<date>-<version>.json`, `apps/site/public/evals.json` and `docs/AGENT-BENCHMARKS.md` from a scored run. Refuses an incomplete or invalid run.                                       |
| `dry [--tasks a,b]`                                                                                           | No model, no key (needs Chromium, like `score`): scores a scripted good cascivo app, a good shadcn app and a broken app per task, to prove each `EVAL.ts` can pass and fail.                        |

`bench --publish` is retired: `docs/AGENT-BENCHMARKS.md` comes from `eval publish` only.

### Reproduce it locally

Needs Node 22.18 or later (the CLI is a `.ts` file run with type stripping), Linux or macOS (the
harness starts MCP servers through POSIX `env -u`), and the Claude CLI at the version the workflow
pins. Use a dedicated Anthropic key with a low spend limit.

```sh
pnpm install
pnpm build                                  # the CLI and MCP server under test, from this checkout
npm i -g @anthropic-ai/claude-code@2.1.304  # the version evals.yml pins
pnpm --filter @cascivo/site exec playwright install chromium --with-deps   # for score

pnpm --filter bench-agent eval dry          # no key: check the hidden EVALs first

export ANTHROPIC_API_KEY=…
pnpm --filter bench-agent eval generate --out ./gen --models claude-sonnet-5-5 --attempts 3 --max-usd 20
pnpm --filter bench-agent eval score --in ./gen --out results.json
pnpm --filter bench-agent eval publish --results results.json
```

`generate` refuses a non-empty `--out` directory. `publish` changes tracked files
in your checkout (the results file, `evals.json`, the report); discard them if the run was only for
you.

### Cost

A full run is 8 tasks x 3 arms x 3 attempts x 2 models = 144 sessions, budgeted at about $50
(`--max-usd`, default 50). No session starts once spend reaches the cap. In `.github/workflows/evals.yml`
each model is its own shard and the cap is split evenly between them, so the defaults give each
model $25. A single model is one shard with the whole cap.

### Security model

`ANTHROPIC_API_KEY` exists only in `generate`, which never builds, installs or runs what an agent
wrote: a session has no Bash, `Read` and `Edit` stay inside its directory, and the only MCP tools
allowed are the ones that start no process. `generate` scans every attempt for the key and aborts
on a hit; `score` runs the agents' code with no secrets and read-only contents; `publish` holds the
write token and runs no generated code.

### Owner steps

These need the repository owner's API key, so they are not part of the code.

1. **Add the secret.** Add the `ANTHROPIC_API_KEY` repository secret, from a dedicated key with a
   low spend limit.
2. **Pilot.** Dispatch `evals.yml` with `tasks=admin-console`, `attempts=1`, `max_usd=10`. Read the
   per-session cost from the `generate` log; expect about $0.10 to $0.60. A pilot is a complete,
   valid run, so `publish` opens a results PR for it: close that PR without merging.
3. **Full run, or the fallback.**
   - If 144 times the observed mean cost is over $50, dispatch two runs: Sonnet with
     `attempts=3`, then Haiku with `attempts=1`. Haiku then reports pass@1 only, and `/evals` says so.
   - Otherwise dispatch both models with `attempts=3`.
4. **Review and merge the results PR.** `/evals` then shows the run.

## Legacy: the surface benchmark

What an agent spends to build an app with cascivo, by surface: the measurement behind the
blueprint work (`docs/plans/app-blueprints-and-workbench-research.md`, §6). It is separate from the
eval above: its arms are called `today` and `cascivo`, and its `cascivo` arm is not the published
`cascivo` arm.

```sh
pnpm build                                        # at the repo root: the CLI and MCP under test
pnpm --filter bench-agent bench --dry-run         # check the harness: no model, no key
ANTHROPIC_API_KEY=… pnpm --filter bench-agent bench --runs 3
```

### Method

- **Five fixed prompts** (`src/prompts.ts`): admin console, SaaS settings, marketing site, CRUD
  table, auth flow. A changed prompt makes earlier results incomparable; add one instead.
- **Two arms** (`src/arms.ts`), identical except for two tools:
  - `today`: the cascivo MCP server without `compose_app` and `list_blocks`. The agent scaffolds
    a shell with `create_app` and writes every page as TSX.
  - `cascivo` (called `blueprints` before the published eval): the same server with both, so a
    page can be a registry block.
- **Each run** starts in a fresh directory that holds only a `node_modules/cascivo` link to this
  checkout's CLI, so the `npx cascivo` the MCP server spawns resolves to it. It runs
  `claude -p --bare --restricted --strict-mcp-config`: no user settings, hooks or CLAUDE.md, only
  the MCP server built from this checkout and `Read` and `Edit` inside that directory (no Bash, so
  no installs or dev servers). Unlike the published eval, it allows the MCP tools that run the
  cascivo CLI (`create_app`, `compose_app`): both arms are built on them, and it runs locally on
  your own key.
- **Recorded:** input tokens (billed plus cache writes and reads), output tokens, cost, wall
  time and turns, from the CLI's own JSON; then `tsc --noEmit` errors and `cascivo audit --ai`
  errors and warnings on the app the run left. The app links one dependency tree installed
  once from this checkout's packed packages (`src/env.ts`), so no run pays for an install.
- **Reported:** the median of each prompt and arm, printed and saved under `results/`.
  `bench --publish` is retired; `docs/AGENT-BENCHMARKS.md` comes from the scored eval:
  `pnpm --filter bench-agent eval publish`.

A dry run replays a scripted tool call per arm (`src/dry-run.ts`) through the same scaffold,
link, `tsc` and audit, so it proves the pipeline and measures nothing about a model. Its
results are not committed.

A full run is 5 prompts × 2 arms × `--runs` agent sessions, on the key's account.
