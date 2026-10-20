import { describe, expect, it } from 'vitest'
import { claudeArgs, PUBLISHED_ARMS } from './arms.ts'
import { MODELS } from './models.ts'
import { instructionsFor, PROMPTS } from './prompts.ts'
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
    const cascivo = claudeArgs('cascivo', 'mcp.json', null)
    expect(today).toContain('mcp__cascivo__compose_app,mcp__cascivo__list_blocks')
    expect(cascivo.join(' ')).not.toContain('--disallowedTools')
    expect(today.slice(0, cascivo.length)).toEqual(cascivo)
  })

  it('keeps the cascivo arm as the legacy blueprints arm was', () => {
    expect(claudeArgs('cascivo', 'mcp.json', 'claude-x')).toEqual([
      '--output-format',
      'json',
      '--bare',
      '--strict-mcp-config',
      '--mcp-config',
      'mcp.json',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'mcp__cascivo__*,Read,Write,Edit,Glob,Grep',
      '--model',
      'claude-x',
    ])
  })

  it('gives cascivo-bare no MCP server at all', () => {
    const args = claudeArgs('cascivo-bare', null, null)
    expect(args).toContain('--strict-mcp-config')
    expect(args).not.toContain('--mcp-config')
    expect(args).not.toContain('--disallowedTools')
    expect(args.join(' ')).not.toContain('mcp__')
  })

  it('gives shadcn its own MCP config and tools', () => {
    const args = claudeArgs('shadcn', 'shadcn.json', 'claude-x')
    expect(args.slice(args.indexOf('--mcp-config'), args.indexOf('--mcp-config') + 2)).toEqual([
      '--mcp-config',
      'shadcn.json',
    ])
    expect(args).not.toContain('--disallowedTools')
    expect(args.join(' ')).toContain('mcp__shadcn__*')
    expect(args.join(' ')).not.toContain('mcp__cascivo__')
  })

  it('refuses an arm that needs an MCP config without one', () => {
    expect(() => claudeArgs('shadcn', null, null)).toThrow(/needs an MCP config/)
  })

  it('captures the whole transcript only when asked', () => {
    const json = claudeArgs('cascivo', 'mcp.json', null)
    const stream = claudeArgs('cascivo', 'mcp.json', null, { stream: true })
    expect(json.slice(0, 2)).toEqual(['--output-format', 'json'])
    expect(stream.slice(0, 3)).toEqual(['--output-format', 'stream-json', '--verbose'])
    expect(stream.slice(3)).toEqual(json.slice(2))
    expect(claudeArgs('cascivo', 'mcp.json', null, {})).toEqual(json)
  })

  it('publishes three arms and two models', () => {
    expect(PUBLISHED_ARMS).toEqual(['cascivo', 'cascivo-bare', 'shadcn'])
    expect(MODELS).toEqual(['claude-sonnet-5-5', 'claude-haiku-5-5'])
  })

  it('names the design system in each arm instruction', () => {
    expect(instructionsFor('shadcn')).toContain('shadcn/ui with Tailwind')
    expect(instructionsFor('cascivo')).toContain('cascivo design system')
    expect(instructionsFor('cascivo-bare')).toContain('cascivo design system')
    expect(instructionsFor('shadcn')).not.toContain('cascivo')
    expect(instructionsFor('cascivo-bare')).not.toContain('MCP')
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
