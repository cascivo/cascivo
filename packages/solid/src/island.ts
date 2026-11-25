import { type Component, createComponent } from 'solid-js'
import { render } from 'solid-js/web'

/** What the island loader (cascivo-web `islands.rs`, `[data-island]`) calls with the parsed props. */
export type IslandMount = (el: Element, props?: Record<string, unknown>) => void

const disposers = new WeakMap<Element, () => void>()

function unmount(el: Element): void {
  disposers.get(el)?.()
  disposers.delete(el)
}

/**
 * Wrap a Solid component as an island module's default export:
 * `export default defineIsland(Cart)`. Mounts into `el` with the server-provided props and
 * disposes when htmx removes `el` (`htmx:beforeCleanupElement`), so a swap never leaks the
 * reactive graph. Mounting twice on one element replaces the first mount.
 */
export function defineIsland<P extends object = Record<string, never>>(
  Component: Component<P>,
): IslandMount {
  return (el, props) => {
    unmount(el)
    // The server fallback markup has the same shape; clear it so the island does not duplicate it.
    el.replaceChildren()
    const dispose = render(() => createComponent(Component, (props ?? {}) as P), el)
    const onCleanup = (e: Event): void => {
      if (e.target !== el) return
      el.removeEventListener('htmx:beforeCleanupElement', onCleanup)
      unmount(el)
    }
    el.addEventListener('htmx:beforeCleanupElement', onCleanup)
    disposers.set(el, dispose)
  }
}
