// @vitest-environment jsdom
import { render } from 'preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pages/cascivo-sans/font.css', () => ({}))

import { FontToggle } from './FontToggle'
import { cascivoSans } from '../font-toggle'

afterEach(() => {
  cascivoSans.value = false
  document.body.replaceChildren()
})

describe('FontToggle', () => {
  it('is off by default and exposes aria-pressed', () => {
    render(<FontToggle />, document.body)
    const btn = document.querySelector('button.header-font-toggle')
    expect(btn?.getAttribute('aria-pressed')).toBe('false')
    expect(document.documentElement.hasAttribute('data-font')).toBe(false)
  })

  it('toggles data-font on <html> and persists the choice', async () => {
    render(<FontToggle />, document.body)
    const btn = document.querySelector<HTMLButtonElement>('button.header-font-toggle')!
    btn.click()
    await Promise.resolve()
    expect(document.documentElement.getAttribute('data-font')).toBe('cascivo-sans')
    expect(localStorage.getItem('cascivo-font-sans')).toContain('true')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    btn.click()
    await Promise.resolve()
    expect(document.documentElement.hasAttribute('data-font')).toBe(false)
  })
})
