import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppShell } from './app-shell'
import { createShellState } from './shell-state'

// suppress storage errors in jsdom
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  localStorage.clear()
})

describe('AppShell', () => {
  it('renders header slot', () => {
    render(
      <AppShell header={<nav>Header</nav>} persistKey={false}>
        content
      </AppShell>,
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('renders children in main', () => {
    render(
      <AppShell header={<div />} persistKey={false}>
        <p>Main content</p>
      </AppShell>,
    )
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('renders sideNav', () => {
    render(
      <AppShell header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppShell>,
    )
    expect(screen.getByText('Nav')).toBeInTheDocument()
  })

  it('toggle button flips nav data-state', () => {
    render(
      <AppShell header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppShell>,
    )
    const nav = document.querySelector('[data-state]')!
    expect(nav).toHaveAttribute('data-state', 'expanded')
    fireEvent.click(screen.getByRole('button'))
    expect(nav).toHaveAttribute('data-state', 'collapsed')
  })

  it('renders aside slot', () => {
    render(
      <AppShell header={<div />} aside={<div>Aside</div>} persistKey={false}>
        children
      </AppShell>,
    )
    expect(screen.getByText('Aside')).toBeInTheDocument()
  })
})

describe('AppShell v2', () => {
  it('main has the skip-link target id and is focusable', () => {
    render(
      <AppShell header={<div>h</div>} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'cascade-main')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('hides the aside when state.asideOpen is false', () => {
    const state = createShellState({ persistKey: false })
    state.asideOpen.value = false
    render(
      <AppShell header={<div>h</div>} aside={<p>details</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    expect(document.querySelector('[data-state="closed"]')).toBeInTheDocument()
  })

  it('external state drives the nav collapse', () => {
    const state = createShellState({ persistKey: false })
    state.sideNavCollapsed.value = true
    render(
      <AppShell header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    expect(screen.getByText('nav').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    )
  })

  it('keeps working with no state prop (back-compat)', () => {
    render(
      <AppShell header={<div>h</div>} sideNav={<p>nav</p>} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    expect(screen.getByText('nav')).toBeInTheDocument()
  })
})

describe('AppShell mobile drawer', () => {
  it('renders a scrim that closes the drawer on click', async () => {
    const state = createShellState({ persistKey: false })
    state.sideNavOpen.value = true
    render(
      <AppShell header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    const scrim = screen.getByTestId('cascade-shell-scrim')
    await userEvent.click(scrim)
    expect(state.sideNavOpen.value).toBe(false)
  })

  it('closes the drawer on Escape', async () => {
    const state = createShellState({ persistKey: false })
    state.sideNavOpen.value = true
    render(
      <AppShell header={<div>h</div>} sideNav={<p>nav</p>} state={state} persistKey={false}>
        <p>content</p>
      </AppShell>,
    )
    await userEvent.keyboard('{Escape}')
    expect(state.sideNavOpen.value).toBe(false)
  })
})

describe('AppShell loading bar', () => {
  it('renders no progressbar when loading is idle', () => {
    const state = createShellState({ persistKey: false })
    render(
      <AppShell header={<div>h</div>} state={state}>
        content
      </AppShell>,
    )
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('renders the loading bar with progress', () => {
    const state = createShellState({ persistKey: false })
    render(
      <AppShell header={<div>h</div>} state={state}>
        content
      </AppShell>,
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
      <AppShell header={<div>h</div>} state={state}>
        content
      </AppShell>,
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
