'use client'
import {
  cn,
  useControllableSignal,
  useRovingFocus,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type ReactNode } from 'react'
import styles from './carousel.module.css'

export interface CarouselLabels {
  region?: string
  previous?: string
  next?: string
}

export interface CarouselProps {
  children?: ReactNode
  slides?: ReactNode[]
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  loop?: boolean
  className?: string
  labels?: CarouselLabels
}

function toSlides(children: ReactNode | undefined, slides: ReactNode[] | undefined): ReactNode[] {
  if (slides) return slides
  if (children == null) return []
  return Array.isArray(children) ? children : [children]
}

export function Carousel({
  children,
  slides,
  index,
  defaultIndex,
  onIndexChange,
  loop = false,
  className,
  labels,
}: CarouselProps) {
  useSignals()
  const baseId = useId()
  const items = toSlides(children, slides)
  const total = items.length

  const [active, setActive] = useControllableSignal<number>({
    value: index,
    defaultValue: defaultIndex ?? 0,
    onChange: onIndexChange,
  })

  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const programmatic = useRef(false)

  const { getItemProps, setActiveIndex } = useRovingFocus({ orientation: 'horizontal', loop })

  // Sync active index from scroll position (CSS scroll-snap drives the visual state).
  useSignalEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = (): void => {
      if (programmatic.current) return
      const nearest = Math.round(track.scrollLeft / track.clientWidth)
      if (nearest !== active.value) setActive(nearest)
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  })

  const goTo = (next: number): void => {
    if (total === 0) return
    let target = next
    if (target < 0) target = loop ? total - 1 : 0
    if (target >= total) target = loop ? 0 : total - 1
    const track = trackRef.current
    if (track && typeof track.scrollTo === 'function') {
      programmatic.current = true
      track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' })
      window.setTimeout(() => {
        programmatic.current = false
      }, 400)
    }
    setActive(target)
    setActiveIndex(target)
  }

  const region = labels?.region ?? t(builtin.carousel.region)
  const prevLabel = labels?.previous ?? t(builtin.carousel.previous)
  const nextLabel = labels?.next ?? t(builtin.carousel.next)

  return (
    <section
      className={cn(styles['carousel'], className)}
      aria-roledescription="carousel"
      aria-label={region}
    >
      <div className={styles['viewport']}>
        <button
          type="button"
          className={cn(styles['nav'], styles['prev'])}
          aria-label={prevLabel}
          aria-controls={`${baseId}-track`}
          disabled={!loop && active.value <= 0}
          onClick={() => goTo(active.value - 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div ref={trackRef} id={`${baseId}-track`} className={styles['track']}>
          {items.map((slide, i) => (
            <div
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className={styles['slide']}
              role="group"
              aria-roledescription="slide"
              aria-label={t(builtin.carousel.slide, { n: i + 1, total })}
              aria-hidden={i !== active.value || undefined}
            >
              {slide}
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cn(styles['nav'], styles['next'])}
          aria-label={nextLabel}
          aria-controls={`${baseId}-track`}
          disabled={!loop && active.value >= total - 1}
          onClick={() => goTo(active.value + 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m9 18 6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles['dots']} role="group" aria-label={region}>
        {items.map((_, i) => {
          const itemProps = getItemProps(i)
          return (
            <button
              key={i}
              ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
              type="button"
              className={styles['dot']}
              aria-label={t(builtin.carousel.goTo, { n: i + 1 })}
              aria-current={i === active.value || undefined}
              data-active={i === active.value || undefined}
              tabIndex={itemProps.tabIndex}
              onKeyDown={itemProps.onKeyDown}
              onFocus={itemProps.onFocus}
              onClick={() => goTo(i)}
            />
          )
        })}
      </div>
    </section>
  )
}
