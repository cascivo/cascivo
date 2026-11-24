import { createSignal, onCleanup } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { defineIsland } from './island.ts'

function mount(): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = '<p>fallback</p>'
  document.body.append(el)
  return el
}

describe('defineIsland', () => {
  it('mounts with props, replacing the server fallback', () => {
    const el = mount()
    defineIsland<{ label: string }>((p) => <b>{p.label}</b>)(el, { label: 'hi' })
    expect(el.innerHTML).toBe('<b>hi</b>')
  })

  it('is reactive inside the island', () => {
    const el = mount()
    defineIsland(() => {
      const [n, setN] = createSignal(0)
      return <button onClick={() => setN(n() + 1)}>{n()}</button>
    })(el, {})
    el.querySelector('button')!.click()
    expect(el.textContent).toBe('1')
  })

  it('disposes on htmx:beforeCleanupElement of the island root only', () => {
    const el = mount()
    const cleanup = vi.fn()
    defineIsland(() => {
      onCleanup(cleanup)
      return <span id="inner" />
    })(el, {})
    el.querySelector('#inner')!.dispatchEvent(
      new Event('htmx:beforeCleanupElement', { bubbles: true }),
    )
    expect(cleanup).not.toHaveBeenCalled()
    el.dispatchEvent(new Event('htmx:beforeCleanupElement', { bubbles: true }))
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(el.innerHTML).toBe('')
  })

  it('a second mount on the same element disposes the first', () => {
    const el = mount()
    const cleanup = vi.fn()
    const island = defineIsland(() => {
      onCleanup(cleanup)
      return <i />
    })
    island(el, {})
    island(el, {})
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(el.children).toHaveLength(1)
  })

  it('survives an htmx-style swap: remount on a fresh element works', () => {
    const island = defineIsland<{ n: number }>((p) => <u>{p.n}</u>)
    const a = mount()
    island(a, { n: 1 })
    a.dispatchEvent(new Event('htmx:beforeCleanupElement', { bubbles: true }))
    a.remove()
    const b = mount()
    island(b, { n: 2 })
    expect(b.textContent).toBe('2')
  })
})
