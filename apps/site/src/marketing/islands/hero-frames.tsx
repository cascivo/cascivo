/**
 * Island: the live Pulse iframes in the hero (theme sync with the site theme, lazy iframes).
 *
 * Mount target: `<div data-island="hero-frames" style="display: contents">` inside
 * `<figure class="pg-hero-shot">`, before the `<figcaption>`. The component root is
 * `.pg-hero-frames`, so the static fallback inside the wrapper should be that same element
 * (poster `<img>`s) — it is replaced wholesale on mount. `display: contents` keeps the
 * wrapper out of layout; no stylesheet selector uses `.pg-hero-shot >`.
 */
import { render } from 'preact'
import { HeroLiveFrames } from '../poster/HeroLiveFrames'

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  el.replaceChildren()
  render(<HeroLiveFrames />, el)
}
