import { describe, expect, it } from 'vitest'
import { type ReloadEnv, reloadOnChunkError } from './lazy-reload'

function fakeEnv(stored: string | null, now = 100_000) {
  const env = {
    stored,
    reloads: 0,
    now: () => now,
    read: () => env.stored,
    write: (v: string) => {
      env.stored = v
    },
    reload: () => {
      env.reloads++
    },
  } satisfies ReloadEnv & { stored: string | null; reloads: number }
  return env
}

const stale = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module'))
// Settles a microtask turn so a never-resolving promise can be told apart from a settled one.
const settled = (p: Promise<unknown>) =>
  Promise.race([
    p.then(
      () => 'resolved',
      () => 'rejected',
    ),
    new Promise((r) => setTimeout(() => r('pending'), 0)),
  ])

describe('reloadOnChunkError', () => {
  it('passes a successful load through without reloading', async () => {
    const env = fakeEnv(null)
    await expect(reloadOnChunkError(() => Promise.resolve('page'), env)()).resolves.toBe('page')
    expect(env.reloads).toBe(0)
  })

  it('reloads once and stays pending when a route chunk fails (stale deploy)', async () => {
    const env = fakeEnv(null)
    const result = reloadOnChunkError(stale, env)()
    expect(await settled(result)).toBe('pending')
    expect(env.reloads).toBe(1)
    expect(env.stored).toBe('100000')
  })

  it('rethrows instead of looping when it already reloaded moments ago', async () => {
    const env = fakeEnv('95000')
    await expect(reloadOnChunkError(stale, env)()).rejects.toThrow('dynamically imported')
    expect(env.reloads).toBe(0)
  })

  it('reloads again once the loop window has passed', async () => {
    const env = fakeEnv('1000')
    expect(await settled(reloadOnChunkError(stale, env)())).toBe('pending')
    expect(env.reloads).toBe(1)
  })
})
