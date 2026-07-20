'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './avatar.module.css'

const machine = createMachine({
  initial: 'loading' as const,
  states: {
    loading: { on: { LOADED: 'loaded', ERROR: 'error' } },
    loaded: {},
    error: {},
  },
})

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string
  alt?: string
  /** Full name — used to derive initials for the fallback and as the accessible label. */
  name?: string
  /** Explicit fallback text (initials/glyph). Overrides initials derived from `name`. */
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
}

export function Avatar({
  src,
  alt = '',
  name,
  fallback,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const showImage = Boolean(src) && state.value !== 'error'
  // Explicit `fallback` wins; otherwise derive initials from `name`.
  const fallbackText = fallback ?? initialsFrom(name)
  // Only expose role="img" when there's a name for it. A nameless avatar (no
  // alt, no name, no fallback — e.g. a src that 404s in a static build) becomes
  // decorative instead of an unlabeled image (role-img-alt).
  const label = alt || name || fallback

  return (
    <span
      data-size={size}
      data-status={status}
      className={cn(styles['avatar'], className)}
      role={showImage || !label ? undefined : 'img'}
      aria-label={showImage ? undefined : label || undefined}
      {...props}
    >
      {showImage ? (
        <img
          className={styles['image']}
          src={src}
          alt={alt || name || ''}
          onLoad={() => send('LOADED')}
          onError={() => send('ERROR')}
        />
      ) : (
        <span className={styles['fallback']} aria-hidden="true">
          {fallbackText}
        </span>
      )}
      {status && <span className={styles['status']} aria-hidden="true" />}
    </span>
  )
}

/** First grapheme of the first word + first of the last word, uppercased. */
function initialsFrom(name?: string): string | undefined {
  if (!name) return undefined
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return undefined
  const first = firstGrapheme(words[0]!)
  const last = words.length > 1 ? firstGrapheme(words[words.length - 1]!) : ''
  const initials = (first + last).toLocaleUpperCase()
  return initials || undefined
}

function firstGrapheme(word: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    for (const s of seg.segment(word)) return s.segment
  }
  return [...word][0] ?? ''
}
