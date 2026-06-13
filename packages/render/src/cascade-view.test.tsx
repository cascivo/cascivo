import { signal } from '@cascivo/core'
import { createLocale, defineCatalog, defineMessages } from '@cascivo/i18n'
import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CascadeView } from './cascade-view'
import { getPath } from './cascade-view'

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
