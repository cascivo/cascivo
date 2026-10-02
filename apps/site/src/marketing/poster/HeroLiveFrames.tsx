import { useRef } from 'react'
import type { Ref } from 'react'
import { useMediaQuery, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { isDarkTheme, nextScheme, theme as siteTheme } from '../../theme'
import type { Theme } from '../../theme'

const PULSE = '/demos/pulse/'
const DETAIL = '/examples/pulse'
const ALT =
  'The pulse example app — an observability dashboard with KPI cards, SLO meters and latency charts, built from cascivo components, in the theme this page is wearing.'

/** Window position: `light` is the front window, `dark` the one behind (the CSS classes). */
type Slot = 'light' | 'dark'

/**
 * The theme each window wears: the front one the page's own theme, the back one its other
 * half, so the demo is always the page's look rather than a stock theme pasted onto it.
 */
function themeFor(slot: Slot): Theme {
  return slot === 'light' ? siteTheme.value : nextScheme()
}

/** Tell a running embed to switch theme. It listens for this from its own origin only. */
function postTheme(frame: HTMLIFrameElement | null, next: Theme) {
  frame?.contentWindow?.postMessage({ type: 'cascivo:theme', theme: next }, location.origin)
}

/**
 * One app window: the committed screenshot, replaced by the running app once it has painted.
 *
 * The screenshot stays underneath rather than being swapped out, so a frame that never
 * becomes ready (no JS, a dev server without the built demo) still shows the app.
 */
function Frame({
  slot,
  startTheme,
  frameRef,
  live,
  interactive,
  onReady,
}: {
  slot: Slot
  /** The theme in the iframe's URL, fixed once it mounts: changing `src` would reload it. */
  startTheme: Theme | null
  frameRef: Ref<HTMLIFrameElement>
  live: boolean
  interactive: boolean
  onReady?: () => void
}) {
  useSignals()
  const ready = useSignal(false)
  const theme = themeFor(slot)

  function markReady() {
    ready.value = true
    onReady?.()
  }

  function onLoad(event: { currentTarget: HTMLIFrameElement }) {
    // The page's theme may have changed between mounting the frame and its load.
    postTheme(event.currentTarget, themeFor(slot))
    const doc = event.currentTarget.contentDocument
    // The dev server falls through to this SPA's not-found page when the demo has not been
    // built; that page has its own title, and showing it in the hero would be worse than
    // keeping the screenshot.
    const root = doc?.title === 'Cascivo Pulse' ? doc.getElementById('root') : null
    if (!root) return
    // `load` can fire before React has committed into #root, which would fade in a blank box.
    if (root.firstElementChild) {
      markReady()
      return
    }
    const observer = new MutationObserver(() => {
      if (!root.firstElementChild) return
      markReady()
      observer.disconnect()
    })
    observer.observe(root, { childList: true })
  }

  return (
    <div
      className={`pg-hero-frame pg-hero-frame--${slot}`}
      data-ready={ready.value ? '' : undefined}
      data-interactive={interactive ? '' : undefined}
      aria-hidden={interactive ? undefined : 'true'}
      inert={interactive ? undefined : true}
    >
      <img
        className="pg-hero-frame-poster"
        src={`/hero/pulse-${isDarkTheme(theme) ? 'poster-dark' : 'poster'}.webp`}
        alt=""
        width={1440}
        height={620}
        loading="lazy"
        decoding="async"
      />
      {live && startTheme && (
        <iframe
          ref={frameRef}
          className="pg-hero-frame-live"
          src={`${PULSE}?theme=${startTheme}`}
          title={`Pulse example app, ${theme} theme — live demo`}
          {...(interactive ? {} : { tabIndex: -1 })}
          onLoad={onLoad}
        />
      )}
    </div>
  )
}

/**
 * The hero's proof: the real pulse app, running, in the page's own theme — the front window
 * wears whatever theme the visitor picked, the back one its other half, and both follow a
 * switch live instead of reloading.
 *
 * Live rather than screenshots so it is sharp at every width and every pixel density, and
 * because a responsive app re-laying itself out for a phone says more than a picture can.
 * The app is a separate document with its own ~110 KB of JS, so nothing is fetched until
 * the landing itself has finished loading and the figure is close to the viewport — the
 * hero's first paint costs exactly what it did with the screenshots.
 *
 * With a mouse, the front window is the app itself: click through sections, change the
 * range, pause the simulation. On touch it stays a picture — inert, so it takes no focus,
 * no pointer and no scroll (an iframe that captured touch would trap a phone's page
 * scroll) — and one link laid over it goes to the full example. The dark window behind is
 * always a picture: only a sliver of it shows, and controls in a sliver read as a misclick.
 */
export function HeroLiveFrames() {
  useSignals()
  const live = useSignal(false)
  // Below md the dark frame is hidden by CSS — a sliver behind a phone-width window is not
  // worth a second running app — so it stays a (never-fetched, lazy) screenshot there.
  const wide = useMediaQuery('(min-width: 40rem)')
  const desktop = useMediaQuery('(min-width: 40rem) and (pointer: fine)')
  // Interactive only once the app has actually painted: until then (or if it never does)
  // the screenshot is all there is, and it should still link to the example.
  const frontReady = useSignal(false)
  const interactive = desktop.value && frontReady.value
  const ref = useRef<HTMLDivElement>(null)
  const frontFrame = useRef<HTMLIFrameElement>(null)
  const backFrame = useRef<HTMLIFrameElement>(null)
  // Captured when the frames mount, never after: a new `src` would reload the app.
  const startThemes = useSignal<Record<Slot, Theme> | null>(null)

  useSignalEffect(() => {
    postTheme(frontFrame.current, themeFor('light'))
    postTheme(backFrame.current, themeFor('dark'))
  })

  useSignalEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let observer: IntersectionObserver | undefined
    let idle = 0
    const watch = () => {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          startThemes.value = { light: themeFor('light'), dark: themeFor('dark') }
          live.value = true
          observer?.disconnect()
        },
        { rootMargin: '400px 0px' },
      )
      observer.observe(el)
    }
    const afterLoad = () => {
      idle =
        typeof requestIdleCallback === 'function'
          ? requestIdleCallback(watch, { timeout: 2000 })
          : window.setTimeout(watch, 200)
    }
    if (document.readyState === 'complete') afterLoad()
    else window.addEventListener('load', afterLoad, { once: true })
    return () => {
      window.removeEventListener('load', afterLoad)
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      observer?.disconnect()
    }
  })

  return (
    <div className="pg-hero-frames" ref={ref} data-live={live.value ? '' : undefined}>
      <div className="pg-hero-frames-stack">
        <Frame
          slot="dark"
          startTheme={startThemes.value?.dark ?? null}
          frameRef={backFrame}
          live={live.value && wide.value}
          interactive={false}
        />
        <Frame
          slot="light"
          startTheme={startThemes.value?.light ?? null}
          frameRef={frontFrame}
          live={live.value}
          interactive={interactive}
          onReady={() => {
            frontReady.value = true
          }}
        />
      </div>
      {!interactive && <a className="pg-hero-shot-link" href={DETAIL} aria-label={ALT} />}
    </div>
  )
}
