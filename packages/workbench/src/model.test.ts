import { describe, expect, it } from 'vitest'
import { agentContext, controlsFor, parseManifest } from './model.ts'

describe('parseManifest', () => {
  it('reads a component manifest', () => {
    expect(
      parseManifest({
        name: 'Button',
        description: 'Triggers an action',
        props: [{ name: 'variant', type: "'a' | 'b'", required: false, default: 'a' }],
        tokens: ['--x', 3],
        examples: [{ title: 'Primary', code: '<Button />' }],
      }),
    ).toEqual({
      name: 'Button',
      description: 'Triggers an action',
      props: [{ name: 'variant', type: "'a' | 'b'", required: false, default: 'a' }],
      tokens: ['--x'],
      examples: [{ title: 'Primary', code: '<Button />' }],
    })
  })

  it('fills what a different manifest shape leaves out, and rejects a non-manifest', () => {
    expect(parseManifest({ name: 'faq', examples: [{ code: '<Faq />' }] })).toEqual({
      name: 'faq',
      description: '',
      props: [],
      tokens: [],
      examples: [{ title: 'Example 1', code: '<Faq />' }],
    })
    expect(parseManifest(null)).toBeNull()
    expect(parseManifest({ description: 'no name' })).toBeNull()
  })
})

describe('controlsFor', () => {
  it('draws a control for each simple prop type and skips the rest', () => {
    expect(
      controlsFor([
        { name: 'variant', type: "'primary' | 'ghost'", required: false },
        { name: 'loading', type: 'boolean', required: false },
        { name: 'label', type: 'string', required: true },
        { name: 'max', type: 'number', required: false },
        { name: 'onClick', type: '() => void', required: false },
        { name: 'size', type: "'sm' | number", required: false },
      ]),
    ).toEqual([
      { name: 'variant', kind: 'select', options: ['primary', 'ghost'] },
      { name: 'loading', kind: 'boolean' },
      { name: 'label', kind: 'text' },
      { name: 'max', kind: 'number' },
    ])
  })
})

describe('agentContext', () => {
  it('carries the props and the example being looked at, and nothing else', () => {
    const text = agentContext(
      {
        name: 'Button',
        description: 'Triggers an action',
        props: [{ name: 'variant', type: "'a' | 'b'", required: false, default: 'a' }],
        tokens: ['--long-token-list'],
        examples: [
          { title: 'One', code: '<Button />' },
          { title: 'Two', code: '<Button variant="b" />' },
        ],
      },
      1,
    )
    expect(text).toContain("- variant: 'a' | 'b' (default a)")
    expect(text).toContain('## Example: Two\n```tsx\n<Button variant="b" />\n```')
    expect(text).not.toContain('--long-token-list')
    expect(text).not.toContain('## Example: One')
  })
})
