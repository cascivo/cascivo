'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'

const SECTIONS = [
  { id: 'hero', label: 'Top' },
  { id: 'advantages', label: 'Why cascivo' },
  { id: 'proof', label: 'Proof' },
  { id: 'quickstart', label: 'Quick start' },
  { id: 'cta', label: 'Get started' },
] as const

/**
 * A sticky scroll-spy rail (desktop, in the gutter): a dot per home section that
 * lights up as you scroll and jumps there on click. An IntersectionObserver
 * tracks which section sits in the middle band of the viewport; hash links reuse
 * the router's smooth scroll.
 */
export function SectionNav() {
  useSignals()
  const active = useSignal<string>(SECTIONS[0].id)

  // Active = the last section whose top has scrolled past the viewport's middle.
  // A plain scroll read is steadier than IntersectionObserver ratios when the
  // sections differ a lot in height. rAF-throttled; no re-renders off-band.
  useSignalEffect(() => {
    const ids = SECTIONS.map((s) => s.id)
    let frame = 0
    const update = () => {
      frame = 0
      const center = window.innerHeight / 2
      let current: string = SECTIONS[0].id
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - center <= 0) current = id
      }
      if (active.value !== current) active.value = current
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  })

  return (
    <nav className="section-nav" aria-label="On this page">
      <ul>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="section-nav-dot"
              aria-label={s.label}
              aria-current={active.value === s.id ? 'true' : undefined}
              data-active={active.value === s.id ? '' : undefined}
            >
              <span className="section-nav-label" aria-hidden="true">
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
