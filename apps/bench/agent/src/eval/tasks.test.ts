import { describe, expect, it } from 'vitest'
import { PROMPTS } from '../prompts.ts'
import { loadTasks, TASK_IDS } from './tasks.ts'

describe('loadTasks', () => {
  it('returns 8 tasks in TASK_IDS order, each prompt non-empty', () => {
    const tasks = loadTasks()
    expect(tasks.map((t) => t.id)).toEqual([...TASK_IDS])
    expect(tasks).toHaveLength(8)
    for (const t of tasks) {
      expect(t.prompt.length).toBeGreaterThan(0)
      expect(t.evalPath).toMatch(/tasks\/[^/]+\/EVAL\.ts$/)
      expect(t.fixturesDir).toMatch(/tasks\/[^/]+\/fixtures$/)
    }
  })

  it('loads a subset in the order asked for', () => {
    expect(loadTasks(['auth-flow', 'admin-console']).map((t) => t.id)).toEqual([
      'auth-flow',
      'admin-console',
    ])
  })

  it('rejects an unknown id', () => {
    expect(() => loadTasks(['nope'])).toThrow(/unknown task/i)
  })

  it('existing prompts are unchanged', () => {
    const byId = new Map(loadTasks().map((t) => [t.id, t.prompt]))
    for (const p of PROMPTS) expect(byId.get(p.id)).toBe(p.text)
  })
})
