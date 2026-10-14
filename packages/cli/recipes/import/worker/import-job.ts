import { jobReporter } from '@cascivo/app/jobs-server'
import { WorkflowEntrypoint } from 'cloudflare:workers'
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { importJob } from '../src/import-job'
import type { ImportSummary, Rejected } from '../src/import-job'
import type { Env } from './index'

interface Contact {
  line: number
  name: string
  email: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CHUNK = 25

/** `name,email` per line, after a header line. Quoted fields are not supported. */
function readCsv(csv: string): Contact[] {
  const lines = csv.split(/\r?\n/)
  const rows: Contact[] = []
  lines.forEach((text, i) => {
    if (i === 0 || text.trim() === '') return
    const [name = '', email = ''] = text.split(',').map((cell) => cell.trim())
    rows.push({ line: i + 1, name, email })
  })
  return rows
}

function checkRows(rows: Contact[]): { valid: Contact[]; rejected: Rejected[] } {
  const valid: Contact[] = []
  const rejected: Rejected[] = []
  for (const row of rows) {
    if (!row.name) rejected.push({ line: row.line, reason: 'No name' })
    else if (!EMAIL.test(row.email))
      rejected.push({ line: row.line, reason: 'Not an email address' })
    else valid.push(row)
  }
  return { valid, rejected }
}

/**
 * Write the contacts where they belong (D1, an API…). Here it only waits, so the progress
 * is visible; each chunk is its own step, so a failure retries that chunk alone.
 */
async function importContacts(contacts: Contact[]): Promise<void> {
  console.log(`import: ${contacts.length} contacts`)
  await new Promise((resolve) => setTimeout(resolve, 400))
}

/**
 * The import, as a Workflow: each step is retried on failure and its result is kept, so a
 * crash or a deploy resumes the job where it was. Progress goes to the job's room, where the
 * page watches it (`watchJob`). Every report is made inside a step: a Workflow replays
 * `run()` from the top after each step, and a report outside one would run again.
 */
export class ImportJob extends WorkflowEntrypoint<Env, { csv: string }> {
  override async run(event: WorkflowEvent<{ csv: string }>, step: WorkflowStep) {
    const report = jobReporter(importJob, this.env.ROOMS, event.instanceId)
    let at = 0
    try {
      const rows = await step.do('read', async () => {
        await report.step(0, 'Reading the file')
        return readCsv(event.payload.csv)
      })
      at = 1
      const checked = await step.do('check', async () => {
        await report.step(1, `Checking ${rows.length} rows`)
        return checkRows(rows)
      })
      at = 2
      const total = checked.valid.length
      for (let start = 0; start < total; start += CHUNK) {
        await step.do(`import ${start}`, async () => {
          await report.progress(2, start / total, `Imported ${start} of ${total}`)
          await importContacts(checked.valid.slice(start, start + CHUNK))
        })
      }
      const summary: ImportSummary = { imported: total, rejected: checked.rejected }
      await step.do('done', () => report.done(summary))
      return summary
    } catch (error) {
      await report.fail(error, at)
      throw error
    }
  }
}
