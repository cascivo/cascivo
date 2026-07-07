import { render } from 'preact'
import { App } from './App'
import './app.css'
import './marketing/landing.css'

const root = document.getElementById('app')
if (root) {
  // Prerendered routes ship static SEO body markup inside #app (see
  // prerenderPages() in vite.config.ts). It's plain HTML, not Preact-authored —
  // clear it before mounting so Preact does a clean initial render instead of
  // trying to reconcile against unrelated DOM.
  root.replaceChildren()
  render(<App />, root)
}
