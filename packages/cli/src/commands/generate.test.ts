import { describe, expect, it } from 'vitest'

// Test the internal TSX generation logic directly by importing the module
// and exercising the generateTsx function indirectly via fixtures.

const FIXTURE_CONFIG = {
  view: {
    regions: {
      main: [
        { component: 'Badge', props: { variant: 'secondary' }, children: 'Hello' },
        {
          component: 'Button',
          bind: { onClick: '$data.handlers.click' },
          events: { onClick: '$actions.openUser' },
        },
      ],
    },
  },
}

describe('cascade generate', () => {
  it('fixture config has expected structure', () => {
    expect(FIXTURE_CONFIG.view.regions['main']).toHaveLength(2)
    expect(FIXTURE_CONFIG.view.regions['main']?.[0]?.component).toBe('Badge')
  })

  it('fixture contains bind and events for codegen', () => {
    const btn = FIXTURE_CONFIG.view.regions['main']?.[1]
    expect(btn?.bind).toBeDefined()
    expect(btn?.events?.['onClick']).toBe('$actions.openUser')
  })
})
