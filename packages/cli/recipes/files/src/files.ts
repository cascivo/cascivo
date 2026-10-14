import { createClient } from '@cascivo/app/api'
import { startUpload } from '@cascivo/app/uploads'
import type { StoredFile, Upload } from '@cascivo/app/uploads'
import { signal } from '@cascivo/react'
import { api } from './api'
import { uploads } from './upload-policy'

const client = createClient(api)

/** Files being uploaded now, newest first. */
export const inFlight = signal<Upload[]>([])
/** Files already stored (see listUploads for their order). */
export const stored = signal<StoredFile[]>([])

export async function refresh(): Promise<void> {
  stored.value = await client.listFiles()
}

export function addFiles(files: File[]): void {
  for (const file of files) {
    const upload = startUpload(uploads, file)
    inFlight.value = [upload, ...inFlight.value]
    // Once stored, the file moves from the upload list to the file list.
    const stop = upload.status.subscribe((status) => {
      if (status !== 'done') return
      stop()
      inFlight.value = inFlight.value.filter((u) => u !== upload)
      void refresh()
    })
  }
}

export function removeUpload(id: string): void {
  const upload = inFlight.value.find((u) => u.id === id)
  upload?.abort()
  inFlight.value = inFlight.value.filter((u) => u.id !== id)
}
