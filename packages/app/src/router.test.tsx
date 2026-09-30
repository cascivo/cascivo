import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRouter, lazyRoute, route, RouterView } from './router'
import type { Router, RouteProps } from './router'

function Home() {
  return <h1>Home</h1>
}
function Chat({ params }: RouteProps<'/c/:id'>) {
  return <h1>Chat {params.id}</h1>
}
function NewChat() {
  return <h1>New chat</h1>
}
function Missing() {
  return <h1>Not found</h1>
}

let router: Router | undefined

function setup(path: string, base?: string): Router {
  window.history.replaceState(null, '', path)
  router = createRouter({
    routes: [route('/', Home), route('/c/:id', Chat), route('/c/new', NewChat)],
    notFound: route('*', Missing),
    viewTransitions: false,
    ...(base ? { base } : {}),
  })
  return router
}

beforeEach(() => {
  window.scrollTo = () => undefined
})
afterEach(() => {
  cleanup()
  router?.dispose()
  router = undefined
})

describe('createRouter', () => {
  it('checks a route component against its pattern at compile time', () => {
    // @ts-expect-error — Chat reads params.id, but '/users/:name' has no `id`
    const mismatched = () => route('/users/:name', Chat)
    expect(mismatched).toBeTypeOf('function')
  })

  it('matches the current location, most specific route first', () => {
    expect(setup('/c/new').match.value?.route.path).toBe('/c/new')
    router?.dispose()
    expect(setup('/c/42').match.value?.params).toEqual({ id: '42' })
  })

  it('renders the matched route with its params, and notFound otherwise', () => {
    const r = setup('/c/7')
    render(<RouterView router={r} />)
    expect(screen.getByRole('heading').textContent).toBe('Chat 7')
    act(() => r.navigate('/nope'))
    expect(screen.getByRole('heading').textContent).toBe('Not found')
  })

  it('navigates with pushState and follows back/forward', () => {
    const r = setup('/')
    render(<RouterView router={r} />)
    act(() => r.navigate('/c/1'))
    expect(window.location.pathname).toBe('/c/1')
    expect(screen.getByRole('heading').textContent).toBe('Chat 1')

    act(() => {
      window.history.replaceState(null, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('heading').textContent).toBe('Home')
  })

  it('replaces instead of pushing when asked', () => {
    const r = setup('/')
    const before = window.history.length
    r.navigate('/c/2', { replace: true })
    expect(window.history.length).toBe(before)
    expect(r.pathname.value).toBe('/c/2')
  })

  it('keeps the query string, exposed separately from the path', () => {
    const r = setup('/')
    r.navigate('/c/3?tab=files')
    expect(r.pathname.value).toBe('/c/3')
    expect(r.search.value).toBe('?tab=files')
  })

  it('serves under a base path while routes stay app-relative', () => {
    const r = setup('/demos/chat/c/9', '/demos/chat')
    expect(r.match.value?.params).toEqual({ id: '9' })
    expect(r.href('/c/1?x=1')).toBe('/demos/chat/c/1?x=1')
    r.navigate('/')
    expect(window.location.pathname).toBe('/demos/chat/')
    expect(r.pathname.value).toBe('/')
  })

  it('leaves external hrefs alone', () => {
    const r = setup('/')
    expect(r.href('https://example.com/x')).toBe('https://example.com/x')
    expect(r.href('mailto:a@b.c')).toBe('mailto:a@b.c')
  })
})

describe('router.Link', () => {
  it('navigates client-side on a plain left click', () => {
    const r = setup('/')
    render(
      <>
        <r.Link href="/c/5">Open</r.Link>
        <RouterView router={r} />
      </>,
    )
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.getAttribute('href')).toBe('/c/5')
    fireEvent.click(link)
    expect(screen.getByRole('heading').textContent).toBe('Chat 5')
  })

  it('leaves modified clicks, target=_blank and external links to the browser', () => {
    const r = setup('/')
    render(
      <>
        <r.Link href="/c/1">Cmd</r.Link>
        <r.Link href="/c/2" target="_blank">
          Blank
        </r.Link>
        <r.Link href="https://example.com">Out</r.Link>
      </>,
    )
    const unhandled = (name: string, init?: MouseEventInit) =>
      fireEvent.click(screen.getByRole('link', { name }), init)
    expect(unhandled('Cmd', { metaKey: true })).toBe(true)
    expect(unhandled('Blank')).toBe(true)
    expect(unhandled('Out')).toBe(true)
    expect(r.pathname.value).toBe('/')
  })

  it("respects a caller's preventDefault (a disabled nav item)", () => {
    const r = setup('/')
    render(
      <r.Link href="/c/1" onClick={(e) => e.preventDefault()}>
        Disabled
      </r.Link>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Disabled' }))
    expect(r.pathname.value).toBe('/')
  })
})

describe('lazyRoute', () => {
  it('renders the fallback, then the loaded component', async () => {
    window.history.replaceState(null, '', '/lazy/x')
    router = createRouter({
      routes: [
        lazyRoute('/lazy/:id', async () => ({
          default: ({ params }: RouteProps<'/lazy/:id'>) => <h1>Lazy {params.id}</h1>,
        })),
      ],
      viewTransitions: false,
    })
    render(<RouterView router={router} fallback={<p>Loading</p>} />)
    expect(screen.getByText('Loading')).toBeTruthy()
    expect((await screen.findByRole('heading')).textContent).toBe('Lazy x')
  })
})
