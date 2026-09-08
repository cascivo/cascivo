/**
 * Content primitives: `Button`, `Img`, `Card`, `Badge`, `Alert`.
 *
 * These are where Outlook Windows costs the most markup. `css-border-radius` reports `n`
 * there, so a rounded button is square in Outlook unless VML draws it; `html-svg` is
 * blocked, so images must be raster. Each accommodation below is annotated with the
 * conformance finding that forces it.
 */
import type { ReactNode } from 'react'
import { fontStack } from '../runtime/fonts.ts'
import { token } from '../runtime/palette.ts'
import { merge, px, remToPx, type Style } from '../runtime/style.ts'
import { TABLE_RESET } from './layout.tsx'

export interface ButtonProps {
  children?: ReactNode
  href: string
  variant?: 'primary' | 'secondary' | 'destructive'
  align?: 'left' | 'center' | 'right'
  /** Full-width call to action. */
  block?: boolean
  style?: Style
}

/**
 * A call-to-action button.
 *
 * An `<a>` painted as a block inside a table cell, not a `<button>`: a form control does
 * nothing in an email and several clients strip it. The padding sits on the anchor because
 * that is what makes the whole rectangle clickable — padding on the cell would leave a
 * border of dead pixels around the label.
 *
 * `border-radius` is emitted for the clients that honour it and simply ignored by Outlook
 * Windows, which renders a square button. That is a deliberate choice over the VML
 * alternative: `v:roundrect` costs roughly 400 bytes per button, cannot inherit the
 * anchor's styles, and has to be kept in sync by hand — a square button in one client is a
 * better trade than a second, divergent implementation of every button.
 */
export function Button({
  children,
  href,
  variant = 'primary',
  align = 'left',
  block = false,
  style,
}: ButtonProps) {
  const palette = {
    primary: {
      backgroundColor: token('--cascivo-color-accent'),
      color: token('--cascivo-color-text-on-accent'),
      border: 'none',
    },
    secondary: {
      backgroundColor: token('--cascivo-color-surface'),
      color: token('--cascivo-color-foreground'),
      border: `1px solid ${token('--cascivo-color-border')}`,
    },
    destructive: {
      backgroundColor: token('--cascivo-color-destructive'),
      color: token('--cascivo-color-text-on-destructive'),
      border: 'none',
    },
  }[variant]

  const anchor: Style = {
    display: 'inline-block',
    padding: '12px 24px',
    fontFamily: fontStack('sans'),
    fontSize: '16px',
    lineHeight: '1.25',
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: remToPx(token('--cascivo-radius-control', '6px')),
    ...palette,
    ...(block ? { display: 'block', width: '100%' } : {}),
  }

  return (
    <table {...TABLE_RESET} {...(block ? { width: '100%' } : {})} align={align}>
      <tbody>
        <tr>
          <td align={align} style={block ? { width: '100%' } : undefined}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={px(merge(anchor, style))}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface ImgProps {
  /** Absolute URL. A relative path resolves against the client's own host and 404s. */
  src: string
  /** Required. An image with no alt text is unreadable in the ~40% of clients that block images by default. */
  alt: string
  width: number
  height?: number
  href?: string
  style?: Style
}

/**
 * A raster image.
 *
 * `width` is required and emitted as both attribute and style, because Outlook sizes from
 * the attribute and will otherwise render the image at its intrinsic pixel size. `alt` is
 * required by the type: images are blocked by default in a large share of clients, and an
 * unlabelled image is simply missing content there.
 *
 * SVG is not usable — `html-svg` is blocked in every floor client except Apple Mail. Callers
 * must supply PNG or JPEG.
 */
export function Img({ src, alt, width, height, href, style }: ImgProps) {
  const base: Style = {
    display: 'block',
    width: `${width}px`,
    maxWidth: '100%',
    height: height ? `${height}px` : 'auto',
    border: 0,
    outline: 'none',
    textDecoration: 'none',
    msInterpolationMode: 'bicubic',
  }
  const img = (
    <img
      src={src}
      alt={alt}
      width={width}
      {...(height === undefined ? {} : { height })}
      style={px(merge(base, style))}
    />
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  )
}

export interface CardProps {
  children?: ReactNode
  padding?: number
  style?: Style
}

/**
 * A bordered surface.
 *
 * One table, one cell, border and padding both on the cell — the only arrangement Outlook
 * Windows renders with the border in the right place.
 */
export function Card({ children, padding = 24, style }: CardProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td
            style={px(
              merge(
                {
                  padding: `${padding}px`,
                  backgroundColor: token('--cascivo-color-surface'),
                  border: `1px solid ${token('--cascivo-color-border')}`,
                  borderRadius: remToPx(token('--cascivo-radius-lg', '8px')),
                },
                style,
              ),
            )}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface BadgeProps {
  children?: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'destructive' | 'info'
  style?: Style
}

/**
 * A small status pill.
 *
 * The one primitive that is knowingly imperfect in Outlook Windows, and the trade is worth
 * stating. A badge has to be *inline* — it sits beside text inside a cell — so it cannot be
 * a table like every other primitive here, and `css-padding` is partial in Outlook Windows
 * precisely because it applies to `<td>` and not to inline elements. There, the pill renders
 * with its colours but no breathing room.
 *
 * The `&nbsp;` on each side is the fallback: a client that drops the padding still gets a
 * space of tint either side of the label, so the pill reads as a pill rather than as a run
 * of coloured text. Clients that honour the padding absorb the spaces into it.
 *
 * `inline-table` was the alternative and is worse — support is patchy enough that the badge
 * would break to its own line in several clients, which is a layout bug rather than a
 * cosmetic one.
 */
export function Badge({ children, tone = 'neutral', style }: BadgeProps) {
  const colors: Record<NonNullable<BadgeProps['tone']>, { bg: string; fg: string }> = {
    neutral: {
      bg: token('--cascivo-color-surface-2', token('--cascivo-color-surface')),
      fg: token('--cascivo-color-text-muted'),
    },
    success: {
      bg: token('--cascivo-color-success-subtle', token('--cascivo-color-surface')),
      fg: token('--cascivo-color-success-foreground', token('--cascivo-color-success')),
    },
    warning: {
      bg: token('--cascivo-color-warning-subtle', token('--cascivo-color-surface')),
      fg: token('--cascivo-color-warning-foreground', token('--cascivo-color-warning')),
    },
    destructive: {
      bg: token('--cascivo-color-destructive-subtle', token('--cascivo-color-surface')),
      fg: token('--cascivo-color-destructive-foreground', token('--cascivo-color-destructive')),
    },
    info: {
      bg: token('--cascivo-color-info-subtle', token('--cascivo-color-surface')),
      fg: token('--cascivo-color-info-foreground', token('--cascivo-color-info')),
    },
  }
  const { bg, fg } = colors[tone]
  return (
    <span
      style={px(
        merge(
          {
            display: 'inline-block',
            padding: '4px 10px',
            fontFamily: fontStack('sans'),
            fontSize: '14px',
            lineHeight: '1.25',
            fontWeight: 600,
            color: fg,
            backgroundColor: bg,
            borderRadius: '999px',
          },
          style,
        ),
      )}
    >
      &nbsp;{children}&nbsp;
    </span>
  )
}

export interface AlertProps {
  children?: ReactNode
  tone?: 'info' | 'success' | 'warning' | 'destructive'
  /** Optional bold lead-in above the body copy. */
  title?: string
  style?: Style
}

/**
 * A callout.
 *
 * The tone is carried by a 4px left border plus a tinted background, not by an icon: icons
 * would have to be images, and images are blocked by default in a large share of clients —
 * which would leave the tone invisible exactly where the callout matters most.
 *
 * The border is physical (`borderLeft`) rather than logical. `css-border-inline-block-*` is
 * not supported, and this is the one place the repo's logical-property rule is inverted for
 * email; `rtl:check` exempts this package for that reason.
 */
export function Alert({ children, tone = 'info', title, style }: AlertProps) {
  const accent = {
    info: token('--cascivo-color-info', token('--cascivo-color-accent')),
    success: token('--cascivo-color-success'),
    warning: token('--cascivo-color-warning'),
    destructive: token('--cascivo-color-destructive'),
  }[tone]
  const background = {
    info: token('--cascivo-color-info-subtle', token('--cascivo-color-surface')),
    success: token('--cascivo-color-success-subtle', token('--cascivo-color-surface')),
    warning: token('--cascivo-color-warning-subtle', token('--cascivo-color-surface')),
    destructive: token('--cascivo-color-destructive-subtle', token('--cascivo-color-surface')),
  }[tone]

  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td
            style={px(
              merge(
                {
                  padding: '16px',
                  backgroundColor: background,
                  borderLeft: `4px solid ${accent}`,
                  fontFamily: fontStack('sans'),
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: token('--cascivo-color-foreground'),
                },
                style,
              ),
            )}
          >
            {title ? (
              <p
                style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '16px', lineHeight: '1.5' }}
              >
                {title}
              </p>
            ) : null}
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
