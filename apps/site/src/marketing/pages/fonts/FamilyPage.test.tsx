// @vitest-environment jsdom
import { render } from 'react-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Chrome, fonts CSS and the interactive widgets are covered elsewhere; this checks what the
// family config drives: names, downloads, the hub's cards and links.
vi.mock('@cascivo/components/skip-nav', () => ({
  SkipNavLink: () => null,
  SkipNavTarget: ({ children }: { children: unknown }) => <div>{children as never}</div>,
}))
vi.mock('@cascivo/components/copy-button', () => ({ CopyButton: () => null }))
vi.mock('../../sections/Header', () => ({ Header: () => null }))
vi.mock('../../sections/Footer', () => ({ Footer: () => null }))
vi.mock('../cascivo-sans/TypeTester', () => ({
  TypeTester: (p: { italic?: boolean }) => (
    <div data-testid="tester" data-italic={String(p.italic)} />
  ),
}))
vi.mock('../cascivo-sans/WeightWaterfall', () => ({
  WeightWaterfall: (p: { compare?: boolean }) => (
    <div data-testid="waterfall" data-compare={String(p.compare)} />
  ),
}))
vi.mock('../cascivo-sans/font.css', () => ({}))
vi.mock('./fonts.css', () => ({}))
vi.mock('../../font-faces/mono.css', () => ({}))
vi.mock('../../font-faces/serif.css', () => ({}))
vi.mock('../../font-faces/condensed.css', () => ({}))

import { FamilyPage } from './FamilyPage'
import { FAMILIES } from './families'
import { FontsPage, HUB_CARDS } from '../FontsPage'

let host: HTMLElement
function mount(ui: React.ReactElement): HTMLElement {
  host = document.createElement('div')
  document.body.append(host)
  render(ui, host)
  return host
}
afterEach(() => {
  host.remove()
})

describe('FamilyPage', () => {
  it.each(FAMILIES)(
    '$name: heading, upright-only tester, no compare, its own downloads',
    (family) => {
      const el = mount(<FamilyPage family={family} />)
      expect(el.querySelector('h1')?.textContent).toBe(family.name)
      expect(el.querySelector('[data-testid=tester]')?.getAttribute('data-italic')).toBe('false')
      expect(el.querySelector('[data-testid=waterfall]')?.getAttribute('data-compare')).toBe(
        'false',
      )
      const hrefs = [...el.querySelectorAll<HTMLAnchorElement>('.cs-downloads a')].map((a) =>
        a.getAttribute('href'),
      )
      expect(hrefs).toHaveLength(family.files.length)
      for (const href of hrefs) expect(href).toContain(`/fonts/cascivo-${family.id}/`)
      expect(el.querySelector('main')?.getAttribute('style')).toContain(family.name)
    },
  )
})

describe('FontsPage', () => {
  it('lists all four families, each linking to its page', () => {
    const el = mount(<FontsPage />)
    const links = [...el.querySelectorAll<HTMLAnchorElement>('.cs-family-card a')].map((a) =>
      a.getAttribute('href'),
    )
    expect(links).toEqual([
      '/cascivo-sans',
      '/cascivo-mono',
      '/cascivo-serif',
      '/cascivo-condensed',
    ])
    expect(HUB_CARDS.map((c) => c.name)).toEqual([
      'Cascivo Sans',
      'Cascivo Mono',
      'Cascivo Serif',
      'Cascivo Condensed',
    ])
    const samples = [...el.querySelectorAll<HTMLElement>('.cs-family-sample')]
    expect(samples).toHaveLength(4)
    expect(samples[1]?.style.fontFamily).toContain('Cascivo Mono')
  })
})
