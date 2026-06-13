import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract.js'
import { buildContract } from '../utils/contract.js'
import { findRawStringViolations } from './raw-strings.js'

const contract: Contract = buildContract({
  catalog: { tokens: [] },
  registry: {
    components: [{ meta: { name: 'Tooltip' } }, { meta: { name: 'Card' } }],
  },
  context: {
    components: [
      { name: 'Tooltip', intent: { content: { tone: 'short' } } },
      { name: 'Card', intent: {} },
    ],
  },
})

const IMPORT = `import { Tooltip, Card } from '@cascade-ui/react'\n`

describe('findRawStringViolations', () => {
  it('warns on multi-word prose in a content component', () => {
    const out = findRawStringViolations(
      `${IMPORT}<Tooltip>Open menu now</Tooltip>`,
      'N.tsx',
      contract,
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      component: 'Tooltip',
      text: 'Open menu now',
      level: 'warn',
      rule: 'raw-string',
    })
  })

  it('does not warn on a single word', () => {
    expect(findRawStringViolations(`${IMPORT}<Tooltip>Save</Tooltip>`, 'N.tsx', contract)).toEqual(
      [],
    )
  })

  it('does not warn on JSX expression children', () => {
    const src = `${IMPORT}<Tooltip>{t('tooltip.label')}</Tooltip>`
    expect(findRawStringViolations(src, 'N.tsx', contract)).toEqual([])
  })

  it('does not warn for components without intent.content', () => {
    expect(
      findRawStringViolations(`${IMPORT}<Card>Hello there friend</Card>`, 'N.tsx', contract),
    ).toEqual([])
  })

  it('does not warn on self-closing tags', () => {
    expect(findRawStringViolations(`${IMPORT}<Tooltip label="x" />`, 'N.tsx', contract)).toEqual([])
  })

  it('does not warn on strings with punctuation/digits', () => {
    expect(
      findRawStringViolations(`${IMPORT}<Tooltip>Step 1 of 3</Tooltip>`, 'N.tsx', contract),
    ).toEqual([])
  })
})
