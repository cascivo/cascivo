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
  /**
   * Horizontal placement. Omit it to follow the cell the button sits in.
   *
   * There is no default, and that is half the fix for a bug this shipped: `align` used to
   * default to `'left'`, and because a button is its own table carrying its own `align`
   * attribute, that default beat the `align` of any `Column` around it. A feedback row
   * written as `<Column align="right"><Button/></Column>` rendered hard left, and the two
   * buttons of a pair ended up splayed to opposite edges of the message.
   *
   * Removing the default was not enough on its own, and this docstring claimed otherwise
   * for a release — an adopter deleted their explicit `align` props on the strength of it
   * and the pair splayed again. The other half was in `Column`, which stated its alignment
   * twice: once as the `align` attribute, which moves a nested table, and once as
   * `text-align` in the style, which does not and which won the cascade. See the alignment
   * rule in `layout.tsx`'s header for the measurements.
   *
   * So a button now does follow its cell — but only a cell whose alignment comes from
   * `Column`/`Section`'s `align` prop. A cell given `style={{ textAlign }}` by hand is back
   * to the old behaviour, and a button in one needs this prop set.
   */
  align?: 'left' | 'center' | 'right'
  /** Full-width call to action. */
  block?: boolean
  /** Click-beacon URLs, space-separated — the `ping` attribute. Same caveats as `Link`'s. */
  ping?: string
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
  align,
  block = false,
  ping,
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
              {...(ping === undefined ? {} : { ping })}
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
  /**
   * Fixed height, in pixels, emitted as the `height` attribute only.
   *
   * Omit it for an image that must scale: with no height stated, every client derives one
   * from the intrinsic aspect ratio and the image stays undistorted when `max-width: 100%`
   * shrinks it below `width`. Supply it only when the box must be reserved at a known size.
   */
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
 * Height is carried by the attribute alone, the same rule `Spacer` states: `css-height` is
 * `n` in Yahoo and `a` in Outlook Windows, and a CSS copy of a number the attribute already
 * gives is bytes that buy nothing. The omitted `height: auto` is the initial value, so its
 * absence is not a change either — an image with no stated height has always been sized
 * from its intrinsic ratio.
 *
 * `outline: none` is gone for the same reason, and is worth naming because it appears in
 * every copied-around email image reset: `css-outline` is `n` in Outlook Windows, the
 * `border: 0` beside it already removes the link border it was meant to suppress, and an
 * `<img>` takes no focus ring to begin with. It survived this long only because no shipped
 * template used `Img`, so the conformance lint never saw it.
 *
 * SVG is not usable — `html-svg` is blocked in every floor client except Apple Mail. Callers
 * must supply PNG or JPEG.
 */
export function Img({ src, alt, width, height, href, style }: ImgProps) {
  const base: Style = {
    display: 'block',
    width: `${width}px`,
    maxWidth: '100%',
    border: 0,
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
  /**
   * Extra class, for a rule of your own in a `Style` block.
   *
   * A `Card` is a panel whose padding usually wants to shrink below the breakpoint, which
   * is a media query, which needs a selector — so this is here for the same reason the
   * layout primitives have one. The first cut gave classes to the layout primitives only;
   * the split read as principled and left out two of the three cases anybody actually has.
   */
  className?: string
  style?: Style
}

/**
 * A bordered surface.
 *
 * One table, one cell, border and padding both on the cell — the only arrangement Outlook
 * Windows renders with the border in the right place.
 */
export function Card({ children, padding = 24, className, style }: CardProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td
            className={className}
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
