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
    expect(map.get('src/App.tsx')).toContain("import '@cascivo/themes/dark.css'")
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
    expect(app).toContain('AppShell')
    expect(app).toContain('SideNav')
    expect(app).toContain('ShellHeader')
  })

  it('escapes the brand name into ShellHeader', () => {
    const app = map.get('src/App.tsx')!
    expect(app).toContain("brand={{ name: 'My App' }}")
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
