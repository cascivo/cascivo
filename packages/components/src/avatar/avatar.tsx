'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascade-ui/core'
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
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy'
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const showImage = Boolean(src) && state.value !== 'error'

  return (
    <span
      data-size={size}
      data-status={status}
      className={cn(styles['avatar'], className)}
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : alt || fallback}
      {...props}
    >
      {showImage ? (
        <img
          className={styles['image']}
          src={src}
          alt={alt}
          onLoad={() => send('LOADED')}
          onError={() => send('ERROR')}
        />
      ) : (
        <span className={styles['fallback']} aria-hidden="true">
          {fallback}
        </span>
      )}
      {status && <span className={styles['status']} aria-hidden="true" />}
    </span>
  )
}
