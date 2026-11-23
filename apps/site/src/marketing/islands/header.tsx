/**
 * Island: the site header on the static home (cascivo-web).
 *
 * Mount target: an empty `<div data-island="header" style="display: contents">` placed where
 * the SPA renders `<Header />` (directly under the skip link, before `<main>`/the skip
 * target). `Header` renders a fragment (the sticky `<header>`, `.scroll-progress`, the scrim
 * and `#mobile-nav-drawer`), so the wrapper must be `display: contents`: a real box would
 * become the sticky header's containing block and stop it sticking, and would make the
 * fixed drawer/scrim children of a layout box instead of the body.
 *
 * Besides `Header` this island does what `src/App.tsx` does for the SPA:
 *  - theme: importing `../../theme` registers the effect that keeps `<html data-theme>` in
 *    sync with the persisted `cascade-theme` signal (localStorage, `{v:1,value}` envelope,
 *    OS preference as the default, deferred `themes-extra.css` loaded on first use of an extra
 *    theme). `Header` writes it through `setTheme`/`toggleScheme`.
 *  - search: the lazy `SearchDialogLazy` (its chunk prefetched on first hover/focus of the
 *    search button, loaded on Cmd/Ctrl+K or click) plus the shortcut. The island mounts on
 *    idle, not load: it is a ~150 ms task that would otherwise land before first input. There is no router on
 *    the static page, so a result navigates with a full page load.
 *  - link clicks: `Header` calls the SPA `navigate()` (pushState) from the drawer links; the
 *    capture listener below stops that handler so the browser performs a normal navigation.
 *  - scroll-reveal fallback (`initReveal`) for browsers without view timelines.
 */
import { Suspense, lazy } from 'react'
import { render } from 'preact'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Header } from '../sections/Header'
import { initReveal } from '../reveal'
import { searchOpen } from '../search/state'
import { theme } from '../../theme'

// One import shared by the prefetch and `lazy`: the chunk starts loading when the search
// button is first hovered or focused, so the dialog is ready by the click.
let searchChunk: Promise<typeof import('../search/SearchDialogLazy')> | undefined
const loadSearch = () => (searchChunk ??= import('../search/SearchDialogLazy'))
const SearchDialogLazy = lazy(() => loadSearch().then((m) => ({ default: m.SearchDialogLazy })))

function HeaderIsland() {
  useSignals()
  // Read once so the module's data-theme effect is live and the attribute is set before paint.
  document.documentElement.setAttribute('data-theme', theme.value)

  const hasOpenedSearch = useSignal(false)
  useSignalEffect(() => {
    if (searchOpen.value) hasOpenedSearch.value = true
  })
  useSignalEffect(() => initReveal())
  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchOpen.value = true
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  return (
    <>
      <Header />
      {hasOpenedSearch.value ? (
        <Suspense fallback={null}>
          <SearchDialogLazy
            open={searchOpen.value}
            onClose={() => {
              searchOpen.value = false
            }}
            onNavigate={(href) => {
              window.location.href = href
            }}
          />
        </Suspense>
      ) : null}
    </>
  )
}

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  el.replaceChildren()
  const prefetch = (e: Event) => {
    if (!(e.target as Element | null)?.closest?.('.header-search-btn')) return
    el.removeEventListener('pointerover', prefetch)
    el.removeEventListener('focusin', prefetch)
    void loadSearch()
  }
  el.addEventListener('pointerover', prefetch, { passive: true })
  el.addEventListener('focusin', prefetch)
  el.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest('a')
      if (!a?.href || a.target === '_blank') return
      if (new URL(a.href).origin === location.origin) e.stopPropagation()
    },
    true,
  )
  render(<HeaderIsland />, el)
}
