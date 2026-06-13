import { describe, expect, it } from 'vitest'
import { buildContract, normalizeValue } from './contract.js'

const fixture = {
  catalog: {
    tokens: [
      { name: '--cascade-color-accent', resolvedDefault: 'oklch(0.623 0.214 250)' },
      { name: '--cascade-color-brand', resolvedDefault: 'oklch(0.623 0.214 250)' },
      { name: '--cascade-color-fg', resolvedDefault: '#111111' },
      { name: '--cascade-space-2', resolvedDefault: '8px' },
      { name: '--cascade-color-themed', resolvedDefault: null },
    ],
  },
  registry: {
    components: [
      {
        meta: {
          name: 'Button',
          props: [
            { name: 'variant', type: "'primary' | 'secondary'", required: false },
            { name: 'onClick', type: 'fn' },
          ],
        },
      },
      {
        meta: {
          name: 'Avatar',
          props: [{ name: 'alt', type: 'string', required: true }],
        },
      },
      { meta: { name: 'NoProps' } },
    ],
  },
  context: {
    components: [
      { name: 'Button', intent: { content: { tone: 'imperative' } } },
      { name: 'Avatar', intent: {} },
    ],
  },
}

describe('normalizeValue', () => {
  it('lowercases and strips spaces', () => {
    expect(normalizeValue('OKLCH(0.623 0.214 250)')).toBe('oklch(0.6230.214250)')
    expect(normalizeValue('#3B82F6')).toBe('#3b82f6')
  })
})

describe('buildContract — tokensByValue', () => {
  const contract = buildContract(fixture)

  it('maps a normalized value to its token name(s)', () => {
    expect(contract.tokensByValue.get(normalizeValue('oklch(0.623 0.214 250)'))).toEqual([
      '--cascade-color-accent',
      '--cascade-color-brand',
    ])
  })

  it('maps a hex value', () => {
    expect(contract.tokensByValue.get('#111111')).toEqual(['--cascade-color-fg'])
  })

  it('skips tokens with null resolvedDefault', () => {
    const all = [...contract.tokensByValue.values()].flat()
    expect(all).not.toContain('--cascade-color-themed')
  })
})

describe('buildContract — components', () => {
  const contract = buildContract(fixture)

  it('indexes Button props', () => {
    const button = contract.components.get('Button')
    expect(button?.props).toContainEqual({
      name: 'variant',
      type: "'primary' | 'secondary'",
      required: false,
    })
  })

  it('Button has no required props', () => {
    expect(contract.components.get('Button')?.requiredProps).toEqual([])
    expect(contract.components.get('Button')?.hasRequiredProps).toBe(false)
  })

  it('Avatar has a required prop', () => {
    expect(contract.components.get('Avatar')?.requiredProps).toEqual(['alt'])
    expect(contract.components.get('Avatar')?.hasRequiredProps).toBe(true)
  })

  it('marks components with intent.content', () => {
    expect(contract.components.get('Button')?.hasContent).toBe(true)
    expect(contract.components.get('Avatar')?.hasContent).toBe(false)
  })

  it('handles components without props', () => {
    expect(contract.components.get('NoProps')?.props).toEqual([])
  })
})
