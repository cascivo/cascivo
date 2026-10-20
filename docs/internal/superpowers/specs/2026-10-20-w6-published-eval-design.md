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
4. A change that breaks cascivo's MCP lowers the `cascivo` arm's score on the next run.

## 2. Arms

Every arm gets the same task text, the same file tools (`Read`, `Write`, `Edit`, `Glob`, `Grep`;
no Bash) and an empty working directory. Each runs through `claude -p --bare --strict-mcp-config`
with `--permission-mode acceptEdits`, as the harness does today.

| Arm id | Starting point | Tools beyond files | Measures |
| --- | --- | --- | --- |
| `cascivo` | empty directory | cascivo MCP server built from this checkout, including `compose_app` and `list_blocks` (today's `blueprints` arm) | cascivo as recommended |
| `cascivo-bare` | Vite + React app with `@cascivo/react` and a theme installed | none | what the model already knows about cascivo; the gap to `cascivo` is the value of the AI context |
| `shadcn` | empty directory | shadcn's official MCP server | the market default, each side at its best |

- **The `today` arm** stays in the code for internal comparison but is not published.
- **Verify the shadcn MCP invocation during implementation.** It is currently `npx shadcn@latest mcp`.
  Pin the shadcn CLI version in the harness so the control stays comparable between runs.
- **Starter projects** for `cascivo-bare` and `shadcn` are produced by the harness (the cascivo
  scaffold, or the shadcn init for a Vite app), not by the agent.
- **Dependencies:** each arm's dependency tree is installed once per run and linked into each
  attempt, as `src/env.ts` does today.

**Instructions:** each arm gets one shared, arm-neutral instruction, plus a one-sentence
arm-specific line naming its design system:

- "Use the cascivo design system" for both cascivo arms;
- "Use shadcn/ui with Tailwind" for `shadcn`.

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
| `admin-console` | existing prompt | overview with KPI figures, a users table, a settings page, navigation between them |
| `saas-settings` | existing | profile, billing and notification pages reachable and labelled |
| `marketing-site` | existing | hero heading, features, pricing, testimonials, FAQ (disclosure expands), footer |
| `crud-table` | existing | table of projects; search narrows rows; pagination moves pages; "create" adds a row |
| `auth-flow` | existing | sign-in and sign-up forms with labelled fields; submitting sign-in reaches a dashboard |
| `form-validation` | new | submitting an empty required field shows an error tied to the field (`aria-describedby` or `aria-invalid`); a valid submit clears it |
| `delete-confirm` | new | "Delete" opens a dialog with a title; Cancel closes it without deleting; Confirm removes the item |
| `filter-empty-state` | new | a filter that matches nothing shows an empty-state message; clearing it restores the list |

**Assertion rules:**

- `EVAL.ts` uses only role, label and text locators, never cascivo or Tailwind class names, so
  every arm can pass. Assertions check behaviour a user can see, not implementation.
- Each `EVAL.ts` exports `default async function evaluate(page: Page, baseUrl: string): Promise<void>`
  and throws on failure.
- Assertions tolerate reasonable variation:
  - case-insensitive text matching;
  - the target may be on any route reachable from `/` by visible navigation;
  - helper functions in a shared `tasks/_lib.ts` find a link or button by accessible name.

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

**Not published:** incomplete and invalid runs are not published. They are kept as workflow
artifacts for diagnosis.

## 5. Models and budget

**Models:** model ids live in one config file (`apps/bench/agent/src/models.ts`). v1 uses
`claude-sonnet-5-5` and `claude-haiku-5-5`. Adding a model is a config change and a re-run.

**Full run:** 8 tasks × 3 arms × 3 attempts × 2 models = 144 sessions.

**Pilot first:** before the first full run, a pilot measures the real cost per session:
1 task × 3 arms × 1 attempt × both models.

**If 144 sessions do not fit $50:** the fallback is 3 attempts on Sonnet and 1 attempt on Haiku. In
that case Haiku reports pass@1 only, and the page says so.

## 6. Running and publishing

### Workflow

A new `.github/workflows/evals.yml`.

**Triggers:**

- `workflow_dispatch`, with inputs: models, attempts, max-usd, tasks (default all);
- `release: published`.

It never runs on `pull_request` or `push`. All actions are SHA-pinned, as in
`framework-latest.yml`.

**Jobs:**

1. **`generate`**
   - Secret: `ANTHROPIC_API_KEY`. Permissions: `contents: read`.
   - Builds and packs this checkout, prepares the starter projects and dependency trees, and runs
     the `claude -p` sessions.
   - Runs nothing the agent wrote: no build, install, or execution of generated code.
   - Uploads every attempt directory and the CLI's JSON as an artifact.
2. **`score`**
   - No secrets, `contents: read`.
   - Downloads the artifacts and links the dependency trees.
   - Builds, type-checks and runs `EVAL.ts` with axe and the audit, in Chromium installed the way
     `ci.yml:257` does.
   - Writes `results.json` and uploads it.
3. **`publish`**
   - Permissions: `contents: write`, `pull-requests: write`. Runs no generated code.
   - Writes the results files and opens a PR (via `gh` and the workflow token) only for a valid,
     complete run.
   - A person merges it.

The hidden `EVAL.ts` files are in the repository, so they are not secret from people. They are
hidden from the agent because the harness never copies them into its working directory.

### Files

| File | Content | Committed |
| --- | --- | --- |
| `apps/bench/agent/results/<date>-<cascivo-version>.json` | versioned schema; run metadata (date, cascivo version, commit, models, attempts, validity) plus one record per attempt (task, arm, model, status, metrics) | yes, via the results PR |
| transcripts | full CLI output per attempt | no; workflow artifact, 90 days |
| `apps/site/public/evals.json` | latest valid run plus history (pass@1 per arm and model per run) | yes, generated |
| `docs/AGENT-BENCHMARKS.md` | generated from the JSON by the extended `--publish` path | yes, generated |

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
| Generated code exfiltrating the key | key confined to `generate`, which never executes generated code |
| shadcn control drifts between runs | pin the shadcn CLI version; record it in the run metadata |
| Non-determinism | 3 attempts, pass@1 as the mean; results labelled with exact model ids and dates |

## 10. Dependency on [cascivo/cascivo#283](https://github.com/cascivo/cascivo/pull/283)

The implementation starts after #283 merges. The branch then restarts from `main`. This spec lands
with #283 as documentation only.
