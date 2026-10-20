/** The models the published eval runs: the latest Sonnet and Haiku (spec §1). */
export const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'] as const

export type ModelId = (typeof MODELS)[number]
