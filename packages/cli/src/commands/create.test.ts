import { describe, expect, it } from 'vitest'
import { buildScaffold, type ScaffoldFile } from './create.js'

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
