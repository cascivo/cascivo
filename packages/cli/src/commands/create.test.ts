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
