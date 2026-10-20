/**
 * Canaries for the hidden EVALs (spec §7): per task, a good cascivo app, a good shadcn app and a
 * broken app, each scored through the real pipeline (build, types, preview, EVAL) with no model.
 * An EVAL earns trust only if it passes both good apps, which shows it does not favour either
 * design system, and fails the broken one, which shows it can fail at all.
 */
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PublishedArmId } from '../arms.ts'
import { scoreAttempt } from './evaluate.ts'
import type { AttemptStatus } from './results.ts'
import { prepareStarter, type Starter } from './starters.ts'
import { loadTasks, type EvalTask } from './tasks.ts'

export type CanaryFixture = 'cascivo' | 'shadcn' | 'broken'

export interface CanaryResult {
  task: string
  fixture: CanaryFixture
  status: AttemptStatus
}

const FIXTURES: readonly CanaryFixture[] = ['cascivo', 'shadcn', 'broken']

/** The broken app is the cascivo app minus one behaviour, so it shares the cascivo starter. */
const ARM: Record<CanaryFixture, PublishedArmId> = {
  cascivo: 'cascivo-bare',
  shadcn: 'shadcn',
  broken: 'cascivo-bare',
}

/** Two at a time, as `scoreAll` does: more and the EVALs' settle timeouts start to race the CPU. */
const CONCURRENCY = 2

interface Job {
  task: EvalTask
  fixture: CanaryFixture
}

async function runCanary(job: Job, starter: Starter): Promise<CanaryResult & { detail: string }> {
  const source = join(job.task.fixturesDir, job.fixture)
  if (!existsSync(source)) throw new Error(`${job.task.id} has no ${job.fixture} fixture`)
  if (starter.template === null) throw new Error(`${ARM[job.fixture]} has no template to overlay`)
  const dir = mkdtempSync(join(tmpdir(), `canary-${job.task.id}-${job.fixture}-`))
  try {
    // The fixture is the agent's output: the starter as the agent found it, plus what it wrote.
    cpSync(starter.template, dir, { recursive: true })
    cpSync(source, dir, { recursive: true })
    const record = await scoreAttempt({
      attemptDir: dir,
      task: job.task,
      arm: ARM[job.fixture],
      model: 'dry-run',
      attempt: 1,
      nodeModules: starter.nodeModules,
      usage: null,
      infra: false,
    })
    return {
      task: job.task.id,
      fixture: job.fixture,
      status: record.status,
      detail: record.detail ?? '',
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Score every canary of the given tasks (all by default). Throws, listing each offender with
 * its failure detail, when a good fixture does not pass or a broken one does.
 */
export async function dryRunCanaries(
  ids?: string[],
): Promise<{ task: string; fixture: CanaryFixture; status: AttemptStatus }[]> {
  const tasks = loadTasks(ids)
  const log = (line: string) => console.error(line)
  // Prepared up front: preparing is synchronous and would stall a concurrent preview mid-EVAL.
  const starters = new Map<PublishedArmId, Starter>()
  for (const arm of new Set(Object.values(ARM))) starters.set(arm, prepareStarter(arm, log))

  const jobs: Job[] = tasks.flatMap((task) => FIXTURES.map((fixture) => ({ task, fixture })))
  const results: (CanaryResult & { detail: string })[] = []
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const index = next++
      const job = jobs[index]
      const starter = job === undefined ? undefined : starters.get(ARM[job.fixture])
      if (job === undefined || starter === undefined) continue
      const result = await runCanary(job, starter)
      log(`${result.task}/${result.fixture}: ${result.status} ${result.detail}`.trim())
      results[index] = result
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))

  const wrong = results.filter((r) =>
    r.fixture === 'broken' ? r.status === 'pass' : r.status !== 'pass',
  )
  if (wrong.length > 0) {
    const lines = wrong.map((r) =>
      r.fixture === 'broken'
        ? `${r.task}/broken passed: the EVAL cannot see the behaviour it removes`
        : `${r.task}/${r.fixture} is ${r.status}: ${r.detail}`,
    )
    throw new Error(`Canaries disagree with their EVALs:\n${lines.join('\n')}`)
  }
  return results.map(({ task, fixture, status }) => ({ task, fixture, status }))
}
