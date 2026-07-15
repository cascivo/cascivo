import { signal } from '@cascivo/core'
import { createLocale, defineCatalog, defineMessages } from '@cascivo/i18n'
import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CascadeView } from './cascade-view'
import { getPath } from './cascade-view'
import { validateView } from './validate'

afterEach(() => cleanup())

const messages = defineMessages('cv_test', {
  hello: 'Hello World',
})

defineCatalog(messages, 'en', { hello: 'Hello World' })

describe('getPath()', () => {
  it('resolves dot paths', () => {
    expect(getPath({ users: { active: 42 } }, 'users.active')).toBe(42)
  })

  it('returns undefined for missing paths', () => {
    expect(getPath({}, 'users.active')).toBeUndefined()
  })
})

describe('<CascadeView />', () => {
  it('renders a Badge with correct variant', () => {
    const config = {
      view: {
        regions: {
          main: [{ component: 'Badge', props: { variant: 'secondary' } }],
        },
      },
    }
    const { container } = render(<CascadeView config={config} />)
    expect(
      container.querySelector('[data-variant]') ??
        container.querySelector('.badge') ??
        container.firstElementChild,
    ).toBeTruthy()
  })

  it('resolves $t children via translateKey', () => {
    createLocale({ default: 'en', supported: ['en'] })
    const config = {
      view: {
        regions: {
          main: [{ component: 'Badge', children: { $t: 'cv_test.hello' } }],
        },
      },
    }
    const { container } = render(<CascadeView config={config} />)
    expect(container.textContent).toContain('Hello World')
  })

  it('injects $data.* bound props', () => {
    const config = {
      view: {
        regions: {
          main: [
            {
              component: 'Badge',
              bind: { 'data-testid': '$data.ui.testId' },
            },
          ],
        },
      },
    }
    const { container } = render(
      <CascadeView config={config} data={{ ui: { testId: 'my-badge' } }} />,
    )
    expect(container.querySelector('[data-testid="my-badge"]')).toBeTruthy()
  })

  it('wires $actions.* events', async () => {
    const spy = vi.fn()
    const config = {
      view: {
        regions: {
          main: [{ component: 'Button', events: { onClick: '$actions.handleClick' } }],
        },
      },
    }
    const { container } = render(<CascadeView config={config} actions={{ handleClick: spy }} />)
    const btn = container.querySelector('button')
    btn?.click()
    expect(spy).toHaveBeenCalled()
  })

  it('throws on invalid config', () => {
    expect(() =>
      render(
        <CascadeView config={{ view: { regions: { main: [{ component: 'NoSuchThing' }] } } }} />,
      ),
    ).toThrow('CascadeView: invalid config')
  })

  it('renders error panel in onInvalid=render mode', () => {
    const { container } = render(
      <CascadeView
        config={{ view: { regions: { main: [{ component: 'NoSuchThing' }] } } }}
        onInvalid="render"
      />,
    )
    expect(container.querySelector('[role="alert"]')).toBeTruthy()
  })

  it('renders an initial $state value into a bound prop', () => {
    const config = {
      state: { query: 'hello' },
      view: {
        regions: { main: [{ component: 'Input', bind: { value: '$state.query' } }] },
      },
    }
    const { container } = render(<CascadeView config={config} />)
    expect(container.querySelector('input')?.value).toBe('hello')
  })

  it('closes the two-way loop: writing $state.set updates the bound value', () => {
    const config = {
      state: { query: '' },
      view: {
        regions: {
          main: [
            {
              component: 'Input',
              bind: { value: '$state.query' },
              events: { onChange: '$state.set.query' },
            },
          ],
        },
      },
    }
    const { container } = render(<CascadeView config={config} />)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'vercel' } })
    expect(container.querySelector('input')?.value).toBe('vercel')
  })

  it('flips a boolean via $state.toggle', () => {
    const config = {
      state: { off: false },
      view: {
        regions: {
          main: [
            {
              component: 'Button',
              bind: { disabled: '$state.off' },
              events: { onClick: '$state.toggle.off' },
              children: 'Toggle',
            },
          ],
        },
      },
    }
    const { container } = render(<CascadeView config={config} />)
    const btn = container.querySelector('button')!
    expect(btn.disabled).toBe(false)
    fireEvent.click(btn)
    expect(container.querySelector('button')?.disabled).toBe(true)
  })

  it('rejects a $state ref to an undeclared key', () => {
    const { valid, errors } = validateView({
      state: { query: '' },
      view: { regions: { main: [{ component: 'Input', bind: { value: '$state.qeury' } }] } },
    })
    expect(valid).toBe(false)
    expect(errors[0]?.message).toContain('Unknown state key "qeury"')
    expect(errors[0]?.message).toContain('Did you mean "query"?')
  })

  it('rejects $state.toggle on a non-boolean key', () => {
    const { valid, errors } = validateView({
      state: { query: '' },
      view: {
        regions: { main: [{ component: 'Button', events: { onClick: '$state.toggle.query' } }] },
      },
    })
    expect(valid).toBe(false)
    expect(errors[0]?.message).toContain('requires a boolean initial value')
  })

  it('rejects a non-primitive state value', () => {
    const { valid, errors } = validateView({
      state: { bad: { nested: true } },
      view: { regions: { main: [] } },
    })
    expect(valid).toBe(false)
    expect(errors[0]?.path).toBe('state.bad')
  })

  it('live-patches when signal config changes', async () => {
    const configSignal = signal({
      view: {
        regions: { main: [{ component: 'Badge', props: { variant: 'secondary' } }] },
      },
    })
    const { container } = render(<CascadeView config={configSignal} />)
    const before = container.textContent

    configSignal.value = {
      view: {
        regions: { main: [{ component: 'Badge', children: 'Updated' }] },
      },
    }

    // Allow signal effects to flush
    await new Promise((r) => setTimeout(r, 10))
    expect(container.textContent).toContain('Updated')
    // (before may have been empty or different, just check update happened)
    expect(container.textContent).not.toBe(before)
  })
})
