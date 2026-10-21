import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { a2uiComponents } from '../a2ui-catalog-data'
import { propSchemas } from '../prop-schemas'
import { cascivoCatalogSpec } from './catalog-spec'
import { isTrustedGesture } from './gesture'
import type { A2uiCatalogSpec } from './catalog-spec'
import { A2UI_CATALOG_ID } from './messages'
import type { A2uiActionMessage, A2uiErrorMessage } from './messages'
import { createA2uiStore } from './store'
import type { A2uiLimits, A2uiStore } from './store'
import { A2uiSurface, cascivoCatalog } from './surface'
import type { A2uiRenderCatalog } from './surface'
import { TWO_WAY, twoWayValue } from './two-way'

// jsdom marks every dispatched event untrusted (fireEvent and user-event alike), so a test
// that stands for a real click on the control says so with `trustGestures()`.
vi.mock('./gesture', { spy: true })
const trustGestures = () => vi.mocked(isTrustedGesture).mockReturnValue(true)

afterEach(() => {
  cleanup()
  vi.mocked(isTrustedGesture).mockReset()
})

// Test-only catalog: the cascivo catalog plus `Spy` (counts its own renders), `Reporter`
// (reports through the adapter input on every render) and `Hooked` (an adapter using a hook).
const SPY_CATALOG_ID = 'test:spy-catalog'
const TEST_COMPONENTS: ReadonlySet<string> = new Set([
  'Spy',
  'Reporter',
  'Hooked',
  'Box',
  'Fan',
  'Twice',
  'SlotTwice',
  'Column',
  'Throws',
  'ThrowsWhen',
])
// The string ids of a component's raw `children` prop, as a basic-catalog adapter reads them.
const idsOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
let spyRenders = 0
const spySpec: A2uiCatalogSpec = {
  id: SPY_CATALOG_ID,
  has: (c) => TEST_COMPONENTS.has(c) || cascivoCatalogSpec.has(c),
  validate: (c) => (TEST_COMPONENTS.has(c.component) ? [] : cascivoCatalogSpec.validate(c)),
}
function HookedId(): React.ReactNode {
  return <span data-testid="hooked">{React.useId()}</span>
}
const spyCatalog: A2uiRenderCatalog = {
  id: SPY_CATALOG_ID,
  adapter: (c) => {
    if (c === 'Spy') {
      return () => {
        spyRenders++
        return <span data-testid="spy">spy</span>
      }
    }
    if (c === 'Reporter') {
      return (input) => {
        input.report('UNSUPPORTED_COMPONENT', 'Reporter is not supported.')
        return <span>reporter</span>
      }
    }
    // Calls a hook in the adapter itself, as a catalog adapter may.
    if (c === 'Hooked') return () => <HookedId key={React.useId()} />
    // A countable container: every rendered Box is one `[data-box]` element.
    if (c === 'Box')
      return (input) => <div data-box={input.component.id}>{input.slot('children')}</div>
    // Renders its `children` ids through one `children()` call, as Task 8's adapters will.
    if (c === 'Fan') {
      return (input) => (
        <div data-box={input.component.id}>
          {input.children(idsOf(input.component.props['children']))}
        </div>
      )
    }
    // Breaks the once-per-render rule: the second batch must render nothing.
    if (c === 'Twice') {
      return (input) => {
        const ids = idsOf(input.component.props['children'])
        return (
          <div data-box={input.component.id}>
            {input.children(ids)}
            <div data-second="">{input.children(ids)}</div>
          </div>
        )
      }
    }
    if (c === 'SlotTwice') {
      return (input) => (
        <div data-box={input.component.id}>
          {input.slot('children')}
          <div data-second="">{input.slot('children')}</div>
        </div>
      )
    }
    // An adopter's adapter with a bug: it throws while rendering.
    if (c === 'Throws') {
      return () => {
        throw new Error('adapter bug')
      }
    }
    // Throws while its bound `when` is true, so a crash can depend on data.
    if (c === 'ThrowsWhen') {
      return (input) => {
        if (input.prop('when') === true) throw new Error('flag is set')
        return <span>recovered</span>
      }
    }
    // A basic-catalog style Column: an id list through `children()`, a template through `slot()`.
    if (c === 'Column') {
      return (input) => {
        const value = input.component.props['children']
        return (
          <div>{Array.isArray(value) ? input.children(idsOf(value)) : input.slot('children')}</div>
        )
      }
    }
    return cascivoCatalog.adapter(c)
  },
}

const SID = 's1'

function setup(
  components: unknown[],
  options: { catalogId?: string; sendDataModel?: boolean; limits?: Partial<A2uiLimits> } = {},
) {
  const store = createA2uiStore({
    catalogs: [cascivoCatalogSpec, spySpec],
    ...(options.limits === undefined ? {} : { limits: options.limits }),
  })
  const errors: A2uiErrorMessage[] = []
  const send = (msg: Record<string, unknown>) => {
    errors.push(...store.apply({ version: 'v0.9', ...msg }))
  }
  send({
    createSurface: {
      surfaceId: SID,
      catalogId: options.catalogId ?? A2UI_CATALOG_ID,
      ...(options.sendDataModel === undefined ? {} : { sendDataModel: options.sendDataModel }),
    },
  })
  if (components.length > 0) send({ updateComponents: { surfaceId: SID, components } })
  const data = (path: string, value: unknown) =>
    send({ updateDataModel: { surfaceId: SID, path, value } })
  const update = (list: unknown[]) =>
    send({ updateComponents: { surfaceId: SID, components: list } })
  return { store, errors, data, update }
}

function mount(
  store: A2uiStore,
  extra: Partial<React.ComponentProps<typeof A2uiSurface>> = {},
): ReturnType<typeof render> {
  return render(
    <A2uiSurface
      store={store}
      surfaceId={SID}
      catalogs={[cascivoCatalog, spyCatalog]}
      {...extra}
    />,
  )
}

describe('<A2uiSurface>', () => {
  it('hello world: a Text root renders its text', () => {
    const { store, errors } = setup([{ id: 'root', component: 'Text', children: 'Hello' }])
    expect(errors).toEqual([])
    mount(store)
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('binding: a bound Text updates; a sibling node does not re-render', () => {
    const { store, errors, data } = setup(
      [
        { id: 'root', component: 'Flex', children: ['greet', 'spy'] },
        { id: 'greet', component: 'Text', children: { path: '/greeting' } },
        { id: 'spy', component: 'Spy' },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    data('/greeting', 'Hi')
    expect(errors).toEqual([])
    spyRenders = 0
    const { container } = mount(store)
    expect(container.textContent).toContain('Hi')
    expect(screen.getByTestId('spy')).toBeTruthy()
    const before = spyRenders
    expect(before).toBeGreaterThan(0)
    act(() => data('/greeting', 'Hello again'))
    expect(container.textContent).toContain('Hello again')
    expect(spyRenders).toBe(before)
  })

  it('two-way binding: typing into a bound Input updates a bound Text and the action context', () => {
    const onAction = vi.fn<(m: A2uiActionMessage, meta: Record<string, unknown>) => void>()
    const { store, errors, data } = setup([
      { id: 'root', component: 'Flex', children: ['name', 'echo', 'submit'] },
      { id: 'name', component: 'Input', label: 'Name', value: { path: '/form/name' } },
      { id: 'echo', component: 'Text', children: { path: '/form/name' } },
      {
        id: 'submit',
        component: 'Button',
        children: 'Submit',
        onClick: { event: { name: 'submit', context: { name: { path: '/form/name' } } } },
      },
    ])
    data('/form', { name: '' })
    expect(errors).toEqual([])
    const { container } = mount(store, { onAction })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'typed value' } })
    expect(container.textContent).toContain('typed value')
    expect(store.surface(SID)?.data.snapshot()).toEqual({ form: { name: 'typed value' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(onAction).toHaveBeenCalledTimes(1)
    const [message, meta] = onAction.mock.calls[0]!
    expect(message.version).toBe('v0.9')
    expect(message.action.name).toBe('submit')
    expect(message.action.sourceComponentId).toBe('submit')
    expect(message.action.surfaceId).toBe(SID)
    expect(message.action.context['name']).toBe('typed value')
    // No sendDataModel on the surface: the metadata key is absent.
    expect(meta).toEqual({})
  })

  it('two-way binding: metadata carries the client data model when sendDataModel is set', () => {
    const onAction = vi.fn<(m: A2uiActionMessage, meta: Record<string, unknown>) => void>()
    const { store, data } = setup(
      [
        {
          id: 'root',
          component: 'Button',
          children: 'Go',
          onClick: { event: { name: 'go' } },
        },
      ],
      { sendDataModel: true },
    )
    data('/x', 1)
    mount(store, { onAction })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onAction.mock.calls[0]![1]).toEqual({
      a2uiClientDataModel: { version: 'v0.9', surfaces: { [SID]: { x: 1 } } },
    })
  })

  it('R38: an action carries only the acting surface model, not other sendDataModel surfaces', () => {
    const onAction = vi.fn<(m: A2uiActionMessage, meta: Record<string, unknown>) => void>()
    const { store, data } = setup(
      [{ id: 'root', component: 'Button', children: 'Go', onClick: { event: { name: 'go' } } }],
      { sendDataModel: true },
    )
    store.apply({
      version: 'v0.9',
      createSurface: { surfaceId: 'other', catalogId: A2UI_CATALOG_ID, sendDataModel: true },
    })
    store.apply({
      version: 'v0.9',
      updateDataModel: { surfaceId: 'other', path: '/secret', value: 'of another agent' },
    })
    data('/x', 1)
    mount(store, { onAction })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onAction.mock.calls[0]![1]).toEqual({
      a2uiClientDataModel: { version: 'v0.9', surfaces: { [SID]: { x: 1 } } },
    })
  })

  it('R32: a two-way write over the node limit reports LIMIT_EXCEEDED', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    // The limit counts the written value; 0 leaves no room for even one string.
    const { store } = setup(
      [{ id: 'root', component: 'Input', label: 'Name', value: { path: '/name' } }],
      { limits: { maxDataNodes: 0 } },
    )
    mount(store, { onError })
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x' } })
    await act(async () => {})
    expect(onError.mock.calls.map(([m]) => m.error)).toEqual([
      { code: 'LIMIT_EXCEEDED', surfaceId: SID, message: 'At most 0 JSON nodes per value.' },
    ])
  })

  it('two-way binding: a bound Input fires its own onChange action after writing', () => {
    const onAction = vi.fn<(m: A2uiActionMessage) => void>()
    const { store, data } = setup([
      {
        id: 'root',
        component: 'Input',
        label: 'Q',
        value: { path: '/q' },
        onChange: { event: { name: 'typed', context: { q: { path: '/q' } } } },
      },
    ])
    data('/q', '')
    mount(store, { onAction })
    fireEvent.change(screen.getByLabelText('Q'), { target: { value: 'abc' } })
    expect(onAction).toHaveBeenCalledTimes(1)
    // The bound value is written first, so the action context already sees it.
    expect(onAction.mock.calls[0]![0].action.context['q']).toBe('abc')
  })

  it('template: a List renders one row per item with relative bindings', () => {
    const { store, errors, data } = setup([
      { id: 'root', component: 'List', children: { componentId: 'row', path: '/items' } },
      { id: 'row', component: 'Text', children: { path: 'name' } },
    ])
    data('/items', [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Edsger' }])
    expect(errors).toEqual([])
    const { container } = mount(store)
    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.getByText('Grace')).toBeTruthy()
    expect(screen.getByText('Edsger')).toBeTruthy()
    act(() => data('/items', [{ name: 'Only' }]))
    expect(container.textContent).toBe('Only')
  })

  it('progressive rendering: nothing before root, everything once root arrives; a missing child is a Skeleton', () => {
    const { store, errors, update } = setup([{ id: 'title', component: 'Text', children: 'Title' }])
    const { container } = mount(store, { fallback: <span>loading</span> })
    expect(container.textContent).toBe('loading')
    act(() => update([{ id: 'root', component: 'Flex', children: ['title', 'later'] }]))
    expect(errors).toEqual([])
    expect(screen.getByText('Title')).toBeTruthy()
    expect(container.textContent).not.toContain('loading')
    expect(container.querySelector('[aria-hidden="true"][data-variant="text"]')).not.toBeNull()
    act(() => update([{ id: 'later', component: 'Text', children: 'Later' }]))
    expect(screen.getByText('Later')).toBeTruthy()
    expect(container.querySelector('[aria-hidden="true"][data-variant="text"]')).toBeNull()
  })

  it('Review Focus 2: a↔b cycle and a self-child render without throwing, one RENDER_ERROR per id', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const root = { id: 'root', component: 'Flex', children: ['a', 'root', 'label'] }
    const { store, errors, data, update } = setup([
      root,
      { id: 'a', component: 'Flex', children: ['b'] },
      { id: 'b', component: 'Flex', children: ['a'] },
      { id: 'label', component: 'Text', children: { path: '/t' } },
    ])
    expect(errors).toEqual([])
    expect(() => mount(store, { onError })).not.toThrow()
    // Re-render the whole tree (a re-sent root) and one leaf: still one report per id.
    act(() => update([{ ...root }]))
    act(() => data('/t', 'again'))
    await Promise.resolve()
    const renderErrors = onError.mock.calls
      .map(([m]) => m.error)
      .filter((e) => e.code === 'RENDER_ERROR')
    const ids = renderErrors.map((e) => e.message)
    expect(renderErrors).toHaveLength(2)
    expect(ids.filter((m) => m.includes('"a"'))).toHaveLength(1)
    expect(ids.filter((m) => m.includes('"root"'))).toHaveLength(1)
    expect(renderErrors.every((e) => e.surfaceId === SID)).toBe(true)
  })

  it('Review Focus 2: a tree deeper than maxRenderDepth stops rendering and reports', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const store = createA2uiStore({ catalogs: [cascivoCatalogSpec], limits: { maxRenderDepth: 3 } })
    store.apply({ version: 'v0.9', createSurface: { surfaceId: SID, catalogId: A2UI_CATALOG_ID } })
    store.apply({
      version: 'v0.9',
      updateComponents: {
        surfaceId: SID,
        components: [
          { id: 'root', component: 'Flex', children: ['n1'] },
          { id: 'n1', component: 'Flex', children: ['n2'] },
          { id: 'n2', component: 'Flex', children: ['n3'] },
          { id: 'n3', component: 'Text', children: 'too deep' },
        ],
      },
    })
    const { container } = mount(store, { onError })
    await Promise.resolve()
    expect(container.textContent).not.toContain('too deep')
    expect(onError.mock.calls.filter(([m]) => m.error.code === 'RENDER_ERROR')).toHaveLength(1)
  })

  it('Review Focus 3: unsafe bound URLs render no src/href attribute', () => {
    const { store, errors, data } = setup([
      { id: 'root', component: 'Flex', children: ['img1', 'img2', 'link1', 'link2'] },
      { id: 'img1', component: 'Image', alt: 'one', src: { path: '/u1' } },
      { id: 'img2', component: 'Image', alt: 'two', src: { path: '/u2' } },
      { id: 'link1', component: 'Link', href: { path: '/u1' }, children: 'L1' },
      { id: 'link2', component: 'Link', href: { path: '/u2' }, children: 'L2' },
    ])
    data('/u1', 'javascript:alert(1)')
    data('/u2', ' java\tscript:x')
    expect(errors).toEqual([])
    const { container } = mount(store)
    expect(screen.getByText('L1')).toBeTruthy()
    expect(container.querySelector('[src]')).toBeNull()
    expect(container.querySelector('[href]')).toBeNull()
  })

  it('a safe bound URL is rendered', () => {
    const { store, data } = setup([
      { id: 'root', component: 'Link', href: { path: '/u' }, children: 'Docs' },
    ])
    data('/u', 'https://example.com/docs')
    mount(store)
    expect(screen.getByText('Docs').closest('a')?.getAttribute('href')).toBe(
      'https://example.com/docs',
    )
  })

  it('checks: a Button with a failing required check is disabled; an Input shows the message', () => {
    const required = {
      condition: { call: 'required', args: { value: { path: '/form/email' } } },
      message: 'Email is required',
    }
    const { store, errors, data } = setup([
      { id: 'root', component: 'Flex', children: ['email', 'send'] },
      {
        id: 'email',
        component: 'Input',
        label: 'Email',
        value: { path: '/form/email' },
        checks: [required],
      },
      { id: 'send', component: 'Button', children: 'Send', checks: [required] },
    ])
    data('/form/email', '')
    expect(errors).toEqual([])
    mount(store)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('alert').textContent).toBe('Email is required')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } })
    expect(screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('accessibility.label becomes ariaLabel on components that declare it', () => {
    const { store, errors, data } = setup([
      {
        id: 'root',
        component: 'Input',
        value: { path: '/v' },
        accessibility: { label: { path: '/label' } },
      },
    ])
    data('/v', '')
    data('/label', 'Search term')
    expect(errors).toEqual([])
    mount(store)
    expect(screen.getByLabelText('Search term')).toBeTruthy()
  })

  it('a functionCall action runs the function (openUrl through the host callback)', () => {
    trustGestures()
    const openUrl = vi.fn<(url: string) => void>()
    const { store } = setup([
      {
        id: 'root',
        component: 'Button',
        children: 'Open',
        onClick: { functionCall: { call: 'openUrl', args: { url: 'https://example.com' } } },
      },
    ])
    mount(store, { openUrl })
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(openUrl).toHaveBeenCalledWith('https://example.com')
  })

  it('R30: openUrl never runs while rendering, even from bound formatString text', async () => {
    const openUrl = vi.fn<(url: string) => void>()
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, errors, data } = setup([
      {
        id: 'root',
        component: 'Text',
        children: { call: 'formatString', args: { value: { path: '/t' } } },
      },
    ])
    data('/t', "${openUrl(url:'https://evil.example/')}")
    expect(errors).toEqual([])
    mount(store, { openUrl, onError })
    await act(async () => {})
    expect(openUrl).not.toHaveBeenCalled()
    expect(onError.mock.calls.map(([m]) => m.error)).toEqual([
      { code: 'FUNCTION_ERROR', surfaceId: SID, message: 'openUrl only runs from an action.' },
    ])
  })

  describe('R2: openUrl at dispatch needs transient user activation', () => {
    const activation = (isActive: boolean) =>
      Object.defineProperty(navigator, 'userActivation', {
        value: { isActive },
        configurable: true,
      })
    // jsdom's <dialog> has no showModal/close; stand in as the Modal tests do.
    const dialog = HTMLDialogElement.prototype
    const stubDialog = () => {
      Object.defineProperty(dialog, 'showModal', {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.setAttribute('open', '')
        },
      })
      Object.defineProperty(dialog, 'close', {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.removeAttribute('open')
          this.dispatchEvent(new Event('close'))
        },
      })
    }
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'userActivation')
      Reflect.deleteProperty(dialog, 'showModal')
      Reflect.deleteProperty(dialog, 'close')
    })

    it('without activation, even a trusted handler call does not open, and reports once', async () => {
      activation(false)
      trustGestures()
      stubDialog()
      const openUrl = vi.fn<(url: string) => void>()
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors, data } = setup([
        {
          id: 'root',
          component: 'Modal',
          title: 'Hi',
          open: { path: '/open' },
          onClose: { functionCall: { call: 'openUrl', args: { url: 'https://evil.example/' } } },
          children: 'Body',
        },
      ])
      expect(errors).toEqual([])
      const { container } = mount(store, { openUrl, onError })
      // Modal mirrors its `open` prop in a microtask, so each write is awaited.
      for (let i = 0; i < 2; i++) {
        await act(async () => data('/open', true))
        expect(container.querySelector('dialog[open]')).not.toBeNull()
        await act(async () => data('/open', false))
      }
      await act(async () => {})
      expect(openUrl).not.toHaveBeenCalled()
      expect(onError.mock.calls.map(([m]) => m.error)).toEqual([
        { code: 'FUNCTION_ERROR', surfaceId: SID, message: 'openUrl needs a user gesture.' },
      ])
    })

    it('a Button click with transient activation opens the url', () => {
      activation(true)
      trustGestures()
      const openUrl = vi.fn<(url: string) => void>()
      const { store } = setup([
        {
          id: 'root',
          component: 'Button',
          children: 'Open',
          onClick: { functionCall: { call: 'openUrl', args: { url: 'https://example.com' } } },
        },
      ])
      mount(store, { openUrl })
      fireEvent.click(screen.getByRole('button', { name: 'Open' }))
      expect(openUrl).toHaveBeenCalledWith('https://example.com')
    })
  })

  describe('R41: only a top-level openUrl functionCall opens, and only from a trusted event', () => {
    const activation = (isActive: boolean) =>
      Object.defineProperty(navigator, 'userActivation', {
        value: { isActive },
        configurable: true,
      })
    const dialog = HTMLDialogElement.prototype
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'userActivation')
      Reflect.deleteProperty(dialog, 'showModal')
      Reflect.deleteProperty(dialog, 'close')
    })
    // Nested formatString calls spell `${openUrl(` only once they run: no text scan sees it.
    const composed =
      '${formatString(value:${formatString(value:\'$${formatString(value:"{open")}Url(url:"https://evil.example/")}\')})}'
    const topLevelOnly = {
      code: 'FUNCTION_ERROR',
      surfaceId: SID,
      message: "openUrl only runs as an action's top-level functionCall.",
    }
    const clickOpen = async (onClick: unknown) => {
      activation(true)
      trustGestures()
      const openUrl = vi.fn<(url: string) => void>()
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors } = setup([
        { id: 'root', component: 'Button', children: 'Open', onClick },
      ])
      expect(errors).toEqual([])
      mount(store, { openUrl, onError })
      fireEvent.click(screen.getByRole('button', { name: 'Open' }))
      await act(async () => {})
      return { openUrl, errors: onError.mock.calls.map(([m]) => m.error) }
    }

    it('an openUrl composed in an event context does not open', async () => {
      const { openUrl, errors } = await clickOpen({
        event: {
          name: 'go',
          context: { u: { call: 'formatString', args: { value: composed } } },
        },
      })
      expect(openUrl).not.toHaveBeenCalled()
      expect(errors).toEqual([topLevelOnly])
    })

    it("an openUrl composed in another functionCall, or in openUrl's own args, does not open", async () => {
      const first = await clickOpen({
        functionCall: { call: 'formatString', args: { value: composed } },
      })
      expect(first.openUrl).not.toHaveBeenCalled()
      expect(first.errors).toEqual([topLevelOnly])
      cleanup()
      const second = await clickOpen({
        functionCall: {
          call: 'openUrl',
          args: { url: { call: 'formatString', args: { value: composed } } },
        },
      })
      // The inner call is refused; the outer one opens only what formatString made of that.
      expect(second.openUrl).not.toHaveBeenCalledWith('https://evil.example/')
      expect(second.errors).toContainEqual(topLevelOnly)
    })

    it('a Modal closed by the agent while activation is still active does not open', async () => {
      activation(true)
      Object.defineProperty(dialog, 'showModal', {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.setAttribute('open', '')
        },
      })
      Object.defineProperty(dialog, 'close', {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.removeAttribute('open')
          this.dispatchEvent(new Event('close'))
        },
      })
      const openUrl = vi.fn<(url: string) => void>()
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors, data } = setup([
        {
          id: 'root',
          component: 'Modal',
          title: 'Hi',
          open: { path: '/open' },
          onClose: { functionCall: { call: 'openUrl', args: { url: 'https://evil.example/' } } },
          children: 'Body',
        },
      ])
      expect(errors).toEqual([])
      mount(store, { openUrl, onError })
      await act(async () => data('/open', true))
      await act(async () => data('/open', false))
      await act(async () => {})
      expect(openUrl).not.toHaveBeenCalled()
      expect(onError.mock.calls.map(([m]) => m.error)).toEqual([
        {
          code: 'FUNCTION_ERROR',
          surfaceId: SID,
          message: 'openUrl needs a user gesture on the control.',
        },
      ])
    })

    it('an untrusted click does not open', () => {
      activation(true)
      const openUrl = vi.fn<(url: string) => void>()
      const { store } = setup([
        {
          id: 'root',
          component: 'Button',
          children: 'Open',
          onClick: { functionCall: { call: 'openUrl', args: { url: 'https://example.com' } } },
        },
      ])
      mount(store, { openUrl })
      fireEvent.click(screen.getByRole('button', { name: 'Open' }))
      expect(openUrl).not.toHaveBeenCalled()
    })
  })

  it('R30: the store refuses an openUrl call in a rendered prop', () => {
    const { errors } = setup([
      {
        id: 'root',
        component: 'Text',
        children: { call: 'openUrl', args: { url: 'https://evil.example/' } },
      },
    ])
    expect(errors.map((e) => [e.error.code, e.error.path])).toEqual([
      ['VALIDATION_FAILED', '/components/0/children'],
    ])
  })

  it('renders the fallback when the surface does not exist yet', () => {
    const store = createA2uiStore({ catalogs: [cascivoCatalogSpec] })
    const { container } = mount(store, { fallback: <span>wait</span> })
    expect(container.textContent).toBe('wait')
    act(() => {
      store.apply({
        version: 'v0.9',
        createSurface: { surfaceId: SID, catalogId: A2UI_CATALOG_ID },
      })
      store.apply({
        version: 'v0.9',
        updateComponents: {
          surfaceId: SID,
          components: [{ id: 'root', component: 'Text', children: 'Up' }],
        },
      })
    })
    expect(container.textContent).toBe('Up')
  })

  it('fix 1: a render-time error is reported once even when onError re-renders the host', async () => {
    const { store, errors } = setup([{ id: 'root', component: 'Text', children: { path: 'rel' } }])
    expect(errors).toEqual([])
    let calls = 0
    function Host(): React.ReactNode {
      const [count, setCount] = React.useState(0)
      return (
        <>
          <span data-testid="count">{count}</span>
          <A2uiSurface
            store={store}
            surfaceId={SID}
            catalogs={[cascivoCatalog]}
            onError={() => {
              calls++
              setCount((n) => n + 1)
            }}
          />
        </>
      )
    }
    render(<Host />)
    for (let i = 0; i < 10; i++) await act(async () => {})
    expect(calls).toBe(1)
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('fix 1: an error at dispatch time is reported every time', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store } = setup([
      {
        id: 'root',
        component: 'Button',
        children: 'Open',
        onClick: { functionCall: { call: 'openUrl', args: { url: 'javascript:x' } } },
      },
    ])
    mount(store, { onError })
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await act(async () => {})
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('fix 2: a RadioCardGroup binds value; selecting a card writes the path', () => {
    const { store, errors, data } = setup([
      {
        id: 'root',
        component: 'RadioCardGroup',
        name: 'plan',
        label: 'Plan',
        value: { path: '/plan' },
        children: ['basic', 'pro'],
      },
      { id: 'basic', component: 'RadioCard', value: 'basic', title: 'basicTitle' },
      { id: 'pro', component: 'RadioCard', value: 'pro', title: 'proTitle' },
      { id: 'basicTitle', component: 'Text', children: 'Basic' },
      { id: 'proTitle', component: 'Text', children: 'Pro' },
    ])
    data('/plan', 'basic')
    expect(errors).toEqual([])
    const { container } = mount(store)
    const pro = container.querySelector<HTMLInputElement>('input[value="pro"]')!
    fireEvent.click(pro)
    expect(store.surface(SID)?.data.snapshot()).toEqual({ plan: 'pro' })
    expect(pro.checked).toBe(true)
  })

  // DatePicker is left out: it logs "Cannot update a component while rendering" on any change
  // of its controlled value, bound or not (a component bug, outside the renderer).
  it('fix 3: two-way components bound to a missing path log no React error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { store, errors, data } = setup([
        {
          id: 'root',
          component: 'Flex',
          children: ['in', 'ta', 'cb', 'sl', 'ni', 'cc', 'tg', 'rg', 'tp', 'pg'],
        },
        { id: 'in', component: 'Input', label: 'In', value: { path: '/in' } },
        { id: 'ta', component: 'Textarea', label: 'Ta', value: { path: '/ta' } },
        { id: 'cb', component: 'Checkbox', label: 'Cb', checked: { path: '/cb' } },
        { id: 'sl', component: 'Slider', label: 'Sl', value: { path: '/sl' } },
        { id: 'ni', component: 'NumberInput', label: 'Ni', value: { path: '/ni' } },
        { id: 'cc', component: 'CheckboxCard', title: 'ccTitle', checked: { path: '/cc' } },
        { id: 'ccTitle', component: 'Text', children: 'Cc' },
        { id: 'tg', component: 'Toggle', label: 'Tg', checked: { path: '/tg' } },
        {
          id: 'rg',
          component: 'RadioCardGroup',
          name: 'rg',
          label: 'Rg',
          value: { path: '/rg' },
          children: ['rgA'],
        },
        { id: 'rgA', component: 'RadioCard', value: 'a', title: 'ccTitle' },
        {
          id: 'pg',
          component: 'Pagination',
          page: { path: '/pg' },
          pageSize: 10,
          totalItems: 50,
          onPageChange: { event: { name: 'page' } },
        },
        { id: 'tp', component: 'TimePicker', label: 'Tp', value: { path: '/tp' } },
      ])
      expect(errors).toEqual([])
      mount(store)
      act(() => {
        data('/in', 'x')
        data('/ta', 'y')
        data('/cb', true)
        data('/sl', 40)
        data('/ni', 3)
        data('/cc', true)
        data('/tg', true)
        data('/rg', 'a')
        data('/pg', 2)
        data('/tp', '10:30')
      })
      expect((screen.getByLabelText('In') as HTMLInputElement).value).toBe('x')
      expect(error).not.toHaveBeenCalled()
    } finally {
      error.mockRestore()
    }
  })

  it('fix 4: duplicate child ids render without a React key warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { store } = setup([
        { id: 'root', component: 'Flex', children: ['a', 'a'] },
        { id: 'a', component: 'Text', children: 'twice' },
      ])
      mount(store)
      expect(screen.getAllByText('twice')).toHaveLength(2)
      expect(error).not.toHaveBeenCalled()
    } finally {
      error.mockRestore()
    }
  })

  it('fix 5: AdapterInput.report reports once per component, with its code', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, data } = setup(
      [
        { id: 'root', component: 'Flex', children: ['r', 'label'] },
        { id: 'r', component: 'Reporter' },
        { id: 'label', component: 'Text', children: { path: '/t' } },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    mount(store, { onError })
    act(() => data('/t', 'again'))
    act(() =>
      store.apply({
        version: 'v0.9',
        updateComponents: {
          surfaceId: SID,
          components: [{ id: 'root', component: 'Flex', children: ['r', 'label'] }],
        },
      }),
    )
    await act(async () => {})
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]![0].error).toEqual({
      code: 'UNSUPPORTED_COMPONENT',
      surfaceId: SID,
      message: 'Reporter is not supported.',
    })
  })

  it('fix 6: a recursive template over tree data renders every level without RENDER_ERROR', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, errors, data } = setup([
      { id: 'root', component: 'List', children: { componentId: 'row', path: '/tree' } },
      { id: 'row', component: 'Flex', children: ['name', 'sub'] },
      { id: 'name', component: 'Text', children: { path: 'name' } },
      { id: 'sub', component: 'List', children: { componentId: 'row', path: 'children' } },
    ])
    data('/tree', [
      { name: 'A', children: [{ name: 'A1', children: [] }] },
      { name: 'B', children: [] },
    ])
    expect(errors).toEqual([])
    mount(store, { onError })
    await act(async () => {})
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('A1')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
    expect(onError).not.toHaveBeenCalled()
  })

  const list10 = Array.from({ length: 10 }, (_, i) => ({ n: i }))
  const renderErrorsOf = (onError: { mock: { calls: [A2uiErrorMessage][] } }) =>
    onError.mock.calls.map(([m]) => m.error).filter((e) => e.code === 'RENDER_ERROR')

  it('R18 (a): a self-template over an absolute list renders one level and reports once', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, errors, data } = setup(
      [
        { id: 'root', component: 'Box', children: ['a'] },
        { id: 'a', component: 'Box', children: { componentId: 'a', path: '/list' } },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    data('/list', list10)
    expect(errors).toEqual([])
    const { container } = mount(store, { onError })
    await act(async () => {})
    // The top `a` plus one `a` per item; their own self-templates are cycles.
    expect(container.querySelectorAll('[data-box="a"]')).toHaveLength(11)
    expect(renderErrorsOf(onError)).toHaveLength(1)
  })

  it('R18 (c): a↔b and root→root are still flagged', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store } = setup(
      [
        { id: 'root', component: 'Box', children: ['a', 'root'] },
        { id: 'a', component: 'Box', children: ['b'] },
        { id: 'b', component: 'Box', children: ['a'] },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box]')).toHaveLength(3)
    expect(renderErrorsOf(onError).map((e) => e.message)).toEqual([
      expect.stringContaining('"a"'),
      expect.stringContaining('"root"'),
    ])
  })

  it('R18 (d): a↔b alternating over one absolute list is flagged and bounded', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, data } = setup(
      [
        { id: 'root', component: 'Box', children: ['a'] },
        { id: 'a', component: 'Box', children: { componentId: 'b', path: '/list' } },
        { id: 'b', component: 'Box', children: { componentId: 'a', path: '/list' } },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    data('/list', list10)
    const { container } = mount(store, { onError })
    await act(async () => {})
    // a@'' → b@/list/i (10) → a@/list/j (100, they descend ''); the next b is a sibling item of
    // its nearest b, a cycle. Polynomial, not n!.
    expect(container.querySelectorAll('[data-box="b"]')).toHaveLength(10)
    expect(container.querySelectorAll('[data-box="a"]')).toHaveLength(101)
    expect(renderErrorsOf(onError)).toHaveLength(1)
  })

  const ten = (id: string) => Array.from({ length: 10 }, () => id)
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ n: i }))

  it('R19 (a): a static fan-out DAG stops at maxRenderNodes with one RENDER_ERROR', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const ids = ['root', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    const { store, errors } = setup(
      ids.map((id, i) =>
        i < ids.length - 1
          ? { id, component: 'Box', children: ten(ids[i + 1]!) }
          : { id, component: 'Box' },
      ),
      // An explicit limit below the default keeps the fan-out fast in jsdom and still overflowing.
      { catalogId: SPY_CATALOG_ID, limits: { maxRenderNodes: 5000 } },
    )
    expect(errors).toEqual([])
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box]').length).toBeLessThanOrEqual(5000)
    const limit = renderErrorsOf(onError)
    expect(limit).toHaveLength(1)
    expect(limit[0]!.message).toContain('maxRenderNodes')
  })

  it('R19 (b): a template fan-out DAG over one absolute list is bounded', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const ids = ['root', 'c1', 'c2', 'c3', 'c4']
    const { store, data } = setup(
      ids.map((id, i) =>
        i < ids.length - 1
          ? { id, component: 'Box', children: { componentId: ids[i + 1], path: '/list' } }
          : { id, component: 'Box' },
      ),
      // An explicit limit below the default keeps the fan-out fast in jsdom and still overflowing.
      { catalogId: SPY_CATALOG_ID, limits: { maxRenderNodes: 5000 } },
    )
    data('/list', rows(10))
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box]').length).toBeLessThanOrEqual(5000)
    expect(renderErrorsOf(onError)).toHaveLength(1)
  })

  it('R19 (c): a 1,000-row template beside two siblings renders every row', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, errors, data } = setup(
      [
        { id: 'root', component: 'Flex', children: ['head', 'list', 'foot'] },
        { id: 'head', component: 'Text', children: 'Head' },
        { id: 'list', component: 'Box', children: { componentId: 'row', path: '/rows' } },
        { id: 'row', component: 'Box' },
        { id: 'foot', component: 'Text', children: 'Foot' },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    data('/rows', rows(1000))
    expect(errors).toEqual([])
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box="row"]')).toHaveLength(1000)
    expect(screen.getByText('Head')).toBeTruthy()
    expect(screen.getByText('Foot')).toBeTruthy()
    expect(onError).not.toHaveBeenCalled()
  })

  it('R19 (d): maxRenderNodes 10 truncates a 20-row list with one error', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, data } = setup(
      [
        { id: 'root', component: 'Box', children: { componentId: 'row', path: '/rows' } },
        { id: 'row', component: 'Box' },
      ],
      { catalogId: SPY_CATALOG_ID, limits: { maxRenderNodes: 10 } },
    )
    data('/rows', rows(20))
    const { container } = mount(store, { onError })
    await act(async () => {})
    // The root takes 1; the remaining 9 go to the first 9 rows.
    expect(container.querySelectorAll('[data-box="row"]')).toHaveLength(9)
    expect(renderErrorsOf(onError)).toHaveLength(1)
  })

  it('R20 (a): children() with 10 ids on a 6-level fan-out stays within maxRenderNodes', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const ids = ['root', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    const { store, errors } = setup(
      ids.map((id, i) =>
        i < ids.length - 1
          ? { id, component: 'Fan', children: ten(ids[i + 1]!) }
          : { id, component: 'Fan' },
      ),
      // An explicit limit below the default keeps the fan-out fast in jsdom and still overflowing.
      { catalogId: SPY_CATALOG_ID, limits: { maxRenderNodes: 5000 } },
    )
    expect(errors).toEqual([])
    const { container } = mount(store, { onError })
    await act(async () => {})
    const rendered = container.querySelectorAll('[data-box]').length
    expect(rendered).toBeGreaterThan(1000)
    expect(rendered).toBeLessThanOrEqual(5000)
    const limit = renderErrorsOf(onError)
    expect(limit).toHaveLength(1)
    expect(limit[0]!.message).toContain('maxRenderNodes')
  })

  it('R20 (b): a second children() call in one render renders nothing and reports once', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store } = setup(
      [
        { id: 'root', component: 'Twice', children: ['x', 'y'] },
        { id: 'x', component: 'Box' },
        { id: 'y', component: 'Box' },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box="x"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-box="y"]')).toHaveLength(1)
    expect(container.querySelector('[data-second]')!.childElementCount).toBe(0)
    const errs = renderErrorsOf(onError)
    expect(errs).toHaveLength(1)
    expect(errs[0]!.message).toContain('children() may be called once per render')
  })

  it("R20 (c): a second slot('children') call in one render renders nothing", async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store } = setup(
      [
        { id: 'root', component: 'SlotTwice', children: ['x'] },
        { id: 'x', component: 'Box' },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    const { container } = mount(store, { onError })
    await act(async () => {})
    expect(container.querySelectorAll('[data-box="x"]')).toHaveLength(1)
    expect(container.querySelector('[data-second]')!.childElementCount).toBe(0)
    const errs = renderErrorsOf(onError)
    expect(errs).toHaveLength(1)
    expect(errs[0]!.message).toContain('may be called once per render')
  })

  it('R20 (d): 1,000 Flex rows of two Texts beside two Texts fully render at the default limit', async () => {
    const onError = vi.fn<(m: A2uiErrorMessage) => void>()
    const { store, errors, data } = setup(
      [
        { id: 'root', component: 'Column', children: ['head', 'list', 'foot'] },
        { id: 'head', component: 'Text', children: 'Head' },
        { id: 'list', component: 'Column', children: { componentId: 'row', path: '/rows' } },
        { id: 'row', component: 'Flex', children: ['label', 'value'] },
        { id: 'label', component: 'Text', children: { path: 'a' } },
        { id: 'value', component: 'Text', children: { path: 'b' } },
        { id: 'foot', component: 'Text', children: 'Foot' },
      ],
      { catalogId: SPY_CATALOG_ID },
    )
    data(
      '/rows',
      Array.from({ length: 1000 }, (_, i) => ({ a: `a${i}`, b: `b${i}` })),
    )
    expect(errors).toEqual([])
    mount(store, { onError })
    await act(async () => {})
    expect(screen.getAllByText(/^a\d+$/)).toHaveLength(1000)
    expect(screen.getAllByText(/^b\d+$/)).toHaveLength(1000)
    expect(screen.getByText('b999')).toBeTruthy()
    expect(screen.getByText('Head')).toBeTruthy()
    expect(screen.getByText('Foot')).toBeTruthy()
    expect(onError).not.toHaveBeenCalled()
  })

  describe('C1: bound values are type-checked; a crashing node does not unmount the host', () => {
    const renderErrors = (onError: { mock: { calls: [A2uiErrorMessage][] } }) =>
      onError.mock.calls.map(([m]) => m.error).filter((e) => e.code === 'RENDER_ERROR')

    it('Alert.title bound to an object renders without it and reports the prop', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors, data } = setup([
        { id: 'root', component: 'Flex', children: ['alert', 'ok'] },
        { id: 'alert', component: 'Alert', title: { path: '/t' }, children: 'Body' },
        { id: 'ok', component: 'Text', children: 'Sibling' },
      ])
      data('/t', { a: 1 })
      expect(errors).toEqual([])
      const { container } = mount(store, { onError })
      await act(async () => {})
      expect(container.textContent).toContain('Body')
      expect(container.textContent).toContain('Sibling')
      expect(renderErrors(onError)).toEqual([
        {
          code: 'RENDER_ERROR',
          surfaceId: SID,
          message: expect.stringMatching(/"alert".*"title".*expected string/),
        },
      ])
    })

    it('Breadcrumb.items bound to a string, or computed by a call, is dropped and reported', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors, data } = setup([
        { id: 'root', component: 'Flex', children: ['b1', 'b2', 'ok'] },
        { id: 'b1', component: 'Breadcrumb', items: { path: '/t' } },
        {
          id: 'b2',
          component: 'Breadcrumb',
          items: { call: 'formatString', args: { value: 'x' } },
        },
        { id: 'ok', component: 'Text', children: 'Sibling' },
      ])
      data('/t', 'x')
      expect(errors).toEqual([])
      const { container } = mount(store, { onError })
      await act(async () => {})
      expect(container.textContent).toContain('Sibling')
      const messages = renderErrors(onError).map((e) => e.message)
      expect(messages.some((m) => m.includes('"b1"') && m.includes('"items"'))).toBe(true)
      expect(messages.some((m) => m.includes('"b2"') && m.includes('"items"'))).toBe(true)
    })

    it('a bound {$t} or an object in an untyped prop is dropped and reported', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const { store, errors, data } = setup([
        { id: 'root', component: 'Flex', children: ['a1', 'a2', 'ok'] },
        { id: 'a1', component: 'Alert', title: { path: '/ref' }, children: 'One' },
        { id: 'a2', component: 'Alert', action: { path: '/obj' }, children: 'Two' },
        { id: 'ok', component: 'Text', children: 'Sibling' },
      ])
      data('/ref', { $t: 'nope' })
      data('/obj', { a: 1 })
      expect(errors).toEqual([])
      const { container } = mount(store, { onError })
      await act(async () => {})
      expect(container.textContent).toContain('One')
      expect(container.textContent).toContain('Two')
      // The dropped action renders no action button.
      expect(container.querySelector('button')).toBeNull()
      expect(container.textContent).toContain('Sibling')
      const messages = renderErrors(onError).map((e) => e.message)
      expect(messages.some((m) => m.includes('"a1"') && m.includes('"title"'))).toBe(true)
      expect(messages.some((m) => m.includes('"a2"') && m.includes('"action"'))).toBe(true)
    })

    it('a bound string or number in an untyped prop still renders', () => {
      const { store, data } = setup([
        { id: 'root', component: 'Heading', level: { path: '/n' }, children: 'Title' },
      ])
      data('/n', 3)
      const { container } = mount(store)
      expect(container.querySelector('h3')?.textContent).toBe('Title')
    })

    it('the cascivo spec refuses a literal {$t}: agents cannot know host i18n keys', () => {
      const { errors } = setup([
        { id: 'root', component: 'Alert', title: { $t: 'nope' }, children: 'Body' },
      ])
      expect(errors.map((e) => e.error)).toEqual([
        {
          code: 'VALIDATION_FAILED',
          surfaceId: SID,
          path: '/components/0/title',
          message: expect.stringContaining('$t'),
        },
      ])
    })

    it('a throwing adapter renders nothing, reports once, and leaves its siblings rendered', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { store } = setup(
        [
          { id: 'root', component: 'Box', children: ['bad', 'ok'] },
          { id: 'bad', component: 'Throws' },
          { id: 'ok', component: 'Text', children: 'Sibling' },
        ],
        { catalogId: SPY_CATALOG_ID },
      )
      const { container } = render(
        <div>
          <span>Host</span>
          <A2uiSurface store={store} surfaceId={SID} catalogs={[spyCatalog]} onError={onError} />
        </div>,
      )
      await act(async () => {})
      quiet.mockRestore()
      expect(container.textContent).toContain('Host')
      expect(container.textContent).toContain('Sibling')
      expect(renderErrors(onError)).toEqual([
        {
          code: 'RENDER_ERROR',
          surfaceId: SID,
          message: 'Component "bad" failed to render: adapter bug',
        },
      ])
    })
  })

  describe('R1: a node waits for its required data and recovers after a crash', () => {
    const renderErrors = (onError: { mock: { calls: [A2uiErrorMessage][] } }) =>
      onError.mock.calls.map(([m]) => m.error).filter((e) => e.code === 'RENDER_ERROR')
    const skeleton = (container: HTMLElement) =>
      container.querySelector('[aria-hidden="true"][data-variant="text"]')

    it('a required prop bound before its data renders a Skeleton, then the component', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { store, errors, data } = setup([
        { id: 'root', component: 'Flex', children: ['crumbs', 'alert'] },
        { id: 'crumbs', component: 'Breadcrumb', items: { path: '/s' } },
        { id: 'alert', component: 'Alert', title: { path: '/t' }, children: 'Body' },
      ])
      expect(errors).toEqual([])
      const { container } = mount(store, { onError })
      await act(async () => {})
      expect(skeleton(container)).not.toBeNull()
      act(() => data('/s', [{ label: 'Home', href: '/' }, { label: 'Docs' }]))
      act(() => data('/t', 'Title'))
      await act(async () => {})
      quiet.mockRestore()
      expect(skeleton(container)).toBeNull()
      expect(container.textContent).toContain('Home')
      expect(container.textContent).toContain('Docs')
      expect(container.textContent).toContain('Title')
      expect(renderErrors(onError)).toEqual([])
    })

    it('a required prop dropped on a type mismatch is a Skeleton with one report, not a crash', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { store, errors, data } = setup([
        { id: 'root', component: 'Breadcrumb', items: { path: '/s' } },
      ])
      data('/s', 'x')
      expect(errors).toEqual([])
      const { container } = mount(store, { onError })
      await act(async () => {})
      quiet.mockRestore()
      expect(skeleton(container)).not.toBeNull()
      expect(renderErrors(onError)).toEqual([
        {
          code: 'RENDER_ERROR',
          surfaceId: SID,
          message: expect.stringMatching(/"root".*bound value dropped.*"items"/),
        },
      ])
      act(() => data('/s', [{ label: 'Fixed' }]))
      expect(container.textContent).toContain('Fixed')
    })

    it('a crashed node renders again after the next data write; a re-crash is not re-reported', async () => {
      const onError = vi.fn<(m: A2uiErrorMessage) => void>()
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { store, data } = setup(
        [
          { id: 'root', component: 'Box', children: ['bad', 'ok'] },
          { id: 'bad', component: 'ThrowsWhen', when: { path: '/flag' } },
          { id: 'ok', component: 'Text', children: 'Sibling' },
        ],
        { catalogId: SPY_CATALOG_ID },
      )
      data('/flag', true)
      const { container } = mount(store, { onError })
      await act(async () => {})
      expect(container.textContent).not.toContain('recovered')
      act(() => data('/flag', false))
      expect(container.textContent).toContain('recovered')
      act(() => data('/flag', true))
      expect(container.textContent).not.toContain('recovered')
      act(() => data('/flag', false))
      await act(async () => {})
      quiet.mockRestore()
      expect(container.textContent).toContain('recovered')
      expect(container.textContent).toContain('Sibling')
      expect(renderErrors(onError)).toEqual([
        {
          code: 'RENDER_ERROR',
          surfaceId: SID,
          message: 'Component "bad" failed to render: flag is set',
        },
      ])
    })
  })

  it('fix 7: changing the component type of an id remounts it, so adapter hooks stay safe', () => {
    const { store, update } = setup([{ id: 'root', component: 'Hooked' }], {
      catalogId: SPY_CATALOG_ID,
    })
    mount(store)
    expect(screen.getByTestId('hooked')).toBeTruthy()
    act(() => update([{ id: 'root', component: 'Text', children: 'Plain' }]))
    expect(screen.getByText('Plain')).toBeTruthy()
  })
})

describe('TWO_WAY', () => {
  it('pairs each component with a prop and event it really declares', () => {
    expect(TWO_WAY['Input']).toEqual({ prop: 'value', event: 'onChange' })
    expect(TWO_WAY['Toggle']).toEqual({ prop: 'checked', event: 'onValueChange' })
    expect(TWO_WAY['CheckboxCard']).toEqual({ prop: 'checked', event: 'onCheckedChange' })
    expect(TWO_WAY['Pagination']).toEqual({ prop: 'page', event: 'onPageChange' })
    expect(TWO_WAY['Modal']).toEqual({ prop: 'open', event: 'onClose' })
  })

  it('names only events and props the generated catalog data declares', () => {
    for (const [name, { prop, event }] of Object.entries(TWO_WAY)) {
      expect(a2uiComponents[name]?.events, name).toContain(event)
      // RadioCardGroup has no manifest prop schema yet, so its `value` cannot be sent at all.
      if (name === 'RadioCardGroup') continue
      expect(
        propSchemas[name]?.map((p) => p.name),
        name,
      ).toContain(prop)
    }
  })

  it('twoWayValue: Slider coerces to a number, Modal writes false, others unwrap the event', () => {
    expect(twoWayValue('Slider', { target: { value: '42' } })).toBe(42)
    expect(twoWayValue('Modal', undefined)).toBe(false)
    expect(twoWayValue('Checkbox', { target: { type: 'checkbox', checked: true } })).toBe(true)
    expect(twoWayValue('Toggle', false)).toBe(false)
  })
})
