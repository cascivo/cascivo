/**
 * Island: section 04, the theme switcher card (loads every deferred theme sheet on mount).
 *
 * Mount target: `<div data-island="themes" style="display: contents">` wrapping
 * `<section id="themes" class="pg-section pg-cols pg-cols--4-8">` inside `main.pg`.
 * `:where(.pg-cols, .pg-tiles) > :where(*)` (poster.css) targets the section's own
 * children, which are unchanged; the wrapper only sits above the section.
 */
import { render } from 'preact'
import { PosterThemes } from '../poster/PosterThemes'

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  el.replaceChildren()
  render(<PosterThemes />, el)
}
