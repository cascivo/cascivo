# W6 Published Eval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a re-runnable eval of how often Claude builds a correct app with cascivo. It compares
three arms: cascivo, cascivo without its AI context, and shadcn/ui + Tailwind. Results publish
through a reviewed PR to `/evals` and `docs/AGENT-BENCHMARKS.md`.

**Architecture:** extend `apps/bench/agent`. The eval has three phases, each a subcommand of a new
`src/eval-cli.ts`:

| Phase | Subcommand | Holds the API key? | Runs generated code? | What it does |
| --- | --- | --- | --- | --- |
| Generate | `generate` | yes | no | runs `claude -p` sessions |
| Score | `score` | no | yes | builds each attempt, type-checks it, runs the hidden Playwright `EVAL.ts` plus axe and the audit |
| Publish | `publish` | no | no | writes the results files |

Tasks follow the next-evals-oss layout: `tasks/<id>/PROMPT.md` and `EVAL.ts`.

**Tech Stack:**

- Node 22 with `--experimental-strip-types`, as the harness runs today;
- `claude` CLI headless;
- Playwright with `@axe-core/playwright`;
- Vite;
- vitest via `vp`;
- GitHub Actions;
- the Preact site (`apps/site`).

**Spec:** [`../specs/2026-10-20-w6-published-eval-design.md`](../specs/2026-10-20-w6-published-eval-design.md).
Read it first.

**Prerequisite:** [cascivo/cascivo#283](https://github.com/cascivo/cascivo/pull/283) is merged.
Restart the branch from `main` before Task 1:

```sh
git fetch origin main && git checkout -B claude/nice-galileo-x8ogrz origin/main
```

## Global Constraints

### Project rules

- CLAUDE.md rules bind every task:
  - `pnpm ready` before every commit;
  - parse payloads you did not produce at the boundary (`unknown`, then narrow; never `as`);
  - comments explain why, not what;
  - no new runtime dependency in any published package. All new dependencies go to
    `apps/bench/agent` (private) or are already in `apps/site`.
- The legacy `bench` command (`src/cli.ts`) and its tests keep working unchanged, except that the
  arm id `blueprints` is renamed to `cascivo` (Task 3).

### Eval parameters

| Parameter | Value |
| --- | --- |
| Models | `claude-sonnet-5-5`, `claude-haiku-5-5`, in `src/models.ts` |
| Attempts | 3 per task × arm × model (`--attempts`, default 3) |
| Budget cap | `--max-usd`, default `50`. Once total spend ≥ cap, no new session starts and the run is `incomplete` |
| Session timeout | 10 minutes. A timeout or CLI crash is status `infra-error` |
| Invalid run | `infra-error` attempts > 10% of all attempts |
| Published runs | only those that are complete and valid |
| Schema | `schemaVersion: 1` |

### Statuses

- **Attempt statuses:** `pass`, `fail-build`, `fail-types`, `fail-eval`, `infra-error`.
- **Precedence** (first failing wins): `infra-error` → `fail-build` → `fail-types` → `fail-eval` →
  `pass`.

### Arms and tasks

**Published arms:** `cascivo`, `cascivo-bare`, `shadcn`.

**Tasks** (ids, in this order):

1. `admin-console`
2. `saas-settings`
3. `marketing-site`
4. `crud-table`
5. `auth-flow`
6. `form-validation`
7. `delete-confirm`
8. `filter-empty-state`

### Hidden tests

- `EVAL.ts` uses only role, label and text locators, never class names.
- It exports `default async function evaluate(page: Page, baseUrl: string): Promise<void>` and
  throws on failure.

### Scoring timeouts

| Step | Timeout |
| --- | --- |
| `vite build` | 180 s |
| `tsc --noEmit` | 120 s |
| `vite preview` readiness | 30 s |
| `EVAL.ts` | 120 s |

A step that times out fails that step: build → `fail-build`, tsc → `fail-types`, preview or
EVAL → `fail-eval`.

### Security

- **Key confinement:** `ANTHROPIC_API_KEY` exists only in the `generate` job, which never builds,
  installs or executes agent output.
- **Agent isolation:** the agent's working directory never contains `EVAL.ts` or fixtures.

## Review Focus

These are the most likely ways the eval misleads or breaks. Each has a test in the task named.

1. **The agent writes the app in a subdirectory, or in the run root.** Expected: scoring finds it
   (`findApp`). No app at all is `fail-build`, not a crash (Task 4).
2. **Generated code hangs** (an infinite build, a preview that never listens, a page that never
   settles). Expected: the step's timeout fails the attempt, and the score phase continues with
   the next attempt (Task 4).
3. **The app routes client-side or with hash URLs.** Expected: `_lib.ts` navigation by visible link
   or button works for both (Task 2 helpers, exercised by Task 5 and 6 canaries).
4. **The budget cap is hit mid-run.** Expected:
   - sessions already started finish;
   - nothing new starts;
   - `publish` refuses the run;
   - the reason is printed (Task 7, Task 8).
5. **A malformed or foreign `results.json` reaches `publish`.** Expected: a clear error naming the
   bad field; nothing is written (Task 1, Task 8).

---

### Task 1: Results schema, statuses, aggregation, validity

Pure functions with no I/O. Everything later depends on these types.

**Files:**
- Create: `apps/bench/agent/src/eval/results.ts`, `apps/bench/agent/src/eval/aggregate.ts`
- Test: `apps/bench/agent/src/eval/results.test.ts`, `apps/bench/agent/src/eval/aggregate.test.ts`

**Interfaces:**
- **Produces types:**

```ts
export const SCHEMA_VERSION = 1
export type AttemptStatus = 'pass' | 'fail-build' | 'fail-types' | 'fail-eval' | 'infra-error'
export interface AxeCounts { critical: number; serious: number; moderate: number; minor: number }
export interface AttemptRecord {
  task: string; arm: string; model: string; attempt: number   // attempt is 1-based
  status: AttemptStatus
  /** First failing step's message, trimmed to 500 chars; null on pass. */
  detail: string | null
  usage: AgentUsage | null          // from src/result.ts; null on infra-error before a result
  tscErrors: number | null
  axe: AxeCounts | null              // null when the eval never loaded a page
  auditErrors: number | null; auditWarnings: number | null   // null for the shadcn arm
}
export interface EvalRun {
  schemaVersion: 1
  date: string                       // ISO
  cascivoVersion: string; commit: string
  models: string[]; arms: string[]; tasks: string[]; attempts: number
  maxUsd: number; spentUsd: number
  /** True when the budget cap stopped new sessions. */
  budgetExhausted: boolean
  shadcnVersion: string
  records: AttemptRecord[]
}
export type RunValidity = 'valid' | 'incomplete' | 'invalid'
```

- **Produces functions:**
  - `parseEvalRun(raw: unknown): EvalRun` throws `Error` naming the first bad field, e.g.
    `records[3].status`.
  - `classify(steps: { infra: boolean; build: boolean; types: boolean; eval: boolean }): AttemptStatus`
  - `validity(run: EvalRun): RunValidity`
  - `aggregate(run: EvalRun): AggregateRow[]`, where
    `AggregateRow = { task: string; arm: string; model: string; attempts: number; passAt1: number; passAt3: boolean | null; axeSerious: number; medianCostUsd: number | null }`.

- [ ] **Step 1: Write the failing tests.**
  - `classify follows precedence`: `{infra:true, …}` → `infra-error`; `{build:false, types:false}`
    → `fail-build`; `{build:true, types:false, eval:false}` → `fail-types`; all true → `pass`.
  - `validity`:
    - `budgetExhausted` → `incomplete`;
    - 2 of 18 records `infra-error` (11%) → `invalid`;
    - 1 of 18 (5.6%) → `valid`;
    - a run whose records don't cover every task × arm × model × attempt → `incomplete`.
  - `aggregate`:
    - 3 attempts with pass, fail-eval, pass → `passAt1 ≈ 0.667`, `passAt3 = true`;
    - 1 attempt → `passAt3 = null`;
    - `axeSerious` sums `critical + serious` over attempts.
  - `parseEvalRun` accepts a valid run and rejects each of:
    - `schemaVersion: 2`;
    - an unknown status;
    - a negative `spentUsd`;
    - a non-array `records`.

    The error message contains the field path. (Review Focus 5.)
- [ ] **Step 2: Run `pnpm --filter bench-agent test`.** Expected: the new tests FAIL (module
  missing).
- [ ] **Step 3: Implement both modules.** Reuse `parseClaudeResult`'s style from `src/result.ts`
  for `isRecord` and numeric checks. `aggregate` keys rows by task × arm × model in
  `run.tasks` × `run.arms` × `run.models` order.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** after `pnpm ready`:
  `git commit -m "feat(bench): eval results schema, statuses and aggregation"`.

### Task 2: Task registry, prompts and the shared assertion helpers

**Files:**
- Create: `apps/bench/agent/tasks/<id>/PROMPT.md` for the 8 ids. The five existing ones copy the
  `text` from `src/prompts.ts` verbatim. The three new ones are:
  - `form-validation`: "Build a contact form with name, email and message fields. All three are
    required and the email must be valid; show an error next to each invalid field when the form
    is submitted, and a success message when it is valid."
  - `delete-confirm`: "Build a page that lists three projects, each with a Delete button. Deleting
    asks for confirmation in a dialog; Cancel keeps the project and Confirm removes it."
  - `filter-empty-state`: "Build a page that lists team members with a text filter. When no
    member matches, show a message saying nothing matched, with a way to clear the filter."
- Create: `apps/bench/agent/tasks/_lib.ts`, `apps/bench/agent/src/eval/tasks.ts`
- Modify: `apps/bench/agent/package.json`: add devDependencies `@playwright/test`
  (catalog version if the catalog has it, else the version `apps/site` uses) and
  `@axe-core/playwright` (latest).
- Test: `apps/bench/agent/src/eval/tasks.test.ts`

**Interfaces:**
- Produces: `TASK_IDS: readonly string[]` (Global Constraints order).
- Produces: `loadTasks(ids?: string[]): EvalTask[]`, where
  `EvalTask = { id: string; prompt: string; evalPath: string; fixturesDir: string }`. It throws on
  an unknown id or a missing `PROMPT.md`/`EVAL.ts`.
- Produces in `tasks/_lib.ts`:
  - `goTo(page: Page, baseUrl: string, name: RegExp): Promise<void>`: from the current page, click
    the first visible link or button whose accessible name matches `name`, then wait for the
    navigation or DOM to settle. Works for history routing and hash routing.
  - `expectVisible(page: Page, role: AriaRole, name: RegExp): Promise<void>`
  - `findOnAnyPage(page: Page, baseUrl: string, role: AriaRole, name: RegExp): Promise<Locator>`:
    tries `/`, then follows each visible nav link once (breadth-first, max 10 pages).

- [ ] **Step 1: Write the failing tests.**
  - `loadTasks returns 8 tasks in TASK_IDS order, each prompt non-empty`.
  - `loadTasks rejects an unknown id`.
  - `existing prompts are unchanged`: each of the five `PROMPT.md` texts equals
    `PROMPTS.find(p => p.id === id).text`.

  `EVAL.ts` files don't exist yet. For this task, create each as a stub that throws
  `new Error('not implemented')`; Tasks 5–6 replace them.
- [ ] **Step 2: Confirm the tests fail.** Expected: FAIL.
- [ ] **Step 3: Implement.** Add the prompts, `_lib.ts`, `tasks.ts` and the stubs.
- [ ] **Step 4: Run the tests and commit.** Expected: PASS. Then `pnpm ready` and
  `git commit -m "feat(bench): eval task registry and assertion helpers"`.

### Task 3: Arms, starters and models

**Files:**
- Modify: `apps/bench/agent/src/arms.ts`:
  - `ArmId = 'today' | 'cascivo' | 'cascivo-bare' | 'shadcn'`. `blueprints` is renamed to
    `cascivo`; update `src/cli.ts` and `bench.test.ts` references.
  - `PUBLISHED_ARMS = ['cascivo', 'cascivo-bare', 'shadcn'] as const`.
- Create: `apps/bench/agent/src/models.ts`:
  `export const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'] as const`.
- Create: `apps/bench/agent/src/eval/starters.ts`
- Modify: `apps/bench/agent/src/prompts.ts`: add the arm-specific instruction line from the spec
  §2, as `instructionsFor(arm: ArmId): string`. Keep `INSTRUCTIONS` for the legacy arms.
- Test: `apps/bench/agent/src/bench.test.ts` (extend), `apps/bench/agent/src/eval/starters.test.ts`

**Interfaces:**
- Produces:
  `claudeArgs(arm: ArmId, mcpConfig: string | null, model: string | null, opts?: { stream?: boolean }): string[]`.
  With `stream: true` it emits `--output-format stream-json --verbose` instead of
  `--output-format json`, so the full transcript is captured. The legacy CLI keeps the default.
  The rest of the arm behaviour:
  - `cascivo-bare` passes no `--mcp-config` (only `--strict-mcp-config`, so no ambient servers).
  - `shadcn` gets its own MCP config file.
  - `cascivo` is today's `blueprints` behaviour.
- Produces: `SHADCN_VERSION: string`, pinned. Set it to the output of `npm view shadcn version` at
  implementation time.
- Produces:
  `prepareStarter(arm: 'cascivo' | 'cascivo-bare' | 'shadcn', log): { template: string | null; nodeModules: string }`.
  - `cascivo`: `template: null` (empty run dir). `nodeModules` is the existing `prepare()` tree.
  - `cascivo-bare`: `template` is the app produced by `cascivo create app --yes`, with
    `@cascivo/*` pointed at the packed tarballs as `env.ts` does. `nodeModules` is the same
    `prepare()` tree.
  - `shadcn`: `template` is a Vite React-TS app with Tailwind and `shadcn@<SHADCN_VERSION> init`
    run non-interactively, with all shadcn components added (`shadcn add --all`). It gets its own
    installed `nodeModules`, cached under `apps/bench/agent/.cache/shadcn/`.
- Produces: `shadcnMcpConfig(path: string): string`, which writes
  `{ mcpServers: { shadcn: { command: 'npx', args: ['-y', \`shadcn@${SHADCN_VERSION}\`, 'mcp'] } } }`.
  Verify the subcommand name against the pinned version's `--help`, and record what you found in
  a code comment.

- [ ] **Step 1: Write the failing tests.**
  - `claudeArgs('cascivo-bare', …)` contains `--strict-mcp-config` and no `--mcp-config`.
  - `claudeArgs('shadcn', cfg, m)` contains `--mcp-config cfg` and no `--disallowedTools`.
  - `claudeArgs('cascivo', …)` equals the old `blueprints` output.
  - `instructionsFor('shadcn')` contains "shadcn/ui with Tailwind"; `instructionsFor('cascivo')`
    contains "cascivo design system".
  - `prepareStarter('shadcn')` is integration-tested behind `skip: !process.env.EVAL_SLOW`. Its
    template contains `components.json` and `src/components/ui/button.tsx`.
- [ ] **Step 2: Confirm the tests fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests.** Run `pnpm --filter bench-agent test`, and once with
  `EVAL_SLOW=1`. Expected: PASS.
- [ ] **Step 5: Commit** after `pnpm ready`:
  `git commit -m "feat(bench): eval arms, shadcn and bare starters, model list"`.

### Task 4: The score phase

**Files:**
- Create: `apps/bench/agent/src/eval/evaluate.ts`
- Modify: `apps/bench/agent/src/score.ts`: export `findApp` (already exported) and
  `countTscErrors`. No behaviour change.
- Test: `apps/bench/agent/src/eval/evaluate.test.ts`, with fixtures under
  `apps/bench/agent/src/eval/__fixtures__/` (a tiny passing app, a build-breaking app, a type-error
  app, and a never-listening preview app).

**Interfaces:**
- Consumes: `classify`, `AttemptRecord`, `AxeCounts` (Task 1); `EvalTask` (Task 2);
  `prepareStarter` (Task 3).
- Produces:
  `scoreAttempt(input: { attemptDir: string; task: EvalTask; arm: string; model: string; attempt: number; nodeModules: string; usage: AgentUsage | null; infra: boolean; infraDetail?: string }): Promise<AttemptRecord>`
  1. Run `findApp(attemptDir)`. No app gives `fail-build` with detail `no app found`.
  2. Link `nodeModules` into the app.
  3. Run `vite build` (180 s), then `tsc --noEmit -p .` (120 s).
  4. Start `vite preview --port <free port>` and wait up to 30 s for HTTP 200 on `/`.
  5. Import `task.evalPath` and run it in a fresh Chromium page (120 s timeout).
  6. Run axe on each URL the page visited (track `page.on('framenavigated')`), and sum the counts.
  7. Run `cascivo audit --ai` for cascivo arms only.
  8. Kill the preview in `finally`.
- Produces:
  `scoreAll(inDir: string, opts: { concurrency: number }): Promise<AttemptRecord[]>`. It walks
  `<inDir>/<model>/<arm>/<task>/<attempt>/` (layout from Task 7) and reads `meta.json` in each
  attempt dir (`{ usage: unknown | null; infra: boolean; infraDetail?: string }`), parsing `usage`
  with `parseClaudeResult` when present.

- [ ] **Step 1: Write the failing tests.** All use the local fixtures, a stub `EVAL.ts` per
  fixture and real Chromium:
  - passing app → `pass` with axe counts;
  - build-breaking → `fail-build`;
  - type error → `fail-types`;
  - an EVAL that throws → `fail-eval` with the thrown message in `detail`;
  - the never-listening preview → `fail-eval` within ≈ 35 s, not a hang (Review Focus 2);
  - an empty attempt dir → `fail-build`, `no app found` (Review Focus 1);
  - the app placed in a subdirectory is found (Review Focus 1).
- [ ] **Step 2: Confirm the tests fail.** Expected: FAIL.
- [ ] **Step 3: Implement.** Use `child_process.spawn` with explicit kill on timeout (kill the
  process group), and Playwright's `chromium.launch()`. Locate Chromium the way
  `scripts/checks/framework-install.test.ts` does (`resolveChromium`); never hard-code a path.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** after `pnpm ready`:
  `git commit -m "feat(bench): eval score phase (build, types, hidden eval, axe, audit)"`.

### Task 5: Hidden evals and canary fixtures, tasks 1–4

**Files** (per task id `admin-console`, `saas-settings`, `marketing-site`, `crud-table`):
- Replace: `apps/bench/agent/tasks/<id>/EVAL.ts`
- Create: `apps/bench/agent/tasks/<id>/fixtures/{cascivo,shadcn,broken}/`. These are files
  overlaid onto the arm's starter template, mainly `src/App.tsx` plus page files:
  - `cascivo` and `broken` overlay the `cascivo-bare` template;
  - `shadcn` overlays the shadcn template.
- Create: `apps/bench/agent/src/eval/dry.ts`
- Test: `apps/bench/agent/src/eval/dry.test.ts` (behind `skip: !process.env.EVAL_SLOW`)

**Interfaces:**
- Consumes: `scoreAttempt` (Task 4), `prepareStarter` (Task 3), `_lib.ts` helpers (Task 2).
- Produces:
  `dryRunCanaries(ids?: string[]): Promise<{ task: string; fixture: 'cascivo' | 'shadcn' | 'broken'; status: AttemptStatus }[]>`.
  It throws when a good fixture is not `pass` or a broken one is `pass`.

**What each EVAL asserts** (role/label/text only, case-insensitive, with `findOnAnyPage`/`goTo`):

| Task | Assertions |
| --- | --- |
| `admin-console` | some heading or region containing a number (a KPI); a `table` with ≥ 1 row and a column header; a page with a heading matching `/settings/i` reached via navigation; navigation back to the overview works |
| `saas-settings` | three pages, reached by navigation, with headings matching `/profile/i`, `/billing/i`, `/notification/i`; each has at least one labelled form control |
| `marketing-site` | an `h1`; sections with headings matching `/feature/i`, `/pricing/i`, `/testimonial|customer/i`, `/faq|question/i`; one FAQ disclosure (`button[aria-expanded]` or `details`) expands to reveal hidden text; a `contentinfo` landmark |
| `crud-table` | a `table` of rows; typing into a `searchbox`/textbox labelled `/search/i` reduces the visible rows; a pagination control changes the visible rows; a `/new|create|add/i` button leads to a form that, once submitted with a name, shows that name in the table |

Each `broken` fixture removes exactly one asserted behaviour. Name the removed behaviour in a
comment at the top of the fixture's `App.tsx`.

- [ ] **Step 1: Run the canary for one task before its EVAL exists.** Write the fixtures for
  `admin-console`, run `EVAL_SLOW=1 pnpm --filter bench-agent test -- dry`, and confirm the
  canary fails (the stub throws).
- [ ] **Step 2: Write `EVAL.ts`** until both good fixtures pass and `broken` fails.
- [ ] **Step 3: Repeat Steps 1–2** for the other three tasks.
- [ ] **Step 4: Run all four canaries.** Expected: 8 passes (2 per task) and 4 failures (the
  broken ones).
- [ ] **Step 5: Commit** after `pnpm ready`:
  `git commit -m "feat(bench): hidden evals and canaries for the first four tasks"`.

### Task 6: Hidden evals and canary fixtures, tasks 5–8

Same structure and interfaces as Task 5, for `auth-flow`, `form-validation`, `delete-confirm` and
`filter-empty-state`.

| Task | Assertions |
| --- | --- |
| `auth-flow` | a sign-in form with fields labelled `/email|user/i` and `/password/i`; a sign-up page reached by navigation; submitting sign-in with any non-empty values shows a page with a heading matching `/dashboard/i` |
| `form-validation` | submitting empty shows an error for each of the three fields, each programmatically tied to its field (`aria-describedby` points at visible error text, or the field has `aria-invalid="true"` and an associated message); an invalid email keeps its email error; a valid submission shows text matching `/thank|sent|success/i` and no field errors |
| `delete-confirm` | three items; clicking one item's Delete opens a `dialog` with an accessible name; Cancel closes it and the three items remain; Delete then Confirm (button `/confirm|delete|yes/i` inside the dialog) leaves two items |
| `filter-empty-state` | typing a string that matches nothing shows text matching `/no .*match|nothing|no results/i`; a `/clear|reset/i` control restores the full list |

- [ ] **Steps 1–5:** as in Task 5. The commit message is
  `"feat(bench): hidden evals and canaries for the remaining four tasks"`.

### Task 7: The generate phase

**Files:**
- Create: `apps/bench/agent/src/eval/generate.ts`, `apps/bench/agent/src/eval-cli.ts`
- Modify: `apps/bench/agent/package.json`: add the script `"eval": "node src/eval-cli.ts"`.
- Test: `apps/bench/agent/src/eval/generate.test.ts`, using a fake `claude` executable on `PATH`
  (a test fixture script) that writes a tiny app into its cwd and prints a result JSON with a
  chosen `total_cost_usd`. Variants: hang, crash, normal.

**Interfaces:**
- Consumes: `claudeArgs`, `instructionsFor`, `prepareStarter`, `shadcnMcpConfig` (Task 3);
  `loadTasks` (Task 2); `MODELS` (Task 3).
- Produces:
  `generate(opts: { outDir: string; models: string[]; arms: ArmId[]; tasks: string[]; attempts: number; maxUsd: number; timeoutMin: number }): Promise<{ spentUsd: number; budgetExhausted: boolean }>`.
  - It runs sessions sequentially, in order model → arm → task → attempt.
  - For each attempt:
    1. create `<outDir>/<model>/<arm>/<task>/<attempt>/`;
    2. copy the starter template if there is one;
    3. run `claude -p <PROMPT.md>\n\n<instructionsFor(arm)> …claudeArgs(…, { stream: true })`
       with cwd there, using the 10-minute timeout;
    4. save stdout as `transcript.jsonl`, take its last line whose JSON has `type === 'result'`,
       parse it with `parseClaudeResult`, and write `meta.json` = `{ usage, infra, infraDetail? }`.
       No result line counts as `infra`;
    5. remove every `node_modules` under the attempt dir.
  - Before each session, if `spentUsd >= maxUsd`: stop and return `budgetExhausted: true`.
  - It writes `<outDir>/run.json` with the `EvalRun` metadata fields from Task 1, minus
    `records`:
    - `cascivoVersion` from `packages/react/package.json`;
    - `commit` from `git rev-parse HEAD`;
    - `shadcnVersion`.
  - It never copies `EVAL.ts` or `fixtures/` into an attempt dir.
- Produces the `eval-cli.ts` subcommands:

  | Subcommand | Calls |
  | --- | --- |
  | `generate --out <dir> [--models a,b] [--arms …] [--tasks …] [--attempts n] [--max-usd n] [--timeout min]` | `generate` |
  | `score --in <dir> --out <results.json> [--concurrency n]` | `scoreAll`; merges `run.json` with the records and writes an `EvalRun` |
  | `dry [--tasks …]` | `dryRunCanaries` |
  | `publish --results <file>` | Task 8 |

  - Without `ANTHROPIC_API_KEY`, `generate` exits 2 with the same message the legacy CLI prints.
  - Option parsing follows `src/cli.ts`'s style.

- [ ] **Step 1: Write the failing tests** (fake `claude` on `PATH`):
  - 1 task × 1 arm × 2 attempts produces 2 attempt dirs, each with `meta.json`,
    `transcript.jsonl` and no `node_modules`. The fake prints stream-json lines ending in a
    `result` line.
  - The hanging fake with `timeoutMin` set to 0.05 gives `infra: true` and `infraDetail` matching
    `/timed out/`.
  - The crashing fake (exit 1, no JSON) gives `infra: true`.
  - Fakes costing $0.30 each with `maxUsd: 0.5` stop after 2 sessions (0.60 ≥ 0.5 is checked
    before the 3rd) and return `budgetExhausted: true` (Review Focus 4).
  - No attempt dir ever contains a file named `EVAL.ts`.
- [ ] **Step 2: Confirm the tests fail.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the tests and commit.** Expected: PASS. Then `pnpm ready` and
  `git commit -m "feat(bench): eval generate phase and CLI"`.

### Task 8: The publish phase

**Files:**
- Create: `apps/bench/agent/src/eval/publish.ts`
- Modify: `apps/bench/agent/src/report.ts`: add `evalDoc(run: EvalRun, source: string): string`,
  the `docs/AGENT-BENCHMARKS.md` body.
- Test: `apps/bench/agent/src/eval/publish.test.ts`

**Interfaces:**
- Consumes: `parseEvalRun`, `validity`, `aggregate` (Task 1).
- Produces:
  `publish(resultsFile: string, repo: string): { written: string[] }`. It throws without writing
  anything when `validity(run) !== 'valid'`; the message says whether the run is incomplete or
  invalid and why. A valid run writes three files:
  - `apps/bench/agent/results/<YYYY-MM-DD>-<cascivoVersion>.json`, the parsed run, re-serialised
    with 2-space indent;
  - `apps/site/public/evals.json`, the `EvalsJson` defined below;
  - `docs/AGENT-BENCHMARKS.md`, from `evalDoc`.
- Produces:
  `type EvalsJson = { schemaVersion: 1; latest: { date: string; cascivoVersion: string; models: string[]; rows: AggregateRow[]; costUsd: number }; history: { date: string; cascivoVersion: string; passAt1: Record<string /*model*/, Record<string /*arm*/, number>> }[] }`.
  - `history` is rebuilt from every file in `apps/bench/agent/results/` that `parseEvalRun` accepts
    and that is valid. Older files without `schemaVersion` (legacy bench output) are skipped
    silently.
  - `latest` combines, per model, that model's newest valid run, because the budget fallback
    publishes Sonnet and Haiku as separate runs:
    - `rows` concatenates their aggregate rows;
    - `date` and `cascivoVersion` come from the newest of them;
    - `models` lists each model with its run date.

    Change the `latest` type accordingly to
    `models: { model: string; date: string; attempts: number }[]`.
- `evalDoc` contents:
  1. a "do not edit" header, as `publishedDoc` has;
  2. arms;
  3. scoring rules;
  4. a per-model table of pass@1 per arm;
  5. a per-task table;
  6. accessibility and cost columns;
  7. reproduction commands;
  8. the source file path.

- [ ] **Step 1: Write the failing tests.**
  - A valid run writes exactly those 3 files (in a temp repo layout) and `evals.json.latest.rows`
    matches `aggregate(run)`.
  - An incomplete run throws `/incomplete/`, and the temp dir is unchanged.
  - An invalid run throws `/invalid/`.
  - A results file with `records[0].status = 'ok'` throws naming `records[0].status`
    (Review Focus 5).
  - `history` contains 2 entries when 2 valid result files exist plus one legacy file.
  - Given a Sonnet-only valid run and a later Haiku-only valid run, `latest.rows` contains rows for
    both models, and `latest.models` lists both with their own dates and attempts.
- [ ] **Step 2: Confirm the tests fail, then implement and run them again.** Expected: PASS.
- [ ] **Step 3: Commit** after `pnpm ready`:
  `git commit -m "feat(bench): eval publish phase (results, evals.json, AGENT-BENCHMARKS.md)"`.

### Task 9: Workflow and CI dry run

**Files:**
- Create: `.github/workflows/evals.yml`
- Modify: `.github/workflows/ci.yml`. In the job that already installs Chromium (`build-guards`,
  around line 257), after the build, add a step `Eval harness dry run` running
  `EVAL_SLOW=1 pnpm --filter bench-agent test` and `pnpm --filter bench-agent eval dry`.

**`evals.yml`:**

- **Triggers:**
  - `workflow_dispatch`, with inputs `models` (default `claude-sonnet-5-5,claude-haiku-5-5`),
    `attempts` (default `3`), `max_usd` (default `50`) and `tasks` (default empty = all);
  - `release: { types: [published] }`.
- **Workflow-level settings:** `permissions: {}`, and `concurrency: evals` with no cancellation.

**Jobs:**

1. **`generate`**
   - Permissions: `contents: read`. Env: `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}`.
   - Steps:
     1. checkout with `persist-credentials: false`;
     2. setup pnpm and node, install, `pnpm build`;
     3. install the `claude` CLI pinned with `npm i -g @anthropic-ai/claude-code@<pinned>`, using
        the current version at implementation time, recorded in the file;
     4. run `pnpm --filter bench-agent eval generate --out gen …inputs`;
     5. upload `gen/` as artifact `eval-gen`, retention 90 days.
   - It has no step that builds or runs files from `gen/`.
2. **`score`** (needs `generate`)
   - Permissions: `contents: read`. No secrets.
   - Steps:
     1. checkout and `pnpm build`;
     2. install Chromium as `ci.yml:257` does;
     3. download `eval-gen`;
     4. run `pnpm --filter bench-agent eval score --in gen --out results.json`;
     5. upload `results.json` as artifact `eval-results`.
3. **`publish`** (needs `score`)
   - Permissions: `contents: write`, `pull-requests: write`.
   - Steps:
     1. checkout and install (no build is needed for publish);
     2. download `eval-results`;
     3. run `pnpm --filter bench-agent eval publish --results results.json`. A non-zero exit
        (incomplete or invalid run) fails the job, so no PR is opened;
     4. create branch `evals/<date>`, commit the three files, push, and
        `gh pr create --title "evals: <date> run" --body <generated summary>` with `GH_TOKEN`.

**Rules for both files:**
- SHA-pin every action, reusing the SHAs `framework-latest.yml` already uses for the same actions.
- `persist-credentials: false` on every checkout except publish's, which needs to push.

- [ ] **Step 1: Validate the workflow.** Write it, then run `pnpm ready`, which includes the
  repo's workflow guards if any. Also run `npx --yes zizmor .github/workflows/evals.yml` if network
  allows; record the result, but zizmor is not a gate.
- [ ] **Step 2: Run the CI dry-run commands locally.** Run the two commands added to `ci.yml`.
  Expected: PASS.
- [ ] **Step 3: Commit.** `git commit -m "ci: eval workflow (generate/score/publish) and harness dry run"`.

### Task 10: The `/evals` page and the docs

**Files:**
- Create: `apps/site/src/marketing/pages/EvalsPage.tsx` and its CSS module. Follow
  `PerformancePage.tsx` for structure, layout and the layered-CSS rules.
- Modify: `apps/site/src/marketing/App.tsx`: add the route `'/evals'` next to `/performance`
  (line ~239), lazy-loaded like `PerformancePage`.
- Modify: `apps/site/src/marketing/route-head.ts`: add `ROUTE_HEAD['/evals']` with title
  `Agent evals — cascivo`, a one-sentence description, and add it to `PRERENDER_ROUTES` if the
  performance route is there.
- Modify: `apps/site/src/marketing/sections/Footer.tsx`: add a link `Agent evals` → `/evals` next
  to `Performance`.
- Create: `apps/site/public/evals.json`. Ship an empty-state document,
  `{ "schemaVersion": 1, "latest": null, "history": [] }`, until the first published run. Widen
  `EvalsJson.latest` to `| null` in Task 8's type accordingly; Task 8's tests already cover a
  non-null run.
- Modify: `apps/bench/agent/README.md`: document the eval (arms, tasks, scoring, the three
  subcommands, local reproduction with your own key, cost) above the legacy section.
- Test: `apps/site/src/marketing/pages/EvalsPage.test.tsx`

**Interfaces:**
- Consumes: the `EvalsJson` shape (Task 8). The page imports `apps/site/public/evals.json` and
  parses it with a small local guard. Never cast it.
- Content: the spec §6 "Site page" list, in that order.
  - **Empty state** (`latest: null`): the method, the tasks and the reproduction steps, plus the
    sentence "No published run yet."
  - **Copy rule:** no claims beyond what the JSON holds.

- [ ] **Step 1: Write the failing tests.**
  - With a fixture `EvalsJson`, the page renders one headline value per arm × model and a table
    with 8 task rows.
  - With `latest: null`, it shows "No published run yet." and the reproduction command
    `pnpm --filter bench-agent eval generate`.
  - A malformed JSON (`latest.rows` not an array) renders the empty state, not a crash.
- [ ] **Step 2: Confirm the tests fail, then implement and run them again.** Run
  `vp run @cascivo/site#test -- EvalsPage`. Expected: PASS.
- [ ] **Step 3: Run the site gates.** Run `pnpm ready` (which includes the site build, the
  docs-routes check and the overflow/axe guards that cover marketing routes). Check the page at
  320/360/390/414 px with the repo's existing overflow sweep. Expected: PASS.
- [ ] **Step 4: Commit.** `git commit -m "feat(site): /evals page; docs: eval method and reproduction"`.

## After the plan: the pilot, then the first real run

These steps need the owner's API key, so they are not implementation tasks.

1. **Add the secret.** Add the `ANTHROPIC_API_KEY` repository secret.
2. **Pilot.** Dispatch `evals.yml` with `tasks=admin-console`, `attempts=1` and `max_usd=10`. Read
   the per-session cost from the `generate` log. Expected: about $0.10–0.60 per session.
3. **Full run, or the documented fallback.**
   - If 144 × the observed mean cost exceeds $50, dispatch the full run as two runs: Sonnet with
     `attempts=3`, then Haiku with `attempts=1`.
   - Otherwise dispatch both models with `attempts=3`.
4. **Review and merge the results PR.** `/evals` then shows the first published run.
