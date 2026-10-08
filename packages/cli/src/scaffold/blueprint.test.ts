import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildScaffold, create } from '../commands/create.js'
import { blueprintOptions, parseBlueprint } from './blueprint.js'
import { blockNames } from './recipes.js'

const page = (title: string, block?: string) => ({ title, ...(block ? { block } : {}) })

describe('parseBlueprint', () => {
  it('reads a blueprint into scaffold options, with defaults', () => {
    const blueprint = parseBlueprint(
      { name: 'acme', pages: [page('Overview', 'dashboard-overview'), page('Notes')] },
      'cascivo.app.json',
    )
    expect(blueprintOptions(blueprint)).toEqual({
      name: 'acme',
      framework: 'react-vite',
      theme: 'light',
      sections: ['Overview', 'Notes'],
      blocks: ['dashboard-overview', undefined],
    })
  })

  it.each([
    [
      'an unknown field, naming it',
      { name: 'a', pages: [page('A')], page: [] },
      /unknown field "page"/,
    ],
    ['no pages', { name: 'a', pages: [] }, /"pages"/],
    ['a page without a title', { name: 'a', pages: [{ block: 'faq' }] }, /pages\[0\]/],
    [
      'an unknown block, listing the real ones',
      { name: 'a', pages: [page('A', 'charts')] },
      /Blocks: .*dashboard-overview/,
    ],
    ['a name that leaves the directory', { name: '../outside', pages: [page('A')] }, /"name"/],
    ['a name that is a path', { name: 'a/b', pages: [page('A')] }, /"name"/],
    [
      'an unknown theme',
      { name: 'a', theme: 'neon', pages: [page('A')] },
      /"theme" must be one of/,
    ],
    [
      'a runtime that is not a string',
      { name: 'a', runtime: ['react'], pages: [page('A')] },
      /"runtime"/,
    ],
    [
      'an unknown example',
      { name: 'a', framework: 'cloudflare', examples: ['crud', 'shop'], pages: [page('A')] },
      /"examples"/,
    ],
    [
      'blocks on astro',
      { name: 'a', framework: 'astro', pages: [page('A', 'faq')] },
      /react-vite or cloudflare/,
    ],
  ])('rejects %s', (_label, raw, message) => {
    expect(() => parseBlueprint(raw, 'cascivo.app.json')).toThrow(message)
  })
})

describe('blueprint pages render blocks', () => {
  const files = (
    framework: 'react-vite' | 'cloudflare',
    pages: { title: string; block?: string }[],
  ) =>
    new Map(
      buildScaffold({
        ...blueprintOptions(parseBlueprint({ name: 'acme', framework, pages }, 'test')),
      }).map((f) => [f.path, f.contents]),
    )

  it('writes each block once and a page that renders it (react-vite)', () => {
    const map = files('react-vite', [
      page('Overview', 'dashboard-overview'),
      page('KPIs', 'dashboard-overview'),
      page('Team', 'users-table-page'),
    ])
    expect(map.get('src/sections/Overview.tsx')).toContain(
      "import { DashboardOverview } from '../blocks/dashboard-overview'",
    )
    expect(map.get('src/sections/Overview.tsx')).toContain('return <DashboardOverview />')
    expect([...map.keys()].filter((p) => p.startsWith('src/blocks/')).sort()).toEqual([
      'src/blocks/dashboard-overview.module.css',
      'src/blocks/dashboard-overview.tsx',
      'src/blocks/users-table-page.tsx',
    ])
  })

  it('routes and links each page (cloudflare)', () => {
    const map = files('cloudflare', [
      page('Overview', 'dashboard-overview'),
      page('Team', 'users-table-page'),
    ])
    expect(map.get('src/routes/index.tsx')).toContain('export default function Overview()')
    expect(map.get('src/routes/team.tsx')).toContain('return <UsersTablePage />')
    expect(map.get('src/App.tsx')).toContain("label: 'Team'")
    expect(map.get('src/routes.gen.ts')).toContain("'/team'")
  })

  it('breaks a long section union the way Prettier prints it', () => {
    const pages = Array.from({ length: 15 }, (_, i) => page(`Page ${i + 1}`))
    const app = files('react-vite', pages).get('src/App.tsx')!
    expect(app).toContain("type Section =\n  | 'page-1'\n  | 'page-2'")
    expect(app.split('\n').every((line) => line.length <= 100)).toBe(true)
  })

  it('aliases a block whose name is the page component', () => {
    const map = files('react-vite', [page('Pricing', 'pricing')])
    expect(map.get('src/sections/Pricing.tsx')).toContain(
      "import { Pricing as PricingBlock } from '../blocks/pricing'",
    )
  })

  it('every block imports only what the scaffolded app depends on', () => {
    for (const framework of ['react-vite', 'cloudflare'] as const) {
      for (const block of blockNames()) {
        const map = files(framework, [page('A', block)])
        const source = map.get(`src/blocks/${block}.tsx`)!
        const pkg: unknown = JSON.parse(map.get('package.json')!)
        const declared = Object.keys(
          (pkg as { dependencies: Record<string, string>; devDependencies: Record<string, string> })
            .dependencies,
        )
        for (const [, specifier] of source.matchAll(/from '([^']+)'/g)) {
          // `import type … from 'react'` is satisfied by @types/react.
          if (specifier === `./${block}.module.css` || specifier === 'react') continue
          expect(declared, `${framework} ${block} imports ${specifier}`).toContain(specifier)
        }
      }
    }
  })

  it('adds the package a block brings, at the pinned version, only when used', () => {
    const deps = (pages: { title: string; block?: string }[]): Record<string, string> => {
      const pkg: unknown = JSON.parse(files('react-vite', pages).get('package.json')!)
      return (pkg as { dependencies: Record<string, string> }).dependencies
    }
    expect(deps([page('Charts', 'dashboard-charts')])['@cascivo/charts']).toMatch(/^\d+\.\d+\.\d+/)
    expect(deps([page('Overview', 'dashboard-overview')])['@cascivo/charts']).toBeUndefined()
  })
})

describe('cascivo create --from', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
    process.exitCode = undefined
    vi.restoreAllMocks()
  })

  function workdir(blueprint: unknown): string {
    const cwd = mkdtempSync(join(tmpdir(), 'cascivo-blueprint-'))
    dirs.push(cwd)
    writeFileSync(join(cwd, 'cascivo.app.json'), JSON.stringify(blueprint))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    return cwd
  }

  it('compiles the blueprint and keeps it in the app', async () => {
    const blueprint = {
      name: 'acme',
      framework: 'cloudflare',
      theme: 'dark',
      pages: [page('Overview', 'stats-cards')],
    }
    const cwd = workdir(blueprint)
    await create(['--from', 'cascivo.app.json'], cwd)
    expect(process.exitCode).toBeUndefined()
    expect(readFileSync(join(cwd, 'acme/src/blocks/stats-cards.tsx'), 'utf8')).toContain(
      'StatsCards',
    )
    expect(JSON.parse(readFileSync(join(cwd, 'acme/cascivo.app.json'), 'utf8'))).toEqual(blueprint)
  })

  it('holds a blueprint to the same rules as the flags, and writes nothing', async () => {
    const cwd = workdir({ name: 'acme', examples: ['crud'], pages: [page('A')] })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await create(['--from', 'cascivo.app.json'], cwd)
    expect(process.exitCode).toBe(1)
    expect(error.mock.calls.join(' ')).toContain('--example needs --framework cloudflare')
    expect(readdirSync(cwd)).toEqual(['cascivo.app.json'])
  })
})
