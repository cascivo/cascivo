import { describe, expect, it } from 'vitest'
import { findVendorCssImports } from './vendor-css.js'

describe('findVendorCssImports', () => {
  it('flags a bare side-effect CSS import', () => {
    const out = findVendorCssImports(`import 'chart.js/dist/Chart.css'`, 'app.tsx')
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      rule: 'vendor-css-import',
      level: 'warn',
      specifier: 'chart.js/dist/Chart.css',
      line: 1,
    })
  })

  it('flags a bare `from` CSS import', () => {
    const out = findVendorCssImports(`import styles from 'some-lib/styles.css'`, 'app.tsx')
    expect(out).toHaveLength(1)
    expect(out[0]?.specifier).toBe('some-lib/styles.css')
  })

  it('does not flag relative CSS imports (own CSS modules)', () => {
    expect(findVendorCssImports(`import s from './button.module.css'`, 'a.tsx')).toEqual([])
    expect(findVendorCssImports(`import '../styles/app.css'`, 'a.tsx')).toEqual([])
  })

  it('does not flag absolute-path CSS imports', () => {
    expect(findVendorCssImports(`import '/assets/x.css'`, 'a.tsx')).toEqual([])
  })

  it('exempts cascivo own stylesheets (already layered)', () => {
    expect(findVendorCssImports(`import '@cascivo/react/styles.css'`, 'a.tsx')).toEqual([])
    expect(findVendorCssImports(`import '@cascivo/themes/dark.css'`, 'a.tsx')).toEqual([])
  })

  it('does not flag JS/TS imports (only .css specifiers)', () => {
    expect(findVendorCssImports(`import { foo } from 'some-lib'`, 'a.tsx')).toEqual([])
  })

  it('handles a query/hash suffix on the specifier', () => {
    const out = findVendorCssImports(`import 'lib/x.css?inline'`, 'a.tsx')
    expect(out).toHaveLength(1)
    expect(out[0]?.specifier).toBe('lib/x.css?inline')
  })

  it('reports the correct line', () => {
    const src = `import React from 'react'\nimport 'katex/dist/katex.css'`
    const out = findVendorCssImports(src, 'a.tsx')
    expect(out).toHaveLength(1)
    expect(out[0]?.line).toBe(2)
  })
})
