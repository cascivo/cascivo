import { describe, expect, it } from 'vitest'
import { SearchIndex, type SearchItem } from './index'

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
