import { describe, expect, it } from 'vitest'
import { CASCIVO_PACKAGE_RE, cascivoLayers, cascivoSsr, wrapCssInLayer } from './index.js'

describe('wrapCssInLayer', () => {
  it('wraps plain rules in the given layer', () => {
    const out = wrapCssInLayer('.btn { color: red; }', 'vendor')
    expect(out).toBe('@layer vendor {\n.btn { color: red; }\n}\n')
  })

  it('defaults the layer name to "vendor"', () => {
    expect(wrapCssInLayer('a{color:red}')).toContain('@layer vendor {')
  })

  it('respects a custom layer name', () => {
    expect(wrapCssInLayer('a{color:red}', 'charts')).toContain('@layer charts {')
  })

  it('hoists @import out of the layer block and adds layer()', () => {
    const out = wrapCssInLayer("@import url('reset.css');\n.a { color: red; }", 'vendor')
    // @import must precede the @layer block (it cannot live inside one).
    expect(out.indexOf("@import url('reset.css') layer(vendor);")).toBeLessThan(
      out.indexOf('@layer vendor {'),
    )
    expect(out).not.toMatch(/@layer vendor \{[^}]*@import/)
  })

  it('does not double-layer an @import that already declares a layer', () => {
    const out = wrapCssInLayer("@import url('x.css') layer(other);\n.a{color:red}", 'vendor')
    expect(out).toContain("@import url('x.css') layer(other);")
    expect(out).not.toContain('layer(vendor)')
  })

  it('keeps a leading @charset first', () => {
    const out = wrapCssInLayer('@charset "utf-8";\n.a{color:red}', 'vendor')
    expect(out.startsWith('@charset "utf-8";')).toBe(true)
    expect(out.indexOf('@charset')).toBeLessThan(out.indexOf('@layer'))
  })
})

describe('cascivoLayers plugin', () => {
  const plugin = cascivoLayers({ imports: { 'chart-widget/dist/styles.css': 'vendor' } })
  const transform = (code: string, id: string) =>
    (plugin.transform as (c: string, i: string) => { code: string } | null)(code, id)

  it('transforms a matching node_modules stylesheet', () => {
    const res = transform('.x{color:red}', '/app/node_modules/chart-widget/dist/styles.css')
    expect(res?.code).toContain('@layer vendor {')
  })

  it('matches even through a pnpm .pnpm path (tail suffix)', () => {
    const res = transform(
      '.x{color:red}',
      '/app/node_modules/.pnpm/chart-widget@1.0.0/node_modules/chart-widget/dist/styles.css',
    )
    expect(res?.code).toContain('@layer vendor {')
  })

  it('ignores a stylesheet that is not configured', () => {
    expect(transform('.x{color:red}', '/app/node_modules/other/dist/styles.css')).toBeNull()
  })

  it('ignores non-css ids and app source', () => {
    expect(transform('const x = 1', '/app/node_modules/chart-widget/index.js')).toBeNull()
    expect(transform('.x{}', '/app/src/chart-widget/dist/styles.css')).toBeNull()
  })

  it('runs enforce: pre', () => {
    expect(plugin.enforce).toBe('pre')
  })
})

describe('cascivoSsr plugin', () => {
  it('returns ssr.noExternal covering every @cascivo/* package', () => {
    const partial = cascivoSsr().config?.()
    expect(partial).toEqual({ ssr: { noExternal: [CASCIVO_PACKAGE_RE] } })
  })

  it('is named so it is identifiable in the plugin pipeline', () => {
    expect(cascivoSsr().name).toBe('cascivo:ssr-no-external')
  })

  it('the pattern matches package roots and deep subpaths but not bare react', () => {
    expect(CASCIVO_PACKAGE_RE.test('@cascivo/react')).toBe(true)
    expect(CASCIVO_PACKAGE_RE.test('@cascivo/react/styles.css')).toBe(true)
    expect(CASCIVO_PACKAGE_RE.test('@cascivo/charts')).toBe(true)
    expect(CASCIVO_PACKAGE_RE.test('react')).toBe(false)
    expect(CASCIVO_PACKAGE_RE.test('not-@cascivo/react')).toBe(false)
  })
})
