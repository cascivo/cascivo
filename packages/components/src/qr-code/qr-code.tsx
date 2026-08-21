'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import { encode } from './encode'
import type { ErrorCorrection } from './encode'
import styles from './qr-code.module.css'

export interface QrCodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The text or URL to encode. */
  value: string
  /** Rendered size in pixels (width and height). Default 128. */
  size?: number
  /**
   * Higher levels tolerate more damage but hold less data
   *
   * @defaultValue `M`
   * @see the component manifest
   */
  errorCorrection?: ErrorCorrection
  /** CSS length rounding the code's corners (applied to the container). */
  radius?: string
  /**
   * Foreground color of the QR modules.
   *
   * @defaultValue `currentColor`
   * @see the component manifest
   */
  fill?: string
  /**
   * Background color behind the QR code.
   *
   * @defaultValue `transparent`
   * @see the component manifest
   */
  background?: string
  /** Accessible name for the QR image — **not rendered**. Defaults to the i18n built-in
   * "QR code". */
  label?: string
  /**
   * Alias of `label` — the same invisible accessible name under the catalog's own spelling.
   *
   * `ariaLabel` is what the catalog calls a name nothing paints, so it is the guess an agent
   * makes after reading one other component (2026-08-21 report item 1). This component
   * predates the convention and shipped `label`; both work and neither is deprecated.
   */
  ariaLabel?: string
}

const QUIET_ZONE = 4

export function QrCode({
  value,
  size = 128,
  errorCorrection = 'M',
  radius,
  fill = 'currentColor',
  background = 'transparent',
  label,
  ariaLabel,
  className,
  style,
  ...props
}: QrCodeProps) {
  useSignals()
  if (!value) return null

  const matrix = encode(value, errorCorrection)
  const dim = matrix.length + QUIET_ZONE * 2

  let path = ''
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix.length; x++) {
      if (matrix[y]![x]) path += `M${x + QUIET_ZONE},${y + QUIET_ZONE}h1v1h-1z`
    }
  }

  return (
    <div
      className={cn(styles['qrCode'], className)}
      style={{ inlineSize: size, blockSize: size, borderRadius: radius, ...style }}
      {...props}
    >
      <svg
        className={styles['svg']}
        role="img"
        aria-label={ariaLabel ?? label ?? t(builtin.qrCode.label)}
        viewBox={`0 0 ${dim} ${dim}`}
        shapeRendering="crispEdges"
      >
        <rect width={dim} height={dim} fill={background} />
        <path d={path} fill={fill} />
      </svg>
    </div>
  )
}
