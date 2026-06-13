import { describe, it, expect } from 'vitest'
import type { ComponentMeta, ComponentIntent } from './index.ts'

describe('ComponentMeta types', () => {
  it('round-trips a ComponentMeta with intent through JSON', () => {
    const intent: ComponentIntent = {
      whenToUse: ['User needs to trigger an action'],
      whenNotToUse: ['Navigating to another page — use a link instead'],
      antiPatterns: [
        { bad: 'Using a button as a nav link', why: 'Breaks semantics and accessibility' },
        { bad: 'Icon-only button without label', good: 'Add aria-label', why: 'Screen readers need text' },
      ],
      related: [
        { name: 'Link', relationship: 'alternative', reason: 'Use for navigation' },
        { name: 'IconButton', relationship: 'pairs-with', reason: 'Compact variant' },
      ],
      a11yRationale: 'Renders as <button> so keyboard and screen reader support is native',
      content: { tone: 'action-oriented', notes: 'Keep labels under 3 words' },
      flexibility: [
        { area: 'variant', level: 'strict', note: 'Only use defined variants' },
        { area: 'size', level: 'flexible', note: 'Custom sizes via CSS tokens are fine' },
      ],
    }

    const meta: ComponentMeta = {
      name: 'Button',
      description: 'Triggers an action',
      category: 'inputs',
      states: ['default', 'hover', 'focus', 'disabled', 'loading'],
      variants: ['primary', 'secondary', 'ghost'],
      sizes: ['sm', 'md', 'lg'],
      props: [{ name: 'disabled', type: 'boolean', required: false, default: 'false' }],
      tokens: ['--cascade-button-bg'],
      accessibility: { role: 'button', wcag: 'AA', keyboard: ['Enter', 'Space'] },
      examples: [{ title: 'Primary', code: '<Button>Click</Button>' }],
      dependencies: ['@cascade-ui/core'],
      tags: ['action', 'cta'],
      intent,
    }

    const parsed = JSON.parse(JSON.stringify(meta)) as ComponentMeta
    expect(parsed.intent?.whenToUse[0]).toBe('User needs to trigger an action')
    expect(parsed.intent?.antiPatterns[1]?.good).toBe('Add aria-label')
    expect(parsed.intent?.related[0]?.relationship).toBe('alternative')
    expect(parsed.intent?.flexibility[0]?.level).toBe('strict')
    expect(parsed.intent?.content?.tone).toBe('action-oriented')
  })

  it('accepts a ComponentMeta without intent', () => {
    const meta: ComponentMeta = {
      name: 'Badge',
      description: 'Displays a status label',
      category: 'display',
      states: ['default'],
      variants: ['default', 'success', 'warning', 'error'],
      sizes: ['sm', 'md'],
      props: [],
      tokens: ['--cascade-badge-bg'],
      accessibility: { role: 'status', wcag: 'AA', keyboard: [] },
      examples: [{ title: 'Default', code: '<Badge>New</Badge>' }],
      dependencies: ['@cascade-ui/core'],
      tags: ['label'],
    }

    expect(meta.intent).toBeUndefined()
  })
})
