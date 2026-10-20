import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Order is part of the published schema: reports list tasks in this order. */
export const TASK_IDS: readonly string[] = [
  'admin-console',
  'saas-settings',
  'marketing-site',
  'crud-table',
  'auth-flow',
  'form-validation',
  'delete-confirm',
  'filter-empty-state',
]

export interface EvalTask {
  id: string
  prompt: string
  /** Hidden check, run against the built app. Never reachable from the agent's directory. */
  evalPath: string
  fixturesDir: string
}

const TASKS_DIR = fileURLToPath(new URL('../../tasks/', import.meta.url))

export function loadTasks(ids: readonly string[] = TASK_IDS): EvalTask[] {
  return ids.map((id) => {
    // Checked against the list, not the filesystem, so an id can never walk out of tasks/.
    if (!TASK_IDS.includes(id)) throw new Error(`Unknown task "${id}"`)
    const dir = `${TASKS_DIR}${id}/`
    const promptPath = `${dir}PROMPT.md`
    const evalPath = `${dir}EVAL.ts`
    if (!existsSync(promptPath)) throw new Error(`Task "${id}" has no PROMPT.md`)
    if (!existsSync(evalPath)) throw new Error(`Task "${id}" has no EVAL.ts`)
    // The formatter owns the trailing newline; the prompt sent to the agent must not carry it.
    const prompt = readFileSync(promptPath, 'utf8').trim()
    if (prompt === '') throw new Error(`Task "${id}" has an empty PROMPT.md`)
    return { id, prompt, evalPath, fixturesDir: `${dir}fixtures` }
  })
}
