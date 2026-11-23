/**
 * Island: the live Pulse frame in the hero (theme sync with the site theme, one lazy iframe).
 *
 * Mount target: `<div data-island="hero-frames" style="display: contents">` inside
 * `<figure class="pg-hero-shot">`, before the `<figcaption>`. The component root is
 * `.pg-hero-frames`, so the static fallback inside the wrapper should be that same element
 * (poster `<img>`s, no iframe) — it is replaced wholesale on mount. `display: contents` keeps
 * the wrapper out of layout; no stylesheet selector uses `.pg-hero-shot >`.
 *
 * The posters are the template's hashed `img()` copies: the island reads their URLs from the
 * fallback (front window = light scheme, back = dark), so the re-rendered `<img>`s hit the
 * cache instead of fetching the unhashed `/hero/` files a second time.
 */
import { render } from 'preact'
import { HeroLiveFrames } from '../poster/HeroLiveFrames'
import type { HeroPosters } from '../poster/HeroLiveFrames'

function posterOf(el: HTMLElement, slot: 'light' | 'dark'): string | null {
  return el.querySelector(`.pg-hero-frame--${slot} img`)?.getAttribute('src') ?? null
}

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  const light = posterOf(el, 'light')
  const dark = posterOf(el, 'dark')
  const posters: HeroPosters | undefined = light && dark ? { light, dark } : undefined
  el.replaceChildren()
  render(posters ? <HeroLiveFrames posters={posters} /> : <HeroLiveFrames />, el)
}
