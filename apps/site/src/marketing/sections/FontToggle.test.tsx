// @vitest-environment jsdom
import { render } from 'preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Under vitest @cascivo/core loads real React, not the site build's Preact alias, so the
// React-only useSignals hook is stubbed; the signals themselves stay real.
vi.mock('@cascivo/core', async () => ({
  ...(await vi.importActual<typeof import('@cascivo/core')>('@cascivo/core')),
  useSignals: () => {},
}))
vi.mock('../pages/cascivo-sans/font.css', () => ({}))
vi.mock('../font-faces/mono.css', () => ({}))
vi.mock('../font-faces/serif.css', () => ({}))
vi.mock('../font-faces/condensed.css', () => ({}))

import { FontToggle } from './FontToggle'
import { siteFont } from '../font-toggle'

let host: HTMLElement
function mount(): HTMLSelectElement {
  // A fresh host per test: preact keeps vnode state on the container it rendered into.
  host = document.createElement('div')
  document.body.append(host)
  render(<FontToggle />, host)
  return host.querySelector('select')!
}

afterEach(() => {
  siteFont.value = 'default'
  render(null, host)
  host.remove()
})

function pick(select: HTMLSelectElement, value: string): void {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('FontToggle', () => {
  it('is a labelled select, default selected, no data-font', () => {
    const select = mount()
    expect(select.getAttribute('aria-label')).toBe('Site typeface')
    expect(select.value).toBe('default')
    expect([...select.options].map((o) => o.value)).toEqual([
      'default',
      'cascivo',
      'sans',
      'mono',
      'serif',
      'condensed',
    ])
    expect(document.documentElement.hasAttribute('data-font')).toBe(false)
  })

  it.each(['sans', 'mono', 'serif', 'condensed'])(
    'choosing %s sets data-font and persists',
    async (name) => {
      const select = mount()
      pick(select, name)
      await Promise.resolve()
      expect(document.documentElement.getAttribute('data-font')).toBe(`cascivo-${name}`)
      expect(localStorage.getItem('cascivo-font-sans')).toContain(name)
    },
  )

  it('Cascivo Fonts sets data-font="cascivo" and persists', async () => {
    const select = mount()
    pick(select, 'cascivo')
    await Promise.resolve()
    expect(document.documentElement.getAttribute('data-font')).toBe('cascivo')
    expect(localStorage.getItem('cascivo-font-sans')).toContain('cascivo')
  })

  it('returning to default removes data-font', async () => {
    const select = mount()
    pick(select, 'mono')
    pick(select, 'default')
    await Promise.resolve()
    expect(document.documentElement.hasAttribute('data-font')).toBe(false)
  })
})
