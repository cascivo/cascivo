import registry from '../../../../registry.json'
import { SearchIndex, type SearchItem } from '@cascivo/search'

interface RegEntry {
  name: string
  category: string
  description?: string
  meta: { name: string; description?: string }
}

const componentItems: SearchItem[] = (registry as { components: RegEntry[] }).components.map(
  (e) => {
    const description = e.meta.description ?? e.description
    return {
      id: `component-${e.meta.name.toLowerCase()}`,
      title: e.meta.name,
      section: e.category,
      ...(description ? { description } : {}),
      href: `https://docs.cascivo.com/components/${e.meta.name.toLowerCase()}`,
      type: 'component' as const,
      category: e.category,
    }
  },
)

const PAGE_SECTIONS: SearchItem[] = [
  { id: 'page-home', title: 'Home', section: 'Landing', href: '/', type: 'page' },
  {
    id: 'page-a11y',
    title: 'Accessibility',
    section: 'Landing',
    href: '/accessibility',
    type: 'page',
  },
  { id: 'page-perf', title: 'Performance', section: 'Landing', href: '/performance', type: 'page' },
  { id: 'page-guides', title: 'Guides', section: 'Landing', href: '/guides', type: 'page' },
  { id: 'page-examples', title: 'Examples', section: 'Landing', href: '/examples', type: 'page' },
  {
    id: 'page-quickstart',
    title: 'Quick Start',
    section: 'Home',
    href: '/#quick-start',
    type: 'page',
    description: 'Get up and running in three steps',
  },
  {
    id: 'page-theming',
    title: 'Theming',
    section: 'Home',
    href: '/#theme-demo',
    type: 'page',
    description: 'Switch between light, dark, and warm themes',
  },
  {
    id: 'page-charts',
    title: 'Charts',
    section: 'Home',
    href: '/#charts',
    type: 'page',
    description: 'Data visualisation built with cascivo',
  },
  {
    id: 'page-tech',
    title: 'Modern CSS deep dive',
    section: 'Home',
    href: '/#tech-deep-dive',
    type: 'page',
    description: '@layer, @container, :has() explained',
  },
]

export const landingIndex = new SearchIndex([...componentItems, ...PAGE_SECTIONS])
