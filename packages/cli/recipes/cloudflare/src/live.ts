import { createClient } from '@cascivo/app/api'
import { signal } from '@cascivo/react'
import { api } from './api'
import type { Tick } from './api'

const client = createClient(api)

// Module-level signals: any component that reads them re-renders when they change, and
// writing them from plain functions needs no hooks.
export const ticks = signal<Tick[]>([])
export const status = signal<'idle' | 'live' | 'error'>('idle')
export const error = signal<string | null>(null)

let controller: AbortController | null = null

/** Opens the Worker's event stream and appends each tick until it ends or is stopped. */
export async function connect(): Promise<void> {
  if (controller) return
  const abort = new AbortController()
  controller = abort
  ticks.value = []
  error.value = null
  status.value = 'live'
  try {
    for await (const tick of client.ticks({ signal: abort.signal })) {
      ticks.value = [...ticks.value, tick]
    }
    status.value = 'idle'
  } catch (cause) {
    if (abort.signal.aborted) {
      status.value = 'idle'
    } else {
      status.value = 'error'
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
  } finally {
    if (controller === abort) controller = null
  }
}

export function disconnect(): void {
  controller?.abort()
}
