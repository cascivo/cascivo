import registry from '../../../../../registry.json'
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
      // e.name is the kebab-case registry slug (e.g. "shell-header"); meta.name
      // is the PascalCase display name. Docs URLs use the kebab slug.
      id: `component-${e.name}`,
      title: e.meta.name,
      section: e.category,
      ...(description ? { description } : {}),
      href: `https://docs.cascivo.com/components/${e.name}`,
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
    id: 'page-ai',
    title: 'AI layer',
    section: 'Landing',
    href: '/ai',
    type: 'page',
    description: 'Manifests, MCP server, skills, and llms.txt — the AI-first layer',
  },
  {
    id: 'page-quickstart',
    title: 'Quick Start',
    section: 'Home',
    href: '/#quickstart',
    type: 'page',
    description: 'Get up and running in three steps',
  },
  {
    id: 'page-theming',
    title: 'Theming',
    section: 'Home',
    href: '/#advantages',
    type: 'page',
    description: 'Ten token-driven themes — swap data-theme to restyle everything',
  },
  {
    id: 'page-charts',
    title: 'Charts',
    section: 'Landing',
    href: '/examples#charts',
    type: 'page',
    description: 'Data visualisation built with cascivo',
  },
  {
    id: 'page-tech',
    title: 'Modern CSS',
    section: 'Landing',
    href: '/modern-css',
    type: 'page',
    description: '@layer, @container, :has() explained',
  },
]

export const landingIndex = new SearchIndex([...componentItems, ...PAGE_SECTIONS])
