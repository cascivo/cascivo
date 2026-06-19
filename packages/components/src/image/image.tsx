'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascivo/core'
import type { CSSProperties, ImgHTMLAttributes } from 'react'
import styles from './image.module.css'

// loading → loaded → error, mirroring avatar's load FSM (the component drives
// the transitions via the native <img> load lifecycle — no effect hook needed).
const machine = createMachine({
  initial: 'loading' as const,
  states: {
    loading: { on: { LOADED: 'loaded', ERROR: 'error' } },
    loaded: {},
    error: {},
  },
})

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  src?: string
  alt?: string
  /** Image shown if `src` fails to load. Without it, a neutral fallback box renders. */
  fallbackSrc?: string
  width?: string | number
  height?: string | number
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  /** Hover-zoom the image (reduced-motion-safe). */
  zoom?: boolean
  /** Render a bare <img> with no wrapper, placeholder, or zoom (HeroUI parity). */
  removeWrapper?: boolean
  /** Show a blurred placeholder while loading. */
  isBlurred?: boolean
}

export function Image({
  src,
  alt = '',
  fallbackSrc,
  width,
  height,
  radius = 'md',
  zoom = false,
  removeWrapper = false,
  isBlurred = false,
  className,
  style,
  ...rest
}: ImageProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const errored = state.value === 'error'
  const showFallbackBox = errored && !fallbackSrc
  const imageSrc = errored && fallbackSrc ? fallbackSrc : src

  const sizeVars: CSSProperties = {
    ...(width !== undefined && { inlineSize: width }),
    ...(height !== undefined && { blockSize: height }),
  }

  if (removeWrapper) {
    return (
      <img
        className={cn(styles['image'], className)}
        src={imageSrc}
        alt={alt}
        onLoad={() => send('LOADED')}
        onError={() => send('ERROR')}
        style={{ ...sizeVars, ...style }}
        {...rest}
      />
    )
  }

  return (
    <span
      data-state={state.value}
      data-radius={radius}
      data-zoom={zoom || undefined}
      data-blurred={isBlurred || undefined}
      className={cn(styles['wrapper'], className)}
      style={{ ...sizeVars, ...style }}
      role={showFallbackBox ? 'img' : undefined}
      aria-label={showFallbackBox ? alt : undefined}
    >
      {state.value === 'loading' && <span className={styles['placeholder']} aria-hidden="true" />}
      {showFallbackBox ? (
        <span className={styles['fallback']} aria-hidden="true" />
      ) : (
        <img
          className={styles['image']}
          src={imageSrc}
          alt={alt}
          onLoad={() => send('LOADED')}
          onError={() => send('ERROR')}
          {...rest}
        />
      )}
    </span>
  )
}
