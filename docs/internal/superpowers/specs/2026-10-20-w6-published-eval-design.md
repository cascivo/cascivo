# W6: a published, reproducible LLM × cascivo eval

**Status:** approved in conversation on 2026-10-20; this written spec is up for review.
**Roadmap:** W6 in [`2026-10-17-ai-era-gap-analysis-design.md`](./2026-10-17-ai-era-gap-analysis-design.md).
**Evidence:** research reports
[05 §2](./2026-10-17-research/05-trust-evals-enterprise.md) and
[02 §5](./2026-10-17-research/02-ai-market.md).

## 1. Intent

**What the owner asked for:** a published eval with two jobs.

- **Public proof:** a re-runnable number for "how often does an agent build a correct app with
  cascivo". It is compared against a shadcn/ui + Tailwind control and against cascivo used without
  its AI context.
- **Regression detection:** the same suite is re-run on each release and on each new model, so a
  change to cascivo's AI context (MCP, `llms.txt`, docs) that makes agents worse shows up.

**Decisions taken in the conversation:**

| Area | Decision |
| --- | --- |
| Models | Claude only: the latest Sonnet and Haiku |
| Budget | About $50 per full run |
| Pass criteria | Hidden Playwright assertions plus build and type-check gates. No LLM judge |
| Where it runs | A release- or manually-triggered GitHub workflow |
| Where results go | Committed JSON, an `/evals` site page and `docs/AGENT-BENCHMARKS.md` |
| Approach | Extend `apps/bench/agent`, using the task layout of Vercel's [next-evals-oss](https://github.com/vercel/next-evals-oss) |

**Why this matters:** no design system publishes such an eval (report 05 §2), so cascivo's main claim
("AI-first") is currently unmeasured in public. The harness exists (`apps/bench/agent`: 5 prompts,
`claude -p --bare`, `tsc` + `audit --ai` scoring, token/cost capture), but
`docs/AGENT-BENCHMARKS.md` was never written.

**Success:**

1. One full run completes within budget.
2. Its results land in the repo through a reviewed PR.
3. `/evals` shows, per model:
   - pass@1 for the three arms;
   - the per-task table;
   - accessibility and cost columns;
   - the method and the reproduction steps.
4. A change that breaks cascivo's MCP lowers the `cascivo` arm's score on the next run (its read
   tools are what the arm uses; see §2).

## 2. Arms

Every arm gets the same task text, the same file tools and a starter project the harness copies
into its working directory. Each runs through `claude -p --bare --restricted --strict-mcp-config`
with `--permission-mode acceptEdits` and an explicit tool allowlist (`src/arms.ts`).

- **File tools:** `Read` and `Edit`, the same for every arm. With `--bare`, the pinned CLI
  (2.1.304) offers no others (`Write`, `Glob` and `Grep` are allowed but not offered), plus Bash.
  `--restricted` removes Bash, keeps `Read` and `Edit` inside the working directory and refuses a
  path that resolves through a symlink out of it.
- **Project file list:** the agent cannot list a directory, so the prompt ends with a block the
  harness generates from the starter, worded the same for every arm: `Project files (the working
  directory):` and the sorted relative paths, without `node_modules`, `.git` or lockfiles, at most
  200 (then `…and N more`).
- **No tool that runs a process.** The `generate` job holds the API key, and any process started
  there could read it, so each MCP server is limited to the tools that start none (§6). Both MCP
  arms lose their executing tools.

| Arm id | Starting point | Tools beyond files | Measures |
| --- | --- | --- | --- |
| `cascivo` | the cascivo scaffold (`cascivo create app --yes` on this checkout's packages) with its AI context files, `AGENTS.md` and `CLAUDE.md`; its `.mcp.json` is removed because the harness passes the server. `--bare` skips `CLAUDE.md` discovery, so the harness preloads the context as an adopter's Claude Code would (`CLAUDE.md` is `@AGENTS.md`): `--append-system-prompt-file` with a harness copy of the scaffold's `AGENTS.md`, kept outside the attempt directory. Never `--add-dir`, which would widen what `--restricted` lets the file tools reach | the 21 read-only tools of the cascivo MCP server built from this checkout (`CASCIVO_SAFE_TOOLS`: registry, components, blocks, templates, tokens, icons, guides, context, view grammar and validators). Not `compose_app`, `create_app`, `add_to_project`, `add_template`, `deploy_preview`, `lint_email` or `render_view_as_markdown`: they run the CLI, an install, a deploy or project code in the keyed job. The agent extends the scaffold itself; no tool returns component source | cascivo with its AI context, without the tools that scaffold or install |
| `cascivo-bare` | the same scaffold without `AGENTS.md`, `CLAUDE.md` and `.mcp.json`; nothing is preloaded | none | what the model already knows about cascivo; the gap to `cascivo` is the value of the AI context (the MCP server and the preloaded `AGENTS.md`) |
| `shadcn` | shadcn's Vite starter with every component added | shadcn's official MCP server, pinned, with the 3 tools that start no process (`SHADCN_SAFE_TOOLS`): `get_project_registries`, `get_add_command_for_items`, `get_audit_checklist`. Not its 4 item tools (`list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`, `get_item_examples_from_registries`): for a GitHub-sourced registry or item, which the agent can name or put in `components.json`, they run `git ls-remote` or `gh api` in the agent's directory. Every component's source is already in the starter | the market default, each side with what it can use safely |

- **The `today` arm** stays in the code for internal comparison but is not published.
- **The shadcn MCP invocation** is `npx --prefix <cfg> -y shadcn@4.22.1 mcp --cwd <cfg>`, where
  `<cfg>` is the harness's config directory (outside every attempt), started through
  `env -u ANTHROPIC_API_KEY`. The version is pinned (`SHADCN_VERSION`) so the control stays
  comparable between runs; `--prefix` keeps npx from resolving a `shadcn` the agent wrote, and
  `--cwd` keeps shadcn's dotenvx from loading the agent's `.env` files.
- **Starter projects** for every arm are produced by the harness (the cascivo scaffold, or the
  shadcn init for a Vite app), not by the agent. Both cascivo arms copy one scaffold.
- **Dependencies:** each arm's dependency tree is installed once per run and linked into each
  attempt by the score job. During generate nothing is linked into an attempt, so a session's
  writes cannot reach a shared tree or the checkout.

**Instructions:** each arm gets one shared, arm-neutral instruction, plus a one-sentence
arm-specific line naming its design system:

- "Use the cascivo design system" for both cascivo arms;
- "Use shadcn/ui with Tailwind" for `shadcn`.

The project file list follows them. It is generated from the starter, not written per arm.

## 3. Tasks

**Layout:**

- Tasks live in `apps/bench/agent/tasks/<id>/`. Each task folder holds:
  - `PROMPT.md`: the task text the agent sees;
  - `EVAL.ts`: the hidden assertions (Playwright), never copied into the agent's directory.
- A task's text or assertions never change once published. A changed task gets a new id, so older
  results stay comparable.

**v1 tasks (single-turn):**

| id | Source | Behaviour the hidden test checks (examples) |
| --- | --- | --- |
| `admin-console` | existing prompt | overview with KPI figures (on `/`, or behind an overview/dashboard/home link when `/` shows none), a users table, a settings page, navigation between them; a KPI figure is an element whose whole text is an amount (`1,284`, `$48.2k`, `98.5%`) or a duration (`3m 24s`, `2:34`), optionally followed by a signed delta (`$48,210 +4.2%`), or a heading or named region holding a number |
| `saas-settings` | existing | profile, billing and notification pages, each reached by navigation (at most one of them may be the landing page, and only if it shows that page's heading and its control; a settings index that only lists the three is navigated from); profile and notifications each have a labelled form control, billing has a labelled control or a named action or table |
| `marketing-site` | existing | hero heading, features, pricing, testimonials, FAQ (a question disclosure, if there is one, expands to show its answer; otherwise an answer is visible under its question), footer (`contentinfo` or a page `<footer>`); a section is a heading or named region, or the in-page target of a link of that name (`#features`, or `/#features` from `/`; a malformed `%` escape is no target) |
| `crud-table` | existing | table of projects; search narrows rows; pagination moves pages; "create" adds a row |
| `auth-flow` | existing | a sign-in form with fields named email/user and password (label, `aria-label` or placeholder); a sign-up page reached by a link, button or tab; submitting sign-in with plausible credentials replaces the form with a dashboard heading (if sign-in refuses an unknown account, the same credentials are registered through sign-up, ticking required checkboxes, then used to sign in again; if sign-up itself lands on the dashboard and the app offers a sign-out that keeps the page, the EVAL signs out, answering a sign-out confirmation dialog, and signs in again without reloading; a sign-out that leaves the dashboard up, or a sign-in form only a reload would reach, is accepted) |
| `form-validation` | new | submitting empty shows an error next to each of the three fields (in an element the field names in `aria-describedby`/`aria-errormessage`, in the field's own wrapper, or right after it); an invalid email gets an email error and no success; a valid submit shows a success message and no field errors; browser-native validation alone (a bubble, not in the page) is not an error next to a field; success words are matched whole (thank, sent, success, received, submitted, got it, be in touch; not "consent"), and not when a negation (not, cannot, n't, couldn't, unable, failed) is one of the three words right before it in the same sentence ("could not be sent" is a refusal; "Don't worry, your message was sent" is a success); residual: an error inside or after the success block is not detected on valid submit |
| `delete-confirm` | new | three projects, each with a Delete button; Delete opens a `dialog` or `alertdialog` with a title (an accessible name, or a visible heading inside it); Cancel closes it and all three remain; Confirm removes that project and two remain |
| `filter-empty-state` | new | a filter that matches nothing hides the members and shows a "nothing matched" message; a clear/reset/show-all button or link restores the full list |

**Assertion rules:**

- `EVAL.ts` uses only role, label and text locators, never cascivo or Tailwind class names, so
  every arm can pass. Assertions check behaviour a user can see, not implementation.
- Each `EVAL.ts` exports `default async function evaluate(page: Page, baseUrl: string): Promise<void>`
  and throws on failure.
- Assertions tolerate reasonable variation:
  - case-insensitive text matching;
  - the target may be on any route reachable from `/` by visible navigation;
  - helper functions in a shared `tasks/_lib.ts` find a link or button by accessible name. When
    the target is a page of the app (admin-console's overview, users and settings, saas-settings'
    three pages), a match inside a navigation landmark wins over a same-named control elsewhere (a
    header account button named "Settings" or "Profile"). For an action (create, delete, clear,
    submit), the first match on the page wins, so a later nav (a footer "What's new" link) cannot
    take it.

**Out of v1:** multi-turn edit tasks (an agent extends its own app across turns). Report 02 §5
says these are where models fail most, so they are first for v2.

## 4. Scoring

### One attempt

An attempt **passes** when all three hold:

1. `vite build` succeeds;
2. `tsc --noEmit` reports 0 errors;
3. `EVAL.ts` passes against the built app served by `vite preview`.

### Status of an attempt

Each attempt records one `status`:

- `pass`;
- `fail-build`;
- `fail-types`;
- `fail-eval`;
- `infra-error`.

`infra-error` covers a CLI crash, a session over the 10-minute timeout, or a harness failure
before the agent started. It counts as a failed attempt.

### Secondary metrics

These never affect pass or fail:

| Metric | Applies to | How |
| --- | --- | --- |
| Accessibility | all arms | `@axe-core/playwright` on every page the eval visited; count of violations by impact |
| Adherence | cascivo arms only | `cascivo audit --ai` errors and warnings, as `src/score.ts` does today |
| Cost | all arms | input, output and cache tokens, USD, wall time and turns, from the CLI's own JSON |

### Aggregates per task × arm × model

- **pass@1:** the mean of the attempt outcomes. This is the headline.
- **pass@3:** at least one of the 3 attempts passed.

With 3 samples these are exact, not estimated.

### Validity

**Incomplete run:** a run stops starting new sessions once spend reaches `--max-usd` (default 50);
that run is `incomplete`.

**Invalid run:** a run is `invalid` when `infra-error` attempts exceed 10% of all attempts.

**Not published:** incomplete and invalid runs are not published, nor are partial runs (fewer
than every task or arm, §5). They are kept as workflow artifacts for diagnosis. The workflow
checks each model's shard on its own: if every shard is valid, so is the run.

## 5. Models and budget

**Models:** model ids live in one config file (`apps/bench/agent/src/models.ts`). v1 uses
`claude-sonnet-5-5` and `claude-haiku-5-5`. Adding a model is a config change and a re-run.

**Full run:** 8 tasks × 3 arms × 3 attempts × 2 models = 144 sessions.

**Pilot first:** before the first full run, a pilot measures the real cost per session:
1 task × 3 arms × 1 attempt × both models.

**If 144 sessions do not fit $50:** the fallback is 3 attempts on Sonnet and 1 attempt on Haiku. In
that case Haiku reports pass@1 only, and the page says so.

**Budget per model:** the workflow runs each model as its own shard (§6), and each shard's cap is
`max_usd / n` for `n` models, rounded down to the cent. A shard cannot borrow what another left
unspent, so the run total never exceeds `max_usd`. At the defaults each model has $25 for its 72
sessions; a single-model dispatch has the whole cap. Size a run per model from that share.

**Pilot and partial runs are not published:** `publish` refuses a run whose tasks are not every
published task or whose arms are not the three arms (a pilot, or a `--tasks` subset), because it
would replace the headline with the mean over its own tasks. `--partial` overrides that for local
use only. `attempts=1` is still a full run (the fallback above).

## 6. Running and publishing

### Workflow

A new `.github/workflows/evals.yml`.

**Triggers:**

- `workflow_dispatch`, with inputs: models, attempts, max-usd, tasks (default all), and `publish`
  (a boolean, default false): only a ticked dispatch opens a results PR, so a pilot leaves it off;
- `release: published`, which always publishes.

**Sharding:** a run is 8 tasks × 3 arms × attempts × models sessions, one after another, which at
the defaults exceeds the 6 hours a hosted job may run. So a `setup` job validates the inputs and
plans one shard per model, and `generate` and `score` run as a matrix over the models
(`fail-fast: false`, so one failing shard keeps the others' transcripts). Each shard's cap is
`max_usd / n` (§5).

It never runs on `pull_request` or `push`. All actions are SHA-pinned, as in
`framework-latest.yml`.

**Jobs:**

1. **`generate`** (one per model)
   - Secret: `ANTHROPIC_API_KEY`. Permissions: `contents: read`.
   - Builds and packs this checkout and prepares the starter projects and dependency trees before
     the key is in any environment, then runs the `claude -p` sessions.
   - Runs nothing the agent wrote: no build, install, or execution of generated code. Any process
     started in this job can read the key from `/proc`, so a session cannot start one either: no
     Bash, `Read` and `Edit` confined to the attempt directory by `--restricted` (no symlink out of
     it; nothing is linked into it during generate), and only MCP tools that start no process
     (§2). MCP servers start without the key, and neither loads code or `.env` files from the
     session's directory: shadcn's runs with `npx --prefix` and `--cwd` set to the harness's
     config directory, because it loads `.env` through dotenvx, which runs `$(…)` in a value.
   - Scans every attempt for the key after its session: a hit removes the attempt's files and
     aborts the run. A separate step scans the whole output again, whatever happened to the run,
     and the artifact is uploaded only when that scan is clean.
   - Uploads every attempt directory and the CLI's JSON as the `eval-gen-<model>` artifact, and
     its `run.json` (the run metadata: date, commit, models, tasks, arms, attempts, spend) again on
     its own as `eval-run-<model>`, so `publish` can cross-check the results against what this
     job, where no agent code runs, recorded.
2. **`score`** (one per model)
   - No secrets, `contents: read`.
   - Downloads the artifacts and links the dependency trees.
   - Imports every planned task's `EVAL.ts` (and `_lib.ts`) before the first attempt builds, then
     builds, type-checks and runs `EVAL.ts` with axe and the audit, in Chromium installed the way
     `ci.yml:257` does.
   - A harness fault (a missing tool, a browser that will not launch, audit output that is not
     JSON) aborts the shard rather than being recorded against the model (R9); "Re-run failed
     jobs" scores it again from the kept artifacts, with no model spend.
   - Writes `results.json` and uploads it as `eval-results-<model>`.
   - Trust limit: agent code runs here (`vite.config.ts`, a PostCSS config, the app) with the
     checkout writable. It cannot reach the key or the repository, but it can tamper with its own
     shard's scoring (§9).
3. **`publish`** (on a release, or a dispatch with `publish` ticked)
   - Permissions: `contents: write`, `pull-requests: write`. Runs no generated code.
   - Downloads every shard's `eval-results-<model>` and `eval-run-<model>`; the downloaded set
     must be exactly the planned models. Runs `eval publish` once per shard, with
     `--expect-model <model>` and `--run <that shard's run.json>`: a shard whose results are not
     that model's, not every task and arm, dated in the future, incomplete or invalid, or whose
     date, commit, models, tasks, arms, attempts, spend or budget flag differ from its `run.json`
     fails the job before any branch exists. Nothing in `run.json` is executed.
   - Each shard becomes its own results file (one model each). A file name already holding a
     different run gets a `-2`, `-3`, … suffix (R23), so a re-published run is idempotent and
     nothing is overwritten. `evals.json` takes each model's newest run as `latest`, and the
     history has one entry per run: the shards of one run (same day, cascivo version and commit)
     merge.
   - Opens one PR (via `gh` and the workflow token) for the whole run. A person reviews and merges
     it; that review is the integrity gate for what the score job could forge (§9).

The hidden `EVAL.ts` files are in the repository, so they are not secret from people. They are
hidden from the agent because the harness never copies them into its working directory.

### Files

| File | Content | Committed |
| --- | --- | --- |
| `apps/bench/agent/results/<date>-<cascivo-version>[-<n>].json` | one per shard (one model); versioned schema; run metadata (date, cascivo version, commit, models, arms, tasks, attempts, spend, budget flag, shadcn version) plus one record per attempt (task, arm, model, status, metrics). Validity is computed from it, not stored. `-<n>` only when the name already holds a different run | yes, via the results PR |
| transcripts | full CLI output per attempt | no; workflow artifact, 90 days |
| `apps/site/public/evals.json` | latest: each model's newest valid run, with that run's date, cascivo version and attempts; history: pass@1 per arm and model, one entry per run (its shards merged) | yes, generated |
| `docs/AGENT-BENCHMARKS.md` | generated from the JSON by `eval publish` | yes, generated |

**Schema and parsing:**

- The schema has a `schemaVersion` field.
- Results are parsed at the boundary (bound as `unknown`, then narrowed), per CLAUDE.md's rule on
  payloads.

### Site page

A new `/evals` route in `apps/site`, data-driven from `evals.json` like the rest of the site. It
shows:

1. **Headline:** pass@1 per arm and model, with the run date and cascivo version.
2. **Per-task table:** pass@1 and pass@3 per arm.
3. **Accessibility and cost columns.**
4. **Method:** arms, task list linked to the task folders, scoring rules, what is not measured.
5. **Reproduction:** the exact commands to run it locally with your own key.
6. **History:** pass@1 per arm over runs.
7. **Note:** incomplete and invalid runs are not shown.

The page follows the site's existing layout, theming and accessibility conventions, and passes the
320–414 px overflow sweep.

## 7. Testing the harness (no model, no key)

- **Canaries per task:** the dry run (`src/dry-run.ts`) is extended with fixtures per task:
  - a scripted "good" app built with cascivo;
  - a scripted "good" app built with shadcn/ui + Tailwind;
  - a scripted "broken" app.

  `EVAL.ts` must pass both good apps and fail the broken one. This proves each hidden test can fail
  and does not favour either design system.
- **Unit tests:** pass@k maths, status classification, the results schema parser (rejects malformed
  input), the validity rules, and the report and `evals.json` generators.
- **CI:** the dry run joins CI as a test job, so the harness cannot rot between paid runs.

## 8. Non-goals (v1)

- non-Claude models;
- an LLM judge;
- multi-turn tasks;
- visual or screenshot scoring;
- leaderboards for third parties.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Assertions favour one design system | role, label and text locators only; each task's dry-run canary has a good cascivo app and a good shadcn app, and both must pass (§7) |
| Cost overrun | `--max-usd` cap, pilot first, documented fallback |
| Generated code exfiltrating the key | key only in `generate`, which never executes generated code; sessions there cannot start a process (no Bash, an allowlist of MCP tools that start none, `--restricted` file tools that cannot reach code a tool runs); the output is scanned for the key before upload. Use a dedicated Anthropic workspace key with a low spend limit, so a leak is cheap to rotate |
| Agent code in `score` tampers with its shard's results | it runs as the runner user with the checkout writable (a `vite.config.ts`, PostCSS config or Vite plugin), so it can rewrite other attempts before they build, the shared dependency trees, an `EVAL.ts` not yet imported, or `results.json` before upload (a `setsid` process outlives the step). Hardening: no secrets and read-only contents in the job; every planned `EVAL.ts` is imported before the first build; `publish` checks the shape, the model, the full scope, that the date is not in the future, and the run metadata against generate's `run.json`. It cannot check the statuses: a person reviews the results PR before merging, and that review is the integrity gate (the PR body says so) |
| shadcn control drifts between runs | pin the shadcn CLI version; record it in the run metadata |
| Non-determinism | 3 attempts, pass@1 as the mean; results labelled with exact model ids and dates |

## 10. Dependency on [cascivo/cascivo#283](https://github.com/cascivo/cascivo/pull/283)

The implementation starts after #283 merges. The branch then restarts from `main`. This spec lands
with #283 as documentation only.
