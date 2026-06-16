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

export function initRouter() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest('a')
    if (!a?.href) return
    const url = new URL(a.href)
    if (url.origin !== location.origin) return
    if (a.target === '_blank') return
    if (a.hasAttribute('download')) return
    e.preventDefault()
    navigate(url.pathname)
  })

  window.addEventListener('popstate', () => {
    currentPath.value = normPath(location.pathname)
  })
}
