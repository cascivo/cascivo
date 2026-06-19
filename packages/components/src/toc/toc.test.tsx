import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Toc } from './toc'

const items = [
  { id: 'intro', label: 'Introduction' },
  { id: 'usage', label: 'Usage' },
  { id: 'api', label: 'API', level: 3 },
]

let ioCallback: IntersectionObserverCallback | null = null
const observed: Element[] = []

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb
  }
  observe(el: Element): void {
    observed.push(el)
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

beforeEach(() => {
  ioCallback = null
  observed.length = 0
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Toc', () => {
  it('renders a nav landmark labeled from the i18n default', () => {
    render(<Toc items={items} />)
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument()
  })

  it('allows overriding the nav label', () => {
    render(<Toc items={items} labels={{ nav: 'Auf dieser Seite' }} />)
    expect(screen.getByRole('navigation', { name: 'Auf dieser Seite' })).toBeInTheDocument()
  })

  it('renders one anchor link per item with the right href', () => {
    render(<Toc items={items} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#intro')
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute('href', '#api')
  })

  it('indents entries by heading level via --toc-level', () => {
    render(<Toc items={items} />)
    const apiLi = screen.getByRole('link', { name: 'API' }).closest('li') as HTMLElement
    expect(apiLi.style.getPropertyValue('--toc-level')).toBe('3')
    const introLi = screen.getByRole('link', { name: 'Introduction' }).closest('li') as HTMLElement
    expect(introLi.style.getPropertyValue('--toc-level')).toBe('2')
  })

  it('marks the controlled active item with aria-current="location"', () => {
    const { rerender } = render(<Toc items={items} activeId="usage" />)
    expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('link', { name: 'Introduction' })).not.toHaveAttribute('aria-current')

    rerender(<Toc items={items} activeId="api" />)
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('link', { name: 'Usage' })).not.toHaveAttribute('aria-current')
  })

  it('defaults the active item to the first when uncontrolled', () => {
    render(<Toc items={items} />)
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  it('scroll-spy: updates the active item from the topmost visible heading', () => {
    const onActiveChange = vi.fn()
    render(
      <>
        <h2 id="intro">Introduction</h2>
        <h2 id="usage">Usage</h2>
        <h3 id="api">API</h3>
        <Toc items={items} onActiveChange={onActiveChange} />
      </>,
    )
    expect(ioCallback).not.toBeNull()

    act(() => {
      ioCallback?.(
        [
          {
            target: document.getElementById('usage')!,
            isIntersecting: true,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('aria-current', 'location')
    expect(onActiveChange).toHaveBeenCalledWith('usage')
  })

  it('does not run scroll-spy when controlled', () => {
    render(<Toc items={items} activeId="api" />)
    // No observer is created in controlled mode.
    expect(ioCallback).toBeNull()
  })

  it('merges custom className onto the nav', () => {
    render(<Toc items={items} className="custom" />)
    expect(screen.getByRole('navigation')).toHaveClass('custom')
  })

  it('uses no forbidden React hooks (signals only)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/toc/toc.tsx'), 'utf8')
    expect(src).not.toMatch(
      /\buseState\b|\buseEffect\b|\buseContext\b|\buseReducer\b|\buseLayoutEffect\b/,
    )
  })
})
