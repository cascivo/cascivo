import { render } from 'preact'
// The stylesheets come FIRST, before any module that pulls in component CSS.
// app.css reaches @cascivo/tokens, whose layers.css carries the one authoritative
// `@layer` statement — and a layer's position is fixed by its first appearance, so
// whatever emits CSS first wins the ordering. Importing `./App` above this line put
// `cascivo.component` at offset 0 of the bundle and left `cascivo.base` registered
// AFTER it, inverting the two: a base reset outranked every component style.
import './app.css'
import './marketing/landing.css'
// The poster grid re-tunes the shared chrome landing.css declares, so it loads last.
import './marketing/poster.css'
import './marketing/poster-sections.css'
import { App } from './App'

const root = document.getElementById('app')
if (root) {
  // Prerendered routes ship static SEO body markup inside #app (see
  // prerenderPages() in vite.config.ts). It's plain HTML, not Preact-authored —
  // clear it before mounting so Preact does a clean initial render instead of
  // trying to reconcile against unrelated DOM.
  root.replaceChildren()
  render(<App />, root)
}
