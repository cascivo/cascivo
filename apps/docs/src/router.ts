import { signal } from '@cascivo/core'

function normPath(p: string) {
  return p.replace(/\/+$/, '') || '/'
}

export const currentPath = signal(
  typeof window !== 'undefined' ? normPath(window.location.pathname) : '/',
)

export function navigate(href: string) {
  const target = normPath(new URL(href, location.origin).pathname)
  if (target === currentPath.value) return
  history.pushState(null, '', href)
  if ('startViewTransition' in document) {
    ;(
      document as Document & { startViewTransition: (cb: () => void) => unknown }
    ).startViewTransition(() => {
      currentPath.value = target
    })
  } else {
    currentPath.value = target
  }
}

/**
 * Scroll to an in-page anchor, tolerating lazy-rendered routes: the target may
 * not exist on the first frame (the destination page is a lazy chunk), so retry
 * across a few animation frames before giving up.
 */
export function scrollToHash(hash: string, attempts = 20) {
  if (!hash || hash === '#') return
  let el: Element | null = null
  try {
    el = document.querySelector(hash)
  } catch {
    return
  }
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
    return
  }
  if (attempts > 0) {
    requestAnimationFrame(() => scrollToHash(hash, attempts - 1))
  }
}

export function initRouter() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest('a')
    if (!a?.href) return
    const url = new URL(a.href)
    if (url.origin !== location.origin) return
    if (a.target === '_blank') return
    if (a.hasAttribute('download')) return
    if (url.pathname.startsWith('/demos/')) return
    e.preventDefault()
    if (url.hash) {
      if (normPath(url.pathname) === currentPath.value) {
        history.pushState(null, '', url.pathname + url.hash)
      } else {
        navigate(url.pathname + url.hash)
      }
      scrollToHash(url.hash)
      return
    }
    navigate(url.pathname)
  })

  window.addEventListener('popstate', () => {
    currentPath.value = normPath(location.pathname)
  })
}
