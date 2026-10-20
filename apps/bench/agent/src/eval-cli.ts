#!/usr/bin/env node
/**
 * `pnpm --filter bench-agent eval <subcommand>` — the published LLM × cascivo eval (spec §6).
 *
 * Three jobs share this entry point so the one that holds `ANTHROPIC_API_KEY` (`generate`) never
 * builds or runs what the sessions wrote, and the one that does (`score`) never sees the key.
 * Subcommand modules are imported on demand: `--help` should not load Playwright.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { argv, env, exit, stderr, stdout } from 'node:process'
import { isArm, PUBLISHED_ARMS, type ArmId } from './arms.ts'
import { REPO } from './env.ts'
import { MODELS } from './models.ts'
import { parseEvalRun, parseRunMeta } from './eval/results.ts'
import { TASK_IDS } from './eval/tasks.ts'

const HELP = `Usage: eval <subcommand> [options]

Subcommands:
  generate --out <dir> [--models a,b] [--arms a,b] [--tasks a,b] [--attempts n]
           [--max-usd n] [--timeout min]
      Run the claude -p sessions into <dir>. Needs ANTHROPIC_API_KEY.
      Defaults: every model, published arm and task; 3 attempts; $50; 10 minutes.
  score --in <dir> --out <results.json> [--concurrency n]
      Build, type-check and drive what generate left in <dir>; write the results file.
  dry [--tasks a,b]
      Score the canary apps with no model, to check the hidden EVALs.
  publish --results <file> [--expect-model id] [--run <run.json>] [--partial]
      Write the results file, apps/site/public/evals.json and docs/AGENT-BENCHMARKS.md from a
      scored run. Refuses an incomplete or invalid run, a run dated in the future, and a run
      that is not every published task and arm (unless --partial, for local use). With
      --expect-model, refuses a run whose models are not exactly that one; with --run, one whose
      run metadata differs from that run.json (the one generate wrote).

  -h, --help          Show this message`

class UsageError extends Error {}

type Flags = Map<string, string>

/** `--name value` pairs, and `--name` alone for a name in `switches` (its value is `true`). */
function flags(
  args: string[],
  allowed: readonly string[],
  switches: readonly string[] = [],
): Flags {
  const found: Flags = new Map()
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? ''
    if (switches.includes(arg.slice(2)) && arg.startsWith('--')) {
      found.set(arg.slice(2), 'true')
      continue
    }
    if (!arg.startsWith('--') || !allowed.includes(arg.slice(2)))
      throw new UsageError(`unknown option ${arg}`)
    const v = args[(i += 1)]
    if (!v || v.startsWith('-')) throw new UsageError(`${arg} needs a value`)
    found.set(arg.slice(2), v)
  }
  return found
}

function number(flags: Flags, name: string, fallback: number, integer: boolean): number {
  const raw = flags.get(name)
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0 || (integer && !Number.isInteger(n)))
    throw new UsageError(`--${name} needs a positive ${integer ? 'integer' : 'number'}`)
  return n
}

/** A comma-separated list of ids; a repeated one would be run, paid for and weighted twice. */
function list(flags: Flags, name: string): string[] | undefined {
  const ids = flags.get(name)?.split(',')
  const twice = ids?.find((id, i) => ids.indexOf(id) !== i)
  if (twice !== undefined) throw new UsageError(`--${name} lists ${twice} twice`)
  return ids
}

function required(flags: Flags, name: string): string {
  const v = flags.get(name)
  if (v === undefined) throw new UsageError(`--${name} is required`)
  return v
}

const log = (line: string) => stdout.write(`${line}\n`)

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

async function generateCommand(args: string[]): Promise<void> {
  const f = flags(args, ['out', 'models', 'arms', 'tasks', 'attempts', 'max-usd', 'timeout'])
  const outDir = required(f, 'out')
  const arms = list(f, 'arms') ?? [...PUBLISHED_ARMS]
  const bad = arms.filter((a) => !(PUBLISHED_ARMS as readonly string[]).includes(a))
  if (bad.length > 0) throw new UsageError(`unknown arm ${bad.join(', ')}`)
  const tasks = list(f, 'tasks') ?? [...TASK_IDS]
  const unknown = tasks.filter((t) => !TASK_IDS.includes(t))
  if (unknown.length > 0) throw new UsageError(`unknown task ${unknown.join(', ')}`)
  const models = list(f, 'models') ?? [...MODELS]
  const badModels = models.filter((m) => !(MODELS as readonly string[]).includes(m))
  if (badModels.length > 0)
    throw new UsageError(`unknown model ${badModels.join(', ')} (known: ${MODELS.join(', ')})`)
  const options = {
    outDir,
    models,
    arms: arms.filter((a): a is ArmId => isArm(a)),
    tasks,
    attempts: number(f, 'attempts', 3, true),
    maxUsd: number(f, 'max-usd', 50, false),
    timeoutMin: number(f, 'timeout', 10, false),
  }
  if (!env.ANTHROPIC_API_KEY) {
    stderr.write(
      'bench-agent: a real run needs ANTHROPIC_API_KEY. Use the `dry` subcommand to check the harness.\n',
    )
    exit(2)
  }
  const { assertFreshOutDir, generate } = await import('./eval/generate.ts')
  try {
    assertFreshOutDir(outDir)
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error))
  }
  const { spentUsd, budgetExhausted } = await generate(options)
  log(
    `\nspent $${spentUsd.toFixed(2)} of $${options.maxUsd}` +
      (budgetExhausted ? ': budget exhausted, the run is incomplete' : ''),
  )
}

async function scoreCommand(args: string[]): Promise<void> {
  const f = flags(args, ['in', 'out', 'concurrency'])
  const inDir = required(f, 'in')
  const out = required(f, 'out')
  const concurrency = number(f, 'concurrency', 2, true)
  // Read first: a missing or malformed run.json should fail before minutes of scoring.
  const meta: unknown = JSON.parse(readFileSync(join(inDir, 'run.json'), 'utf8'))
  if (!isRecord(meta)) throw new Error(`${join(inDir, 'run.json')} is not an object`)
  const planned = parseRunMeta(meta).tasks
  const { scoreAll } = await import('./eval/evaluate.ts')
  const records = await scoreAll(inDir, { concurrency, tasks: planned })
  // Validated before anything is written, so a malformed run never reaches the results file.
  const run = parseEvalRun({ ...meta, records })
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, `${JSON.stringify(run, null, 2)}\n`)
  const passed = run.records.filter((r) => r.status === 'pass').length
  log(`scored ${run.records.length} attempts, ${passed} passed; wrote ${out}`)
}

async function dryCommand(args: string[]): Promise<void> {
  const f = flags(args, ['tasks'])
  const { dryRunCanaries } = await import('./eval/dry.ts')
  const results = await dryRunCanaries(list(f, 'tasks'))
  log(`${results.length} canaries agree with their EVALs`)
}

async function publishCommand(args: string[]): Promise<void> {
  const f = flags(args, ['results', 'expect-model', 'run'], ['partial'])
  const results = required(f, 'results')
  const expectModel = f.get('expect-model')
  const runFile = f.get('run')
  const { publish } = await import('./eval/publish.ts')
  const opts = {
    ...(expectModel === undefined ? {} : { expectModel }),
    ...(runFile === undefined ? {} : { runFile }),
    partial: f.has('partial'),
  }
  for (const file of publish(results, REPO, opts).written) log(`wrote ${file}`)
}

const [command, ...rest] = argv.slice(2)
try {
  if (command === '-h' || command === '--help' || rest.includes('-h') || rest.includes('--help')) {
    log(HELP)
    exit(0)
  }
  switch (command) {
    case 'generate':
      await generateCommand(rest)
      break
    case 'score':
      await scoreCommand(rest)
      break
    case 'dry':
      await dryCommand(rest)
      break
    case 'publish':
      await publishCommand(rest)
      break
    default:
      throw new UsageError(
        command === undefined ? 'a subcommand is required' : `unknown subcommand ${command}`,
      )
  }
} catch (error) {
  if (error instanceof UsageError) {
    stderr.write(`bench-agent: ${error.message}\n\n${HELP}\n`)
    exit(2)
  }
  stderr.write(`bench-agent: ${error instanceof Error ? error.message : String(error)}\n`)
  exit(1)
}
