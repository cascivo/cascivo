import { describe, expect, it } from 'vitest'
import { validateView } from './validate'

describe('validateView()', () => {
  it('returns valid for a well-formed config', () => {
    const result = validateView({
      view: {
        regions: {
          main: [{ component: 'Badge', props: { variant: 'secondary' } }],
        },
      },
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('flags unknown components with the path', () => {
    const result = validateView({
      view: { regions: { main: [{ component: 'NoSuchThing' }] } },
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatchObject({
      path: 'view.regions.main[0].component',
      message: expect.stringContaining('Unknown component "NoSuchThing"'),
    })
  })

  it('suggests similar names for typos', () => {
    const result = validateView({
      view: { regions: { main: [{ component: 'Budge' }] } },
    })
    expect(result.valid).toBe(false)
    const msg = result.errors[0]?.message ?? ''
    expect(msg).toMatch(/Badge/)
  })

  it('flags malformed $data refs', () => {
    const result = validateView({
      view: {
        regions: {
          main: [{ component: 'Badge', bind: { variant: 'notaref' } }],
        },
      },
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toMatch(/\$data\./)
  })

  it('flags malformed $actions refs', () => {
    const result = validateView({
      view: {
        regions: {
          main: [{ component: 'Button', events: { onClick: 'notanaction' } }],
        },
      },
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toMatch(/\$actions\./)
  })

  it('accepts valid $data and $actions refs', () => {
    const result = validateView({
      view: {
        regions: {
          main: [
            {
              component: 'Badge',
              bind: { variant: '$data.badge.variant' },
              events: { onClick: '$actions.handleClick' },
            },
          ],
        },
      },
    })
    // bind/events errors should be absent (prop type check skips bound props)
    const refErrors = result.errors.filter(
      (e) => e.message.includes('$data') || e.message.includes('$actions'),
    )
    expect(refErrors).toHaveLength(0)
  })

  it('flags non-object config', () => {
    const result = validateView(null)
    expect(result.valid).toBe(false)
  })

  it('accepts TranslationRef children without error', () => {
    const result = validateView({
      view: {
        regions: {
          main: [{ component: 'Badge', children: { $t: 'test.plain' } }],
        },
      },
    })
    expect(result.valid).toBe(true)
  })
})
