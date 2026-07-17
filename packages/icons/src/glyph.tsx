import type { CSSProperties, HTMLAttributes } from 'react'
import type { GlyphName, MorphName } from './glyphs/spec'

export type { GlyphName, MorphName } from './glyphs/spec'

export interface GlyphProps extends HTMLAttributes<HTMLSpanElement> {
  /** Which glyph to render — a static glyph or a morph. */
  name: GlyphName | MorphName
  /** Edge length; a number is treated as px. Sets `--cascivo-glyph-size` (CSS default: 1.5rem). */
  size?: number | string
  /** Morph glyphs only — drives the `[data-state="open"]` transition. */
  open?: boolean
}

/**
 * Pure-CSS glyph. Renders an empty `<span>` that the `@cascivo/icons/glyphs.css`
 * stylesheet paints via `clip-path: shape()` over `background: currentColor`, so
 * it inherits the surrounding text color and resizes via `--cascivo-glyph-size`.
 * That stylesheet must be imported once by the app; without it the span is
 * invisible. Decorative by default (`aria-hidden`); pass `aria-label` to expose it.
 *
 * Hook-free and RSC-safe — no client boundary required.
 */
export function Glyph({ name, size, open, className, style, ...props }: GlyphProps) {
  const cls = className ? `cascivo-glyph ${className}` : 'cascivo-glyph'
  const sizedStyle =
    size == null
      ? style
      : ({
          ...style,
          '--cascivo-glyph-size': typeof size === 'number' ? `${size}px` : size,
        } as CSSProperties & { '--cascivo-glyph-size': string })
  return (
    <span
      className={cls}
      data-glyph={name}
      data-state={open ? 'open' : undefined}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
      style={sizedStyle}
    />
  )
}
Glyph.displayName = 'Glyph'
