/** The models the published eval runs: the latest Sonnet and Haiku (spec §1). */
export const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'] as const

export type ModelId = (typeof MODELS)[number]

/**
 * What a session that left no result line is charged (spec §6), when no session of any model has
 * finished yet to estimate from. A guess, not a measurement: sized generously for a ten-minute
 * agent loop that rereads a large cached context, so the budget cap errs on the side of stopping.
 * Revisit with the first real run's per-session costs.
 */
export const ESTIMATED_MAX_SESSION_USD: Record<ModelId, number> = {
  'claude-sonnet-5-5': 3,
  'claude-haiku-5-5': 1,
}
