import { describe, expect, it } from 'vitest'
import { set } from './base.ts'

describe('set', () => {
  // render() runs on every mutation; an unguarded write re-queues a record and loops forever
  // (as `.disabled = true` did on the date-picker nav button).
  it('writes nothing when the attribute already has the value', async () => {
    const el = document.createElement('div')
    el.setAttribute('aria-expanded', 'true')
    const records: MutationRecord[] = []
    const mo = new MutationObserver((r) => records.push(...r))
    mo.observe(el, { attributes: true })
    set(el, 'aria-expanded', 'true')
    set(el, 'hidden', null)
    await Promise.resolve()
    expect(records).toEqual([])
    set(el, 'aria-expanded', 'false')
    set(el, 'aria-expanded', null)
    await Promise.resolve()
    mo.disconnect()
    expect(records.map((r) => r.attributeName)).toEqual(['aria-expanded', 'aria-expanded'])
    expect(el.hasAttribute('aria-expanded')).toBe(false)
  })
})
