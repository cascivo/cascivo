import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readLock, writeLock, createLock, updateLockEntry } from './lock.js'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(`${tmpdir()}/cascade-lock-`)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('lock', () => {
  it('returns null when no lock exists', async () => {
    expect(await readLock(dir)).toBeNull()
  })

  it('write + read round-trip', async () => {
    let lock = createLock()
    lock = updateLockEntry(lock, 'button', {
      registry: 'https://cascade-ui.dev/r',
      version: '1.2.0',
      installedAt: '2026-06-12',
      files: { 'src/components/ui/button/button.tsx': 'sha256-abc' },
    })
    await writeLock(lock, dir)
    const read = await readLock(dir)
    expect(read?.items['button']?.version).toBe('1.2.0')
    expect(read?.items['button']?.files['src/components/ui/button/button.tsx']).toBe('sha256-abc')
  })
})
