/**
 * Layout primitives: `Container`, `Section`, `Row`, `Column`, `Spacer`, `Hr`.
 *
 * Every one of these is a table. That is not nostalgia — `css-display-flex` and
 * `css-display-grid` both report `n` for Outlook Windows in the vendored matrix, and
 * `css-gap` reports `n` for Outlook Windows and Yahoo. Tables are the only layout mechanism
 * with unanimous support, so the primitive set is built on them and the conformance lint
 * keeps it that way.
 *
 * Three rules hold across the file:
 *
 *  - Every layout table carries `role="presentation"` plus `cellPadding`/`cellSpacing`/
 *    `border` of zero. The role keeps a screen reader from announcing a data table; the
 *    three attributes are the presentational HTML that Outlook honours where CSS fails.
 *  - Padding goes on `<td>`, never on a wrapper. `css-padding` is `a` for Outlook Windows
 *    precisely because it applies to table cells and not to `<div>`.
 *  - Widths are set as an attribute *and* in CSS. Outlook reads the attribute; everything
 *    else reads the style.
 */
import type { ReactNode } from 'react'
import { token } from '../runtime/palette.ts'
import { merge, px, type Style } from '../runtime/style.ts'

/** Attributes every presentational table repeats. Spread, so none can be forgotten. */
export const TABLE_RESET = {
  role: 'presentation' as const,
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
}

/** The canonical email content width. 600px clears every desktop reading pane. */
export const CONTENT_WIDTH = 600

export interface ContainerProps {
  children?: ReactNode
  /** Content width in pixels. */
  width?: number
  style?: Style
}

/**
 * Centred fixed-width column — the outermost content wrapper.
 *
 * `margin: 0 auto` centres it everywhere except Outlook Windows, which ignores auto margins
 * on tables; `align="center"` is the attribute Outlook does honour. Both are present because
 * neither alone works everywhere.
 */
export function Container({ children, width = CONTENT_WIDTH, style }: ContainerProps) {
  const base: Style = { width: `${width}px`, maxWidth: '100%', margin: '0 auto' }
  return (
    <table {...TABLE_RESET} align="center" width={width} style={px(merge(base, style))}>
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

export interface SectionProps {
  children?: ReactNode
  /** Vertical padding in pixels, applied to the cell. */
  padding?: number | string
  background?: string
  align?: 'left' | 'center' | 'right'
  style?: Style
}

/**
 * A full-width band of content.
 *
 * The single most expensive mistake in email markup is a table per wrapper: nesting depth is
 * where the bytes go, and Gmail clips at ~102 KB. `Section` emits exactly one table with one
 * cell, and the renderer's normalization pass drops even that when a section's only child is
 * already a table.
 */
export function Section({ children, padding = 0, background, align, style }: SectionProps) {
  const cell: Style = {
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    backgroundColor: background,
    textAlign: align,
  }
  return (
    <table {...TABLE_RESET} width="100%" style={px(merge({ width: '100%' }, style))}>
      <tbody>
        <tr>
          <td style={px(cell)} align={align}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface RowProps {
  children?: ReactNode
  style?: Style
}

/**
 * A horizontal group of {@link Column}s.
 *
 * Children must be `Column`s. React Email has a long-standing bug where a `Column` inside a
 * `Section` emits stray `<td>`s, because the parent inspects children for `td` elements and
 * a component is not one. This avoids the class of bug entirely by never inspecting
 * children: `Row` emits `<tr>` and trusts `Column` to emit `<td>`, which the structural
 * invariants then verify on the rendered output rather than at construction time.
 */
export function Row({ children, style }: RowProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={px(merge({ width: '100%' }, style))}>
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  )
}

export interface ColumnProps {
  children?: ReactNode
  /** Width as a percentage or pixel count. Set both attribute and style. */
  width?: number | string
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  padding?: number | string
  style?: Style
}

/**
 * One cell of a {@link Row}.
 *
 * Stacking on narrow screens is deliberately NOT attempted here. The usual technique needs
 * a `@media` query, and `css-at-media` is blocked in Outlook Windows and Gmail — so a
 * component that promised responsive stacking would keep that promise only in Apple Mail.
 * A layout that must reflow should use one `Row` per line instead.
 */
export function Column({ children, width, align, valign = 'top', padding, style }: ColumnProps) {
  const cell: Style = {
    width: typeof width === 'number' ? `${width}px` : width,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    textAlign: align,
    verticalAlign: valign,
  }
  return (
    <td
      {...(width === undefined ? {} : { width: typeof width === 'number' ? width : undefined })}
      align={align}
      valign={valign}
      style={px(merge(cell, style))}
    >
      {children}
    </td>
  )
}

export interface SpacerProps {
  /** Height in pixels. */
  height: number
}

/**
 * Vertical space.
 *
 * A margin would be simpler and is not dependable: Outlook Windows collapses and ignores
 * margins in several positions. A table row with an explicit height, a non-breaking space,
 * and `font-size`/`line-height` pinned to the same height is the shape that survives —
 * without the font-size pin, Outlook gives the cell the minimum line box of its inherited
 * font and the gap is wrong by several pixels.
 *
 * The height is carried by the `height` **attribute** only. A CSS `height` alongside it
 * would be redundant everywhere and is blocked in Yahoo, so it is bytes that buy nothing;
 * the attribute plus the pinned line box is what actually reserves the space.
 */
export function Spacer({ height }: SpacerProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td height={height} style={{ fontSize: `${height}px`, lineHeight: `${height}px` }}>
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface HrProps {
  style?: Style
  /** Space above and below, in pixels. */
  spacing?: number
}

/**
 * A rule.
 *
 * Drawn as a bordered table cell rather than `<hr>`: Outlook Windows renders `<hr>` with its
 * own inset 3D border and ignores most styling on it. A one-pixel top border on an empty
 * cell is the same line everywhere.
 */
export function Hr({ style, spacing = 0 }: HrProps) {
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td
            style={px(
              merge(
                {
                  borderTop: `1px solid ${token('--cascivo-color-border')}`,
                  fontSize: '1px',
                  lineHeight: '1px',
                  paddingTop: spacing ? `${spacing}px` : undefined,
                  marginTop: spacing ? `${spacing}px` : undefined,
                },
                style,
              ),
            )}
          >
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  )
}
