export function initReveal(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }
  // threshold: 0 + rootMargin shrinks the effective viewport by 60px at the bottom,
  // so sections reveal when ~60px is visible — viewport-relative, not element-size-relative.
  // threshold: 0.15 breaks for very tall elements (e.g. the 5500px a11y matrix table)
  // because 15% of 5500px > iPhone viewport height, so the callback never fires.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-revealed', '')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0, rootMargin: '0px 0px -60px 0px' },
  )
  for (const el of document.querySelectorAll('[data-reveal]')) observer.observe(el)

  // Lazy-loaded sections arrive after the initial scan — watch for them.
  const mutation = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node.hasAttribute('data-reveal')) observer.observe(node)
        for (const el of node.querySelectorAll('[data-reveal]')) observer.observe(el)
      }
    }
  })
  mutation.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    mutation.disconnect()
  }
}
