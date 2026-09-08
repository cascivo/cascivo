import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { DataList, DataListItem } from './data-list'

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

describe('DataListItem (2026-08-31 report §22)', () => {
  it('renders a dt/dd pair inside DataList', () => {
    const { container } = render(
      <DataList>
        <DataListItem label="Domain">storefront.example.com</DataListItem>
        <DataListItem label="Region">fra1</DataListItem>
      </DataList>,
    )
    const terms = [...container.querySelectorAll('dt')].map((el) => el.textContent)
    const details = [...container.querySelectorAll('dd')].map((el) => el.textContent)
    expect(terms).toEqual(['Domain', 'Region'])
    expect(details).toEqual(['storefront.example.com', 'fra1'])
  })

  it('renders the same markup as the equivalent `items` array', () => {
    const fromItems = render(
      <DataList items={[{ id: 'domain', label: 'Domain', value: 'example.com' }]} />,
    ).container.innerHTML
    const fromChildren = render(
      <DataList>
        <DataListItem label="Domain">example.com</DataListItem>
      </DataList>,
    ).container.innerHTML
    expect(fromChildren).toBe(fromItems)
  })

  it('accepts items and children together', () => {
    const { container } = render(
      <DataList items={[{ id: 'a', label: 'A', value: '1' }]}>
        <DataListItem label="B">2</DataListItem>
      </DataList>,
    )
    expect(container.querySelectorAll('dt')).toHaveLength(2)
  })
})
