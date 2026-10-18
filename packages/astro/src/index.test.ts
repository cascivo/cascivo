import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vite-plus/test'
import cascivo, { DEFAULT_LAYERS, type CascivoAstroOptions } from './index.ts'

const VIRTUAL_ID = 'virtual:cascivo/layers.css'
const RESOLVED_ID = '\0virtual:cascivo/layers.css'

interface LayersPlugin {
  name: string
  resolveId: (id: string) => string | undefined
  load: (id: string) => string | undefined
}

/** Runs `astro:config:setup` with spies and returns what the integration registered. */
function setup(options?: CascivoAstroOptions) {
  const updateConfig = vi.fn()
  const injectScript = vi.fn()
  const hook = cascivo(options).hooks['astro:config:setup']
  if (!hook) throw new Error('cascivo() registers no astro:config:setup hook')
  // A partial of Astro's hook argument: the integration only touches these two.
  void hook({ updateConfig, injectScript } as unknown as Parameters<typeof hook>[0])

  const configs = updateConfig.mock.calls.map(([config]) => config as Record<string, unknown>)
  const vite = configs.map((c) => c['vite'] as Record<string, unknown> | undefined)
  const noExternal = vite.flatMap(
    (v) =>
      ((v?.['resolve'] as { noExternal?: RegExp[] } | undefined)?.noExternal ?? []) as RegExp[],
  )
  const plugins = vite.flatMap((v) => (v?.['plugins'] ?? []) as LayersPlugin[])
  const scripts = (stage: string) =>
    injectScript.mock.calls.filter(([s]) => s === stage).map(([, content]) => content as string)
  return { noExternal, plugins, scripts }
}

function layersPlugin(options?: CascivoAstroOptions): LayersPlugin {
  const plugin = setup(options).plugins.find((p) => p.resolveId(VIRTUAL_ID) === RESOLVED_ID)
  if (!plugin) throw new Error(`no plugin resolves ${VIRTUAL_ID}`)
  return plugin
}

/** The names of the canonical `@layer …;` statement in @cascivo/tokens. */
function tokensLayerNames(): string[] {
  const css = readFileSync(new URL('../../tokens/src/layers.css', import.meta.url), 'utf8')
  const statement = /^@layer\s+([^;{]+);/m.exec(css)?.[1]
  if (statement === undefined) throw new Error('no @layer statement in tokens/src/layers.css')
  return statement.split(',').map((n) => n.trim())
}

describe('@cascivo/astro', () => {
  it('is named @cascivo/astro', () => {
    expect(cascivo().name).toBe('@cascivo/astro')
  })

  it('keeps every @cascivo/* package in the Vite graph (resolve.noExternal)', () => {
    const { noExternal } = setup()
    expect(noExternal.some((re) => re.test('@cascivo/react'))).toBe(true)
    expect(noExternal.some((re) => re.test('react'))).toBe(false)
  })

  it('imports the virtual layer order before the theme on every page', () => {
    const [script, ...rest] = setup().scripts('page-ssr')
    expect(rest).toEqual([])
    expect(script).toBeDefined()
    const layers = script!.indexOf(VIRTUAL_ID)
    const theme = script!.indexOf('@cascivo/themes/light-dark.css')
    expect(layers).toBeGreaterThan(-1)
    expect(theme).toBeGreaterThan(layers)
  })

  it('imports a custom theme stylesheet', () => {
    const [script] = setup({ theme: '@cascivo/themes/midnight.css' }).scripts('page-ssr')
    expect(script).toContain('@cascivo/themes/midnight.css')
    expect(script).not.toContain('light-dark.css')
  })

  it('theme: false drops the theme import but keeps the layer order', () => {
    const [script] = setup({ theme: false }).scripts('page-ssr')
    expect(script).toContain(VIRTUAL_ID)
    expect(script).not.toContain('@cascivo/themes')
  })

  it('serves DEFAULT_LAYERS from the virtual module', () => {
    const plugin = layersPlugin()
    expect(plugin.resolveId('something-else')).toBeUndefined()
    expect(plugin.load(RESOLVED_ID)).toBe(DEFAULT_LAYERS)
    expect(plugin.load('something-else')).toBeUndefined()
  })

  it('serves a custom layers statement verbatim', () => {
    const layers =
      '@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, ' +
      'cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.example, cascivo.override;'
    expect(layersPlugin({ layers }).load(RESOLVED_ID)).toBe(layers)
  })

  it('DEFAULT_LAYERS is vendor, then the tokens statement in its order', () => {
    expect(DEFAULT_LAYERS.startsWith('@layer vendor, cascivo.reset')).toBe(true)
    expect(DEFAULT_LAYERS.endsWith('cascivo.override;')).toBe(true)
    const names = /^@layer\s+([^;]+);$/
      .exec(DEFAULT_LAYERS)?.[1]
      ?.split(',')
      .map((n) => n.trim())
    expect(names).toEqual(['vendor', ...tokensLayerNames()])
  })

  it('inlines a theme script that re-applies after a ClientRouter swap', () => {
    const [script, ...rest] = setup().scripts('head-inline')
    expect(rest).toEqual([])
    expect(script).toContain('astro:after-swap')
    expect(script).toContain('"cascivo-theme"')
    expect(script).toContain('"data-theme"')
  })

  it('passes themeScript options through to the preload script', () => {
    const [script] = setup({
      themeScript: { defaultTheme: 'midnight', storageKey: 'my-theme', attribute: 'data-mode' },
    }).scripts('head-inline')
    expect(script).toContain('"midnight"')
    expect(script).toContain('"my-theme"')
    expect(script).toContain('"data-mode"')
    // An explicit default suppresses the OS-preference fallback that would overwrite it.
    expect(script).not.toContain('prefers-color-scheme')
    expect(script).toContain('astro:after-swap')
  })

  it('themeScript: false injects no head-inline script', () => {
    expect(setup({ themeScript: false }).scripts('head-inline')).toEqual([])
  })
})
