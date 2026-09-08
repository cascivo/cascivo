/**
 * The document shell: `Html`, `Head`, `Preview`, `Body`.
 *
 * Grouped in one file because they are never used apart — every email opens with the same
 * four elements, and splitting them across four modules would be four imports for one
 * concept.
 */
import type { ReactNode } from 'react'
import { fontStack } from '../runtime/fonts.ts'
import { token } from '../runtime/palette.ts'
import { merge, px, type Style } from '../runtime/style.ts'

export interface HtmlProps {
  children?: ReactNode
  /** BCP 47 language tag. Also set on `<body>`, because some clients strip `<html>`. */
  lang?: string
  dir?: 'ltr' | 'rtl'
}

/**
 * The root element.
 *
 * `xmlns:v` and `xmlns:o` are the VML and Office namespaces. They look like noise and are
 * not: Outlook Windows needs them declared on `<html>` before any `<v:…>` element in a
 * conditional comment will render, and a background image or a rounded button that relies
 * on VML fails silently without them.
 */
export function Html({ children, lang = 'en', dir = 'ltr' }: HtmlProps) {
  return (
    <html
      lang={lang}
      dir={dir}
      // React's `html` element type declares neither `xmlns` nor the two Office
      // namespaces, so they go through a spread. They are real, required attributes:
      // Outlook will not render a `<v:…>` element in a conditional comment unless the
      // VML namespace is declared here.
      {...({
        xmlns: 'http://www.w3.org/1999/xhtml',
        'xmlns:v': 'urn:schemas-microsoft-com:vml',
        'xmlns:o': 'urn:schemas-microsoft-com:office:office',
      } as Record<string, string>)}
    >
      {children}
    </html>
  )
}

export interface HeadProps {
  children?: ReactNode
  /** Rendered as `<title>`. Some clients show it; most ignore it. */
  title?: string
}

/**
 * Document head.
 *
 * Carries the four things every client needs and nothing else. In particular there is no
 * stylesheet here by default: `css-at-media` is blocked in Outlook Windows and Gmail, so a
 * `<style>` block can only ever be progressive enhancement, and the renderer adds one only
 * when a component genuinely needs it.
 *
 * `<o:OfficeDocumentSettings>` sits in a conditional comment and switches Outlook's DPI
 * handling off; without it Outlook Windows scales pixel dimensions on high-DPI displays and
 * every fixed width in the email is wrong.
 */
export function Head({ children, title }: HeadProps) {
  return (
    <head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      {title ? <title>{title}</title> : null}
      <MsoDpiFix />
      {children}
    </head>
  )
}

/** Outlook's DPI scaling fix. Split out so `Head` reads as a list of what it emits. */
function MsoDpiFix() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- a conditional comment cannot be expressed as JSX; it is a comment node by construction, and the content is a fixed literal. */}
      <div
        dangerouslySetInnerHTML={{
          __html:
            '<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->',
        }}
      />
    </>
  )
}

export interface PreviewProps {
  /** The inbox preview line. Aim for under ~90 characters; clients truncate past that. */
  children: string
}

/**
 * The inbox preview text — the grey line beside the subject.
 *
 * Two parts, both necessary. The text is hidden, and the trailing whitespace run then
 * pushes the *body's* first words out of the preview window; without it a client appends
 * whatever follows, and the preview reads "Reset your password Reset your password Hi Sam".
 *
 * The hide is built only from properties that are actually supported, which is narrower
 * than the rule set usually copied around for this. `overflow`, `max-height` and `opacity`
 * are all `n` in Outlook Windows — the very client the belt-and-braces was meant to cover —
 * so they cost bytes and buy nothing. `display: none` carries it everywhere it is honoured,
 * `mso-hide: all` is Outlook's own directive for the case where it is not, and the pinned
 * 1px line box keeps the text from reserving space in anything that ignores both.
 *
 * The padding characters are word-joiners rather than `&nbsp;` because a joiner is
 * zero-width — `&nbsp;` renders as a run of visible blanks in clients that ignore the hide.
 */
export function Preview({ children }: PreviewProps) {
  const hidden: Style = {
    display: 'none',
    msoHide: 'all',
    fontSize: '1px',
    lineHeight: '1px',
    color: token('--cascivo-color-background'),
  }
  return (
    <div style={px(hidden)}>
      {children}
      {'⁠​'.repeat(100)}
    </div>
  )
}

export interface BodyProps {
  children?: ReactNode
  style?: Style
  lang?: string
  dir?: 'ltr' | 'rtl'
}

/**
 * Document body, painted with the theme background.
 *
 * `lang` and `dir` are repeated here deliberately: several clients strip `<html>` and
 * `<head>` entirely and graft the body into their own document, taking the attributes with
 * them. `margin: 0` and `padding: 0` undo the UA default, and the two `-webkit`/`-ms`
 * text-size properties stop iOS and Windows Phone inflating small text.
 */
export function Body({ children, style, lang = 'en', dir = 'ltr' }: BodyProps) {
  const base: Style = {
    margin: 0,
    padding: 0,
    backgroundColor: token('--cascivo-color-background'),
    color: token('--cascivo-color-foreground'),
    fontFamily: fontStack('sans'),
    WebkitTextSizeAdjust: '100%',
    msTextSizeAdjust: '100%',
  }
  return (
    <body lang={lang} dir={dir} style={px(merge(base, style))}>
      {children}
    </body>
  )
}
