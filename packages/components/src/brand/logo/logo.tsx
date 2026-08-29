import { cn } from '@cascivo/core/pure'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './logo.module.css'

/**
 * The cascivo mark ("the Notch") on its 32-unit grid: a filled square with a
 * 21x10 bite out of the right edge. Stem 11, bars 11. One closed path.
 */
const MARK_PATH = 'M0 0H32V11H11V21H32V32H0Z'

/** Below this the notch closes optically — use the wordmark alone. */
const MIN_MARK_PX = 16

export type LogoVariant = 'mark' | 'mark-accent' | 'horizontal' | 'stacked' | 'nav'

export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The logo renders the mark and, in a lockup, the wordmark — there is no slot for
   * anything else. `never` rather than `Omit<>` because omitting a key off
   * `HTMLAttributes` loses the `style` widening that the signals JSX augmentation
   * applies in an adopter's project, and the spread below then fails to compile there.
   */
  children?: never
  /**
   * `mark` and `mark-accent` render the square alone; `horizontal`, `stacked` and `nav`
   * add the wordmark. `nav` is the only lockup permitted below 24px.
   *
   * @defaultValue `mark`
   * @see the component manifest
   */
  variant?: LogoVariant
  /**
   * Mark height in px. Clamped to a 16px floor — below that the notch closes optically.
   *
   * @defaultValue `18` for `nav`, `32` otherwise
   * @see the component manifest
   */
  size?: number
}

function Mark({ accent, size, labelled }: { accent: boolean; size: number; labelled: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={styles['mark'] as string | undefined}
      // In a lockup the wordmark already names the brand, so the mark leaves the
      // a11y tree rather than having a screen reader announce "cascivo" twice.
      {...(labelled ? { role: 'img' } : { 'aria-hidden': true })}
    >
      {labelled && <title>cascivo</title>}
      <path d={MARK_PATH} fill="currentColor" />
      {accent && <rect x="11" y="11" width="21" height="10" className={styles['notch']} />}
    </svg>
  )
}

/**
 * The cascivo logo: the mark on its own, or one of the three sanctioned lockups.
 *
 * Renders inline SVG rather than an `<img>` on purpose — `currentColor` and
 * `--cascivo-color-accent` only resolve when the SVG is part of the document, which is
 * what lets the logo repaint with whatever `data-theme` subtree it is dropped into.
 */
export function Logo({ variant = 'mark', size, className, style, ...props }: LogoProps) {
  const markSize = Math.max(size ?? (variant === 'nav' ? 18 : 32), MIN_MARK_PX)
  const isLockup = variant === 'horizontal' || variant === 'stacked' || variant === 'nav'

  return (
    <span
      data-cascivo-logo={variant}
      className={cn(styles['logo'], className as string | undefined)}
      // The caller's style spreads last so it can still override anything, but it
      // no longer replaces the size hook the gap and wordmark are derived from.
      //
      // The cast on `style` is load-bearing in the OTHER type world, not ours: with
      // `@preact/signals-react`'s JSX augmentation loaded — every adopter that installs
      // the signals runtime — `style` widens to `Signalish<CSSProperties | undefined>`,
      // and a union carrying a non-object member is not spreadable (TS2698). Our own
      // tsconfig never loads that augmentation, so a type-aware lint run inside this
      // repo will call it unnecessary. It is not. See CLAUDE.md, "two type worlds".
      style={
        {
          '--cascivo-logo-size': `${markSize}px`,
          ...(style as CSSProperties | undefined),
        } as CSSProperties
      }
      {...props}
    >
      <Mark accent={variant !== 'mark' && variant !== 'nav'} size={markSize} labelled={!isLockup} />
      {isLockup && <span className={styles['wordmark']}>cascivo</span>}
    </span>
  )
}
