import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildScaffold,
  parseAuth,
  create,
  type Example,
  type ScaffoldFile,
  type ScaffoldOptions,
} from './create.js'

function fileMap(files: ScaffoldFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.path, f.contents]))
}

describe('buildScaffold', () => {
  const files = buildScaffold({
    name: 'My App',
    theme: 'dark',
    sections: ['Dashboard', 'Reports', 'Settings'],
  })
  const map = fileMap(files)

  it('emits the core project files', () => {
    for (const path of [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'eslint.config.js',
      '.gitignore',
      'README.md',
      'AGENTS.md',
      'src/main.tsx',
      'src/vite-env.d.ts',
      'src/App.tsx',
    ]) {
      expect(map.has(path)).toBe(true)
    }
  })

  it('writes one section component per nav item', () => {
    expect(map.has('src/sections/Dashboard.tsx')).toBe(true)
    expect(map.has('src/sections/Reports.tsx')).toBe(true)
    expect(map.has('src/sections/Settings.tsx')).toBe(true)
  })

  it('normalizes the package name', () => {
    const pkg = JSON.parse(map.get('package.json')!) as { name: string }
    expect(pkg.name).toBe('my-app')
  })

  it('depends on the cascivo runtime packages the prebuilt path needs — and no others', () => {
    const pkg = JSON.parse(map.get('package.json')!) as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies['@cascivo/react']).toBeDefined()
    expect(pkg.dependencies['@cascivo/themes']).toBeDefined()
    expect(pkg.dependencies['react']).toBeDefined()
    // The generated App.tsx calls `useSignals()`; the peer used to be omitted entirely and
    // resolved only by hoisting.
    expect(pkg.dependencies['@preact/signals-react']).toBeDefined()
    // AI-RULES.md / GETTING-STARTED.md both forbid declaring these on the prebuilt path.
    expect(pkg.dependencies['@cascivo/core']).toBeUndefined()
    expect(pkg.dependencies['@cascivo/tokens']).toBeUndefined()
  })

  it('writes no cascivo.config on the prebuilt path', () => {
    // Its presence is what made `doctor` classify the scaffold as a copy-paste project.
    expect([...map.keys()].some((p) => p.startsWith('cascivo.config.'))).toBe(false)
  })

  it('wires the chosen theme into html and the entry CSS', () => {
    expect(map.get('index.html')).toContain('data-theme="dark"')
    // The theme import lives with the shell, which owns the app chrome and survives a
    // migration to a router (App.tsx does not).
    expect(map.get('src/Shell.tsx')).toContain("import '@cascivo/themes/dark.css'")
  })

  it('declares the canonical layer order with a vendor slot for third-party CSS', () => {
    const html = map.get('index.html')!
    const declared = /@layer ([^;]+);/
      .exec(html)?.[1]
      ?.split(',')
      .map((s) => s.trim())
    expect(declared).toEqual([
      'vendor',
      'cascivo.reset',
      'cascivo.base',
      'cascivo.tokens',
      'cascivo.component',
      'cascivo.platform',
      'cascivo.theme',
      'cascivo.blocks',
      // The app's own slot. AGENTS.md tells the agent to write here; it used to be named
      // there but never declared, so that CSS landed in an undeclared layer that beats
      // every cascivo layer.
      'cascivo.example',
      'cascivo.override',
    ])
    expect(html).toContain('layer(vendor)')
  })

  it('scaffolds an AGENTS.md with the CSS layer contract', () => {
    const agents = map.get('AGENTS.md')!
    expect(agents).toContain('CSS layer contract')
    expect(agents).toContain('cascivo.override')
    expect(agents).toContain('layer(vendor)')
    expect(agents).toContain('https://cascivo.com/llms.txt')
  })

  it('builds a typed section union and signal-driven switching', () => {
    const app = map.get('src/App.tsx')!
    expect(app).toContain("type Section = 'dashboard' | 'reports' | 'settings'")
    expect(app).toContain("const section = signal<Section>('dashboard')")
    // Reads a signal during render in a React app → must subscribe explicitly.
    expect(app).toContain('useSignals()')
    expect(app).toContain('<Shell navItems={navItems}>')
  })

  it('puts the shell composition in its own component with a children slot', () => {
    // The shell is the valuable part of the scaffold and it used to be welded to the
    // signal-driven section switcher, so a router prompt meant deleting most of what
    // `create` generated and re-deriving this by hand (2026-08-14 §1). Keeping it separate
    // means adding a router is: delete App.tsx + sections/, render <Shell> from the route
    // layout.
    const shell = map.get('src/Shell.tsx')!
    expect(shell).toContain('AppShell')
    expect(shell).toContain('SideNav')
    expect(shell).toContain('ShellHeader')
    expect(shell).toContain('children')
    expect(shell).toContain('navItems: SideNavItem[]')
    // Router-agnostic: the shell must not reach for the section signal.
    expect(shell).not.toContain('section.value')
    // and it must point at the router recipe, since that is the migration it exists for.
    expect(shell).toContain('using-with-a-router')
  })

  it('escapes the brand name into ShellHeader', () => {
    const shell = map.get('src/Shell.tsx')!
    expect(shell).toContain("brand={{ name: 'My App' }}")
  })

  it('derives unique keys and component names for duplicate labels', () => {
    const dup = fileMap(
      buildScaffold({ name: 'x', theme: 'light', sections: ['Reports', 'Reports'] }),
    )
    expect(dup.has('src/sections/Reports.tsx')).toBe(true)
    expect(dup.has('src/sections/Reports2.tsx')).toBe(true)
    const app = dup.get('src/App.tsx')!
    expect(app).toContain("'reports'")
    expect(app).toContain("'reports-2'")
  })

  it('falls back to a Home section when none are given', () => {
    const empty = fileMap(buildScaffold({ name: 'x', theme: 'light', sections: [] }))
    expect(empty.has('src/sections/Home.tsx')).toBe(true)
  })

  it('handles section labels that start with a digit', () => {
    const numeric = fileMap(buildScaffold({ name: 'x', theme: 'light', sections: ['2024 Review'] }))
    expect(numeric.has('src/sections/Section2024Review.tsx')).toBe(true)
  })
})

describe('buildScaffold — the AppShell tag as Prettier lays it out', () => {
  const shell = (name: string, framework?: 'astro' | 'cloudflare') =>
    buildScaffold({
      name,
      theme: 'light',
      sections: ['Dashboard'],
      ...(framework ? { framework } : {}),
    }).find((f) => f.contents.includes('<AppShell'))!.contents

  it('keeps it on one line when a short name fits in 100 columns', () => {
    // A fresh `cascivo create app` failed its own format:check: the tag was always split.
    for (const framework of [undefined, 'astro', 'cloudflare'] as const) {
      const line = shell('app', framework)
        .split('\n')
        .find((l) => l.includes('<AppShell'))!
      expect(line).toMatch(/^ {4}<AppShell header=\{.*\} nav=\{.*\}>$/)
      expect(line.length).toBeLessThanOrEqual(100)
    }
  })

  it('splits it over its attributes when the name makes it too long', () => {
    expect(shell('northwind-traders-internal-ops')).toContain('    <AppShell\n      header=')
  })
})

describe('buildScaffold — astro', () => {
  const files = buildScaffold({
    name: 'My App',
    framework: 'astro',
    theme: 'dark',
    sections: ['Dashboard', 'Reports', 'Settings'],
  })
  const map = fileMap(files)

  it('emits an Astro project, not a Vite SPA', () => {
    for (const path of [
      'package.json',
      'tsconfig.json',
      'astro.config.mjs',
      'src/layouts/Layout.astro',
      'src/components/Shell.tsx',
      'src/styles/layers.css',
    ]) {
      expect(map.has(path)).toBe(true)
    }
    // The Vite SPA entry points must not leak into the Astro shape.
    expect(map.has('vite.config.ts')).toBe(false)
    expect(map.has('index.html')).toBe(false)
    expect(map.has('src/main.tsx')).toBe(false)
    expect(map.has('src/App.tsx')).toBe(false)
  })

  it('routes the first section at / and the rest by name', () => {
    expect(map.has('src/pages/index.astro')).toBe(true)
    expect(map.has('src/pages/reports.astro')).toBe(true)
    expect(map.has('src/pages/settings.astro')).toBe(true)
    expect(map.get('src/pages/index.astro')).toContain('activePath="/"')
    expect(map.get('src/pages/reports.astro')).toContain('activePath="/reports"')
  })

  /**
   * The single line that decides whether the app renders styled at all.
   *
   * Vite externalizes node_modules packages in its server build, so without this the
   * package's module graph is never walked and Astro — which collects a page's CSS from
   * that graph — emits none. It must be `resolve.noExternal`: Astro prerenders in its own
   * Vite environment, which `ssr.*` does not reach.
   */
  it('sets resolve.noExternal in the Astro config', () => {
    const config = map.get('astro.config.mjs')!
    expect(config).toContain('noExternal')
    expect(config).toContain('resolve')
    expect(config).not.toMatch(/ssr:\s*\{[^}]*noExternal/)
  })

  it('hydrates only the shell, leaving page content server-rendered', () => {
    const page = map.get('src/pages/index.astro')!
    expect(page).toContain('<Shell client:load')
    // The section is rendered with no client directive — static HTML, zero JS.
    expect(page).toMatch(/<Dashboard \/>/)
    expect(map.get('src/components/Dashboard.tsx')).not.toContain('client:')
  })

  it('imports the layer order before the theme, so vendor cannot outrank cascivo', () => {
    const layout = map.get('src/layouts/Layout.astro')!
    const layers = layout.indexOf('styles/layers.css')
    const theme = layout.indexOf('@cascivo/themes/')
    expect(layers).toBeGreaterThan(-1)
    expect(theme).toBeGreaterThan(-1)
    expect(layers).toBeLessThan(theme)
    expect(map.get('src/styles/layers.css')).toContain('@layer vendor, cascivo.reset')
  })

  it('nav items carry href, so Astro routing needs no client router', () => {
    const shell = map.get('src/components/Shell.tsx')!
    expect(shell).toContain("href: '/'")
    expect(shell).toContain("href: '/reports'")
    // No router registration call — Astro's file routing handles the hrefs.
    expect(shell).not.toContain('setLinkComponent(')
  })

  it('depends on astro and the prebuilt cascivo packages — and no others', () => {
    const pkg = JSON.parse(map.get('package.json')!) as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies['astro']).toBeDefined()
    expect(pkg.dependencies['@astrojs/react']).toBeDefined()
    expect(pkg.dependencies['@cascivo/react']).toBeDefined()
    expect(pkg.dependencies['@cascivo/themes']).toBeDefined()
    // Same prebuilt-path rule as the Vite scaffold: these are transitive, never declared.
    expect(pkg.dependencies['@cascivo/core']).toBeUndefined()
    expect(pkg.dependencies['@cascivo/tokens']).toBeUndefined()
  })

  it('defaults to the vite scaffold when no framework is given', () => {
    const dflt = fileMap(buildScaffold({ name: 'x', theme: 'light', sections: ['Home'] }))
    expect(dflt.has('vite.config.ts')).toBe(true)
    expect(dflt.has('astro.config.mjs')).toBe(false)
  })
})

describe('buildScaffold — cloudflare', () => {
  const build = (runtime?: 'preact' | 'react') =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'dark',
        sections: ['Dashboard', 'Reports'],
        pm: 'pnpm',
        ...(runtime ? { runtime } : {}),
      }),
    )
  const map = build()
  const pkg = JSON.parse(map.get('package.json')!) as {
    scripts: Record<string, string>
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }

  it('emits a client app plus a Worker, deployed as one', () => {
    for (const path of [
      'wrangler.jsonc',
      'worker/index.ts',
      'src/api.ts',
      'src/router.ts',
      'src/routes.gen.ts',
      'src/live.ts',
      'src/LiveCard.tsx',
      'src/App.tsx',
      'src/Shell.tsx',
      'index.html',
    ]) {
      expect(map.has(path)).toBe(true)
    }
    expect(map.get('vite.config.ts')).toContain('cloudflare()')
    expect(map.has('src/sections/Dashboard.tsx')).toBe(false)
  })

  it('routes only /api/* to the Worker and falls back to the SPA', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"main": "./worker/index.ts"')
    expect(wrangler).toContain('"not_found_handling": "single-page-application"')
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]')
  })

  it('turns sections into file routes, first at /, plus a 404', () => {
    expect(map.has('src/routes/index.tsx')).toBe(true)
    expect(map.has('src/routes/reports.tsx')).toBe(true)
    expect(map.has('src/routes/404.tsx')).toBe(true)
    expect(map.get('src/routes/reports.tsx')).toContain('export default function Reports()')
    expect(map.get('src/routes/reports.tsx')).toContain('src/routes/reports.tsx')
    expect(map.get('vite.config.ts')).toContain('cascivoRoutes()')
  })

  it('writes routes.gen.ts up front, so tsc passes before the first vite run', () => {
    const gen = map.get('src/routes.gen.ts')!
    expect(gen).toContain("lazyRoute('/reports', () => import('./routes/reports'))")
    expect(gen).toContain("lazyRoute('/', () => import('./routes/index'))")
    expect(gen).toContain(
      "export const notFound: Route | undefined = lazyRoute('*', () => import('./routes/404'))",
    )
    expect(map.get('.prettierignore')).toContain('src/routes.gen.ts')
  })

  it('navigates with real hrefs through the router Link', () => {
    const app = map.get('src/App.tsx')!
    expect(app).toContain("href: '/reports'")
    expect(app).toContain('<RouterView router={router}')
    expect(map.get('src/main.tsx')).toContain('setLinkComponent(router.Link)')
    // The Vite scaffold's "adding a router" advice would be wrong here.
    expect(map.get('src/Shell.tsx')).not.toContain('Adding a router')
  })

  it('shares one typed API contract between the Worker and the client', () => {
    expect(map.get('src/api.ts')).toContain('defineApi(')
    expect(map.get('worker/index.ts')).toContain('createHandler<typeof api, Env>(api')
    expect(map.get('src/live.ts')).toContain('createClient(api)')
    expect(JSON.parse(map.get('tsconfig.json')!).include).toEqual(['src', 'worker'])
  })

  it('parses what crosses the network rather than casting it', () => {
    expect(map.get('src/api.ts')).toContain('event: parseTick')
    expect(map.get('src/api.ts')).not.toMatch(/JSON\.parse\([^)]*\) as /)
  })

  it('renders the live demo on the first page only', () => {
    expect(map.get('src/routes/index.tsx')).toContain('<LiveCard />')
    expect(map.get('src/routes/reports.tsx')).not.toContain('LiveCard')
  })

  it('declares the package it imports, and not the transitive core/tokens/data', () => {
    expect(pkg.dependencies['@cascivo/app']).toBeDefined()
    expect(pkg.dependencies['@cascivo/core']).toBeUndefined()
    expect(pkg.dependencies['@cascivo/tokens']).toBeUndefined()
    expect(pkg.dependencies['@cascivo/data']).toBeUndefined()
  })

  it('defaults to Preact, with React types and React as a dev-only peer', () => {
    expect(map.get('vite.config.ts')).toContain("from '@preact/preset-vite'")
    expect(pkg.dependencies['preact']).toBeDefined()
    expect(pkg.dependencies['react']).toBeUndefined()
    expect(pkg.devDependencies['react']).toBeDefined()
    expect(pkg.devDependencies['@types/react']).toBeDefined()
  })

  it('switches to React with --runtime react, without changing the source', () => {
    const react = build('react')
    expect(react.get('vite.config.ts')).toContain("from '@vitejs/plugin-react'")
    const reactPkg = JSON.parse(react.get('package.json')!) as {
      dependencies: Record<string, string>
    }
    expect(reactPkg.dependencies['react']).toBeDefined()
    expect(reactPkg.dependencies['preact']).toBeUndefined()
    for (const path of ['src/App.tsx', 'src/live.ts', 'src/api.ts', 'worker/index.ts']) {
      expect(react.get(path)).toBe(map.get(path))
    }
  })

  // `pnpm deploy` is pnpm's built-in workspace deploy — it never reaches the script.
  it('tells the user to run the deploy script through `run`', () => {
    expect(map.get('README.md')).toContain('pnpm run deploy')
    expect(map.get('README.md')).not.toMatch(/^pnpm deploy$/m)
    expect(pkg.scripts['deploy']).toBe('pnpm build && wrangler deploy')
  })

  it('can share a no-account preview through a temporary Cloudflare account', () => {
    expect(pkg.scripts['deploy:preview']).toBe('pnpm build && wrangler deploy --temporary')
    const readme = map.get('README.md')!
    expect(readme).toContain('pnpm run deploy:preview')
    expect(readme).toContain('claim URL')
    expect(readme).toContain('60 minutes')
    expect(readme).toContain('not\nsupport Workers AI')
    // An agent working in the app is told to hand both URLs back, and that it is public.
    expect(map.get('AGENTS.md')).toContain('Give the user both URLs')
  })

  it('ignores wrangler state and local secrets', () => {
    expect(map.get('.gitignore')).toContain('.wrangler')
    expect(map.get('.gitignore')).toContain('.dev.vars')
  })
})

describe('buildScaffold — sharing a static build', () => {
  for (const framework of ['react-vite', 'astro'] as const) {
    it(`${framework}: points at Cloudflare Drop, and the config-free CLI equivalent`, () => {
      const readme = fileMap(
        buildScaffold({ name: 'My App', framework, theme: 'light', sections: ['Home'] }),
      ).get('README.md')!
      expect(readme).toContain('https://www.cloudflare.com/drop/')
      expect(readme).toContain('npx wrangler deploy --temporary --assets dist --name my-app')
    })
  }
})

describe('buildScaffold — cloudflare --example board', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'dark',
      sections: ['Dashboard'],
      examples: ['board'],
    }),
  )

  it('adds a /board route backed by a SyncRoom Durable Object', () => {
    expect(map.has('src/routes/board.tsx')).toBe(true)
    expect(map.has('src/board.ts')).toBe(true)
    expect(map.get('src/routes.gen.ts')).toContain("lazyRoute('/board'")
    expect(map.get('src/App.tsx')).toContain("href: '/board'")
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"class_name": "SyncRoom"')
    expect(wrangler).toContain('"new_sqlite_classes": ["SyncRoom"]')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { SyncRoom } from '@cascivo/app/sync-server'")
    expect(worker).toContain('roomResponse(request, env.ROOMS')
  })

  it('parses peer data instead of casting it', () => {
    const board = map.get('src/board.ts')!
    expect(board).toContain("room.map('notes', parseNote)")
    expect(board).not.toMatch(/JSON\.parse\([^)]*\) as /)
  })

  it('leaves the default scaffold without a Durable Object', () => {
    const plain = fileMap(
      buildScaffold({ name: 'x', framework: 'cloudflare', theme: 'light', sections: ['Home'] }),
    )
    expect(plain.has('src/board.ts')).toBe(false)
    expect(plain.get('wrangler.jsonc')).not.toContain('durable_objects')
    expect(plain.get('worker/index.ts')).toContain('fetch: handleApi')
  })
})

describe('buildScaffold — cloudflare --example agent', () => {
  const build = (examples: ('board' | 'agent')[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'dark',
        sections: ['Dashboard'],
        pm: 'pnpm',
        examples,
      }),
    )
  const map = build(['agent'])
  const pkg = JSON.parse(map.get('package.json')!) as {
    scripts: Record<string, string>
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }

  it('adds an /assistant route on an AIChatAgent Durable Object', () => {
    expect(map.get('src/routes.gen.ts')).toContain("lazyRoute('/assistant'")
    expect(map.get('src/App.tsx')).toContain("href: '/assistant'")
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { Assistant } from './assistant'")
    expect(worker).toContain('await routeAgentRequest(request, env)')
    expect(worker).toContain('AI: Ai')
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"run_worker_first": ["/api/*", "/agents/*"]')
    expect(wrangler).toContain('{ "name": "Assistant", "class_name": "Assistant" }')
    expect(wrangler).toContain('"new_sqlite_classes": ["Assistant"]')
    expect(wrangler).toContain('"ai": { "binding": "AI" }')
    expect(wrangler).toContain('"compatibility_flags": ["nodejs_compat"]')
  })

  it('validates every generated view on both sides of the wire', () => {
    expect(map.get('src/assistant.ts')).toContain(
      "import { validateView } from '@cascivo/render/validate'",
    )
    expect(map.get('worker/assistant.ts')).toContain(
      'execute: async ({ title, view }) => checkView(',
    )
    // The stored message crossed the network: the page re-checks it rather than casting.
    const page = map.get('src/routes/assistant.tsx')!
    expect(page).toContain('checkView(output.title, output.view)')
    expect(page).not.toMatch(/part\.output as /)
  })

  it('answers from a scripted model in vite dev, so it runs without an account', () => {
    expect(map.get('worker/assistant.ts')).toContain('import.meta.env.DEV')
    expect(map.get('vite.config.ts')).toContain(
      "cloudflare({ remoteBindings: process.env['VITE_REAL_AI'] === '1' })",
    )
    expect(map.has('worker/scripted-model.ts')).toBe(true)
  })

  it('runs on React by default: the Agents SDK hooks need use()', () => {
    expect(map.get('vite.config.ts')).toContain('react()')
    expect(pkg.dependencies['react']).toBeDefined()
    expect(pkg.dependencies['preact']).toBeUndefined()
    expect(pkg.dependencies['agents']).toBeDefined()
    expect(pkg.dependencies['@cascivo/render']).toMatch(/^\d/)
  })

  it('type-checks the Worker against the Workers runtime, apart from the DOM', () => {
    expect(JSON.parse(map.get('tsconfig.json')!)).toMatchObject({ include: ['src'] })
    expect(JSON.parse(map.get('tsconfig.worker.json')!)).toMatchObject({
      compilerOptions: { types: ['@cloudflare/workers-types', 'vite/client'] },
      include: ['worker'],
    })
    expect(pkg.devDependencies['@cloudflare/workers-types']).toBeDefined()
    expect(pkg.scripts['typecheck']).toContain('tsc --noEmit -p tsconfig.worker.json')
    expect(pkg.scripts['build']).toContain('tsc -p tsconfig.worker.json')
  })

  it('declares both Durable Objects in one migration alongside the board', () => {
    const both = build(['board', 'agent'])
    const wrangler = both.get('wrangler.jsonc')!
    expect(wrangler).toContain('"new_sqlite_classes": ["SyncRoom", "Assistant"]')
    const worker = both.get('worker/index.ts')!
    expect(worker).toContain('roomResponse(request, env.ROOMS')
    expect(worker).toContain('routeAgentRequest(request, env)')
  })
})

describe('buildScaffold — cloudflare format and lint hygiene', () => {
  const plain = fileMap(
    buildScaffold({ name: 'x', framework: 'cloudflare', theme: 'light', sections: ['Home'] }),
  )

  it('prints short tsconfig arrays on one line, as Prettier does', () => {
    // JSON.stringify broke every array across lines, so a fresh app failed its own format:check.
    expect(plain.get('tsconfig.json')).toContain('"lib": ["ES2022", "DOM", "DOM.Iterable"],')
    expect(plain.get('tsconfig.json')).toContain('"include": ["src", "worker"]')
  })

  it('keeps an empty Env interface past no-empty-object-type', () => {
    expect(plain.get('worker/index.ts')).toContain(
      '// eslint-disable-next-line @typescript-eslint/no-empty-object-type',
    )
  })
})

describe('create --example agent', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
    process.exitCode = 0
    vi.restoreAllMocks()
  })

  it('refuses --runtime preact and writes nothing', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'cascivo-create-'))
    dirs.push(cwd)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await create(
      ['app', '--yes', '--framework', 'cloudflare', '--runtime', 'preact', '--example', 'agent'],
      cwd,
    )
    expect(process.exitCode).toBe(1)
    expect(error.mock.calls.join(' ')).toContain('--example agent needs --runtime react')
    expect(readdirSync(cwd)).toEqual([])
  })
})

describe('buildScaffold — cloudflare --example notes', () => {
  const build = (examples: ('board' | 'notes')[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
      }),
    )
  const map = build(['notes'])

  it('adds a /notes route on a room kept in IndexedDB', () => {
    expect(map.get('src/routes.gen.ts')).toContain("lazyRoute('/notes'")
    expect(map.get('src/App.tsx')).toContain("href: '/notes'")
    const notes = map.get('src/notes.ts')!
    expect(notes).toContain("storage: indexedDBDriver('cascivo-notes')")
    expect(notes).not.toMatch(/JSON\.parse\([^)]*\) as /)
    expect(map.get('src/routes/notes.tsx')).toContain('room.unsynced.value')
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cascivo/storage']).toMatch(/^\d/)
  })

  it('reuses the SyncRoom binding and route the board uses', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('{ "name": "ROOMS", "class_name": "SyncRoom" }')
    expect(map.get('worker/index.ts')).toContain('roomResponse(request, env.ROOMS')
    const both = build(['board', 'notes'])
    expect(both.get('wrangler.jsonc')!.match(/"class_name": "SyncRoom"/g)).toHaveLength(1)
  })
})

describe('buildScaffold — cloudflare --example import', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['import'],
    }),
  )

  it('runs the import as a Workflow and serves its progress as a read-only room', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"class_name": "ImportJob"')
    expect(wrangler).toContain('{ "name": "ROOMS", "class_name": "SyncRoom" }')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { ImportJob } from './import-job'")
    expect(worker).toContain('IMPORT_JOB: Workflow<{ csv: string }>')
    expect(worker).toContain('importJob.roomName(job[1]!), { readOnly: true }')
    expect(map.get('src/api.ts')).toContain("path: '/api/import'")
    expect(map.get('src/routes.gen.ts')).toContain("lazyRoute('/import'")
  })

  it('reports from inside steps, so a replay cannot move progress backwards', () => {
    const workflow = map.get('worker/import-job.ts')!
    // Each progress report is the first line of a step.do callback. (`fail` is the one report
    // outside a step: it runs once, on the way out of a run that is ending.)
    const reports = workflow.match(/report\.(step|progress|done)\(/g) ?? []
    const inSteps =
      workflow.match(
        /step\.do\([^\n]*\n\s+await report\.(step|progress)\(|step\.do\('done', \(\) => report\.done\(/g,
      ) ?? []
    expect(reports.length).toBe(4)
    expect(inSteps.length).toBe(reports.length)
  })

  it('type-checks the Workflow against the Workers runtime', () => {
    expect(map.has('tsconfig.worker.json')).toBe(true)
    const pkg = JSON.parse(map.get('package.json')!) as {
      devDependencies: Record<string, string>
      dependencies: Record<string, string>
    }
    expect(pkg.devDependencies['@cloudflare/workers-types']).toBeDefined()
    // Workflows are on the default runtime: only the agent example needs React.
    expect(pkg.dependencies['preact']).toBeDefined()
  })
})

describe('buildScaffold — cloudflare --example files', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['files'],
    }),
  )

  it('binds a bucket and Images, and routes uploads before the API', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain(
      '"r2_buckets": [{ "binding": "FILES", "bucket_name": "edge-app-files" }]',
    )
    expect(wrangler).toContain('"images": { "binding": "IMAGES" }')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('handleUploads(uploads, env.FILES, { images: env.IMAGES })(request)')
    expect(worker).toContain("import { uploads } from '../src/upload-policy'")
    expect(map.get('src/api.ts')).toContain("path: '/api/files'")
    expect(map.get('src/routes.gen.ts')).toContain("lazyRoute('/files'")
  })

  it('keeps the policy the Worker imports free of the page and of React', () => {
    const policy = map.get('src/upload-policy.ts')!
    expect(policy).not.toMatch(/@cascivo\/react|from '\.\/files'/)
    expect(policy).not.toContain('image/svg+xml')
  })
})

describe('buildScaffold — cloudflare --example export', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['export'],
    }),
  )

  it('exports pages through Browser Run, and renders them without the shell', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"browser": { "binding": "BROWSER" }')
    expect(wrangler).toContain("// Cloudflare's puppeteer uses Node.js APIs.")
    expect(wrangler.match(/compatibility_flags/g)).toHaveLength(1)
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain(
      'handleExport(request, { launch: () => puppeteer.launch(env.BROWSER) })',
    )
    expect(map.get('src/App.tsx')).toContain('if (isExporting()) {')
    expect(map.get('src/routes/report.tsx')).toContain("exportUrl('/report', 'pdf')")
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cloudflare/puppeteer']).toBeDefined()
  })

  it('declares nodejs_compat once when the agent needs it too', () => {
    const both = fileMap(
      buildScaffold({
        name: 'x',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Home'],
        examples: ['agent', 'export'],
      }),
    )
    const wrangler = both.get('wrangler.jsonc')!
    expect(wrangler.match(/compatibility_flags/g)).toHaveLength(1)
    expect(wrangler).toContain("// The Agents SDK and Cloudflare's puppeteer use Node.js APIs.")
  })
})

describe('buildScaffold — cloudflare --example usage', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['usage'],
    }),
  )

  it('records every API request into a dataset named after the app', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('{ "binding": "USAGE", "dataset": "edge_app_usage" }')
    expect(map.get('src/usage.ts')).toContain("dataset: 'edge_app_usage'")
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('usageMetrics.write(env.USAGE, {')
    // With another example the fetch handler routes first, then records the API call.
    const withFiles = fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples: ['usage', 'files'],
      }),
    )
    expect(withFiles.get('worker/index.ts')).toContain('return handleAndRecord(request, env)')
  })

  it('reads usage back only with the secrets, and counts sampled rows', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('env.CF_ACCOUNT_ID && env.CF_API_TOKEN')
    const queries = map.get('worker/usage.ts')!
    expect(queries).toContain('SUM(_sample_interval)')
    // Code lines only: the comments say why COUNT() is wrong.
    const code = queries
      .split('\n')
      .filter((line) => !/^\s*(\*|\/\*\*|\/\/)/.test(line))
      .join('\n')
    expect(code).not.toMatch(/COUNT\(/)
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cascivo/charts']).toMatch(/^\d/)
  })

  it('records through the plain fetch handler too', () => {
    // No other example: the Worker's default export is the recording handler itself.
    expect(map.get('worker/index.ts')).toContain('fetch: handleAndRecord,')
  })
})

describe('buildScaffold — cloudflare --example crud', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['crud'],
    }),
  )

  it('binds a D1 database the Worker migrates itself', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain(
      '"d1_databases": [{ "binding": "DB", "database_name": "edge-app-db" }]',
    )
    expect(wrangler).not.toContain('"database_id"')
    expect(map.get('worker/customers.ts')).toContain('await migrate(db, migrations)')
    expect(map.get('worker/migrations.ts')).toContain("id: '0001_customers'")
  })

  it('queries through the table definition, with the query parsed at the boundary', () => {
    const api = map.get('src/api.ts')!
    expect(api).toContain('input: parseTableQuery')
    expect(api).toContain("path: '/api/customers/:id'")
    expect(map.get('worker/customers.ts')).toContain(
      'queryTable(await ready(db), customersTable, query, parseCustomer)',
    )
    expect(map.get('src/routes/customers.tsx')).toContain('server={{')
  })

  it('binds every value in the statements it writes', () => {
    const store = map.get('worker/customers.ts')!
    for (const line of store.split('\n').filter((l) => /(INSERT|UPDATE|DELETE)/.test(l))) {
      expect(line).not.toContain('${')
    }
  })
})

describe('buildScaffold — cloudflare guards', () => {
  const build = (opts: Partial<ScaffoldOptions>) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        ...opts,
      }),
    )

  it('rate-limits starting an upload or an export, not every request', () => {
    const map = build({ examples: ['files', 'export'] })
    expect(map.get('wrangler.jsonc')).toContain('"name": "LIMITER"')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('LIMITER: RateLimiter')
    expect(worker).toContain('if (countsAgainstLimit(request))')
    expect(worker).toContain(
      "return (request.method === 'PUT' && step === null) || step === 'start'",
    )
    expect(worker).toContain("return url.pathname === '/api/export'")
    expect(worker.indexOf('rateLimit(')).toBeLessThan(worker.indexOf('handleUploads('))
    expect(map.get('README.md')).toContain('20 uploads a minute')
  })

  it('has no limiter without a paid example', () => {
    const map = build({ examples: ['crud'] })
    expect(map.get('wrangler.jsonc')).not.toContain('ratelimits')
    expect(map.get('worker/index.ts')).not.toContain('@cascivo/app/guard')
  })

  it('--auth access checks every Worker request first, outside vite dev, and fails closed', () => {
    const map = build({ auth: 'access' })
    expect(map.get('wrangler.jsonc')).toContain(
      '"vars": { "ACCESS_TEAM_DOMAIN": "", "ACCESS_AUD": "" }',
    )
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('async fetch(request: Request, env: Env): Promise<Response> {')
    expect(worker).toContain('if (!import.meta.env.DEV) {')
    expect(worker.indexOf('requireAccess(')).toBeLessThan(worker.indexOf('return handleApi('))
    expect(map.get('README.md')).toContain('## Access (who may use the app)')
  })

  it('--auth access runs before the limiter and the room routes', () => {
    const worker = build({ auth: 'access', examples: ['board', 'files'] }).get('worker/index.ts')!
    const access = worker.indexOf('await requireAccess(')
    expect(access).toBeGreaterThan(0)
    expect(access).toBeLessThan(worker.indexOf('await rateLimit('))
    expect(access).toBeLessThan(worker.indexOf('roomResponse(request'))
  })
})

describe('create --auth', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
    process.exitCode = 0
    vi.restoreAllMocks()
  })

  it.each([
    [['--framework', 'react-vite', '--auth', 'access'], '--auth needs --framework cloudflare'],
    [
      ['--framework', 'cloudflare', '--auth', 'basic'],
      'Unknown auth "basic". Expected: access, email, oauth or email,oauth.',
    ],
    [
      ['--framework', 'cloudflare', '--example', 'social', '--auth', 'access'],
      '--example social needs accounts',
    ],
    [
      ['--framework', 'cloudflare', '--auth', 'access,email'],
      'Unknown auth "access,email". Expected: access, email, oauth or email,oauth.',
    ],
  ])('refuses %j and writes nothing', async (flags, message) => {
    const cwd = mkdtempSync(join(tmpdir(), 'cascivo-create-'))
    dirs.push(cwd)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await create(['app', '--yes', ...flags], cwd)
    expect(process.exitCode).toBe(1)
    expect(error.mock.calls.join(' ')).toContain(message)
    expect(readdirSync(cwd)).toEqual([])
  })
})

describe('buildScaffold — cloudflare --example live', () => {
  const map = fileMap(
    buildScaffold({
      name: 'Edge App',
      framework: 'cloudflare',
      theme: 'light',
      sections: ['Dashboard'],
      examples: ['live'],
    }),
  )

  it('binds a queue both ways and the LiveRoom Durable Object', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"producers": [{ "binding": "EVENTS", "queue": "edge-app-events" }]')
    expect(wrangler).toContain('"queue": "edge-app-events",\n        "max_batch_size": 100,')
    expect(wrangler).toContain('{ "name": "LIVE", "class_name": "LiveRoom" }')
    expect(wrangler).toContain('"new_sqlite_classes": ["LiveRoom"]')
  })

  it('consumes the queue into the room, which browsers may only watch', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { LiveRoom } from '@cascivo/app/live-server'")
    expect(worker).toContain('async queue(batch: LiveBatch, env: Env): Promise<void> {')
    expect(worker).toContain('roomResponse(request, env.LIVE, OPS_ROOM, { readOnly: true })')
    // The Worker's clock places events, not the sender's.
    expect(worker).toContain('body: { at, values: event.values }')
    expect(map.get('src/api.ts')).toContain('input: ops.parseEvents')
  })

  it('adds the /ops page with charts', () => {
    expect(map.get('src/routes/ops.tsx')).toContain("watchLive(ops, '/api/live')")
    expect(map.get('src/App.tsx')).toContain("href: '/ops'")
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cascivo/charts']).toMatch(/^\d/)
    expect(map.get('README.md')).toContain('npx wrangler queues create edge-app-events')
  })

  it('lays out a long app name the way Prettier does', () => {
    const long = fileMap(
      buildScaffold({
        name: 'a-rather-long-operations-dashboard-name',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples: ['live', 'crud', 'files'],
      }),
    ).get('wrangler.jsonc')!
    for (const line of long.split('\n')) expect(line.length).toBeLessThanOrEqual(100)
  })
})

describe('buildScaffold — cloudflare --example voice', () => {
  const build = (examples: ('agent' | 'voice')[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
      }),
    )
  const map = build(['voice'])

  it('runs on Preact by default: the voice client needs no React', () => {
    expect(map.get('vite.config.ts')).toContain("import preact from '@preact/preset-vite'")
    expect(map.get('src/voice.ts')).toContain("from 'agents/voice/client'")
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['agents']).toBe('^0.24.0')
    expect(pkg.dependencies['@cloudflare/ai-chat']).toBeUndefined()
  })

  it('routes the voice agent and binds Workers AI', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"run_worker_first": ["/api/*", "/agents/*"]')
    expect(wrangler).toContain('{ "name": "Voice", "class_name": "Voice" }')
    expect(wrangler).toContain('"ai": { "binding": "AI" }')
    expect(wrangler).toContain('"compatibility_flags": ["nodejs_compat"]')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { Voice } from './voice'")
    expect(worker).toContain('const agent = await routeAgentRequest(request, env)')
    expect(map.get('tsconfig.worker.json')).toBeDefined()
  })

  it('uses Workers AI in production and stand-ins only in vite dev', () => {
    const voice = map.get('worker/voice.ts')!
    expect(voice).toContain("import.meta.env.DEV && import.meta.env['VITE_REAL_AI'] !== '1'")
    expect(voice).toContain('new WorkersAIFluxSTT(this.env.AI)')
    expect(voice).toContain('new WorkersAITTS(this.env.AI)')
    expect(map.get('vite.config.ts')).toContain(
      "remoteBindings: process.env['VITE_REAL_AI'] === '1'",
    )
  })

  it('parses the history the agent sends rather than trusting it', () => {
    expect(map.get('src/voice.ts')).toContain('export function parseHistory(raw: unknown)')
  })

  it('shares the Agents SDK wiring with the assistant', () => {
    const both = build(['agent', 'voice'])
    const wrangler = both.get('wrangler.jsonc')!
    expect(wrangler).toContain('"new_sqlite_classes": ["Assistant", "Voice"]')
    expect(wrangler.match(/"ai": \{/g)).toHaveLength(1)
    expect(both.get('worker/index.ts')!.match(/routeAgentRequest\(/g)).toHaveLength(1)
  })
})

describe('buildScaffold — cloudflare --example publish', () => {
  const build = (examples: ('crud' | 'publish')[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
      }),
    )
  const map = build(['publish'])

  it('stores pages in D1 and checks each against the manifests before storing it', () => {
    expect(map.get('wrangler.jsonc')).toContain('"d1_databases": [{ "binding": "DB"')
    expect(map.get('src/api.ts')).toContain('input: parsePageInput')
    const pages = map.get('src/pages.ts')!
    expect(pages).toContain('const result = validateView(view)')
    expect(pages).not.toMatch(/JSON\.parse\([^)]*\) as /)
    expect(map.get('worker/pages.ts')).toContain("id: '0001_pages'")
  })

  it('serves a page at /p/:slug and rate-limits publishing, not reading', () => {
    expect(map.get('src/routes.gen.ts')).toContain("'/p/:slug'")
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("if (url.pathname === '/api/pages') return request.method === 'POST'")
    expect(map.get('wrangler.jsonc')).toContain('"name": "LIMITER"')
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cascivo/render']).toMatch(/^\d/)
  })

  it('shares one database and one migration runner with the customers table', () => {
    const both = build(['crud', 'publish'])
    expect(both.get('wrangler.jsonc')!.match(/"d1_databases"/g)).toHaveLength(1)
    expect(both.get('worker/index.ts')!.match(/DB: Database/g)).toHaveLength(1)
  })
})

describe('buildScaffold — cloudflare --auth email', () => {
  const build = (opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        auth: 'email',
        ...opts,
      }),
    )
  const map = build()

  it('binds D1, Email Service and the limiter, with no sender until one is set', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"send_email": [{ "name": "EMAIL" }]')
    expect(wrangler).toContain('"vars": { "AUTH_FROM": "" }')
    expect(wrangler).toContain('"d1_databases"')
    expect(wrangler).toContain('"name": "LIMITER"')
    expect(map.get('worker/auth.ts')).toContain("if (!from) throw new Error('Set AUTH_FROM")
  })

  it('limits sign-in emails, answers /api/auth, then requires a user for every write', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain(
      "if (url.pathname === '/api/auth/start') return request.method === 'POST'",
    )
    expect(worker).toContain('exposeLink: import.meta.env.DEV')
    const limit = worker.indexOf('await rateLimit(')
    const auth = worker.indexOf('await handleAuth(')
    const guard = worker.indexOf('await requireUser(env.DB, request)')
    expect(limit).toBeGreaterThan(0)
    expect(limit).toBeLessThan(auth)
    expect(auth).toBeLessThan(guard)
    expect(guard).toBeLessThan(worker.indexOf('return handleApi('))
  })

  it('adds the account and link pages, and drops the no-auth warnings', () => {
    expect(map.get('src/routes.gen.ts')).toContain("'/signin/verify'")
    expect(map.get('src/App.tsx')).toContain("href: '/account'")
    const readme = build({ examples: ['files', 'publish'] }).get('README.md')!
    expect(readme).toContain('## Accounts (email sign-in)')
    expect(readme).not.toContain('It has no auth')
    expect(readme).not.toContain('Anyone who can reach the app can publish')
  })
})

describe('parseAuth', () => {
  it.each([
    [undefined, null],
    ['', null],
    ['email', 'email'],
    ['OAuth', 'oauth'],
    ['oauth,email', 'email,oauth'],
    ['email, oauth, email', 'email,oauth'],
    ['access,oauth', 'invalid'],
    ['magic', 'invalid'],
  ] as const)('reads %j as %j', (raw, auth) => {
    expect(parseAuth(raw)).toBe(auth)
  })
})

describe('buildScaffold — cloudflare --auth oauth', () => {
  const build = (opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        auth: 'oauth',
        ...opts,
      }),
    )
  const map = build()

  it('binds D1 but sends no email: no Email Service, no sign-in link page', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"d1_databases"')
    expect(wrangler).not.toContain('send_email')
    expect(wrangler).not.toContain('AUTH_FROM')
    expect(map.has('worker/auth.ts')).toBe(false)
    expect(map.get('src/routes.gen.ts')).not.toContain("'/signin/verify'")
    expect(map.get('src/App.tsx')).toContain("href: '/account'")
  })

  it('answers /api/auth/oauth with the providers that are configured, then requires a user', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("import { handleOAuth } from '@cascivo/app/oauth-server'")
    expect(worker).toContain("import { requireUser } from '@cascivo/app/auth-server'")
    expect(worker).not.toContain('handleAuth(')
    expect(worker).toContain('if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)')
    expect(worker).toContain('if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET)')
    expect(worker).toContain("errorPath: '/account'")
    // No limiter here, so nothing else imports the guard's error responder (a past build break).
    expect(worker).toContain("import { guardResponse } from '@cascivo/app/guard'")
    const oauth = worker.indexOf('await handleOAuth(')
    const guard = worker.indexOf('await requireUser(env.DB, request)')
    expect(oauth).toBeGreaterThan(0)
    expect(oauth).toBeLessThan(guard)
  })

  it('keeps the secrets in .dev.vars, with a sealing secret long enough for vite dev', () => {
    const vars = map.get('.dev.vars')!
    const secret = /^AUTH_SECRET=(.*)$/m.exec(vars)![1]!
    expect(secret.length).toBeGreaterThanOrEqual(32)
    for (const name of [
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ])
      expect(vars).toContain(`${name}=`)
    expect(map.get('.dev.vars.example')).toContain('AUTH_SECRET=\n')
    const bindings = JSON.parse(map.get('package.json')!).cloudflare.bindings
    expect(Object.keys(bindings)).toEqual(
      expect.arrayContaining(['AUTH_SECRET', 'GITHUB_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']),
    )
  })

  it('shows provider links and the reason a sign-in failed, without the email form', () => {
    const account = map.get('src/routes/account.tsx')!
    expect(account).toContain("auth.signInUrl(id, '/account')")
    expect(account).toContain('identity_in_use')
    expect(account).not.toContain('Email me a link')
    expect(map.get('README.md')).toContain('## Accounts (GitHub, Google and LinkedIn sign-in)')
  })

  it('puts both ways in on one page with --auth email,oauth', () => {
    const both = build({ auth: 'email,oauth' })
    const worker = both.get('worker/index.ts')!
    expect(worker.indexOf('await handleAuth(')).toBeLessThan(worker.indexOf('await handleOAuth('))
    const account = both.get('src/routes/account.tsx')!
    expect(account).toContain('Email me a link')
    expect(account).toContain('auth.signInUrl(')
    expect(both.get('src/routes.gen.ts')).toContain("'/signin/verify'")
    expect(both.get('README.md')).toContain(
      '## Accounts (email, GitHub, Google and LinkedIn sign-in)',
    )
  })

  it('bills accounts without an email: checkout then asks Stripe for one', () => {
    const billing = build({ examples: ['checkout'] }).get('worker/billing.ts')!
    expect(billing).toContain('user.email\n          ? { customerEmail: user.email }')
  })
})

describe('buildScaffold — cloudflare --example social', () => {
  const build = (opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples: ['social'],
        ...opts,
      }),
    )
  const map = build()

  it('brings sign-in with providers when no --auth is given', () => {
    expect(map.get('src/routes/account.tsx')).toContain('auth.signInUrl(')
    expect(map.get('worker/index.ts')).toContain('await handleOAuth(')
    // With email sign-in it uses that instead, and still seals tokens with AUTH_SECRET.
    const email = build({ auth: 'email' })
    expect(email.get('worker/index.ts')).not.toContain('handleOAuth(')
    expect(email.get('.dev.vars')).toMatch(/^AUTH_SECRET=.{32,}$/m)
    expect(email.get('worker/index.ts')).toContain('AUTH_SECRET?: string')
  })

  it('binds a Workflow per post, and connects accounts behind the signed-in guard', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"binding": "SOCIAL_POST", "class_name": "SocialPost"')
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain("export { SocialPost } from './social-post'")
    expect(worker.indexOf('await requireUser(env.DB, request)')).toBeLessThan(
      worker.indexOf('await socialStore.connections(env)(request)'),
    )
    // Starting a connection (Mastodon registers the app) and posting are rate-limited.
    expect(worker).toMatch(/connections.*return request\.method === 'GET'/)
    expect(worker).toContain(
      "if (url.pathname === '/api/social/posts') return request.method === 'POST'",
    )
    expect(map.get('src/App.tsx')).toContain("href: '/social'")
  })

  it('never retries a LinkedIn post, and retries Mastodon with an idempotency key', () => {
    const workflow = map.get('worker/social-post.ts')!
    expect(workflow).toContain("{ retries: { limit: 0, delay: '1 second' } }")
    expect(workflow).toContain('idempotencyKey: `${post.id}:${target.accountId}`')
    // "Post now" must not ask a Workflow to sleep until the past.
    expect(workflow.indexOf("step.do('due later'")).toBeLessThan(
      workflow.indexOf('step.sleepUntil('),
    )
  })

  it('names the Mastodon app after the project, quotes and all', () => {
    expect(map.get('worker/social.ts')).toContain("const APP_NAME = 'Edge App'")
    expect(build({ name: "Ada's \\app" }).get('worker/social.ts')).toContain(
      "const APP_NAME = 'Adas app'",
    )
  })
})

describe('buildScaffold — cloudflare --example webhooks', () => {
  const build = (examples: Example[], opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...opts,
      }),
    )

  it('verifies the signature before anything is parsed, and stores each delivery once', () => {
    const store = build(['webhooks']).get('worker/webhooks.ts')!
    expect(store.indexOf('await verifyWebhook(request')).toBeLessThan(
      store.indexOf('JSON.parse(body)'),
    )
    expect(store).toContain('ON CONFLICT (id) DO NOTHING RETURNING id')
    expect(build(['webhooks']).get('.dev.vars')).toContain('WEBHOOK_SECRET=')
  })

  it('pushes deliveries through a read-only room', () => {
    const worker = build(['webhooks']).get('worker/index.ts')!
    expect(worker).toContain(
      'roomResponse(request, env.ROOMS, DELIVERIES_ROOM, { readOnly: true })',
    )
    expect(worker).not.toContain('/api/rooms/')
  })

  it('keeps the rooms the server writes out of /api/rooms/:name', () => {
    const worker = build(['board', 'import', 'webhooks']).get('worker/index.ts')!
    expect(worker).toContain('if (room && !/^(job-|webhooks$)/.test(room[1]!)) {')
    // With only the import, no client-writable room route exists at all.
    expect(build(['import']).get('worker/index.ts')).not.toContain('/api\\/rooms\\/')
  })

  it('exempts signed webhooks from the sign-in rule of --auth email', () => {
    const worker = build(['webhooks'], { auth: 'email' }).get('worker/index.ts')!
    expect(worker).toContain("!new URL(request.url).pathname.startsWith('/api/webhooks/')")
  })
})

describe('buildScaffold — cloudflare --example digest', () => {
  const build = (examples: Example[], opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...opts,
      }),
    )
  const map = build(['digest'])

  it('brings the report page it emails, and a weekly Cron Trigger', () => {
    expect(map.get('src/routes/report.tsx')).toBeDefined()
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"triggers": { "crons": ["0 8 * * 1"] }')
    expect(wrangler).toContain('"browser": { "binding": "BROWSER" }')
    expect(wrangler).toContain('"send_email": [{ "name": "EMAIL" }]')
    expect(wrangler).toContain('"DIGEST_TO": ""')
  })

  it('runs the digest from the scheduled handler, and records every run', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('async scheduled(_event: unknown, env: Env): Promise<void> {')
    expect(worker).toContain(
      "if (url.pathname === '/api/digest/run') return request.method === 'POST'",
    )
    const job = map.get('worker/digest.ts')!
    expect(job).toContain("status: 'skipped'")
    expect(job).toContain('INSERT INTO digest_runs')
  })

  it('shares one vars object and one Email Service binding with --auth email', () => {
    const wrangler = build(['digest'], { auth: 'email' }).get('wrangler.jsonc')!
    expect(wrangler.match(/"vars":/g)).toHaveLength(1)
    expect(wrangler.match(/"send_email":/g)).toHaveLength(1)
    expect(wrangler).toContain('"AUTH_FROM": ""')
    expect(build(['digest'], { auth: 'email' }).get('worker/index.ts')).toContain(
      'EMAIL: SignInSender & DigestSender',
    )
    for (const line of wrangler.split('\n')) expect(line.length).toBeLessThanOrEqual(100)
  })
})

describe('buildScaffold — cloudflare --example checkout', () => {
  const build = (examples: Example[], opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...opts,
      }),
    )
  const map = build(['checkout'])

  it('verifies the Stripe signature before the event is parsed', () => {
    const store = map.get('worker/checkout.ts')!
    expect(store.indexOf('await verifyWebhook(request')).toBeGreaterThan(-1)
    expect(store.indexOf('await verifyWebhook(request')).toBeLessThan(
      store.indexOf('parseStripeEvent(body)'),
    )
    expect(map.get('worker/index.ts')).toContain(
      "if (checkoutPath === orderStore.STRIPE_WEBHOOK_PATH && request.method === 'POST') {",
    )
  })

  it('settles an order once, found by its session id rather than client_reference_id', () => {
    const store = map.get('worker/checkout.ts')!
    expect(store).toContain("WHERE session_id = ? AND status = 'pending' RETURNING")
    expect(store).not.toMatch(/WHERE[^`]*client_reference_id/)
    // The receipt is sent only after the update returned a row, i.e. on the first settle.
    expect(store.indexOf('if (!order) return')).toBeLessThan(store.indexOf('await sendReceipt('))
  })

  it('prices on the server and uses the order id as the idempotency key', () => {
    const store = map.get('worker/checkout.ts')!
    expect(store).toContain('lineItems: [{ ...PRODUCT, quantity: 1 }]')
    expect(store).toContain('{ idempotencyKey: id }')
    expect(map.get('src/api.ts')).not.toMatch(/startCheckout: endpoint\(\{[^}]*input/)
  })

  it('watches each order through a read-only room the client cannot open elsewhere', () => {
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain(
      'return roomResponse(request, env.ROOMS, orderRoom(orderLive[1]!), { readOnly: true })',
    )
    expect(worker).toContain('if (orderLive && ORDER_ID.test(orderLive[1]!)) {')
    expect(build(['board', 'checkout']).get('worker/index.ts')).toContain(
      'if (room && !/^(order-)/.test(room[1]!)) {',
    )
  })

  it('rate-limits starting a checkout and adds the order pages to the nav', () => {
    expect(map.get('worker/index.ts')).toContain(
      "if (url.pathname === '/api/checkout') return request.method === 'POST'",
    )
    expect(map.get('src/routes/checkout.tsx')).toBeDefined()
    expect(map.get('src/routes/checkout/[order].tsx')).toBeDefined()
    expect(map.get('src/routes.gen.ts')).toContain("'/checkout/:order'")
    expect(map.get('src/App.tsx')).toContain("href: '/checkout'")
  })

  it('records refunds by the running total and disputes by their stored status', () => {
    const store = map.get('worker/checkout.ts')!
    // The payment is stored when the order settles: refund and dispute events name only it.
    expect(store).toContain('email = ?, payment_intent_id = ?')
    expect(store).toContain('SET refunded_amount = MAX(refunded_amount, ?)')
    expect(store).toContain(
      "WHERE payment_intent_id = ? AND status = 'paid' AND dispute_status IS NULL",
    )
    expect(store).toContain("status = CASE WHEN ? = 'won' THEN 'paid' ELSE 'disputed' END")
    expect(map.get('src/checkout.ts')).toContain(
      "export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'disputed'",
    )
    expect(map.get('src/routes/checkout/[order].tsx')).toContain(
      "disputed: { variant: 'destructive', label: 'Disputed' },",
    )
    expect(map.get('README.md')).toContain('`charge.dispute.closed`')
  })

  it('sends receipts with @cascivo/email through the Email Service binding', () => {
    const pkg = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(pkg.dependencies['@cascivo/email']).toMatch(/^\d+\.\d+\.\d+$/)
    expect(pkg.dependencies['preact-render-to-string']).toBeDefined()
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"send_email": [{ "name": "EMAIL" }]')
    expect(wrangler).toContain('"RECEIPT_FROM": ""')
    expect(map.get('src/checkout.ts')).toContain("export const SHOP_NAME = 'Edge App'")
  })

  it('keeps Stripe secrets out of wrangler.jsonc and in .dev.vars, beside the webhook one', () => {
    expect(map.get('wrangler.jsonc')).not.toContain('STRIPE_')
    expect(map.get('.dev.vars')).toContain('STRIPE_SECRET_KEY=\n')
    const both = build(['webhooks', 'checkout'])
    expect(both.get('.dev.vars')).toContain('WEBHOOK_SECRET=dev-only-webhook-secret\n')
    expect(both.get('.dev.vars')).toContain('STRIPE_WEBHOOK_SECRET=\n')
  })

  it('exempts Stripe and GitHub webhooks from the sign-in rule of --auth email', () => {
    const worker = build(['webhooks', 'checkout'], { auth: 'email' }).get('worker/index.ts')!
    expect(worker).toContain("!new URL(request.url).pathname.startsWith('/api/webhooks/') &&")
    expect(worker).toContain("!new URL(request.url).pathname.startsWith('/api/stripe/')")
    expect(build(['checkout'], { auth: 'email' }).get('worker/index.ts')).toContain(
      'EMAIL: SignInSender & ReceiptSender',
    )
  })
})

describe('buildScaffold — cloudflare --example checkout --auth email (billing)', () => {
  const build = (examples: Example[], auth?: 'email') =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...(auth ? { auth } : {}),
      }),
    )
  const map = build(['checkout'], 'email')

  it('adds /billing only when there are accounts to bill', () => {
    expect(map.get('src/routes/billing.tsx')).toBeDefined()
    expect(map.get('worker/billing.ts')).toBeDefined()
    expect(map.get('src/App.tsx')).toContain("href: '/billing'")
    const anonymous = build(['checkout'])
    expect(anonymous.get('worker/billing.ts')).toBeUndefined()
    expect(anonymous.get('README.md')).toContain('--example checkout --auth email')
  })

  it('names the user in server-set metadata, never in client_reference_id', () => {
    const billing = map.get('worker/billing.ts')!
    expect(billing).toContain('subscriptionMetadata: { user: user.id }')
    expect(billing).toContain("const userId = subscription.metadata['user']")
    expect(billing).toContain("if (subscription.metadata['user'] !== user.id) {")
  })

  it('stores what Stripe says now, and never lets an old subscription end a live one', () => {
    const billing = map.get('worker/billing.ts')!
    expect(billing).toContain(
      'await store(env.DB, await stripeOf(env).retrieveSubscription(subscriptionId))',
    )
    expect(billing).toContain("OR billing.status NOT IN ('active', 'trialing', 'past_due')")
  })

  it('routes subscription and invoice events from the Stripe webhook into billing', () => {
    expect(map.get('worker/index.ts')).toContain(
      'return await orderStore.receiveStripe(request, env, billingStore.billingHooks(env))',
    )
    expect(build(['checkout']).get('worker/index.ts')).toContain(
      'return await orderStore.receiveStripe(request, env)',
    )
    const store = map.get('worker/checkout.ts')!
    expect(store).toContain(
      "if (event.kind === 'subscription') await billing?.subscription(event.subscription.id)",
    )
    expect(store).toContain('await billing?.paymentFailed(event.invoice, origin)')
  })

  it('gates the plan with isEntitled / requireEntitlement, past_due included', () => {
    const billing = map.get('worker/billing.ts')!
    expect(billing).toContain('active: isEntitled(billing.status)')
    expect(billing).toContain('requireEntitlement((await readRow(env.DB, user.id))?.status)')
    expect(map.get('src/billing.ts')).not.toContain('isActive')
    expect(map.get('README.md')).toContain('await billingStore.requirePlan(env, request)')
  })

  it('reminds a failed renewal once per attempt, only for customers it bills', () => {
    const billing = map.get('worker/billing.ts')!
    expect(billing).toContain(
      "'UPDATE billing SET reminded = ? WHERE customer_id = ? AND reminded IS NOT ? RETURNING user_id'",
    )
    expect(billing.indexOf('if (!row) return')).toBeLessThan(
      billing.indexOf('await env.EMAIL.send('),
    )
    expect(billing).toContain('invoice.hostedInvoiceUrl ??')
    expect(map.get('README.md')).toContain('`invoice.payment_failed`')
  })
})

describe('buildScaffold — secrets for the Deploy to Cloudflare button', () => {
  const build = (examples: Example[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
      }),
    )

  it('lists every local secret, with no value, in a committed .dev.vars.example', () => {
    const map = build(['webhooks', 'checkout', 'newsletter'])
    const example = map.get('.dev.vars.example')!
    const keys = (text: string) =>
      text
        .split('\n')
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => l.split('=')[0])
    expect(keys(example)).toEqual(keys(map.get('.dev.vars')!))
    expect(example).not.toMatch(/^[A-Z_]+=.+$/m)
    expect(map.get('.gitignore')).toContain('.dev.vars*\n!.dev.vars.example\n')
  })

  it('describes each setting in package.json for the button', () => {
    const pkg = JSON.parse(build(['checkout']).get('package.json')!) as {
      cloudflare: { bindings: Record<string, { description: string }> }
    }
    expect(Object.keys(pkg.cloudflare.bindings)).toEqual([
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RECEIPT_FROM',
    ])
    expect(JSON.parse(build([]).get('package.json')!)).not.toHaveProperty('cloudflare')
    expect(build([]).get('.dev.vars.example')).toBeUndefined()
  })
})

describe('buildScaffold — cloudflare --example newsletter', () => {
  const build = (examples: Example[], opts: Partial<ScaffoldOptions> = {}) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...opts,
      }),
    )
  const map = build(['newsletter'])

  it('mails only confirmed readers, and never twice for one issue', () => {
    const store = map.get('worker/newsletter.ts')!
    expect(store).toContain("SELECT email FROM subscribers WHERE status = 'subscribed'")
    expect(store).toContain('PRIMARY KEY (issue_id, email)')
    expect(store).toContain(
      'AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.issue_id = ? AND d.email = s.email)',
    )
    // Throttling is retried by the queue; one bad address is recorded and the rest go on.
    expect(store).toContain('if (!(error instanceof SesError) || error.retryable) throw error')
  })

  it('carries one-click unsubscribe headers and a per-reader link', () => {
    const store = map.get('worker/newsletter.ts')!
    expect(store).toContain("'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'")
    expect(store).toContain('rendered.html.replaceAll(TOKEN_SLOT, readerToken)')
    expect(map.get('worker/index.ts')).toContain(
      "if (newsletterPath === '/api/newsletter/unsubscribe' && request.method === 'POST') {",
    )
  })

  it('sends through sendEmail with the SES client as its sender, and checks an issue first', () => {
    const store = map.get('worker/newsletter.ts')!
    expect(store).toContain('await sendEmail(ses, message, {')
    expect(store).not.toContain('ses.sendEmail(')
    // An unsendable issue is refused before it is queued, so the queue never retries it forever.
    expect(store.indexOf('assertSendable(renderIssue(')).toBeLessThan(
      store.indexOf('await env.NEWSLETTER.sendBatch('),
    )
  })

  it('suppresses permanent bounces and complaints from signature-checked SNS messages', () => {
    const store = map.get('worker/newsletter.ts')!
    expect(store).toContain('return handleSns(request, {')
    expect(store).toContain(
      "event.kind === 'complaint' || (event.kind === 'bounce' && event.bounceType === 'Permanent')",
    )
  })

  it('guards the composer with NEWSLETTER_KEY and rate-limits sign-ups and key use', () => {
    const store = map.get('worker/newsletter.ts')!
    for (const fn of ['overview', 'preview', 'sendIssue']) {
      const body = store.slice(store.indexOf(`export async function ${fn}(`))
      expect(body.indexOf('await requireKey(env')).toBeLessThan(body.indexOf('await migrate('))
    }
    expect(map.get('worker/index.ts')).toContain(
      '/^\\/api\\/newsletter\\/(subscribe|overview|preview|issues)$/.test(url.pathname)',
    )
    expect(map.get('.dev.vars')).toContain('NEWSLETTER_KEY=dev-only-newsletter-key\n')
    expect(map.get('wrangler.jsonc')).not.toContain('AWS_ACCESS_KEY_ID')
  })

  it('declares the queue and its pace, and consumes it', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain(
      '"producers": [{ "binding": "NEWSLETTER", "queue": "edge-app-newsletter" }]',
    )
    expect(wrangler).toContain('"max_concurrency": 1')
    expect(wrangler).not.toContain('send_email')
    expect(map.get('worker/index.ts')).toContain('await newsletterStore.deliver(env, batch)')
  })

  it('shares one queues object and one handler with --example live', () => {
    const both = build(['live', 'newsletter'])
    const wrangler = both.get('wrangler.jsonc')!
    expect(wrangler.match(/"queues":/g)).toHaveLength(1)
    expect(wrangler).toContain('"queue": "edge-app-events"')
    expect(wrangler).toContain('"queue": "edge-app-newsletter"')
    const worker = both.get('worker/index.ts')!
    expect(worker.match(/async queue\(/g)).toHaveLength(1)
    expect(worker).toContain(
      "if (batch.queue === 'edge-app-newsletter') return newsletterStore.deliver(env, batch)",
    )
  })

  it('lets readers sign up, confirm and unsubscribe without an account under --auth email', () => {
    const worker = build(['newsletter'], { auth: 'email' }).get('worker/index.ts')!
    for (const path of ['/api/sns/', '/api/newsletter/subscribe', '/api/newsletter/unsubscribe']) {
      expect(worker).toContain(`!new URL(request.url).pathname.startsWith('${path}')`)
    }
    expect(worker).not.toContain("startsWith('/api/newsletter/issues')")
  })
})

describe('buildScaffold — published pages rendered by the Worker', () => {
  const build = (examples: Example[], runtime?: 'react') =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
        ...(runtime ? { runtime } : {}),
      }),
    )
  const map = build(['publish'])

  it('routes /p/* to the Worker, which reads index.html through ASSETS', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"run_worker_first": ["/api/*", "/p/*"]')
    expect(wrangler).toContain('"binding": "ASSETS"')
    expect(map.get('vite.config.ts')).toContain("build: { manifest: 'asset-manifest.json' }")
    const worker = map.get('worker/index.ts')!
    expect(worker).toContain('return await renderPageHtml(request, page, env.ASSETS, null)')
    // An unknown slug falls back to the app, which says so; other errors are not swallowed.
    expect(worker).toContain('if (!(error instanceof HttpError)) throw error')
  })

  it('escapes what it puts in the HTML and keeps the page above the app root', () => {
    const html = map.get('worker/page-html.ts')!
    expect(html).toContain('const title = escapeHtml(page.title)')
    expect(html.indexOf('<noscript>')).toBeLessThan(html.lastIndexOf('<div id="root"></div>'))
  })

  it('needs preact-render-to-string under Preact only', () => {
    const preact = JSON.parse(map.get('package.json')!) as { dependencies: Record<string, string> }
    expect(preact.dependencies['preact-render-to-string']).toBeDefined()
    const react = JSON.parse(build(['publish'], 'react').get('package.json')!) as {
      dependencies: Record<string, string>
    }
    expect(react.dependencies['preact-render-to-string']).toBeUndefined()
  })

  it('adds the preview image only with Browser Run (the export example)', () => {
    expect(map.get('worker/page-preview.ts')).toBeUndefined()
    const both = build(['publish', 'export'])
    expect(both.get('worker/page-preview.ts')).toContain('fullPage: false')
    expect(both.get('worker/index.ts')).toContain('/preview.png')
  })
})

describe('buildScaffold — cloudflare --example search', () => {
  const build = (examples: Example[]) =>
    fileMap(
      buildScaffold({
        name: 'Edge App',
        framework: 'cloudflare',
        theme: 'light',
        sections: ['Dashboard'],
        examples,
      }),
    )
  const map = build(['search'])

  it('binds Workers AI and a Vectorize index, without the Agents SDK wiring', () => {
    const wrangler = map.get('wrangler.jsonc')!
    expect(wrangler).toContain('"ai": { "binding": "AI" }')
    expect(wrangler).toContain(
      '"vectorize": [{ "binding": "ARTICLES_INDEX", "index_name": "edge-app-articles" }]',
    )
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]')
    expect(wrangler).not.toContain('nodejs_compat')
    expect(map.get('vite.config.ts')).toContain(
      "remoteBindings: process.env['VITE_REAL_AI'] === '1'",
    )
    expect(map.get('worker/index.ts')).toContain('AI: Embedder')
    expect(map.get('README.md')).toContain(
      'npx wrangler vectorize create edge-app-articles --dimensions=768 --metric=cosine',
    )
  })

  it('keeps user input out of the full-text query syntax, and checks what the model returns', () => {
    const search = map.get('worker/search.ts')!
    expect(search).toContain('.map((w) => `"${w}"`)')
    expect(search).toContain("throw new Error('Workers AI returned no embeddings')")
    expect(search).toContain(
      ".prepare('INSERT OR IGNORE INTO articles (id, title, body) VALUES (?, ?, ?)')",
    )
  })

  it('rate-limits indexing, which embeds every article', () => {
    expect(map.get('worker/index.ts')).toContain(
      "if (url.pathname === '/api/search/index') return request.method === 'POST'",
    )
  })

  it('shares Workers AI with the assistant', () => {
    const both = build(['agent', 'search'])
    expect(both.get('wrangler.jsonc')!.match(/"ai": \{/g)).toHaveLength(1)
    expect(both.get('worker/index.ts')).toContain('AI: Ai')
  })
})
