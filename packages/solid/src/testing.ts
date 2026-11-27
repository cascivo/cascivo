import { type IslandMount } from './island.ts'

export interface MountedIsland {
  el: HTMLElement
  /** Simulate htmx removing the island (fires `htmx:beforeCleanupElement`, then detaches). */
  unmount: () => void
}

/**
 * Test helper: mount an island (`defineIsland(...)`) into a fresh attached element, as the
 * island loader would. Pair with `@testing-library/dom` queries or plain DOM.
 */
export function mountIsland(
  island: IslandMount,
  props?: Record<string, unknown>,
  html = '',
): MountedIsland {
  const el = document.createElement('div')
  el.dataset.island = 'test'
  el.innerHTML = html
  document.body.append(el)
  island(el, props)
  return {
    el,
    unmount: () => {
      el.dispatchEvent(new Event('htmx:beforeCleanupElement', { bubbles: true }))
      el.remove()
    },
  }
}
