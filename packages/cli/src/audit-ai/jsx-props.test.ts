import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract.js'
import { buildContract } from '../utils/contract.js'
import { findJsxPropViolations } from './jsx-props.js'

const contract: Contract = buildContract({
  catalog: { tokens: [] },
  registry: {
    components: [
      {
        meta: {
          name: 'Button',
          props: [
            { name: 'variant', type: 'string', required: false },
            { name: 'size', type: 'string', required: false },
            { name: 'loading', type: 'boolean', required: false },
          ],
        },
      },
    ],
  },
  context: { components: [] },
})

const IMPORT = `import { Button } from '@cascade-ui/react'\n`

describe('findJsxPropViolations', () => {
  it('flags an unknown prop on a cascade component', () => {
    const out = findJsxPropViolations(`${IMPORT}<Button frobnicate>Go</Button>`, 'H.tsx', contract)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      component: 'Button',
      prop: 'frobnicate',
      level: 'error',
      rule: 'unknown-prop',
    })
  })

  it('accepts a known prop', () => {
    const out = findJsxPropViolations(
      `${IMPORT}<Button variant="primary">Go</Button>`,
      'H.tsx',
      contract,
    )
    expect(out).toEqual([])
  })

  it('accepts passthrough props (className, onClick, data-, aria-)', () => {
    const src = `${IMPORT}<Button className="x" onClick={f} data-id="1" aria-label="go" id="b">Go</Button>`
    expect(findJsxPropViolations(src, 'H.tsx', contract)).toEqual([])
  })

  it('emits info and skips checks when a spread is present', () => {
    const out = findJsxPropViolations(`${IMPORT}<Button {...rest} frobnicate />`, 'H.tsx', contract)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ level: 'info', rule: 'spread-suppressed', component: 'Button' })
  })

  it('ignores non-cascade elements', () => {
    const out = findJsxPropViolations(`${IMPORT}<div foo="bar" />`, 'H.tsx', contract)
    expect(out).toEqual([])
  })

  it('ignores cascade-named tags that were not imported', () => {
    const out = findJsxPropViolations(`<Button frobnicate />`, 'H.tsx', contract)
    expect(out).toEqual([])
  })

  it('handles self-closing tags and expression values with braces', () => {
    const src = `${IMPORT}<Button variant="primary" loading={cond ? true : false} bogus="x" />`
    const out = findJsxPropViolations(src, 'H.tsx', contract)
    expect(out).toHaveLength(1)
    expect(out[0].prop).toBe('bogus')
  })

  it('reports the correct line number', () => {
    const src = `${IMPORT}\n\n<Button frobnicate />`
    const out = findJsxPropViolations(src, 'H.tsx', contract)
    expect(out[0].line).toBe(4)
  })
})
