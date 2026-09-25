import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fromA2UI, type A2uiComponent } from './a2ui'
import { CascivoView } from './cascivo-view'
import { validateView } from './validate'

const surface: A2uiComponent[] = [
  { id: 'root', component: 'Card', children: ['save', 'status'] },
  {
    id: 'save',
    component: 'Button',
    variant: 'primary',
    text: 'Save',
    disabled: { path: '/form/busy' },
    onClick: { event: { name: 'save' } },
  },
  { id: 'status', component: 'Badge', variant: 'success', text: 'Live' },
]

describe('fromA2UI', () => {
  it('nests the flat component list under its root', () => {
    expect(fromA2UI(surface)).toEqual({
      version: 1,
      view: {
        regions: {
          main: [
            {
              component: 'Card',
              children: [
                {
                  component: 'Button',
                  props: { variant: 'primary' },
                  bind: { disabled: '$data.form.busy' },
                  events: { onClick: '$actions.save' },
                  children: 'Save',
                },
                { component: 'Badge', props: { variant: 'success' }, children: 'Live' },
              ],
            },
          ],
        },
      },
    })
  })

  it('produces a view that validates and renders', () => {
    const view = fromA2UI(surface)
    expect(validateView(view).errors).toEqual([])
    const save = vi.fn()
    render(<CascivoView config={view} data={{ form: { busy: false } }} actions={{ save }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(save).toHaveBeenCalledOnce()
    expect(screen.getByText('Live')).toBeTruthy()
  })

  it('names what it cannot convert', () => {
    expect(() => fromA2UI([{ id: 'a', component: 'Card' }])).toThrow(/no component with id "root"/)
    expect(() => fromA2UI([{ id: 'root', component: 'Card', children: ['x'] }])).toThrow(
      /no component has id "x"/,
    )
    expect(() =>
      fromA2UI([{ id: 'root', component: 'Card', children: { componentId: 'r', path: '/l' } }]),
    ).toThrow(/template/)
    expect(() =>
      fromA2UI([{ id: 'root', component: 'Input', value: { call: 'now', args: {} } }]),
    ).toThrow(/function call/)
    expect(() => fromA2UI([{ id: 'root', component: 'Card', children: ['root'] }])).toThrow(
      /contains itself/,
    )
  })
})
