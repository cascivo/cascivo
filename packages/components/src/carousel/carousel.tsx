'use client'
import {
  cn,
  useControllableSignal,
  useMediaQuery,
  useRovingFocus,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { Children, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './carousel.module.css'

export interface CarouselLabels {
  region?: string
  previous?: string
  next?: string
  play?: string
  pause?: string
}

export interface CarouselProps {
  children?: ReactNode
  slides?: ReactNode[]
  index?: number
  /**
   * The initial slide index when uncontrolled.
   *
   * @defaultValue `0`
   * @see the component manifest
   */
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  /**
   * When true, navigation wraps around from end to start.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loop?: boolean
  /**
   * Milliseconds between automatic advances. Omit or set 0 to leave rotation off.
   *
   * Auto-rotation pauses on hover, on focus within the carousel, while the tab is hidden and
   * under `prefers-reduced-motion`, and always renders a play/pause control — APG requires
   * one for any carousel that rotates on its own.
   */
  autoplay?: number
  className?: string
  labels?: CarouselLabels
}

/**
 * `Children.toArray` rather than `Array.isArray`: a mixed child list —
 * `<Carousel><Intro />{items.map(…)}</Carousel>` — arrives as `[<Intro/>, [...]]`, and the
 * naive check collapsed the entire mapped list into a single slide.
 */
function toSlides(children: ReactNode | undefined, slides: ReactNode[] | undefined): ReactNode[] {
  if (slides) return slides
  return Children.toArray(children)
}

export function Carousel({
  children,
  slides,
  index,
  defaultIndex,
  onIndexChange,
  loop = false,
  autoplay,
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
  const programmatic = useRef(false)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const { getItemProps, setActiveIndex } = useRovingFocus({ orientation: 'horizontal', loop })

  // Sync active index from scroll position (CSS scroll-snap drives the visual state).
  useSignalEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = (): void => {
      if (programmatic.current) return
      // Guard the divisor: a zero-width track — jsdom, pre-layout hydration, a
      // `display: none` ancestor — made this 0/0, and the resulting NaN propagated into
      // `onIndexChange` and every `i === active.value` comparison.
      if (track.clientWidth === 0) return
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
    if (track && typeof track.scrollTo === 'function' && track.clientWidth > 0) {
      programmatic.current = true
      track.scrollTo({
        left: target * track.clientWidth,
        // A JS scroll option overrides CSS `scroll-behavior`, so the stylesheet's
        // reduced-motion rule could never take effect — the manifest's claim to honour the
        // preference was untrue until this read it directly.
        behavior: reduceMotion.value ? 'auto' : 'smooth',
      })
      window.setTimeout(() => {
        programmatic.current = false
      }, 400)
    }
    setActive(target)
    setActiveIndex(target)
  }

  // Keep the roving tabindex with a controlled index the parent drives.
  useSignalEffect(() => {
    setActiveIndex(active.value)
  })

  const playing = useSignal(autoplay !== undefined && autoplay > 0)
  const paused = useSignal(false)

  useSignalEffect(() => {
    if (!autoplay || autoplay <= 0) return
    if (!playing.value || paused.value || reduceMotion.value) return
    const timer = window.setInterval(() => {
      const next = active.peek() + 1
      goTo(next >= total ? 0 : next)
    }, autoplay)
    return () => window.clearInterval(timer)
  })

  // A hidden tab is not a paused carousel unless we say so; rotating in the background burns
  // work and lands the user somewhere unexpected on return.
  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = (): void => {
      paused.value = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  })

  const region = labels?.region ?? t(builtin.carousel.region)
  const prevLabel = labels?.previous ?? t(builtin.carousel.previous)
  const nextLabel = labels?.next ?? t(builtin.carousel.next)
  const playLabel = labels?.play ?? t(builtin.carousel.play)
  const pauseLabel = labels?.pause ?? t(builtin.carousel.pause)
  const rotating = Boolean(autoplay && autoplay > 0)

  return (
    <section
      className={cn(styles['carousel'], className)}
      aria-roledescription="carousel"
      aria-label={region}
      onMouseEnter={() => {
        if (rotating) paused.value = true
      }}
      onMouseLeave={() => {
        if (rotating) paused.value = false
      }}
      onFocusCapture={() => {
        if (rotating) paused.value = true
      }}
      onBlurCapture={(e) => {
        if (rotating && !e.currentTarget.contains(e.relatedTarget as Node)) paused.value = false
      }}
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
          <span className={cn(styles['chevron'], styles['chevronPrev'])} aria-hidden="true" />
        </button>

        {/*
          `aria-live` per APG: announce slide changes when the carousel is not rotating on its
          own, and stay quiet while it is — an auto-advancing region that speaks every few
          seconds is unusable.
        */}
        <div
          ref={trackRef}
          id={`${baseId}-track`}
          className={styles['track']}
          aria-live={rotating && playing.value && !paused.value ? 'off' : 'polite'}
        >
          {items.map((slide, i) => (
            <div
              key={i}
              className={styles['slide']}
              role="group"
              aria-roledescription="slide"
              aria-label={t(builtin.carousel.slide, { n: i + 1, total })}
              /*
                `inert`, not `aria-hidden`. The inactive slides stay in the layout and remain
                scroll-reachable, so `aria-hidden` alone told assistive technology they did
                not exist while every link and button inside them was still tabbable — the
                canonical aria-hidden-focus violation (WCAG 4.1.2, and 2.4.3 for the focus
                order). `inert` removes both the focusability and the exposure together.
              */
              inert={i !== active.value ? true : undefined}
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
          <span className={cn(styles['chevron'], styles['chevronNext'])} aria-hidden="true" />
        </button>
      </div>

      <div className={styles['controls']}>
        {rotating && (
          <button
            type="button"
            className={styles['playPause']}
            aria-label={playing.value ? pauseLabel : playLabel}
            onClick={() => {
              playing.value = !playing.value
            }}
          >
            <span
              className={playing.value ? styles['pauseGlyph'] : styles['playGlyph']}
              aria-hidden="true"
            />
          </button>
        )}

        <div className={styles['dots']} role="group" aria-label={t(builtin.carousel.choose)}>
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
                onFocus={() => {
                  itemProps.onFocus?.()
                  // Arrow keys move focus between dots; following the focus with the slide is
                  // what makes them navigate the carousel rather than just the button row,
                  // which is what the manifest's keyboard list has always implied.
                  if (i !== active.value) goTo(i)
                }}
                onClick={() => goTo(i)}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
