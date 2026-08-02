import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppFrame } from './app-shell'
import { createShellState } from './shell-state'

// suppress storage errors in jsdom
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  localStorage.clear()
})

describe('AppFrame', () => {
  it('renders header slot', () => {
    render(
      <AppFrame header={<nav>Header</nav>} persistKey={false}>
        content
      </AppFrame>,
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('renders children in main', () => {
    render(
      <AppFrame header={<div />} persistKey={false}>
        <p>Main content</p>
      </AppFrame>,
    )
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('renders sideNav', () => {
    render(
      <AppFrame header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppFrame>,
    )
    expect(screen.getByText('Nav')).toBeInTheDocument()
  })

  it('nav renders with expanded state by default', () => {
    render(
      <AppFrame header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppFrame>,
    )
    const nav = document.querySelector('[data-state]')!
    expect(nav).toHaveAttribute('data-state', 'expanded')
  })

  it('renders aside slot', () => {
    render(
      <AppFrame header={<div />} aside={<div>Aside</div>} persistKey={false}>
        children
      </AppFrame>,
    )
    expect(screen.getByText('Aside')).toBeInTheDocument()
  })
})

describe('AppFrame v2', () => {
  it('main has the skip-link target id and is focusable', () => {
    render(
      <AppFrame header={<div>h</div>} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'cascade-main')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('hides the aside when state.asideOpen is false', () => {
    const state = createShellState({ persistKey: false })
    state.asideOpen.value = false
    render(
      <AppFrame header={<div>h</div>} aside={<p>details</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    expect(document.querySelector('[data-state="closed"]')).toBeInTheDocument()
  })

  it('external state drives the nav collapse', () => {
    const state = createShellState({ persistKey: false })
    state.sideNavCollapsed.value = true
    render(
      <AppFrame header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    expect(screen.getByText('nav').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    )
  })

  it('keeps working with no state prop (back-compat)', () => {
    render(
      <AppFrame header={<div>h</div>} sideNav={<p>nav</p>} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    expect(screen.getByText('nav')).toBeInTheDocument()
  })
})

describe('AppFrame sideNavMode', () => {
  it('defaults to push mode', () => {
    render(
      <AppFrame header={<div>h</div>} persistKey={false}>
        content
      </AppFrame>,
    )
    expect(document.querySelector('[data-sidenav-mode="push"]')).toBeInTheDocument()
  })

  it('sets overlay mode via prop', () => {
    render(
      <AppFrame header={<div>h</div>} sideNavMode="overlay" persistKey={false}>
        content
      </AppFrame>,
    )
    expect(document.querySelector('[data-sidenav-mode="overlay"]')).toBeInTheDocument()
  })
})

describe('AppFrame mobile drawer', () => {
  it('renders a scrim that closes the drawer on click', async () => {
    const state = createShellState({ persistKey: false })
    state.sideNavOpen.value = true
    render(
      <AppFrame header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    const scrim = screen.getByTestId('cascade-shell-scrim')
    await userEvent.click(scrim)
    expect(state.sideNavOpen.value).toBe(false)
  })

  it('closes the drawer on Escape', async () => {
    const state = createShellState({ persistKey: false })
    state.sideNavOpen.value = true
    render(
      <AppFrame header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppFrame>,
    )
    await userEvent.keyboard('{Escape}')
    expect(state.sideNavOpen.value).toBe(false)
  })
})

describe('AppFrame loading bar', () => {
  it('renders no progressbar when loading is idle', () => {
    const state = createShellState({ persistKey: false })
    render(
      <AppFrame header={<div>h</div>} state={state}>
        content
      </AppFrame>,
    )
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renders the loading bar with progress', () => {
    const state = createShellState({ persistKey: false })
    render(
      <AppFrame header={<div>h</div>} state={state}>
        content
      </AppFrame>,
    )
    act(() => {
      state.startLoading()
      state.setLoadingProgress(0.6)
    })
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('60')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('failLoading renders a dismissible alert; dismissing hides bar and alert', async () => {
    const user = userEvent.setup()
    const state = createShellState({ persistKey: false })
    render(
      <AppFrame header={<div>h</div>} state={state}>
        content
      </AppFrame>,
    )
    act(() => {
      state.startLoading()
      state.failLoading('Sync failed')
    })
    expect(screen.getByRole('alert').textContent).toContain('Sync failed')
    expect(screen.getByRole('progressbar').getAttribute('data-state')).toBe('error')
    await user.click(screen.getByRole('button', { name: 'Dismiss error' }))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
