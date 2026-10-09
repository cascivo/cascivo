/**
 * Webhook deliveries, shared by the Worker (which verifies and stores them) and the
 * /webhooks page (which lists them as they arrive).
 */
export interface Delivery {
  id: string
  /** The sender's event name, e.g. GitHub's `push` or `issues`. */
  event: string
  /** One line about what happened, taken from the payload. */
  summary: string
  receivedAt: string
}

/** The live room the page watches; the Worker writes each new delivery to `latest` in it. */
export const DELIVERIES_ROOM = 'webhooks'

export function parseDelivery(raw: unknown): Delivery {
  if (typeof raw === 'object' && raw !== null) {
    const { id, event, summary, receivedAt } = raw as Record<string, unknown>
    if (
      typeof id === 'string' &&
      typeof event === 'string' &&
      typeof summary === 'string' &&
      typeof receivedAt === 'string'
    ) {
      return { id, event, summary, receivedAt }
    }
  }
  throw new Error('Malformed delivery')
}

export function parseDeliveries(raw: unknown): Delivery[] {
  if (!Array.isArray(raw)) throw new Error('Expected a list of deliveries')
  return raw.map(parseDelivery)
}

export function parseTestResult(raw: unknown): { status: number } {
  if (typeof raw === 'object' && raw !== null) {
    const { status } = raw as Record<string, unknown>
    if (typeof status === 'number') return { status }
  }
  throw new Error('Malformed reply')
}
