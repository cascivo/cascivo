import { onCleanup } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineIsland } from './island.ts'

// jsdom's XPathExpression.evaluate requires a result type; htmx omits it.
const evaluate = XPathExpression.prototype.evaluate
XPathExpression.prototype.evaluate = function (
  this: XPathExpression,
  ctx: Node,
  type = 0,
  res = null,
) {
  return evaluate.call(this, ctx, type, res)
}
const { default: htmx } = await import('htmx.org')

// Real htmx (not hand-dispatched events): an island inside a swapped fragment must dispose
// when htmx cleans the old node up, and mount again from the new fragment after settle.
const cleanup = vi.fn()
const Island = defineIsland<{ n?: number }>((p) => {
  onCleanup(cleanup)
  return <b>{p.n ?? 0}</b>
})

function boot(): HTMLElement {
  document.body.innerHTML = '<div id="t"></div>'
  const t = document.getElementById('t')!
  // The island loader's job (cascivo-web islands.rs): mount every [data-island] after settle.
  document.body.addEventListener('htmx:afterSettle', () => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-island]'))
      if (!el.firstElementChild || el.firstElementChild.tagName === 'P')
        Island(el, { n: Number(el.dataset.n) })
  })
  return t
}

afterEach(() => {
  cleanup.mockClear()
  document.body.innerHTML = ''
})

describe('htmx swap lifecycle', () => {
  it('disposes on swap and re-mounts from the new fragment after settle', async () => {
    const t = boot()
    htmx.process(document.body)
    const swap = (html: string) =>
      new Promise<void>((done) => {
        document.body.addEventListener('htmx:afterSettle', () => done(), { once: true })
        htmx.swap(t, html, { swapStyle: 'innerHTML' })
      })

    await swap('<div data-island data-n="1"><p>fallback</p></div>')
    expect(t.textContent).toBe('1')
    expect(cleanup).not.toHaveBeenCalled()

    await swap('<div data-island data-n="2"><p>fallback</p></div>')
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(t.textContent).toBe('2')

    await swap('<span>gone</span>')
    expect(cleanup).toHaveBeenCalledTimes(2)
    expect(t.querySelector('[data-island]')).toBeNull()
  })
})
