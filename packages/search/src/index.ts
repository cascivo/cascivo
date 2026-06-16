export interface SearchItem {
  id: string
  title: string
  section?: string
  description?: string
  href: string
  type: 'component' | 'page'
  category?: string
}

export class SearchIndex {
  private items: SearchItem[]

  constructor(items: SearchItem[]) {
    this.items = items
  }

  search(query: string, limit = 8): SearchItem[] {
    const q = query.toLowerCase().trim()
    if (q.length < 2) return []

    const score = (item: SearchItem): number => {
      const title = item.title.toLowerCase()
      const desc = item.description?.toLowerCase() ?? ''
      const section = item.section?.toLowerCase() ?? ''
      const category = item.category?.toLowerCase() ?? ''

      if (title === q) return 100
      if (title.startsWith(q)) return 80
      if (title.includes(q)) return 60
      if (desc.includes(q)) return 40
      if (section.includes(q) || category.includes(q)) return 20
      return 0
    }

    return this.items
      .map((item) => ({ item, score: score(item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item)
  }
}
