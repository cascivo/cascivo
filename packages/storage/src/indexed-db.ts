import { memoryDriver, type StorageDriver } from './drivers'

/** Minimal key-value driver over indexedDB — async hydration, no `idb` dependency. */
export function indexedDBDriver(dbName = 'cascade', storeName = 'kv'): StorageDriver {
  if (typeof indexedDB === 'undefined') return memoryDriver()

  let dbPromise: Promise<IDBDatabase> | undefined
  function open(): Promise<IDBDatabase> {
    dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(storeName)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error(`indexedDB open failed: ${dbName}`))
    })
    return dbPromise
  }

  async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await open()
    return new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(storeName, mode).objectStore(storeName))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('indexedDB request failed'))
    })
  }

  return {
    get: async (key) =>
      ((await withStore('readonly', (store) => store.get(key))) as string | undefined) ?? null,
    set: (key, value) => {
      void withStore('readwrite', (store) => store.put(value, key))
    },
    remove: (key) => {
      void withStore('readwrite', (store) => store.delete(key))
    },
  }
}
