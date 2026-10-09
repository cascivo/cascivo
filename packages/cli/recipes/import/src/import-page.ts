import { createClient } from '@cascivo/app/api'
import { watchJob } from '@cascivo/app/jobs'
import type { WatchedJob } from '@cascivo/app/jobs'
import { signal } from '@cascivo/react'
import { api } from './api'
import { importJob } from './import-job'
import type { ImportSummary } from './import-job'

const client = createClient(api)

/** The job this page shows. Kept in the URL (`?job=`), so a reload picks it back up. */
export const current = signal<WatchedJob<ImportSummary> | null>(null)
export const starting = signal(false)
export const startError = signal<string | null>(null)

function watch(id: string): void {
  current.value?.close()
  current.value = watchJob(importJob, `/api/jobs/${id}`)
}

const fromUrl = new URLSearchParams(location.search).get('job')
if (fromUrl && /^[\w-]{1,60}$/.test(fromUrl)) watch(fromUrl)

export async function startImport(csv: string): Promise<void> {
  starting.value = true
  startError.value = null
  try {
    const { id } = await client.startImport({ body: { csv } })
    history.replaceState(null, '', `/import?job=${id}`)
    watch(id)
  } catch (error) {
    startError.value = error instanceof Error ? error.message : 'The import could not start'
  } finally {
    starting.value = false
  }
}
