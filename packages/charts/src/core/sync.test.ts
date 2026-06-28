import { describe, expect, it } from 'vitest'
import { _syncGroupCount, getSyncGroup, releaseSyncGroup } from './sync'

describe('sync registry', () => {
  it('returns the same shared group for the same id', () => {
    const a = getSyncGroup('grp-1')
    const b = getSyncGroup('grp-1')
    expect(a).toBe(b)
    releaseSyncGroup('grp-1')
    releaseSyncGroup('grp-1')
  })

  it('mirrors a window through the shared signal', () => {
    const a = getSyncGroup('grp-2')
    const b = getSyncGroup('grp-2')
    a.window.value = [3, 7]
    expect(b.window.value).toEqual([3, 7])
    releaseSyncGroup('grp-2')
    releaseSyncGroup('grp-2')
  })

  it('isolates different ids', () => {
    const a = getSyncGroup('grp-a')
    const b = getSyncGroup('grp-b')
    a.window.value = [1, 2]
    expect(b.window.value).toBeNull()
    releaseSyncGroup('grp-a')
    releaseSyncGroup('grp-b')
  })

  it('ref-counts and drops the group at zero', () => {
    getSyncGroup('grp-rc')
    getSyncGroup('grp-rc')
    const before = _syncGroupCount()
    releaseSyncGroup('grp-rc')
    // still referenced once → not dropped
    expect(_syncGroupCount()).toBe(before)
    releaseSyncGroup('grp-rc')
    expect(_syncGroupCount()).toBe(before - 1)
  })
})
