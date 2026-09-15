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
import { Style as StyleBlock } from './style.tsx'

/** Attributes every presentational table repeats. Spread, so none can be forgotten. */
export const TABLE_RESET = {
  role: 'presentation' as const,
  cellPadding: 0,
  cellSpacing: 0,
  border: 0,
}

/** The canonical email content width. 600px clears every desktop reading pane. */
export const CONTENT_WIDTH = 600

/**
 * The viewport width below which a container has to stop being fixed: its own width.
 *
 * Deliberately not a rung of the repo's canonical breakpoint scale, and the one place in
 * the codebase where that is right. A design breakpoint asks "is this a phone"; this asks
 * "is the viewport narrower than this particular table", which is a different question with
 * an exact answer already in hand. A 480px `Container` should go fluid at 480px, not at the
 * 640px that happens to be `md` — and pinning to the scale would also make a 620px viewport
 * stretch a 600px email edge to edge for no reason.
 *
 * Stated in `px` because `css-unit-rem` is `n` in Outlook Windows and Yahoo, and no client
 * resolves a custom property inside a media condition.
 */
function fluidBelow(width: number): string {
  return `${width}px`
}

/**
 * Classes the responsive rules select on.
 *
 * A class, not the `[style*='…']` attribute selector an adopter reached for before this
 * existed: `css-selector-attribute` is `n` in Outlook Windows where `css-selector-class` is
 * merely partial in two Gmail apps, so the trick is strictly worse supported than the plain
 * thing it was standing in for.
 */
const CONTAINER_CLASS = 'cascivo-container'
const STACK_CLASS = 'cascivo-stack'

/** Join a built-in class with an author's, dropping either if absent. */
function classes(...names: (string | undefined)[]): string | undefined {
  const kept = names.filter(Boolean)
  return kept.length > 0 ? kept.join(' ') : undefined
}

export interface ContainerProps {
  children?: ReactNode
  /** Content width in pixels. */
  width?: number
  /**
   * Emit the width override that lets the container go fluid on a phone.
   *
   * On by default, because without it a fixed-width email scrolls sideways on every phone
   * and nothing in the package catches it — the conformance lint reads CSS feature support,
   * not layout. Pass `false` for a template that supplies its own rule.
   */
  responsive?: boolean
  /** Extra class, for a rule of your own in a {@link StyleBlock}. */
  className?: string
  style?: Style
}

/**
 * Centred fixed-width column — the outermost content wrapper.
 *
 * `margin: 0 auto` centres it everywhere except Outlook Windows, which ignores auto margins
 * on tables; `align="center"` is the attribute Outlook does honour. Both are present because
 * neither alone works everywhere.
 *
 * ## Why `max-width: 100%` is not enough
 *
 * It reads as though it handles a narrow viewport, and it does not: a table will not lay out
 * below the min-content width of what is inside it, and a 600px email has plenty that is
 * wider than a phone. Measured in a 320px viewport, a two-column newsletter reported
 * `clientWidth=320, scrollWidth=600` — every mobile reader scrolling sideways, and invisible
 * in a desktop preview.
 *
 * So `responsive` emits an actual width override below {@link FLUID_BELOW}. `css-at-media`
 * is `n` in exactly one floor client, Outlook Windows — which is desktop-only and renders at
 * a width where the fixed 600px is already right, so the rule is progressive enhancement
 * whose absence costs nothing.
 *
 * ## What this does not fix by itself
 *
 * A `Row` of `Column`s keeps its own min-content width; the columns have to stack too, which
 * is {@link ColumnProps.stack}. And a fixed-width image sets a floor under its column — a
 * 260px image in a 24px-padded section cannot go below 324px however fluid its ancestors
 * are. Size images for the narrowest column they will occupy.
 */
export function Container({
  children,
  width = CONTENT_WIDTH,
  responsive = true,
  className,
  style,
}: ContainerProps) {
  const base: Style = { width: `${width}px`, maxWidth: '100%', margin: '0 auto' }
  return (
    <>
      {responsive ? (
        <StyleBlock>
          {`@media only screen and (max-width:${fluidBelow(width)}){.${CONTAINER_CLASS}{width:100%!important}}`}
        </StyleBlock>
      ) : null}
      <table
        {...TABLE_RESET}
        align="center"
        width={width}
        className={classes(responsive ? CONTAINER_CLASS : undefined, className)}
        style={px(merge(base, style))}
      >
        <tbody>
          <tr>
            <td>{children}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export interface SectionProps {
  children?: ReactNode
  /** Vertical padding in pixels, applied to the cell. */
  padding?: number | string
  background?: string
  align?: 'left' | 'center' | 'right'
  /** Extra class, for a rule of your own in a {@link StyleBlock}. */
  className?: string
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
export function Section({
  children,
  padding = 0,
  background,
  align,
  className,
  style,
}: SectionProps) {
  const cell: Style = {
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    backgroundColor: background,
    textAlign: align,
  }
  return (
    <table
      {...TABLE_RESET}
      width="100%"
      className={className}
      style={px(merge({ width: '100%' }, style))}
    >
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
  /** Extra class, for a rule of your own in a {@link StyleBlock}. */
  className?: string
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
export function Row({ children, className, style }: RowProps) {
  return (
    <table
      {...TABLE_RESET}
      width="100%"
      className={className}
      style={px(merge({ width: '100%' }, style))}
    >
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
  /**
   * Become a full-width block below the breakpoint, so a row reflows into a stack.
   *
   * Opt-in, because not every row should reflow — a logo beside a date is meant to stay on
   * one line at any width. Set it on each column that should stack, not on the `Row`: `Row`
   * never inspects its children, which is the bug class it was built to avoid.
   */
  stack?: boolean
  /** Extra class, for a rule of your own in a {@link StyleBlock}. */
  className?: string
  style?: Style
}

/**
 * One cell of a {@link Row}.
 *
 * ## Stacking
 *
 * An earlier revision said stacking was impossible here, on the grounds that `css-at-media`
 * is blocked "in Outlook Windows and Gmail". Half of that was wrong: the matrix reports `n`
 * for Outlook Windows alone, and partial support — not none — across Gmail. Outlook Windows
 * is desktop-only, so the client that cannot read the query is the one client that never
 * needs it, and the rule degrades to exactly today's side-by-side layout there.
 *
 * That mattered, because it is not optional polish. A `Container` going fluid does nothing
 * for a `Row`: the row keeps the min-content width of its columns. Measured at 320px, a
 * two-column newsletter scrolled sideways by 280px with the container override alone, and
 * by nothing once the columns stacked.
 *
 * `display: block` on a `<td>` is the long-standing technique for this and needs no
 * `box-sizing`, which is just as well — `css-box-sizing` is `n` in both Outlook Windows and
 * Yahoo.
 *
 * The breakpoint is {@link CONTENT_WIDTH}, because a column has no way to know which
 * `Container` it ended up in. A narrower container that wants to stack sooner can say so
 * with a `className` and a {@link StyleBlock} of its own.
 */
export function Column({
  children,
  width,
  align,
  valign = 'top',
  padding,
  stack = false,
  className,
  style,
}: ColumnProps) {
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
      className={classes(stack ? STACK_CLASS : undefined, className)}
      style={px(merge(cell, style))}
    >
      {/* Inside the cell, not beside it: `renderEmail` lifts this into <head>, but a
          fragment rendered without one leaves it in place, and a <style> between <tr> and
          <td> is markup a parser would foster out. Inside the cell it is valid either way. */}
      {stack ? (
        <StyleBlock>
          {`@media only screen and (max-width:${fluidBelow(CONTENT_WIDTH)}){.${STACK_CLASS}{display:block!important;width:100%!important}}`}
        </StyleBlock>
      ) : null}
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
