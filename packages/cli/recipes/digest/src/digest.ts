/**
 * The weekly digest's runs, shared by the Worker (which records each one) and the /digest page
 * (which lists them). A run happens on the Cron Trigger in wrangler.jsonc, or from "Send now".
 */
export interface DigestRun {
  id: string
  startedAt: string
  /** `sent`, `skipped` (not configured yet: see `detail`) or `failed`. */
  status: 'sent' | 'skipped' | 'failed'
  /** Who it went to, why it was skipped, or what failed. */
  detail: string
  /** `cron` or `manual`. */
  trigger: 'cron' | 'manual'
}

const STATUSES = ['sent', 'skipped', 'failed']
const TRIGGERS = ['cron', 'manual']

export function parseDigestRun(raw: unknown): DigestRun {
  if (typeof raw === 'object' && raw !== null) {
    const { id, startedAt, status, detail, trigger } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof startedAt === 'string' &&
      typeof status === 'string' &&
      STATUSES.includes(status) &&
      typeof detail === 'string' &&
      typeof trigger === 'string' &&
      TRIGGERS.includes(trigger)
    ) {
      // Both checked against their lists just above.
      return {
        id,
        startedAt,
        status: status as DigestRun['status'],
        detail,
        trigger: trigger as DigestRun['trigger'],
      }
    }
  }
  throw new Error('Malformed digest run')
}

export function parseDigestRuns(raw: unknown): DigestRun[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list of runs')
  return raw.map(parseDigestRun)
}
