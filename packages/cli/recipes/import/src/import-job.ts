import { defineJob } from '@cascivo/app/jobs'

/**
 * The CSV import job, shared by the Worker (which runs it) and the page (which watches it).
 * Its output crosses the network, so it is parsed on the way in, never cast.
 */

/** Largest CSV the Worker accepts. A Workflow's params are limited in size, too. */
export const MAX_CSV_LENGTH = 200_000

export interface Rejected {
  /** 1-based line in the CSV. */
  line: number
  reason: string
}

export interface ImportSummary {
  imported: number
  rejected: Rejected[]
}

export function parseImportSummary(raw: unknown): ImportSummary {
  if (typeof raw === 'object' && raw !== null) {
    const { imported, rejected } = raw as Record<string, unknown>
    if (typeof imported === 'number' && Array.isArray(rejected)) {
      return {
        imported,
        rejected: rejected.map((r: unknown) => {
          if (typeof r === 'object' && r !== null) {
            const { line, reason } = r as Record<string, unknown>
            if (typeof line === 'number' && typeof reason === 'string') return { line, reason }
          }
          throw new Error('Malformed rejected row')
        }),
      }
    }
  }
  throw new Error('Malformed import summary')
}

export const importJob = defineJob({
  steps: ['Read', 'Check', 'Import'],
  output: parseImportSummary,
})

export function parseImportRequest(raw: unknown): { csv: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { csv } = raw as Record<string, unknown>
    if (typeof csv === 'string' && csv.length > 0 && csv.length <= MAX_CSV_LENGTH) return { csv }
  }
  throw new Error(`Send { csv } with 1 to ${MAX_CSV_LENGTH} characters`)
}

export function parseStarted(raw: unknown): { id: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { id } = raw as Record<string, unknown>
    if (typeof id === 'string' && /^[\w-]{1,60}$/.test(id)) return { id }
  }
  throw new Error('Malformed job id')
}
