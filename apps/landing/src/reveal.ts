export function initReveal(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-revealed', '')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.15 },
  )
  for (const el of document.querySelectorAll('[data-reveal]')) observer.observe(el)
  return () => observer.disconnect()
}
