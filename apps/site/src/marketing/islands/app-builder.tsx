/**
 * Island: section 09, "Ship an app" (starter picker + generated command).
 *
 * Mount target: `<div data-island="app-builder" style="display: contents">` wrapping
 * `<section id="ship" class="pg-section">` inside `main.pg`; same wrapper rules as the
 * signals island.
 */
import { render } from 'preact'
import { PosterAppBuilder } from '../poster/PosterAppBuilder'

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  el.replaceChildren()
  render(<PosterAppBuilder />, el)
}
