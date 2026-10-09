#!/usr/bin/env node
/**
 * `pnpm --filter bench-agent bench [options]` — the agent benchmark (2026-10-07 research, §6).
 *
 * Each prompt × arm × run starts in an empty directory with the cascivo MCP server built from
 * this checkout, runs `claude -p` headless, and scores what is left: `tsc` errors and
 * `cascivo audit --ai` findings. Tokens, cost, wall time and turns come from the CLI's own
 * JSON. Results go to results/<date>.json, with the median table printed for docs/BENCHMARKS.md.
 *
 * A real run needs ANTHROPIC_API_KEY (headless `--bare` mode reads nothing else) and spends it:
 * five prompts × two arms × three runs is thirty agent sessions.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { argv, env, exit, stderr, stdout } from 'node:process'
import { ARMS, claudeArgs, isArm } from './arms.ts'
import type { ArmId } from './arms.ts'
import { dryRun } from './dry-run.ts'
import { CLI, mcpConfig, prepare, REPO, runDirectory } from './env.ts'
import { INSTRUCTIONS, PROMPTS } from './prompts.ts'
import { markdownTable, publishedDoc } from './report.ts'
import type { BenchResults, RunRecord } from './report.ts'
import { parseClaudeResult } from './result.ts'
import { score } from './score.ts'

const HELP = `bench-agent — what an agent spends to build an app with cascivo, by surface

Options:
  --runs <n>          Runs per prompt and arm (default 3; medians are reported)
  --prompts <ids>     Comma-separated prompt ids (default: all five)
  --arms <ids>        today, blueprints, or both (default)
  --model <id>        Model for claude -p (default: the CLI's default)
  --timeout <min>     Minutes per run before it is stopped (default 20)
  --dry-run           No model: a scripted tool call per arm, to check the harness
  --fresh             Rebuild the packed packages and the shared dependency tree
  --keep              Keep each run's directory (printed) for inspection
  --publish           Also write docs/AGENT-BENCHMARKS.md from this run (not with --dry-run)
  -h, --help          Show this message`

interface Options {
  runs: number
  prompts: string[]
  arms: ArmId[]
  model: string | null
  timeoutMin: number
  dryRun: boolean
  fresh: boolean
  keep: boolean
  publish: boolean
}

function parse(args: string[]): Options | 'help' {
  const o: Options = {
    runs: 3,
    prompts: PROMPTS.map((p) => p.id),
    arms: [...ARMS],
    model: null,
    timeoutMin: 20,
    dryRun: false,
    fresh: false,
    keep: false,
    publish: false,
  }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    const value = () => {
      const v = args[(i += 1)]
      if (!v || v.startsWith('-')) throw new Error(`${arg} needs a value`)
      return v
    }
    if (arg === '-h' || arg === '--help') return 'help'
    else if (arg === '--runs') o.runs = Number(value())
    else if (arg === '--prompts') o.prompts = value().split(',')
    else if (arg === '--arms') {
      const arms = value().split(',')
      const bad = arms.filter((a) => !isArm(a))
      if (bad.length > 0) throw new Error(`unknown arm ${bad.join(', ')}`)
      o.arms = arms.filter(isArm)
    } else if (arg === '--model') o.model = value()
    else if (arg === '--timeout') o.timeoutMin = Number(value())
    else if (arg === '--dry-run') o.dryRun = true
    else if (arg === '--fresh') o.fresh = true
    else if (arg === '--keep') o.keep = true
    else if (arg === '--publish') o.publish = true
    else throw new Error(`unknown option ${arg}`)
  }
  if (!Number.isInteger(o.runs) || o.runs < 1) throw new Error('--runs needs a positive integer')
  if (o.publish && o.dryRun)
    throw new Error('--publish needs a real run: a dry run measures no model')
  const unknown = o.prompts.filter((p) => !PROMPTS.some((x) => x.id === p))
  if (unknown.length > 0) throw new Error(`unknown prompt ${unknown.join(', ')}`)
  return o
}

let options: Options | 'help'
try {
  options = parse(argv.slice(2))
} catch (e) {
  stderr.write(`bench-agent: ${(e as Error).message}\n\n${HELP}\n`)
  exit(2)
}
if (options === 'help') {
  stdout.write(`${HELP}\n`)
  exit(0)
}
if (!options.dryRun && !env.ANTHROPIC_API_KEY) {
  stderr.write(
    'bench-agent: a real run needs ANTHROPIC_API_KEY. Use --dry-run to check the harness.\n',
  )
  exit(2)
}

const log = (line: string) => stdout.write(`${line}\n`)
const nodeModules = prepare(options.fresh, log)
const root = mkdtempSync(join(tmpdir(), 'bench-agent-'))
const config = mcpConfig(join(root, 'mcp.json'))
const records: RunRecord[] = []

for (const prompt of PROMPTS.filter((p) => options.prompts.includes(p.id))) {
  for (const arm of options.arms) {
    for (let n = 1; n <= options.runs; n += 1) {
      const dir = runDirectory(root, `${prompt.id}-${arm}-${n}`)
      let usage = null
      if (options.dryRun) {
        dryRun(prompt.id, arm, dir)
      } else {
        const result = spawnSync(
          'claude',
          ['-p', `${prompt.text}\n\n${INSTRUCTIONS}`, ...claudeArgs(arm, config, options.model)],
          { cwd: dir, encoding: 'utf8', timeout: options.timeoutMin * 60_000, maxBuffer: 64 << 20 },
        )
        try {
          usage = parseClaudeResult(JSON.parse(result.stdout))
        } catch (e) {
          log(`  ${prompt.id} ${arm} #${n}: no result (${(e as Error).message.split('\n')[0]})`)
        }
      }
      const s = score(dir, nodeModules, CLI)
      records.push({ prompt: prompt.id, arm, run: n, usage, score: s })
      log(
        `  ${prompt.id} ${arm} #${n}: ` +
          (usage ? `${usage.outputTokens} out, ${(usage.durationMs / 1000).toFixed(0)}s, ` : '') +
          `tsc ${s.tscErrors ?? '—'}, audit ${s.auditErrors ?? '—'}/${s.auditWarnings ?? '—'}` +
          (options.keep ? `  ${dir}` : ''),
      )
    }
  }
}

const results: BenchResults = {
  date: new Date().toISOString(),
  model: options.model,
  dryRun: options.dryRun,
  runs: records,
}
const outDir = join(REPO, 'apps/bench/agent/results')
mkdirSync(outDir, { recursive: true })
const out = join(
  outDir,
  `${results.date.slice(0, 19).replace(/:/g, '-')}${options.dryRun ? '-dry' : ''}.json`,
)
writeFileSync(out, `${JSON.stringify(results, null, 2)}\n`)
if (!options.keep) rmSync(root, { recursive: true, force: true })
log(`\n${markdownTable(results)}\n\nwrote ${out}`)
if (options.publish) {
  const doc = join(REPO, 'docs/AGENT-BENCHMARKS.md')
  writeFileSync(doc, publishedDoc(results, out.slice(REPO.length + 1)))
  log(`wrote ${doc}`)
}
