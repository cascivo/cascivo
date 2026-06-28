import { describe, expect, it } from 'vitest'
import { createScope } from './scope.ts'

describe('createScope', () => {
  it('runs owned effects until dispose, then stops them', () => {
    const scope = createScope()
    const s = scope.signal(0)
    let runs = 0
    scope.effect(() => {
      runs++
      void s.value
    })
    expect(runs).toBe(1) // effects run once on creation

    s.value = 1
    expect(runs).toBe(2)

    scope.dispose()
    s.value = 2
    expect(runs).toBe(2) // no further runs after dispose
    expect(scope.disposed).toBe(true)
  })

  it('computed reflects owned signals', () => {
    const scope = createScope()
    const a = scope.signal(2)
    const double = scope.computed(() => a.value * 2)
    expect(double.value).toBe(4)
    a.value = 5
    expect(double.value).toBe(10)
  })

  it('dispose is idempotent', () => {
    const scope = createScope()
    scope.effect(() => {})
    scope.dispose()
    expect(() => scope.dispose()).not.toThrow()
    expect(scope.disposed).toBe(true)
  })

  it('an individual effect disposer stops just that effect', () => {
    const scope = createScope()
    const s = scope.signal(0)
    let a = 0
    let b = 0
    const stopA = scope.effect(() => {
      a++
      void s.value
    })
    scope.effect(() => {
      b++
      void s.value
    })
    stopA()
    s.value = 1
    expect(a).toBe(1) // stopped
    expect(b).toBe(2) // still live
  })

  it('a workspace-switch loop leaks no active effects', () => {
    const shared = createScope().signal(0)
    let liveRuns = 0
    for (let i = 0; i < 1000; i++) {
      const scope = createScope()
      scope.effect(() => {
        liveRuns++
        void shared.value
      })
      scope.dispose()
    }
    const before = liveRuns
    shared.value = 1 // no disposed scope's effect should fire
    expect(liveRuns).toBe(before)
  })

  it('effects created after dispose do not register a live subscription', () => {
    const scope = createScope()
    const s = scope.signal(0)
    scope.dispose()
    let runs = 0
    scope.effect(() => {
      runs++
      void s.value
    })
    s.value = 1
    expect(runs).toBe(0)
  })
})
