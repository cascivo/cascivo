import { defineLive } from '@cascivo/app/live'

/**
 * The live dashboard's metrics, shared by the Worker (which records them) and the page (which
 * charts them). Each event adds to its second's totals, and the room keeps two minutes.
 */
export const ops = defineLive({ metrics: ['orders', 'revenue', 'errors'], window: 120 })

/** The dashboard's room. Name one per team or tenant if each needs its own. */
export const OPS_ROOM = 'ops'

export interface Accepted {
  accepted: number
}

export function parseAccepted(raw: unknown): Accepted {
  if (typeof raw === 'object' && raw !== null) {
    const { accepted } = raw as Record<string, unknown>
    if (typeof accepted === 'number') return { accepted }
  }
  throw new Error('Malformed reply')
}
