import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { DataList } from './data-list'

afterEach(cleanup)

const items = [
  { label: 'Name', value: 'Ada' },
  { label: 'Role', value: 'Mathematician' },
]

describe('DataList', () => {
  it('renders native dl/dt/dd semantics', () => {
    const { container } = render(<DataList items={items} />)
    const dl = container.querySelector('dl')
    expect(dl).not.toBeNull()
    expect(container.querySelectorAll('dt')).toHaveLength(2)
    expect(container.querySelectorAll('dd')).toHaveLength(2)
  })

  it('pairs labels with values', () => {
    const { container } = render(<DataList items={items} />)
    const terms = Array.from(container.querySelectorAll('dt')).map((t) => t.textContent)
    const details = Array.from(container.querySelectorAll('dd')).map((d) => d.textContent)
    expect(terms).toEqual(['Name', 'Role'])
    expect(details).toEqual(['Ada', 'Mathematician'])
  })

  it('defaults orientation to horizontal and size to md', () => {
    const { container } = render(<DataList items={items} />)
    const dl = container.querySelector('dl')!
    expect(dl.getAttribute('data-orientation')).toBe('horizontal')
    expect(dl.getAttribute('data-size')).toBe('md')
  })

  it('reflects vertical orientation via data attribute', () => {
    const { container } = render(<DataList items={items} orientation="vertical" />)
    expect(container.querySelector('dl')!.getAttribute('data-orientation')).toBe('vertical')
  })

  it('sets data-dividers only when dividers is true', () => {
    const { container: a } = render(<DataList items={items} />)
    expect(a.querySelector('dl')!.hasAttribute('data-dividers')).toBe(false)
    const { container: b } = render(<DataList items={items} dividers />)
    expect(b.querySelector('dl')!.hasAttribute('data-dividers')).toBe(true)
  })

  it('reflects size via data attribute', () => {
    const { container } = render(<DataList items={items} size="sm" />)
    expect(container.querySelector('dl')!.getAttribute('data-size')).toBe('sm')
  })

  it('merges className and forwards attributes', () => {
    const { container } = render(<DataList items={items} className="custom" aria-label="Details" />)
    const dl = container.querySelector('dl')!
    expect(dl.classList.contains('custom')).toBe(true)
    expect(dl.getAttribute('aria-label')).toBe('Details')
  })
})
