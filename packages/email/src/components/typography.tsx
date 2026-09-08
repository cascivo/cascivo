/**
 * Typographic primitives: `Heading`, `Text`, `Link`, `List`.
 *
 * Every one resets `margin` explicitly. Client UA stylesheets disagree wildly on the default
 * margins of `<h1>`–`<h6>`, `<p>` and `<ul>`, and an email that relies on them lays out
 * differently in each — so the defaults are zeroed and spacing is stated.
 */
import type { ReactNode } from 'react'
import { fontStack } from '../runtime/fonts.ts'
import { token } from '../runtime/palette.ts'
import { merge, px, type Style } from '../runtime/style.ts'
import { TABLE_RESET } from './layout.tsx'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps {
  children?: ReactNode
  /** Semantic level. Drives the element, and the default size unless `size` overrides it. */
  level?: HeadingLevel
  size?: string
  align?: 'left' | 'center' | 'right'
  style?: Style
}

/** Pixel sizes per level. Fixed rather than token-derived: the type scale is in `rem`. */
const HEADING_SIZES: Record<HeadingLevel, string> = {
  1: '32px',
  2: '24px',
  3: '20px',
  4: '18px',
  5: '16px',
  6: '14px',
}

export function Heading({ children, level = 1, size, align, style }: HeadingProps) {
  const Tag = `h${level}` as 'h1'
  const base: Style = {
    margin: 0,
    fontFamily: fontStack('sans'),
    fontSize: size ?? HEADING_SIZES[level],
    lineHeight: '1.25',
    fontWeight: 600,
    color: token('--cascivo-color-foreground'),
    textAlign: align,
  }
  return <Tag style={px(merge(base, style))}>{children}</Tag>
}

export interface TextProps {
  children?: ReactNode
  size?: string
  /** `muted` for secondary copy — reads from `--cascivo-color-text-muted`. */
  variant?: 'default' | 'muted'
  align?: 'left' | 'center' | 'right'
  style?: Style
}

/**
 * A paragraph.
 *
 * `font-size` is never below 14px: iOS Mail inflates smaller text to its own minimum and
 * the layout shifts under it, which is why the size prop is a string rather than a scale
 * step — a caller that wants smaller must say so explicitly and see it in review.
 */
export function Text({ children, size = '16px', variant = 'default', align, style }: TextProps) {
  const base: Style = {
    margin: 0,
    fontFamily: fontStack('sans'),
    fontSize: size,
    lineHeight: '1.5',
    color:
      variant === 'muted'
        ? token('--cascivo-color-text-muted')
        : token('--cascivo-color-foreground'),
    textAlign: align,
  }
  return <p style={px(merge(base, style))}>{children}</p>
}

export interface LinkProps {
  children?: ReactNode
  href: string
  style?: Style
}

/**
 * An inline link.
 *
 * Reads `--cascivo-color-accent-text`, not `--cascivo-color-accent`. The accent is defined
 * for a fill; four shipped themes pick a hue that only works that way (warm's amber reads
 * 2.1:1 as type, brutalist's acid 1.3:1). `-accent-text` is the token those themes restate,
 * and `scripts/checks/accent-text-contrast.test.ts` guarantees it clears AA.
 */
export function Link({ children, href, style }: LinkProps) {
  const base: Style = {
    color: token('--cascivo-color-accent-text', token('--cascivo-color-accent')),
    textDecoration: 'underline',
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={px(merge(base, style))}>
      {children}
    </a>
  )
}

export interface ListProps {
  items: ReactNode[]
  ordered?: boolean
  style?: Style
}

/**
 * A bulleted or numbered list.
 *
 * Outlook Windows ignores `list-style-position` and mis-indents `<ul>` unless both `margin`
 * and `padding` are stated, so both are. The `items` prop follows the repo's collection
 * vocabulary — `items`, never `entries`.
 */
export function List({ items, ordered = false, style }: ListProps) {
  const Tag = ordered ? 'ol' : 'ul'
  const base: Style = {
    margin: 0,
    padding: '0 0 0 20px',
    fontFamily: fontStack('sans'),
    fontSize: '16px',
    lineHeight: '1.5',
    color: token('--cascivo-color-foreground'),
  }
  return (
    <Tag style={px(merge(base, style))}>
      {items.map((item, i) => (
        // eslint-disable-next-line react/no-array-index-key -- list items are static content in a one-shot render; there is no reconciliation to preserve.
        <li key={i} style={{ marginBottom: '8px' }}>
          {item}
        </li>
      ))}
    </Tag>
  )
}

export interface FooterProps {
  children?: ReactNode
  style?: Style
}

/**
 * The closing block — smaller, muted, centred.
 *
 * A table rather than a styled `<div>` so the padding lands on a `<td>`, per the file-level
 * rule in `layout.tsx`.
 */
export function Footer({ children, style }: FooterProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td
            align="center"
            style={px(
              merge(
                {
                  padding: '24px 16px',
                  fontFamily: fontStack('sans'),
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: token('--cascivo-color-text-muted'),
                  textAlign: 'center',
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
