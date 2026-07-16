import { describe, expect, it } from 'vitest'
import { type IconCatalogEntry, searchIcons } from './icons.js'

const icons: IconCatalogEntry[] = [
  {
    name: 'dashboard',
    pascalName: 'Dashboard',
    category: 'general',
    tags: ['feather'],
    keywords: ['dashboard', 'layout', 'layoutdashboard'],
    aliases: ['LayoutDashboard', 'layout-dashboard'],
    svg: '',
  },
  {
    name: 'spaceship',
    pascalName: 'Spaceship',
    category: 'app-ui',
    tags: ['ui'],
    keywords: ['spaceship', 'rocket', 'deploy', 'launch'],
    aliases: ['Rocket', 'deploy', 'ship'],
    svg: '',
  },
  {
    name: 'git-branch',
    pascalName: 'GitBranch',
    category: 'app-ui',
    tags: ['ui'],
    keywords: ['git', 'branch', 'vcs'],
    aliases: ['Branch'],
    svg: '',
  },
  {
    name: 'anchor',
    pascalName: 'Anchor',
    category: 'general',
    tags: ['feather'],
    keywords: ['anchor'],
    aliases: [],
    svg: '',
  },
]

describe('searchIcons', () => {
  it('resolves a Lucide name to the cascivo export via aliases', () => {
    expect(searchIcons(icons, 'LayoutDashboard')[0]?.pascalName).toBe('Dashboard')
  })

  it('resolves an intent word to the closest icon', () => {
    expect(searchIcons(icons, 'deploy')[0]?.pascalName).toBe('Spaceship')
    expect(searchIcons(icons, 'rocket')[0]?.pascalName).toBe('Spaceship')
  })

  it('finds version-control icons that used to be absent', () => {
    expect(searchIcons(icons, 'git branch').length).toBeGreaterThan(0)
    expect(searchIcons(icons, 'branch')[0]?.pascalName).toBe('GitBranch')
  })

  it('ranks an exact pascalName match first', () => {
    expect(searchIcons(icons, 'Anchor')[0]?.pascalName).toBe('Anchor')
  })

  it('returns nothing for an unrelated query', () => {
    expect(searchIcons(icons, 'zzzznope')).toEqual([])
  })

  it('returns all icons for an empty query', () => {
    expect(searchIcons(icons, '')).toHaveLength(icons.length)
  })
})
