import { describe, expect, it } from 'vitest'
import { createMachine, transition } from './fsm.ts'

describe('transition', () => {
  const m = createMachine({
    initial: 'closed',
    states: { closed: { on: { OPEN: 'open' } }, open: { on: { CLOSE: 'closed' } } },
  })
  it('follows a defined edge', () => {
    expect(transition(m, 'closed', 'OPEN')).toBe('open')
  })
  it('stays put on an unknown event', () => {
    expect(transition(m, 'open', 'OPEN')).toBe('open')
  })
})
