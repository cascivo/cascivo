import type { ArmId } from './arms.ts'
import { aggregate, INFRA_THRESHOLD, type AggregateRow } from './eval/aggregate.ts'
import type { EvalRun } from './eval/results.ts'
import type { AgentUsage } from './result.ts'
import type { Score } from './score.ts'

export interface RunRecord {
  prompt: string
  arm: ArmId
  run: number
  /** Null in a dry run, where no model was called. */
  usage: AgentUsage | null
  score: Score
}

export interface BenchResults {
  date: string
  model: string | null
  dryRun: boolean
  runs: RunRecord[]
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const fmt = (n: number | null, digits = 0) =>
  n === null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: digits })

/** Every input token the model read: billed, cached-written and cached-read. */
const totalInput = (u: AgentUsage) => u.inputTokens + u.cacheCreationTokens + u.cacheReadTokens

/** One row per prompt and arm, medians over its runs: the table docs/BENCHMARKS.md publishes. */
export function markdownTable(results: BenchResults): string {
  const rows: string[] = [
    '| Prompt | Arm | Runs | Input tokens | Output tokens | Cost (USD) | Wall time (s) | Turns | `tsc` errors | Audit errors | Audit warnings |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]
  const keys = [...new Set(results.runs.map((r) => `${r.prompt}\u0000${r.arm}`))]
  for (const key of keys) {
    const [prompt, arm] = key.split('\u0000') as [string, ArmId]
    const runs = results.runs.filter((r) => r.prompt === prompt && r.arm === arm)
    const usages = runs.flatMap((r) => (r.usage ? [r.usage] : []))
    const of = (pick: (s: Score) => number | null) =>
      median(runs.flatMap((r) => (pick(r.score) === null ? [] : [pick(r.score)!])))
    const noApp = runs.filter((r) => r.score.app === null).length
    rows.push(
      [
        prompt,
        arm,
        `${runs.length}${noApp ? ` (${noApp} no app)` : ''}`,
        fmt(median(usages.map(totalInput))),
        fmt(median(usages.map((u) => u.outputTokens))),
        fmt(median(usages.map((u) => u.costUsd)), 2),
        fmt(median(usages.map((u) => u.durationMs / 1000)), 1),
        fmt(median(usages.map((u) => u.turns))),
        fmt(of((s) => s.tscErrors)),
        fmt(of((s) => s.auditErrors)),
        fmt(of((s) => s.auditWarnings)),
      ]
        .join(' | ')
        .replace(/^/, '| ')
        .concat(' |'),
    )
  }
  return rows.join('\n')
}

// Ids in a results file come from a CI artifact, so every string is made inert for a table cell
// and for the Markdown around it before it is interpolated.
const md = (value: string | number): string =>
  String(value)
    .replace(/\r?\n|\r/g, ' ')
    .replace(/[\\|`<>*_[\]]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : `\\${c}`))

const INFRA_PERCENT = INFRA_THRESHOLD * 100
// Inside a code span a backslash would show, so the only unsafe characters are the ones that end it.
const code = (value: string): string => value.replace(/\r?\n|\r/g, ' ').replace(/`/g, '')

/** One run that contributes models to a published document. */
export interface EvalDocRun {
  /** Repo-relative path of its results file. */
  file: string
  run: EvalRun
  /** The models this run supplies; a later run can supersede its others. */
  models: string[]
}

const percent = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)
const usd = (n: number | null) => (n === null ? '—' : `$${n.toFixed(2)}`)

const ARM_NOTES: Record<string, string> = {
  cascivo:
    'a cascivo starter app and the cascivo MCP server (`create_app`, `list_blocks`, `compose_app`)',
  'cascivo-bare': 'a cascivo starter app and no MCP server: the gap to `cascivo` is the AI context',
  shadcn: "a shadcn/ui + Tailwind starter and shadcn's official MCP server, the control",
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length
}

function table(head: string[], align: string[], body: string[][]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [line(head), line(align), ...body.map(line)].join('\n')
}

/** docs/AGENT-BENCHMARKS.md, generated from a scored eval run (the published LLM × cascivo eval). */
export function evalDoc(
  run: EvalRun,
  source: string,
  /**
   * For a latest assembled from several runs: the rows to print (so the document and evals.json
   * share them) and the runs they came from. Omitted, `run` is the only source.
   */
  detail?: { rows: AggregateRow[]; sources: EvalDocRun[] },
): string {
  const rows = detail?.rows ?? aggregate(run)
  const sources = detail?.sources ?? [{ file: source, run, models: run.models }]
  const forModel = (model: string) => rows.filter((r) => r.model === model)

  const headline = table(
    ['Model', ...run.arms.map((arm) => `${md(arm)} pass@1`)],
    ['---', ...run.arms.map(() => '---:')],
    run.models.map((model) => [
      md(model),
      ...run.arms.map((arm) =>
        percent(
          mean(
            forModel(model)
              .filter((r) => r.arm === arm && r.attempts > 0)
              .map((r) => r.passAt1),
          ),
        ),
      ),
    ]),
  )

  const perTask = table(
    ['Task', 'Arm', 'Model', 'Attempts', 'pass@1', 'pass@3'],
    ['---', '---', '---', '---:', '---:', '---:'],
    rows.map((r) => [
      md(r.task),
      md(r.arm),
      md(r.model),
      String(r.attempts),
      percent(r.attempts === 0 ? null : r.passAt1),
      r.passAt3 === null ? '—' : r.passAt3 ? 'yes' : 'no',
    ]),
  )

  // Models that ran under three attempts per cell (the budget fallback, spec §5) cannot show pass@3.
  const pass1Only = run.models.filter((model) => forModel(model).some((r) => r.passAt3 === null))
  const pass1OnlyNote = pass1Only
    .map(
      (model) =>
        `${md(model)} ran fewer than 3 attempts per task and arm, so it reports pass@1 only.`,
    )
    .join('\n')

  const costRows: string[][] = []
  for (const model of run.models)
    for (const arm of run.arms) {
      const records = run.records.filter((r) => r.model === model && r.arm === arm)
      if (records.length === 0) continue
      const costs = records.flatMap((r) => (r.usage ? [r.usage.costUsd] : []))
      const sum = (pick: (r: (typeof records)[number]) => number | null) => {
        const values = records.flatMap((r) => {
          const v = pick(r)
          return v === null ? [] : [v]
        })
        return values.length === 0 ? '—' : String(values.reduce((a, b) => a + b, 0))
      }
      costRows.push([
        md(model),
        md(arm),
        String(
          forModel(model)
            .filter((r) => r.arm === arm)
            .reduce((total, r) => total + r.axeSerious, 0),
        ),
        sum((r) => r.auditErrors),
        sum((r) => r.auditWarnings),
        usd(median(costs)),
        usd(costs.length === 0 ? null : costs.reduce((a, b) => a + b, 0)),
      ])
    }
  const costTable = table(
    [
      'Model',
      'Arm',
      'axe critical + serious',
      'Audit errors',
      'Audit warnings',
      'Median cost per attempt',
      'Total cost',
    ],
    ['---', '---', '---:', '---:', '---:', '---:', '---:'],
    costRows,
  )

  const sourceTable = table(
    ['Run', 'Date', 'cascivo', 'Commit', 'shadcn CLI', 'Models', 'Spend'],
    ['---', '---', '---', '---', '---', '---', '---:'],
    sources.map((s) => [
      `\`${code(s.file).replace(/\|/g, '\\|')}\``,
      md(s.run.date.slice(0, 10)),
      md(s.run.cascivoVersion),
      md(s.run.commit),
      md(s.run.shadcnVersion),
      s.models
        .map(
          (m) =>
            `${md(m)} (${md(s.run.date.slice(0, 10))}, ${s.run.attempts} ${s.run.attempts === 1 ? 'attempt' : 'attempts'})`,
        )
        .join(', '),
      `${usd(s.run.spentUsd)} of ${usd(s.run.maxUsd)}`,
    ]),
  )
  const totalSpend =
    sources.length > 1
      ? `\nTotal spend across these runs: ${usd(sources.reduce((sum, s) => sum + s.run.spentUsd, 0))}.\n`
      : ''

  return `# Agent benchmark

> Generated by \`pnpm --filter bench-agent eval publish\`: do not edit. Method:
> \`apps/bench/agent/README.md\`. Raw results: \`${code(source)}\`.

How well an agent builds a working, accessible app from a plain-language brief with cascivo, against
the same brief with shadcn/ui. Every attempt starts from an empty starter project, runs \`claude -p\`
headless with only file tools, and is scored on what it leaves behind.

${sourceTable}
${totalSpend}
## Arms

${run.arms.map((arm) => `- **${md(arm)}**: ${Object.hasOwn(ARM_NOTES, arm) ? ARM_NOTES[arm] : 'see the method'}.`).join('\n')}

## Scoring

An attempt passes when all three hold: \`vite build\` succeeds, \`tsc --noEmit\` reports 0 errors, and
a hidden \`EVAL.ts\` passes against the built app served by \`vite preview\`. The first failing step
sets the status (infra-error, then build, types, eval). An infra-error (a crash or a session over
the time limit) counts as a failed attempt.

- **pass@1**: the share of attempts that passed. This is the headline.
- **pass@3**: whether any of three attempts passed.
- Accessibility (axe), cascivo audit findings and cost never affect pass or fail.
- Incomplete runs and runs with more than ${INFRA_PERCENT}% infra-errors are not published.

## pass@1 by model and arm

${headline}

## By task

${perTask}
${pass1OnlyNote ? `\n${pass1OnlyNote}\n` : ''}
## Accessibility, adherence and cost

${costTable}

The audit columns apply to the cascivo arms only; shadcn has no equivalent.

## Reproduce

\`\`\`sh
pnpm build
ANTHROPIC_API_KEY=… pnpm --filter bench-agent eval generate --out runs/today
pnpm --filter bench-agent eval score --in runs/today --out results.json
pnpm --filter bench-agent eval publish --results results.json
\`\`\`
`
}
