import { describe, expect, it } from 'vitest'
import { SearchIndex, searchScopes, toGroups, type SearchItem } from './index'

function item(partial: Partial<SearchItem> & { id: string; title: string }): SearchItem {
  return { href: '#', type: 'component', ...partial }
}

describe('SearchIndex scoring', () => {
  it('ranks an exact title above a description match', () => {
    const idx = new SearchIndex([
      item({ id: 'a', title: 'Stack', description: 'layout' }),
      item({ id: 'b', title: 'Card', description: 'a stack of things' }),
    ])
    const [first] = idx.search('stack')
    expect(first?.id).toBe('a')
  })

  it('matches on keywords (prop names / variants)', () => {
    const idx = new SearchIndex([
      item({ id: 'btn', title: 'Button', keywords: 'variant size loading disabled' }),
      item({ id: 'card', title: 'Card', keywords: 'padding' }),
    ])
    const hits = idx.search('loading')
    expect(hits.map((h) => h.id)).toContain('btn')
    expect(hits.map((h) => h.id)).not.toContain('card')
  })

  it('resolves naming aliases via keywords (flex → Stack)', () => {
    const idx = new SearchIndex([
      item({ id: 'stack', title: 'Stack', keywords: 'flex hstack vstack row column' }),
    ])
    expect(idx.search('flex')[0]?.id).toBe('stack')
    expect(idx.search('hstack')[0]?.id).toBe('stack')
  })

  it('title/description still outrank keyword matches', () => {
    const idx = new SearchIndex([
      item({ id: 'kw', title: 'Other', keywords: 'grid' }),
      item({ id: 'title', title: 'Grid' }),
    ])
    expect(idx.search('grid')[0]?.id).toBe('title')
  })
})

describe('toGroups', () => {
  const items: SearchItem[] = [
    { id: 'p1', title: 'Home', href: '/', type: 'page', section: 'Landing' },
    {
      id: 'c1',
      title: 'Button',
      href: '/docs/components/button',
      type: 'component',
      category: 'inputs',
      description: 'A clickable button',
    },
    {
      id: 'c2',
      title: 'Card',
      href: '/docs/components/card',
      type: 'component',
      category: 'display',
    },
  ]

  it('puts pages first (scope "pages"), then components by category (scope "components")', () => {
    const groups = toGroups(
      items,
      () => {},
      () => {},
    )
    expect(groups[0]).toMatchObject({ heading: 'Pages', scope: 'pages' })
    expect(groups.slice(1).map((g) => g.scope)).toEqual(['components', 'components'])
    expect(groups.slice(1).map((g) => g.heading)).toEqual(['inputs', 'display'])
  })

  it('carries the description through as a metadata line', () => {
    const groups = toGroups(
      items,
      () => {},
      () => {},
    )
    const button = groups.find((g) => g.heading === 'inputs')?.items[0]
    expect(button?.description).toBe('A clickable button')
  })

  it('primary action opens; secondary opens in a new tab', () => {
    const opened: string[] = []
    const tabbed: string[] = []
    const groups = toGroups(
      items,
      (h) => opened.push(h),
      (h) => tabbed.push(h),
    )
    const home = groups[0]?.items[0]
    home?.actions?.[0]?.onSelect()
    home?.actions?.[1]?.onSelect()
    expect(opened).toEqual(['/'])
    expect(tabbed).toEqual(['/'])
  })

  it('exposes component and page scopes', () => {
    expect(searchScopes.map((s) => s.id)).toEqual(['components', 'pages'])
  })
})
