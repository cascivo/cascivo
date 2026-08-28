import type { JSX } from 'preact'

/**
 * The cascivo mark ("the Notch") and its lockups.
 *
 * Inline, never an `<img>`: `currentColor` and `--cascivo-color-accent` only resolve
 * when the SVG is part of the document, which is what lets the mark repaint with any
 * `data-theme` subtree it is dropped into (logo brief §3, engineering note 1).
 *
 * Geometry is arithmetic on a 32-unit grid — stem 11, bars 11, notch 21x10 flush to
 * the right edge. Do not round, rotate, stretch, or add a shadow; the mark is always 1:1.
 */

/** One closed path: a filled square with a bite out of the right edge. */
const MARK_PATH = 'M0 0H32V11H11V21H32V32H0Z'

/** The bite, as the accent fills it. Decoration — the mark is complete without it. */
const NOTCH = { x: 11, y: 11, width: 21, height: 10 } as const

/** Below this the notch closes optically; use the wordmark alone (brief §4). */
const MIN_MARK_PX = 16

export type LogoVariant = 'mark' | 'mark-accent' | 'horizontal' | 'stacked' | 'nav'

export interface LogoProps {
  /**
   * `mark` / `mark-accent` render the square alone; `horizontal`, `stacked` and `nav`
   * add the wordmark. `nav` is the only lockup permitted below 24px.
   *
   * @defaultValue `mark`
   */
  variant?: LogoVariant
  /** Mark height in px. Defaults to 18 for `nav`, 32 otherwise. */
  size?: number
  className?: string | undefined
}

/** The wordmark is 16px against an 18px mark in the nav lockup — hold that ratio. */
const WORDMARK_RATIO = 16 / 18

function Mark({ accent, size, hidden }: { accent: boolean; size: number; hidden: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      // In a lockup the wordmark already names the brand — announcing it twice is
      // noise, so the mark drops out of the a11y tree (brief engineering note 3).
      {...(hidden ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'cascivo' })}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {hidden ? null : <title>cascivo</title>}
      <path d={MARK_PATH} fill="currentColor" />
      {accent && <rect {...NOTCH} fill="var(--cascivo-color-accent, oklch(0.88 0.19 105))" />}
    </svg>
  )
}

export function Logo({ variant = 'mark', size, className }: LogoProps): JSX.Element {
  const markSize = Math.max(size ?? (variant === 'nav' ? 18 : 32), MIN_MARK_PX)

  if (variant === 'mark' || variant === 'mark-accent') {
    return (
      <span className={className} style={{ display: 'inline-flex', color: 'inherit' }}>
        <Mark accent={variant === 'mark-accent'} size={markSize} hidden={false} />
      </span>
    )
  }

  const stacked = variant === 'stacked'
  // Gap: 1/3 of the mark height horizontally, 1/4 stacked, a flat 10px in the nav
  // lockup — the one place the ratio is fixed rather than derived (brief §5).
  const gap = variant === 'nav' ? 10 : markSize / (stacked ? 4 : 3)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        // Stacked is left aligned, never centred.
        alignItems: stacked ? 'flex-start' : 'center',
        gap: `${gap}px`,
        color: 'inherit',
      }}
    >
      <Mark accent={variant !== 'nav'} size={markSize} hidden />
      <span
        style={{
          fontFamily: 'var(--cascivo-font-display)',
          fontSize: `${variant === 'nav' ? 16 : Math.round(markSize * WORDMARK_RATIO)}px`,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          // The wordmark is lowercase, full stop — surrounding chrome (the landing
          // header uppercases its brand slot) must not restyle it.
          textTransform: 'none',
          color: 'currentColor',
        }}
      >
        cascivo
      </span>
    </span>
  )
}
