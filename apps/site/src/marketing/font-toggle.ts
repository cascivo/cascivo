import { effect } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'

/** Whether the whole site is set in Cascivo Sans. Persisted (storage failures are swallowed by persistedSignal). */
export const cascivoSans = persistedSignal<boolean>('cascivo-font-sans', false)

let facesLoaded = false

// The @font-face rules live with the /cascivo-sans page; load them only once the toggle is on so
// visitors who never opt in download nothing extra.
function loadFaces(): void {
  if (facesLoaded) return
  facesLoaded = true
  void import('./pages/cascivo-sans/font.css')
}

if (typeof document !== 'undefined') {
  effect(() => {
    const root = document.documentElement
    if (cascivoSans.value) {
      loadFaces()
      root.setAttribute('data-font', 'cascivo-sans')
    } else {
      root.removeAttribute('data-font')
    }
  })
}
