import { cn, normalizeTone } from '@cascivo/core/pure'
import type { ToneInput } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './status.module.css'

/** Canonical tone → the value Status's stylesheet keys on. */
const TONE_CLASS: Record<string, string> = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Severity tone. Accepts the catalog-wide `Tone` vocabulary
   * (`neutral | info | success | warning | danger`) plus Status's historical spellings
   * (`error`, `destructive`, `default`).
   *
   * To name this type in your own code — a `Record<DeployState, Tone>` is the usual shape —
   * import it: `import type { Tone } from '@cascivo/react/types'` on the prebuilt path, or
   * from `@cascivo/core` if you copied the source. Do not add `@cascivo/core` to a prebuilt
   * app just for this; it is a transitive dependency there.
   */
  status?: ToneInput
  /**
   * Pulses the dot — gated behind prefers-reduced-motion: no-preference
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  pulse?: boolean
}

export function Status({
  status = 'neutral',
  pulse = false,
  className,
  children,
  ...props
}: StatusProps) {
  return (
    <span
      data-status={TONE_CLASS[normalizeTone(status)] ?? status}
      data-pulse={pulse ? '' : undefined}
      className={cn(styles['status'], className as string | undefined)}
      {...props}
    >
      <span aria-hidden="true" className={styles['dot']} />
      {children}
    </span>
  )
}
