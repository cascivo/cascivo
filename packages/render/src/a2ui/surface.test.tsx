import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { a2uiComponents } from '../a2ui-catalog-data'
import { propSchemas } from '../prop-schemas'
import { cascivoCatalogSpec } from './catalog-spec'
import type { A2uiCatalogSpec } from './catalog-spec'
import { A2UI_CATALOG_ID } from './messages'
import type { A2uiActionMessage, A2uiErrorMessage } from './messages'
import { createA2uiStore } from './store'
import type { A2uiStore } from './store'
import { A2uiSurface, cascivoCatalog } from './surface'
import type { A2uiRenderCatalog } from './surface'
import { TWO_WAY, twoWayValue } from './two-way'

afterEach(() => cleanup())

// Test-only catalog: the cascivo catalog plus a `Spy` that counts its own renders.
const SPY_CATALOG_ID = 'test:spy-catalog'
let spyRenders = 0
const spySpec: A2uiCatalogSpec = {
  id: SPY_CATALOG_ID,
  has: (c) => c === 'Spy' || cascivoCatalogSpec.has(c),
  validate: (c) => (c.component === 'Spy' ? [] : cascivoCatalogSpec.validate(c)),
}
const spyCatalog: A2uiRenderCatalog = {
  id: SPY_CATALOG_ID,
  adapter: (c) =>
    c === 'Spy'
      ? () => {
          spyRenders++
          return <span data-testid="spy">spy</span>
        }
      : cascivoCatalog.adapter(c),
}

const SID = 's1'

function setup(
  components: unknown[],
  options: { catalogId?: string; sendDataModel?: boolean } = {},
) {
  const store = createA2uiStore({ catalogs: [cascivoCatalogSpec, spySpec] })
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
    React.act(() => data('/greeting', 'Hello again'))
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
    React.act(() => data('/items', [{ name: 'Only' }]))
    expect(container.textContent).toBe('Only')
  })

  it('progressive rendering: nothing before root, everything once root arrives; a missing child is a Skeleton', () => {
    const { store, errors, update } = setup([{ id: 'title', component: 'Text', children: 'Title' }])
    const { container } = mount(store, { fallback: <span>loading</span> })
    expect(container.textContent).toBe('loading')
    React.act(() => update([{ id: 'root', component: 'Flex', children: ['title', 'later'] }]))
    expect(errors).toEqual([])
    expect(screen.getByText('Title')).toBeTruthy()
    expect(container.textContent).not.toContain('loading')
    expect(container.querySelector('[aria-hidden="true"][data-variant="text"]')).not.toBeNull()
    React.act(() => update([{ id: 'later', component: 'Text', children: 'Later' }]))
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
    React.act(() => update([{ ...root }]))
    React.act(() => data('/t', 'again'))
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

  it('renders the fallback when the surface does not exist yet', () => {
    const store = createA2uiStore({ catalogs: [cascivoCatalogSpec] })
    const { container } = mount(store, { fallback: <span>wait</span> })
    expect(container.textContent).toBe('wait')
    React.act(() => {
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
