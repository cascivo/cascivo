import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
      registry: 'https://cascivo.com/r',
      version: '1.2.0',
      installedAt: '2026-06-12',
      files: { 'src/components/ui/button/button.tsx': 'sha256-abc' },
    })
    await writeLock(lock, dir)
    const read = await readLock(dir)
    expect(read?.items['button']?.version).toBe('1.2.0')
    expect(read?.items['button']?.files['src/components/ui/button/button.tsx']).toBe('sha256-abc')
  })

  it('writes cascivo.lock, not the legacy name', async () => {
    await writeLock(createLock(), dir)
    expect(existsSync(join(dir, 'cascivo.lock'))).toBe(true)
    expect(existsSync(join(dir, 'cascade.lock'))).toBe(false)
  })

  it('reads a legacy cascade.lock and migrates it on the next write', async () => {
    const legacy = { lockVersion: 1, items: { button: { version: '0.9.0' } } }
    await writeFile(join(dir, 'cascade.lock'), JSON.stringify(legacy))

    const read = await readLock(dir)
    expect(read?.items['button']?.version).toBe('0.9.0')

    await writeLock(read!, dir)
    expect(existsSync(join(dir, 'cascivo.lock'))).toBe(true)
    expect(existsSync(join(dir, 'cascade.lock'))).toBe(false)
    expect((await readLock(dir))?.items['button']?.version).toBe('0.9.0')
  })

  it('prefers cascivo.lock when both exist', async () => {
    await writeFile(
      join(dir, 'cascade.lock'),
      JSON.stringify({ lockVersion: 1, items: { a: { version: 'old' } } }),
    )
    await writeFile(
      join(dir, 'cascivo.lock'),
      JSON.stringify({ lockVersion: 1, items: { a: { version: 'new' } } }),
    )
    expect((await readLock(dir))?.items['a']?.version).toBe('new')
  })
})
