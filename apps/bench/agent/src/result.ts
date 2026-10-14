/**
 * The measurements of one agent run, read from `claude -p --output-format json`.
 *
 * Parsed at the boundary: the CLI's JSON is another program's output, so every field is
 * checked here and everything downstream has a real type.
 */
export interface AgentUsage {
  /** Input tokens billed at the full rate. */
  inputTokens: number
  /** Input tokens written to and read from the prompt cache; an agent loop rereads a lot. */
  cacheCreationTokens: number
  cacheReadTokens: number
  outputTokens: number
  costUsd: number
  durationMs: number
  turns: number
  /** The run ended in an error (a crash, a refusal, the turn limit). */
  failed: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function count(record: Record<string, unknown>, key: string, where: string): number {
  const value = record[key]
  if (value === undefined) return 0
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`claude result: ${where}${key} is not a non-negative number`)
  }
  return value
}

export function parseClaudeResult(raw: unknown): AgentUsage {
  if (!isRecord(raw) || raw.type !== 'result') {
    throw new Error(
      'claude result: expected the JSON object `claude -p --output-format json` prints',
    )
  }
  const usage = raw.usage
  if (!isRecord(usage)) throw new Error('claude result: no usage object')
  return {
    inputTokens: count(usage, 'input_tokens', 'usage.'),
    cacheCreationTokens: count(usage, 'cache_creation_input_tokens', 'usage.'),
    cacheReadTokens: count(usage, 'cache_read_input_tokens', 'usage.'),
    outputTokens: count(usage, 'output_tokens', 'usage.'),
    costUsd: count(raw, 'total_cost_usd', ''),
    durationMs: count(raw, 'duration_ms', ''),
    turns: count(raw, 'num_turns', ''),
    failed: raw.is_error === true || (typeof raw.subtype === 'string' && raw.subtype !== 'success'),
  }
}
