export interface StorageDriver {
  get(key: string): string | null | Promise<string | null>
  set(key: string, value: string): void
  remove(key: string): void
  /** Optional change feed (e.g. the cross-tab `storage` event). */
  subscribe?(key: string, onChange: (raw: string | null) => void): () => void
}

export function memoryDriver(): StorageDriver {
  const store = new Map<string, string>()
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value)
    },
    remove: (key) => {
      store.delete(key)
    },
  }
}

export function localStorageDriver(): StorageDriver {
  // SSR: no window — persistence becomes a no-op, the signal still works.
  if (typeof window === 'undefined') return memoryDriver()
  return {
    get: (key) => window.localStorage.getItem(key),
    set: (key, value) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // Quota exceeded / private mode: persistence is best-effort.
      }
    },
    remove: (key) => {
      window.localStorage.removeItem(key)
    },
    subscribe(key, onChange) {
      const listener = (event: StorageEvent) => {
        if (event.storageArea === window.localStorage && event.key === key) {
          onChange(event.newValue)
        }
      }
      window.addEventListener('storage', listener)
      return () => window.removeEventListener('storage', listener)
    },
  }
}
