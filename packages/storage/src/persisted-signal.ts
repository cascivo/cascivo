import { effect, signal } from '@cascade-ui/core'
import type { ReadonlySignal, Signal } from '@cascade-ui/core'
import { localStorageDriver, type StorageDriver } from './drivers'

interface Envelope {
  v: number
  value: unknown
}

export interface PersistedSignalOptions<T> {
  driver?: StorageDriver
  /** Bump together with `migrate` when the stored shape changes. */
  version?: number
  migrate?: (value: unknown, fromVersion: number) => T
}

export type PersistedSignal<T> = Signal<T> & { ready: ReadonlySignal<boolean> }

export function persistedSignal<T>(
  key: string,
  initial: T,
  options: PersistedSignalOptions<T> = {},
): PersistedSignal<T> {
  const driver = options.driver ?? localStorageDriver()
  const version = options.version ?? 1
  const value = signal(initial)
  const ready = signal(false)
  // Suppresses the write-through effect while adopting a value FROM storage.
  let adopting = false

  function decode(raw: string | null): T | undefined {
    if (raw === null) return undefined
    try {
      const envelope = JSON.parse(raw) as Envelope
      if (typeof envelope !== 'object' || envelope === null || typeof envelope.v !== 'number') {
        return undefined
      }
      if (envelope.v !== version) {
        if (!options.migrate) return undefined
        const migrated = options.migrate(envelope.value, envelope.v)
        // Persist the migration immediately so old-format data doesn't linger.
        driver.set(key, JSON.stringify({ v: version, value: migrated } satisfies Envelope))
        return migrated
      }
      return envelope.value as T
    } catch {
      return undefined
    }
  }

  function adopt(raw: string | null): void {
    const decoded = decode(raw)
    if (decoded !== undefined) {
      adopting = true
      value.value = decoded
      adopting = false
    }
  }

  const raw = driver.get(key)
  if (raw instanceof Promise) {
    void raw.then((resolved) => {
      adopt(resolved)
      ready.value = true
    })
  } else {
    adopt(raw)
    ready.value = true
  }

  effect(() => {
    const next = value.value
    if (!ready.value || adopting) return
    driver.set(key, JSON.stringify({ v: version, value: next } satisfies Envelope))
  })

  driver.subscribe?.(key, adopt)

  const persisted = value as PersistedSignal<T>
  ;(persisted as { ready: ReadonlySignal<boolean> }).ready = ready
  return persisted
}
