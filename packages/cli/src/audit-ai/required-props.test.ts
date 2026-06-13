import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract.js'
import { buildContract } from '../utils/contract.js'
import { findRequiredPropViolations } from './required-props.js'

const contract: Contract = buildContract({
  catalog: { tokens: [] },
  registry: {
    components: [
      { meta: { name: 'Avatar', props: [{ name: 'alt', type: 'string', required: true }] } },
      { meta: { name: 'Button', props: [{ name: 'variant', type: 'string', required: false }] } },
    ],
  },
  context: { components: [] },
})

const IMPORT = `import { Avatar, Button } from '@cascade-ui/react'\n`

describe('findRequiredPropViolations', () => {
  it('flags a missing required prop', () => {
    const out = findRequiredPropViolations(`${IMPORT}<Avatar />`, 'C.tsx', contract)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      component: 'Avatar',
      prop: 'alt',
      level: 'error',
      rule: 'missing-prop',
    })
  })

  it('is clean when the required prop is present', () => {
    expect(findRequiredPropViolations(`${IMPORT}<Avatar alt="me" />`, 'C.tsx', contract)).toEqual(
      [],
    )
  })

  it('skips elements with a spread', () => {
    expect(findRequiredPropViolations(`${IMPORT}<Avatar {...props} />`, 'C.tsx', contract)).toEqual(
      [],
    )
  })

  it('does not flag components with no required props', () => {
    expect(findRequiredPropViolations(`${IMPORT}<Button />`, 'C.tsx', contract)).toEqual([])
  })
})
