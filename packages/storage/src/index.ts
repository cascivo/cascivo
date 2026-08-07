// `persistedSignal` and the synchronous drivers now live in `@cascivo/core`, so the theme
// runtime there can use them without `@cascivo/core` → `@cascivo/storage` → `@cascivo/core`.
// Re-exported here unchanged: this package's public API is exactly what it was.
export { persistedSignal, localStorageDriver, memoryDriver } from '@cascivo/core'
export type { PersistedSignal, PersistedSignalOptions, StorageDriver } from '@cascivo/core'
export { indexedDBDriver } from './indexed-db'
