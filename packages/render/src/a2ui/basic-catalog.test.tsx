import { createLocale } from '@cascivo/i18n'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { basicCatalog } from './basic-catalog'
import { basicCatalogSpec } from './basic-spec'
import { BASIC_CATALOG_ID, parseServerMessage } from './messages'
import type { A2uiActionMessage, A2uiErrorMessage } from './messages'
import { createA2uiStore } from './store'
import type { A2uiStore } from './store'
import { A2uiSurface } from './surface'

// jsdom has no top layer; Modal opens through showModal().
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  })
})
afterEach(() => cleanup())

const flush = async (): Promise<void> => {
  await Promise.resolve()
}

const SID = 'booking'

function setup(components: unknown[], data?: Record<string, unknown>) {
  const store = createA2uiStore({ catalogs: [basicCatalogSpec] })
  const errors: A2uiErrorMessage[] = []
  const send = (msg: Record<string, unknown>) => {
    errors.push(...store.apply({ version: 'v0.9', ...msg }))
  }
  send({ createSurface: { surfaceId: SID, catalogId: BASIC_CATALOG_ID } })
  if (data !== undefined) send({ updateDataModel: { surfaceId: SID, path: '/', value: data } })
  send({ updateComponents: { surfaceId: SID, components } })
  const snapshot = () => store.surface(SID)?.data.snapshot()
  const setData = (path: string, value: unknown) =>
    send({ updateDataModel: { surfaceId: SID, path, value } })
  return { store, errors, snapshot, setData }
}

function mount(store: A2uiStore, extra: Partial<React.ComponentProps<typeof A2uiSurface>> = {}) {
  return render(<A2uiSurface store={store} surfaceId={SID} catalogs={[basicCatalog]} {...extra} />)
}

/** A root Column holding `ids`, plus the components themselves. */
const column = (ids: string[], ...components: unknown[]): unknown[] => [
  { id: 'root', component: 'Column', children: ids },
  ...components,
]

const text = (id: string, value: unknown, variant?: string) => ({
  id,
  component: 'Text',
  text: value,
  ...(variant === undefined ? {} : { variant }),
})

describe('basicCatalog', () => {
  it('has the basic catalog id', () => {
    expect(basicCatalog.id).toBe(BASIC_CATALOG_ID)
  })

  describe('end to end: a restaurant booking surface', () => {
    // The JSONL stream an agent would send, one message per line.
    const JSONL = [
      { createSurface: { surfaceId: SID, catalogId: BASIC_CATALOG_ID } },
      { updateDataModel: { surfaceId: SID, path: '/booking', value: { name: '', date: '' } } },
      {
        updateComponents: {
          surfaceId: SID,
          components: [
            { id: 'root', component: 'Column', children: ['title', 'name', 'date', 'book'] },
            { id: 'title', component: 'Text', text: 'Book a table', variant: 'h2' },
            {
              id: 'name',
              component: 'TextField',
              label: 'Your name',
              value: { path: '/booking/name' },
            },
            {
              id: 'date',
              component: 'DateTimeInput',
              label: 'Date',
              value: { path: '/booking/date' },
              enableDate: true,
            },
            {
              id: 'book',
              component: 'Button',
              child: 'bookLabel',
              variant: 'primary',
              action: {
                event: {
                  name: 'book',
                  context: { name: { path: '/booking/name' }, date: { path: '/booking/date' } },
                },
              },
            },
            { id: 'bookLabel', component: 'Text', text: 'Book' },
          ],
        },
      },
    ]
      .map((m) => JSON.stringify({ version: 'v0.9', ...m }))
      .join('\n')

    function stream() {
      const store = createA2uiStore({ catalogs: [basicCatalogSpec] })
      const errors: A2uiErrorMessage[] = []
      for (const line of JSONL.split('\n')) {
        const parsed = parseServerMessage(JSON.parse(line))
        expect(parsed.ok).toBe(true)
        errors.push(...store.apply(JSON.parse(line)))
      }
      return { store, errors }
    }

    it('renders a heading, an input, a date picker and a button', () => {
      const { store, errors } = stream()
      expect(errors).toEqual([])
      mount(store)
      expect(screen.getByRole('heading', { level: 2, name: 'Book a table' })).toBeTruthy()
      expect(screen.getByRole('textbox', { name: 'Your name' })).toBeTruthy()
      expect(screen.getByRole('combobox', { name: 'Date' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Book' })).toBeTruthy()
    })

    it('typing and then clicking emits one action whose context has the typed value', () => {
      const { store } = stream()
      const onAction = vi.fn<(m: A2uiActionMessage) => void>()
      mount(store, { onAction })
      fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), {
        target: { value: 'Ada' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Book' }))
      expect(onAction).toHaveBeenCalledTimes(1)
      const message = onAction.mock.calls[0]![0]
      expect(message.action.name).toBe('book')
      expect(message.action.sourceComponentId).toBe('book')
      expect(message.action.context['name']).toBe('Ada')
    })
  })

  describe('Text', () => {
    it.each([1, 2, 3, 4, 5])('h%i renders a Heading of that level', (level) => {
      const { store } = setup(column(['t'], text('t', 'Title', `h${level}`)))
      mount(store)
      expect(screen.getByRole('heading', { level, name: 'Title' })).toBeTruthy()
    })

    it('caption renders a small muted Text', () => {
      const { store } = setup(column(['t'], text('t', 'Small print', 'caption')))
      mount(store)
      const el = screen.getByText('Small print')
      expect(el.tagName).toBe('P')
      expect(el.className).toMatch(/_text_/)
      expect(el.getAttribute('data-size')).toBe('sm')
      expect(el.hasAttribute('data-muted')).toBe(true)
    })

    it('body and no variant render a plain Text, verbatim with no Markdown', () => {
      const { store } = setup(
        column(['a', 'b'], text('a', '**not bold**', 'body'), text('b', '# not a heading')),
      )
      const { container } = mount(store)
      for (const value of ['**not bold**', '# not a heading']) {
        const el = screen.getByText(value)
        expect(el.className).toMatch(/_text_/)
        expect(el.getAttribute('data-size')).toBe('md')
      }
      expect(container.querySelector('strong, h1')).toBeNull()
    })

    it('a bound text follows the data model', () => {
      const { store, setData } = setup(column(['t'], text('t', { path: '/msg' })), { msg: 'One' })
      mount(store)
      expect(screen.getByText('One')).toBeTruthy()
      act(() => setData('/msg', 'Two'))
      expect(screen.getByText('Two')).toBeTruthy()
    })
  })

  it('Image renders an Image with src and alt', () => {
    const { store } = setup(
      column(['i'], {
        id: 'i',
        component: 'Image',
        url: 'https://example.com/a.png',
        description: 'A dish',
        fit: 'cover',
        variant: 'header',
      }),
    )
    mount(store)
    const img = screen.getByRole('img', { name: 'A dish' })
    expect(img.getAttribute('src')).toBe('https://example.com/a.png')
  })

  it('Icon renders nothing and reports UNSUPPORTED_COMPONENT once', async () => {
    const onError = vi.fn<(e: A2uiErrorMessage) => void>()
    const { store, errors, setData } = setup(
      column(
        ['i', 'label'],
        { id: 'i', component: 'Icon', name: 'star' },
        text('label', { path: '/n' }),
      ),
      { n: 'a' },
    )
    expect(errors).toEqual([])
    const { container } = mount(store, { onError })
    // A data change re-renders the surface; the Icon must not report again.
    act(() => setData('/n', 'b'))
    await act(flush)
    expect(container.querySelector('svg')).toBeNull()
    const codes = onError.mock.calls.map(([e]) => e.error.code)
    expect(codes).toEqual(['UNSUPPORTED_COMPONENT'])
  })

  describe('Video and AudioPlayer', () => {
    it('Video renders an external link with the localized text', () => {
      const { store } = setup(
        column(['v'], { id: 'v', component: 'Video', url: 'https://example.com/v.mp4' }),
      )
      mount(store)
      const link = screen.getByRole('link', { name: /Open media/ })
      expect(link.getAttribute('href')).toBe('https://example.com/v.mp4')
      expect(link.getAttribute('target')).toBe('_blank')
    })

    it('the link text follows the locale', () => {
      createLocale({ default: 'de', supported: ['de', 'en'] })
      try {
        const { store } = setup(
          column(['v'], { id: 'v', component: 'Video', url: 'https://example.com/v.mp4' }),
        )
        mount(store)
        expect(screen.getByRole('link', { name: /Medien öffnen/ })).toBeTruthy()
      } finally {
        createLocale({ default: 'en', supported: ['en'] })
      }
    })

    it('AudioPlayer uses its description as the link text', () => {
      const { store } = setup(
        column(['a'], {
          id: 'a',
          component: 'AudioPlayer',
          url: 'https://example.com/a.mp3',
          description: 'Chef interview',
        }),
      )
      mount(store)
      const link = screen.getByRole('link', { name: /Chef interview/ })
      expect(link.getAttribute('href')).toBe('https://example.com/a.mp3')
    })

    it('an unsafe url, bound or literal, renders no link or image', () => {
      const { store } = setup(
        column(
          ['v', 'a', 'i'],
          { id: 'v', component: 'Video', url: { path: '/u' } },
          { id: 'a', component: 'AudioPlayer', url: 'javascript:alert(1)' },
          { id: 'i', component: 'Image', url: 'javascript:alert(1)' },
        ),
        { u: 'javascript:alert(1)' },
      )
      const { container } = mount(store)
      expect(container.querySelector('a, img')).toBeNull()
    })
  })

  describe('Row, Column and List', () => {
    const flexOf = (container: HTMLElement, childText: string) =>
      [...container.querySelectorAll<HTMLElement>('[data-direction]')].find(
        (el) => el.textContent === childText,
      )!

    it('Row renders a horizontal Flex and maps justify and align', () => {
      const { store } = setup([
        { id: 'root', component: 'Row', children: ['a'], justify: 'spaceEvenly', align: 'center' },
        text('a', 'A'),
      ])
      const { container } = mount(store)
      const flex = flexOf(container, 'A')
      expect(flex.className).toMatch(/_flex_/)
      expect(flex.getAttribute('data-direction')).toBe('horizontal')
      expect(flex.style.justifyContent).toBe('space-between')
      expect(flex.style.alignItems).toBe('center')
    })

    it.each([
      ['start', 'flex-start'],
      ['center', 'center'],
      ['end', 'flex-end'],
      ['spaceBetween', 'space-between'],
      ['spaceAround', 'space-between'],
      ['stretch', 'flex-start'],
    ])('Column justify %s → %s', (justify, css) => {
      const { store } = setup([
        { id: 'root', component: 'Column', children: ['a'], justify, align: 'stretch' },
        text('a', 'A'),
      ])
      const { container } = mount(store)
      const flex = flexOf(container, 'A')
      expect(flex.getAttribute('data-direction')).toBe('vertical')
      expect(flex.style.justifyContent).toBe(css)
      expect(flex.style.alignItems).toBe('stretch')
    })

    it('Column renders a template child list', () => {
      const { store } = setup(
        [
          { id: 'root', component: 'Column', children: { componentId: 'item', path: '/items' } },
          text('item', { path: 'label' }),
        ],
        { items: [{ label: 'x' }, { label: 'y' }] },
      )
      const { container } = mount(store)
      expect(flexOf(container, 'xy')).toBeTruthy()
    })

    it('List defaults to vertical and honours direction', () => {
      const { store } = setup([
        { id: 'root', component: 'Column', children: ['l1', 'l2'] },
        { id: 'l1', component: 'List', children: ['a'] },
        { id: 'l2', component: 'List', children: ['b'], direction: 'horizontal', align: 'end' },
        text('a', 'A'),
        text('b', 'B'),
      ])
      const { container } = mount(store)
      expect(flexOf(container, 'A').getAttribute('data-direction')).toBe('vertical')
      const l2 = flexOf(container, 'B')
      expect(l2.getAttribute('data-direction')).toBe('horizontal')
      expect(l2.style.alignItems).toBe('flex-end')
    })
  })

  it('Card renders a Card holding its child', () => {
    const { store } = setup(
      column(['c'], { id: 'c', component: 'Card', child: 't' }, text('t', 'In')),
    )
    const { container } = mount(store)
    const card = container.querySelector('[data-cascivo-card]')!
    expect(card.className).toMatch(/_card_/)
    expect(card.textContent).toBe('In')
  })

  it('Tabs renders a tab per entry, titles resolved, and switches panels', () => {
    const { store } = setup(
      column(
        ['tabs'],
        {
          id: 'tabs',
          component: 'Tabs',
          tabs: [
            { title: 'Menu', child: 'p1' },
            { title: { path: '/second' }, child: 'p2' },
          ],
        },
        text('p1', 'Pasta'),
        text('p2', 'Open daily'),
      ),
      { second: 'Hours' },
    )
    mount(store)
    expect(screen.getByRole('tablist')).toBeTruthy()
    const menu = screen.getByRole('tab', { name: 'Menu' })
    const hours = screen.getByRole('tab', { name: 'Hours' })
    expect(menu.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('Pasta')
    fireEvent.click(hours)
    expect(hours.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('Open daily')
  })

  it('Modal opens when its trigger Button is clicked and closes through onClose', async () => {
    const onAction = vi.fn()
    const { store } = setup(
      column(
        ['m'],
        { id: 'm', component: 'Modal', trigger: 'open', content: 'body' },
        {
          id: 'open',
          component: 'Button',
          child: 'openLabel',
          action: { event: { name: 'peek' } },
        },
        text('openLabel', 'Details'),
        text('body', 'Inside the modal'),
      ),
    )
    const { container } = mount(store, { onAction })
    const dialog = container.querySelector('dialog')!
    expect(dialog.hasAttribute('open')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    // Modal mirrors its `open` prop in a microtask.
    await act(flush)
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(dialog.textContent).toContain('Inside the modal')
    // The trigger's own action still dispatches.
    expect(onAction).toHaveBeenCalledTimes(1)
    act(() => dialog.dispatchEvent(new Event('close')))
    await act(flush)
    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('Divider renders a Separator with its axis', () => {
    const { store } = setup(
      column(
        ['d1', 'd2'],
        { id: 'd1', component: 'Divider' },
        {
          id: 'd2',
          component: 'Divider',
          axis: 'vertical',
        },
      ),
    )
    mount(store)
    const [d1, d2] = screen.getAllByRole('separator')
    expect(d1!.className).toMatch(/_separator_/)
    expect(d1!.getAttribute('data-orientation')).toBe('horizontal')
    expect(d2!.getAttribute('aria-orientation')).toBe('vertical')
  })

  describe('Button', () => {
    it.each([
      ['primary', 'primary'],
      ['default', 'secondary'],
      ['borderless', 'ghost'],
      [undefined, 'secondary'],
    ])('variant %s → %s', (variant, expected) => {
      const { store } = setup(
        column(
          ['b'],
          {
            id: 'b',
            component: 'Button',
            child: 'l',
            action: { event: { name: 'go' } },
            ...(variant === undefined ? {} : { variant }),
          },
          text('l', 'Go'),
        ),
      )
      mount(store)
      expect(screen.getByRole('button', { name: 'Go' }).getAttribute('data-variant')).toBe(expected)
    })

    it('a failing check disables it', () => {
      const { store, setData } = setup(
        column(
          ['b'],
          {
            id: 'b',
            component: 'Button',
            child: 'l',
            action: { event: { name: 'go' } },
            checks: [{ condition: { path: '/ok' }, message: 'Not yet' }],
          },
          text('l', 'Go'),
        ),
        { ok: false },
      )
      mount(store)
      const button = screen.getByRole('button', { name: 'Go' }) as HTMLButtonElement
      expect(button.disabled).toBe(true)
      act(() => setData('/ok', true))
      expect(button.disabled).toBe(false)
    })
  })

  describe('TextField', () => {
    const field = (props: Record<string, unknown>) =>
      column(['f'], { id: 'f', component: 'TextField', label: 'Field', ...props })

    it('shortText (the default) renders an Input that writes back', () => {
      const { store, snapshot } = setup(field({ value: { path: '/v' } }), { v: 'a' })
      mount(store)
      const input = screen.getByRole('textbox', { name: 'Field' }) as HTMLInputElement
      expect(input.tagName).toBe('INPUT')
      expect(input.value).toBe('a')
      fireEvent.change(input, { target: { value: 'ab' } })
      expect(snapshot()).toEqual({ v: 'ab' })
    })

    it('longText renders a Textarea', () => {
      const { store } = setup(field({ variant: 'longText', value: 'hello' }))
      mount(store)
      const area = screen.getByRole('textbox', { name: 'Field' }) as HTMLTextAreaElement
      expect(area.tagName).toBe('TEXTAREA')
      expect(area.value).toBe('hello')
    })

    it('obscured renders a password Input', () => {
      const { store } = setup(field({ variant: 'obscured', value: { path: '/p' } }), { p: '' })
      const { container } = mount(store)
      expect(container.querySelector('input[type="password"]')).not.toBeNull()
    })

    it('number renders a NumberInput that writes String(n)', () => {
      const { store, snapshot } = setup(field({ variant: 'number', value: { path: '/n' } }), {
        n: '2',
      })
      mount(store)
      const input = screen.getByLabelText('Field') as HTMLInputElement
      expect(input.value).toBe('2')
      fireEvent.change(input, { target: { value: '5' } })
      fireEvent.blur(input)
      expect(snapshot()).toEqual({ n: '5' })
    })

    it('a failing check shows its message as the error', () => {
      const { store } = setup(
        field({
          value: { path: '/v' },
          checks: [
            { condition: { call: 'required', args: { value: { path: '/v' } } }, message: 'Needed' },
          ],
        }),
        { v: '' },
      )
      mount(store)
      expect(screen.getByText('Needed')).toBeTruthy()
      expect(screen.getByRole('textbox', { name: 'Field' }).getAttribute('aria-invalid')).toBe(
        'true',
      )
    })

    it('a value not matching validationRegexp shows the localized error', () => {
      const { store, setData } = setup(
        field({ value: { path: '/v' }, validationRegexp: '^[0-9]+$' }),
        { v: '12' },
      )
      mount(store)
      expect(screen.queryByText('Invalid value')).toBeNull()
      act(() => setData('/v', '12a'))
      expect(screen.getByText('Invalid value')).toBeTruthy()
    })
  })

  it('CheckBox renders a Checkbox bound both ways', () => {
    const { store, snapshot } = setup(
      column(['c'], { id: 'c', component: 'CheckBox', label: 'Outdoor', value: { path: '/o' } }),
      { o: true },
    )
    mount(store)
    const box = screen.getByRole('checkbox', { name: 'Outdoor' }) as HTMLInputElement
    expect(box.checked).toBe(true)
    fireEvent.click(box)
    expect(snapshot()).toEqual({ o: false })
    expect(box.checked).toBe(false)
  })

  describe('ChoicePicker', () => {
    const options = [
      { label: 'Two', value: '2' },
      { label: { path: '/fourLabel' }, value: '4' },
    ]

    it('mutuallyExclusive renders a Select showing value[0] and writes [v]', () => {
      const { store, snapshot } = setup(
        column(['p'], {
          id: 'p',
          component: 'ChoicePicker',
          label: 'Guests',
          variant: 'mutuallyExclusive',
          options,
          value: { path: '/g' },
        }),
        { g: ['2'], fourLabel: 'Four' },
      )
      mount(store)
      const select = screen.getByRole('combobox', { name: 'Guests' }) as HTMLSelectElement
      expect(select.tagName).toBe('SELECT')
      expect(select.value).toBe('2')
      expect(screen.getByRole('option', { name: 'Four' })).toBeTruthy()
      fireEvent.change(select, { target: { value: '4' } })
      expect(snapshot()).toMatchObject({ g: ['4'] })
    })

    it('multipleSelection renders a Checkbox per option and writes the selected list', () => {
      const { store, snapshot } = setup(
        column(['p'], {
          id: 'p',
          component: 'ChoicePicker',
          label: 'Guests',
          variant: 'multipleSelection',
          options,
          value: { path: '/g' },
        }),
        { g: ['2'], fourLabel: 'Four' },
      )
      const { container } = mount(store)
      const group = screen.getByRole('group', { name: 'Guests' })
      expect(group.getAttribute('data-direction')).toBe('vertical')
      const two = screen.getByRole('checkbox', { name: 'Two' }) as HTMLInputElement
      const four = screen.getByRole('checkbox', { name: 'Four' }) as HTMLInputElement
      expect(two.checked).toBe(true)
      expect(four.checked).toBe(false)
      fireEvent.click(four)
      expect(snapshot()).toMatchObject({ g: ['2', '4'] })
      fireEvent.click(two)
      expect(snapshot()).toMatchObject({ g: ['4'] })
      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(2)
    })
  })

  it('Slider renders a Slider bound both ways as a number', () => {
    const { store, snapshot } = setup(
      column(['s'], {
        id: 's',
        component: 'Slider',
        label: 'Spice',
        min: 0,
        max: 10,
        value: { path: '/s' },
      }),
      { s: 3 },
    )
    mount(store)
    const slider = screen.getByRole('slider', { name: 'Spice' }) as HTMLInputElement
    expect(slider.value).toBe('3')
    expect(slider.max).toBe('10')
    fireEvent.change(slider, { target: { value: '7' } })
    expect(snapshot()).toEqual({ s: 7 })
  })

  describe('DateTimeInput', () => {
    const dt = (props: Record<string, unknown>) =>
      column(['d'], { id: 'd', component: 'DateTimeInput', label: 'When', ...props })

    it('date only renders a DatePicker', () => {
      const { store } = setup(dt({ value: { path: '/d' }, enableDate: true }), { d: '' })
      const { container } = mount(store)
      expect(screen.getByRole('combobox', { name: 'When' })).toBeTruthy()
      expect(container.querySelector('input[type="time"]')).toBeNull()
    })

    it('time only renders a TimePicker that writes HH:mm', () => {
      const { store, snapshot } = setup(dt({ value: { path: '/d' }, enableTime: true }), {
        d: '18:00',
      })
      const { container } = mount(store)
      expect(screen.queryByRole('combobox')).toBeNull()
      const time = container.querySelector<HTMLInputElement>('input[type="time"]')!
      expect(time.value).toBe('18:00')
      fireEvent.change(time, { target: { value: '19:30' } })
      expect(snapshot()).toEqual({ d: '19:30' })
    })

    it('both render a DatePicker and a TimePicker in a row, combining the value', () => {
      const { store, snapshot } = setup(
        dt({ value: { path: '/d' }, enableDate: true, enableTime: true }),
        { d: '2026-10-21T18:00' },
      )
      const { container } = mount(store)
      expect(screen.getByRole('combobox', { name: 'When' })).toBeTruthy()
      const time = container.querySelector<HTMLInputElement>('input[type="time"]')!
      expect(time.value).toBe('18:00')
      expect(time.closest('[data-direction="horizontal"]')).not.toBeNull()
      fireEvent.change(time, { target: { value: '19:30' } })
      expect(snapshot()).toEqual({ d: '2026-10-21T19:30' })
    })
  })

  it('every basic component has an adapter', () => {
    for (const name of [
      'Text',
      'Image',
      'Icon',
      'Video',
      'AudioPlayer',
      'Row',
      'Column',
      'List',
      'Card',
      'Tabs',
      'Modal',
      'Divider',
      'Button',
      'TextField',
      'CheckBox',
      'ChoicePicker',
      'Slider',
      'DateTimeInput',
    ]) {
      expect(basicCatalog.adapter(name), name).toBeTypeOf('function')
    }
    expect(basicCatalog.adapter('Flex')).toBeUndefined()
    expect(basicCatalog.adapter('__proto__')).toBeUndefined()
  })
})
