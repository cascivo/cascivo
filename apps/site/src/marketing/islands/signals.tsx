/**
 * Island: section 02, the reactivity grid demo.
 *
 * Mount target: `<div data-island="signals" style="display: contents">` that WRAPS the
 * `<section id="signals" class="pg-section">` inside `main.pg` (the component renders the
 * whole section, so the static fallback is the section itself). The wrapper must be
 * `display: contents`: `main` children are laid out by the `.pg` grid/flow and the section
 * must stay its direct layout child. Nothing in landing/poster CSS uses a `main > section`
 * or `.pg-section +` sibling combinator.
 */
import { render } from 'preact'
import { PosterReactivity } from '../poster/PosterReactivity'

export default function mount(el: HTMLElement, _props: Record<string, unknown> = {}): void {
  el.replaceChildren()
  render(<PosterReactivity />, el)
}
