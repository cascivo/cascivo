import { describe, expect, it } from 'vitest'
import { generateTsx } from './generate.js'

const EMPTY_METAS = new Map()

describe('cascade generate', () => {
  it('emits data/action props from $data / $actions refs', () => {
    const tsx = generateTsx(
      {
        view: {
          regions: {
            main: [
              { component: 'Badge', props: { variant: 'secondary' }, children: 'Hello' },
              { component: 'Button', events: { onClick: '$actions.openUser' } },
            ],
          },
        },
      },
      EMPTY_METAS,
      './ui',
    )
    expect(tsx).toContain('onClick={actions.openUser}')
    expect(tsx).toContain('openUser: (...args: unknown[]) => unknown')
  })

  it('emits useSignal declarations and wiring for $state', () => {
    const tsx = generateTsx(
      {
        state: { query: '', open: false },
        view: {
          regions: {
            main: [
              {
                component: 'Input',
                bind: { value: '$state.query' },
                events: { onChange: '$state.set.query' },
              },
              {
                component: 'Button',
                bind: { disabled: '$state.open' },
                events: { onClick: '$state.toggle.open' },
              },
            ],
          },
        },
      },
      EMPTY_METAS,
      './ui',
    )
    expect(tsx).toContain("import { useSignal, useSignals } from '@cascivo/core'")
    expect(tsx).toContain('useSignals()')
    expect(tsx).toContain("const query = useSignal('')")
    expect(tsx).toContain('const open = useSignal(false)')
    expect(tsx).toContain('value={query.value}')
    expect(tsx).toContain('onChange={(e) => (query.value = coerceValue(e))}')
    expect(tsx).toContain('onClick={() => (open.value = !open.value)}')
    expect(tsx).toContain('function coerceValue')
    // State refs must NOT leak into the data/actions PageProps.
    expect(tsx).not.toContain('data.query')
    expect(tsx).not.toContain('actions.query')
  })

  it('omits the coerceValue helper when no $state.set is used', () => {
    const tsx = generateTsx(
      {
        state: { open: false },
        view: {
          regions: { main: [{ component: 'Button', events: { onClick: '$state.toggle.open' } }] },
        },
      },
      EMPTY_METAS,
      './ui',
    )
    expect(tsx).not.toContain('function coerceValue')
    expect(tsx).toContain('const open = useSignal(false)')
  })
})
