import { describe, expect, it } from 'vitest'
import { validatePartialView } from './validate-partial'

const full = JSON.stringify({
  state: { open: false },
  view: {
    regions: {
      main: [
        {
          component: 'Card',
          children: [
            { component: 'Button', props: { variant: 'primary' }, children: 'Save' },
            { component: 'Badge', props: { variant: 'success' }, children: 'Live' },
          ],
        },
      ],
    },
  },
})

describe('validatePartialView', () => {
  it('reports no error at any prefix of a valid view, and completes at the end', () => {
    for (let n = 0; n < full.length; n++) {
      const result = validatePartialView(full.slice(0, n))
      expect(result.complete, `prefix ${n}`).toBe(false)
      expect(result.errors, `prefix ${n}: ${full.slice(0, n)}`).toEqual([])
    }
    expect(validatePartialView(full)).toMatchObject({ complete: true, valid: true })
  })

  it('reports an unknown component as soon as its name has streamed', () => {
    const text = '{"view":{"regions":{"main":[{"component":"Buton","props":{'
    const result = validatePartialView(text)
    expect(result.complete).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]!.message).toMatch(/Unknown component "Buton".*Did you mean "Button"/)
  })

  it('does not judge a value that is still streaming', () => {
    const text = '{"view":{"regions":{"main":[{"component":"Button","props":{"variant":"prim'
    expect(validatePartialView(text).errors).toEqual([])
    const done = '{"view":{"regions":{"main":[{"component":"Button","props":{"variant":"primx",'
    expect(validatePartialView(done).errors[0]!.path).toBe('view.regions.main[0].props.variant')
  })

  it('returns the parsed prefix for progressive rendering', () => {
    const text = full.slice(0, full.indexOf('"Badge"'))
    const { view } = validatePartialView(text) as {
      view: { view: { regions: { main: unknown[] } } }
    }
    const card = view.view.regions.main[0] as { children: unknown[] }
    expect(card.children).toHaveLength(2)
    expect(card.children[0]).toMatchObject({ component: 'Button', children: 'Save' })
  })

  it('reports the missing-view errors once the text is complete', () => {
    const result = validatePartialView('{"state":{}}')
    expect(result.complete).toBe(true)
    expect(result.valid).toBe(false)
  })
})
