import { describe, expect, it } from 'vitest'
import { claudeArgs } from './arms.ts'
import { PROMPTS } from './prompts.ts'
import { markdownTable } from './report.ts'
import type { BenchResults } from './report.ts'
import { parseClaudeResult } from './result.ts'
import { countAudit, countTscErrors } from './score.ts'

describe('parseClaudeResult', () => {
  const result = {
    type: 'result',
    subtype: 'success',
    is_error: false,
    duration_ms: 61_000,
    num_turns: 7,
    total_cost_usd: 0.42,
    usage: {
      input_tokens: 1200,
      cache_creation_input_tokens: 9000,
      cache_read_input_tokens: 40_000,
      output_tokens: 3100,
    },
  }

  it('reads tokens, cost, time and turns', () => {
    expect(parseClaudeResult(result)).toEqual({
      inputTokens: 1200,
      cacheCreationTokens: 9000,
      cacheReadTokens: 40_000,
      outputTokens: 3100,
      costUsd: 0.42,
      durationMs: 61_000,
      turns: 7,
      failed: false,
    })
  })

  it('marks a run that ended in an error', () => {
    expect(parseClaudeResult({ ...result, subtype: 'error_max_turns' }).failed).toBe(true)
  })

  it('rejects what is not a result', () => {
    expect(() => parseClaudeResult({ type: 'assistant' })).toThrow(/expected the JSON object/)
    expect(() => parseClaudeResult({ ...result, usage: { output_tokens: '3' } })).toThrow(
      /usage.output_tokens/,
    )
  })
})

describe('scoring', () => {
  it('counts tsc errors, not their continuation lines', () => {
    const out = [
      "src/a.tsx(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
      '  The expected type comes from property x.',
      'src/b.tsx(1,1): error TS2307: Cannot find module.',
    ].join('\n')
    expect(countTscErrors(out)).toBe(2)
    expect(countTscErrors('')).toBe(0)
  })

  it('counts audit errors and warnings', () => {
    const out = JSON.stringify([{ level: 'error' }, { level: 'warn' }, { level: 'warn' }])
    expect(countAudit(out)).toEqual({ errors: 1, warnings: 2 })
    expect(countAudit('')).toEqual({ errors: 0, warnings: 0 })
  })
})

describe('arms', () => {
  it('differ only in the blueprint tools', () => {
    const today = claudeArgs('today', 'mcp.json', null)
    const blueprints = claudeArgs('blueprints', 'mcp.json', null)
    expect(today).toContain('mcp__cascivo__compose_app,mcp__cascivo__list_blocks')
    expect(blueprints.join(' ')).not.toContain('--disallowedTools')
    expect(today.slice(0, blueprints.length)).toEqual(blueprints)
  })

  it('runs isolated from the user and the project', () => {
    const args = claudeArgs('today', 'mcp.json', 'claude-x')
    expect(args).toEqual(expect.arrayContaining(['--bare', '--strict-mcp-config', '--model']))
  })
})

describe('the report', () => {
  it('prints the median of each prompt and arm', () => {
    const usage = (out: number) => ({
      inputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 900,
      outputTokens: out,
      costUsd: 0.1,
      durationMs: 30_000,
      turns: 3,
      failed: false,
    })
    const score = { app: 'app', tscErrors: 0, auditErrors: 0, auditWarnings: 1 }
    const results: BenchResults = {
      date: '2026-10-09',
      model: null,
      dryRun: false,
      runs: [1000, 3000, 2000].map((out, i) => ({
        prompt: 'crud-table',
        arm: 'today' as const,
        run: i + 1,
        usage: usage(out),
        score,
      })),
    }
    expect(markdownTable(results).split('\n')[2]).toBe(
      '| crud-table | today | 3 | 1,000 | 2,000 | 0.1 | 30 | 3 | 0 | 0 | 1 |',
    )
  })
})

it('keeps the five prompts the research fixed', () => {
  expect(PROMPTS.map((p) => p.id)).toEqual([
    'admin-console',
    'saas-settings',
    'marketing-site',
    'crud-table',
    'auth-flow',
  ])
})
