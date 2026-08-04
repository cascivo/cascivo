import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract.js'
import { buildContract } from '../utils/contract.js'
import { findRawStringViolations } from './raw-strings.js'

const contract: Contract = buildContract({
  catalog: { tokens: [] },
  registry: {
    components: [
      { meta: { name: 'Tooltip' } },
      { meta: { name: 'Card' } },
      { meta: { name: 'Text' } },
    ],
  },
  context: {
    components: [
      { name: 'Tooltip', intent: { content: { tone: 'short' } } },
      { name: 'Card', intent: {} },
      { name: 'Text', intent: { content: { tone: 'plain', contentPrimitive: true } } },
    ],
  },
  contentPrimitives: ['Text'],
})

const IMPORT = `import { Tooltip, Card, Text } from '@cascivo/react'\n`

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

  it('does not warn on page copy inside a typography primitive', () => {
    // The reported false positive: `<Text weight="medium">Automatic deployments</Text>`
    // warned "use labels prop / i18n". That is page content in a typography component, not
    // a component label — and `Text` has no `labels` prop, so the advice has no target. In
    // a real app every sentence on every page warned.
    expect(
      findRawStringViolations(`${IMPORT}<Text>Automatic deployments</Text>`, 'N.tsx', contract),
    ).toEqual([])
  })

  it('still warns on chrome text in a component that owns it', () => {
    // The exclusion must not hollow out the rule.
    expect(
      findRawStringViolations(`${IMPORT}<Tooltip>Copy to clipboard</Tooltip>`, 'N.tsx', contract),
    ).toHaveLength(1)
  })
})
