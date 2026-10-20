import type { AttemptRecord, EvalRun } from './results.ts'

// Shared by the eval tests; not a test file itself, so importing it never re-runs a suite.
const usage = {
  inputTokens: 1,
  cacheCreationTokens: 2,
  cacheReadTokens: 3,
  outputTokens: 4,
  costUsd: 0.5,
  durationMs: 1000,
  turns: 5,
  failed: false,
}

export const record = (over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  task: 'admin-console',
  arm: 'cascivo',
  model: 'claude-sonnet-5-5',
  attempt: 1,
  status: 'pass',
  detail: null,
  usage,
  tscErrors: 0,
  axe: { critical: 0, serious: 0, moderate: 0, minor: 0 },
  auditErrors: 0,
  auditWarnings: 0,
  ...over,
})

export const run = (over: Partial<EvalRun> = {}): EvalRun => ({
  schemaVersion: 1,
  date: '2026-10-20T00:00:00.000Z',
  cascivoVersion: '1.0.0',
  commit: 'abc1234',
  models: ['claude-sonnet-5-5'],
  arms: ['cascivo'],
  tasks: ['admin-console'],
  attempts: 1,
  maxUsd: 50,
  spentUsd: 1,
  budgetExhausted: false,
  shadcnVersion: '2.0.0',
  records: [record()],
  ...over,
})
