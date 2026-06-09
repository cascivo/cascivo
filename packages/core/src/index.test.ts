import { describe, it, expect, vi } from 'vitest'
import { createMachine, useMachine, cn, mergeProps, composeRefs, VERSION } from './index.ts'
import { renderHook, act } from '@testing-library/react'

describe('VERSION', () => {
  it('is defined', () => {
    expect(VERSION).toBe('0.0.0')
  })
})

describe('createMachine', () => {
  it('returns the config unchanged', () => {
    const m = createMachine({
      initial: 'idle',
      states: { idle: { on: { START: 'running' } }, running: {} },
    })
    expect(m.initial).toBe('idle')
  })
})

describe('useMachine', () => {
  const machine = createMachine({
    initial: 'idle' as const,
    states: {
      idle: { on: { START: 'running' } },
      running: { on: { STOP: 'idle' } },
    },
  })

  it('starts in initial state', () => {
    const { result } = renderHook(() => useMachine(machine))
    expect(result.current[0].value).toBe('idle')
  })

  it('transitions on valid event', () => {
    const { result } = renderHook(() => useMachine(machine))
    act(() => result.current[1]('START'))
    expect(result.current[0].value).toBe('running')
  })

  it('ignores unknown events', () => {
    const { result } = renderHook(() => useMachine(machine))
    act(() => result.current[1]('UNKNOWN'))
    expect(result.current[0].value).toBe('idle')
  })
})

describe('cn', () => {
  it('joins classes', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters falsy values', () => {
    expect(cn('a', false, undefined, null, 0, 'b')).toBe('a b')
  })
})

describe('mergeProps', () => {
  it('merges plain props', () => {
    expect(mergeProps({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
  })

  it('chains event handlers', () => {
    const first = vi.fn()
    const second = vi.fn()
    const merged = mergeProps<{ onClick: (...args: unknown[]) => unknown }>(
      { onClick: first },
      { onClick: second },
    )
    merged.onClick()
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})

describe('composeRefs', () => {
  it('calls all ref callbacks', () => {
    const a = vi.fn()
    const b = vi.fn()
    const composed = composeRefs<HTMLDivElement>(a, b)
    const el = {} as HTMLDivElement
    composed(el)
    expect(a).toHaveBeenCalledWith(el)
    expect(b).toHaveBeenCalledWith(el)
  })

  it('assigns to object refs', () => {
    const ref = { current: null }
    const el = {} as HTMLDivElement
    composeRefs<HTMLDivElement>(ref)(el)
    expect(ref.current).toBe(el)
  })
})
