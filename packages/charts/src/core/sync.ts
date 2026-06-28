'use client'
import { signal, type Signal } from '@cascivo/core'

/**
 * A shared zoom window + hovered-x index for a group of connected charts. Charts
 * passing the same `syncId` mirror each other's zoom and hover through this group.
 * `null` means "unset" (use each chart's full range / no hover).
 */
export interface SyncGroup {
  window: Signal<[number, number] | null>
  hoverX: Signal<number | null>
}

const registry = new Map<string, { group: SyncGroup; refs: number }>()

/**
 * Get (lazily creating) the shared group for an id and increment its ref count.
 * Every `getSyncGroup` must be paired with a `releaseSyncGroup` on teardown.
 */
export function getSyncGroup(id: string): SyncGroup {
  let entry = registry.get(id)
  if (!entry) {
    entry = { group: { window: signal(null), hoverX: signal(null) }, refs: 0 }
    registry.set(id, entry)
  }
  entry.refs++
  return entry.group
}

/** Decrement an id's ref count; drop the group from the registry when it hits zero. */
export function releaseSyncGroup(id: string): void {
  const entry = registry.get(id)
  if (!entry) return
  entry.refs--
  if (entry.refs <= 0) registry.delete(id)
}

/** Test-only: number of live sync groups. */
export function _syncGroupCount(): number {
  return registry.size
}
