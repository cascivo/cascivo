/**
 * The email primitive gallery — one catalogue of examples, rendered two ways.
 *
 * React Email publishes a preview per component and it is the first thing an adopter looks
 * for; cascivo shipped the email target with a template gallery and nothing at the
 * primitive level, so "which pieces can I use, and what do they look like" had no answer
 * short of reading `src/components`.
 *
 * ## Why the code snippet is derived rather than written
 *
 * A gallery normally carries two copies of every example: an element tree to render and a
 * string to display. They drift — a prop is added to the render, the snippet keeps the old
 * shape, and the documented call no longer produces the pictured result. So there is one
 * copy here, the element tree, and `toJsx` prints it. The snippet cannot describe something
 * the frame above it did not render, because it *is* the frame's input.
 *
 * `createElement` rather than JSX because this file is run by `node --experimental-strip-types`,
 * which strips types but does not transform JSX — the same constraint `generate-site-samples.ts`
 * documents.
 */
import { createElement, type ReactElement, type ReactNode } from 'react'
import {
  Alert,
  Badge,
  Body,
  Button,
  Card,
  Column,
  Container,
  Footer,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  List,
  Markdown,
  Preview,
  Row,
  Section,
  Spacer,
  Style,
  Text,
} from '../../dist/index.js'

/**
 * How an example is wrapped before it is rendered.
 *
 * - `padded` — dropped into `Container > Section`, the shape almost every primitive is used in.
 * - `bare` — given a `Body` only, for primitives that ARE the wrapper.
 * - `raw` — already a whole document; rendered untouched.
 */
export type Frame = 'padded' | 'bare' | 'raw'

export interface GalleryExample {
  /** Caption above the frame. */
  title: string
  /** What to look at, when the picture alone does not say it. */
  description?: string
  frame?: Frame
  el: ReactElement
}

export interface GalleryEntry {
  /** The exported name, as imported from `@cascivo/email`. */
  name: string
  group: 'Document' | 'Layout' | 'Typography' | 'Content'
  examples: GalleryExample[]
}

/**
 * Component → the name to print in a snippet.
 *
 * Explicit rather than `fn.name`, which is only reliable here because the published build
 * happens to set rolldown's `keepNames`. A gallery entry for a component missing from this
 * map fails the generator rather than printing `<undefined>`.
 */
const NAMES = new Map<unknown, string>([
  [Alert, 'Alert'],
  [Badge, 'Badge'],
  [Body, 'Body'],
  [Button, 'Button'],
  [Card, 'Card'],
  [Column, 'Column'],
  [Container, 'Container'],
  [Footer, 'Footer'],
  [Head, 'Head'],
  [Heading, 'Heading'],
  [Hr, 'Hr'],
  [Html, 'Html'],
  [Img, 'Img'],
  [Link, 'Link'],
  [List, 'List'],
  [Markdown, 'Markdown'],
  [Preview, 'Preview'],
  [Row, 'Row'],
  [Section, 'Section'],
  [Spacer, 'Spacer'],
  [Style, 'Style'],
  [Text, 'Text'],
])

/**
 * The column a printed line has to fit in.
 *
 * Measured, not chosen: the docs page's code column is ~78 monospace characters at the
 * width the reference is read at, and the shared `CodeBlock` scrolls horizontally rather
 * than wrapping — so a longer line is one an adopter has to drag to finish reading. Past
 * it, attributes go one per line, which is what a formatter would have written anyway.
 */
const WIDTH = 78

const isElement = (value: unknown): value is ReactElement =>
  typeof value === 'object' && value !== null && '$$typeof' in value

/** A JS value inside `{…}`, in the repo's own style: single quotes, no trailing commas. */
function toValue(value: unknown): string {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
  if (Array.isArray(value)) return `[${value.map(toValue).join(', ')}]`
  if (isElement(value)) return toJsx(value, '')
  if (typeof value === 'object' && value !== null) {
    const body = Object.entries(value)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${toValue(v)}`)
      .join(', ')
    return `{ ${body} }`
  }
  return String(value)
}

function toAttribute(name: string, value: unknown): string {
  if (value === true) return name
  if (typeof value === 'string' && !value.includes('"') && !value.includes('\n')) {
    return `${name}="${value}"`
  }
  return `${name}={${toValue(value)}}`
}

/**
 * A text child, written the way it would have to be written by hand.
 *
 * A bare literal is only safe while the text carries no JSX punctuation; past that it has to
 * become an expression, and anything with a newline has to become a template literal, since
 * JSX collapses whitespace in a literal child. The template body is deliberately left
 * unindented — indenting it would change the string.
 */
function toChildText(text: string, indent: string): string {
  // A significant space between two elements is `{' '}` in JSX and nothing at all as a bare
  // line — printing the literal would give a snippet whose badges run together.
  if (text.trim() === '') return `${indent}{'${text}'}`
  if (text.includes('\n')) return `${indent}{\`${text.replace(/`/g, '\\`')}\`}`
  if (!/[<>{}]/.test(text)) return `${indent}${text}`
  return `${indent}{${toValue(text)}}`
}

/** Print an element tree as the JSX an adopter would write. */
export function toJsx(element: ReactElement, indent = ''): string {
  const props = element.props as Record<string, unknown>
  const name = NAMES.get(element.type)
  if (!name) throw new Error(`gallery: no printable name for element type ${String(element.type)}`)

  const attributes = Object.entries(props)
    .filter(([key, value]) => key !== 'children' && value !== undefined)
    .map(([key, value]) => toAttribute(key, value))

  const children = ([] as ReactNode[])
    .concat((props['children'] ?? []) as ReactNode)
    .filter((child) => child !== undefined && child !== null && child !== false)

  const inlineOpen = `${indent}<${[name, ...attributes].join(' ')}`
  const open =
    inlineOpen.length <= WIDTH
      ? inlineOpen
      : [`${indent}<${name}`, ...attributes.map((a) => `${indent}  ${a}`)].join('\n') +
        `\n${indent}`

  if (children.length === 0) return `${open} />`

  // A single short label reads as `<Text>Hello</Text>`, which is how it would be written.
  const [only] = children
  if (children.length === 1 && !isElement(only) && !String(only).includes('\n')) {
    const inline = `${open}>${toChildText(String(only), '').trim()}</${name}>`
    if (!inline.includes('\n') && inline.length <= WIDTH) return inline
  }

  const body = children.map((child) => {
    if (isElement(child)) return toJsx(child, `${indent}  `)
    return toChildText(String(child), `${indent}  `)
  })
  return [`${open}>`, ...body, `${indent}</${name}>`].join('\n')
}

const h = createElement

/** A raster image the docs site serves, so the `Img` frame shows a real remote image. */
const SAMPLE_IMAGE = 'https://cascivo.com/icon-192.png'

const MARKDOWN_SOURCE = `## Changes this week

We shipped **two** things you asked for:

- Per-seat billing, prorated
- CSV export on every report

Read the [full notes](https://cascivo.com/docs/changelog).`

/**
 * Every primitive `@cascivo/email` exports, in the order the reference reads.
 *
 * `scripts/checks/email-primitive-docs.test.ts` fails if an export is missing from here, so
 * a new primitive cannot ship undocumented.
 */
export const GALLERY: GalleryEntry[] = [
  {
    name: 'Html',
    group: 'Document',
    examples: [
      {
        title: 'The document shell',
        description:
          'Every email starts here. `Html` carries the XHTML doctype, the namespaces Outlook needs for VML, and the `lang`/`dir` pair that a right-to-left message sets once.',
        frame: 'raw',
        el: h(
          Html,
          { lang: 'en', dir: 'ltr' },
          h(Head, { title: 'Your receipt' }),
          h(
            Body,
            null,
            h(
              Container,
              null,
              h(
                Section,
                { padding: 24 },
                h(Heading, { level: 2 }, 'Your receipt'),
                h(Text, null, 'Thanks — your payment went through.'),
              ),
            ),
          ),
        ),
      },
    ],
  },
  {
    name: 'Head',
    group: 'Document',
    examples: [
      {
        title: 'Title and client meta',
        description:
          'The `title` is what a browser tab and several webmail clients show. Everything else a mail client needs — the viewport tag, the colour-scheme pair, the Outlook pixel-density fix — is emitted for you.',
        frame: 'raw',
        el: h(
          Html,
          null,
          h(Head, { title: 'Reset your password' }),
          h(
            Body,
            null,
            h(Container, null, h(Section, { padding: 24 }, h(Text, null, 'Check the tab title.'))),
          ),
        ),
      },
    ],
  },
  {
    name: 'Body',
    group: 'Document',
    examples: [
      {
        title: 'Themed background',
        description:
          'The background and foreground come from the theme, resolved to literal sRGB — no client supports a custom property. Switch the theme above and this frame is the only thing that has to change.',
        frame: 'raw',
        el: h(
          Html,
          null,
          h(Head, { title: 'Body' }),
          h(
            Body,
            null,
            h(
              Container,
              null,
              h(
                Section,
                { padding: 24 },
                h(Heading, { level: 3 }, 'Painted by the theme'),
                h(Text, { variant: 'muted' }, 'Twelve themes, one component tree.'),
              ),
            ),
          ),
        ),
      },
    ],
  },
  {
    name: 'Preview',
    group: 'Document',
    examples: [
      {
        title: 'The inbox line',
        description:
          'Deliberately invisible in the frame — it is the grey line the inbox shows beside the subject. Without it the client repeats the opening words of the body instead. Keep it under ~90 characters.',
        frame: 'raw',
        el: h(
          Html,
          null,
          h(Head, { title: 'Reset your password' }),
          h(
            Body,
            null,
            h(Preview, null, 'Reset your password — the link expires in 30 minutes'),
            h(
              Container,
              null,
              h(
                Section,
                { padding: 24 },
                h(Heading, { level: 2 }, 'Reset your password'),
                h(Text, null, 'The link below expires in 30 minutes.'),
              ),
            ),
          ),
        ),
      },
    ],
  },
  {
    name: 'Style',
    group: 'Document',
    examples: [
      {
        title: 'A rule inline styles cannot express',
        description:
          'Media queries and pseudo-classes are the only two things that need a stylesheet. Declare the rule next to the component that needs it — the renderer hoists every block into `<head>` and collapses duplicates.',
        frame: 'raw',
        el: h(
          Html,
          null,
          h(Head, { title: 'Style' }),
          h(
            Body,
            null,
            h(
              Container,
              null,
              h(
                Section,
                { padding: 24 },
                h(
                  Style,
                  null,
                  '@media only screen and (max-width:600px){.hero{font-size:24px!important}}',
                ),
                h(Text, { className: 'hero', size: '32px' }, 'Big on desktop, smaller on a phone'),
              ),
            ),
          ),
        ),
      },
    ],
  },
  {
    name: 'Container',
    group: 'Layout',
    examples: [
      {
        title: 'The centred column',
        description:
          'Centred by both `margin: 0 auto` and `align="center"`, because neither works in every client. The default width is 600px, which clears every desktop reading pane; this one is narrowed to 400 so the centring is visible. `responsive` adds the width override that stops a phone scrolling sideways.',
        frame: 'bare',
        el: h(
          Container,
          { width: 400 },
          h(
            Section,
            { padding: 24 },
            h(Card, { padding: 16 }, h(Text, { align: 'center' }, '400px, centred')),
          ),
        ),
      },
    ],
  },
  {
    name: 'Section',
    group: 'Layout',
    examples: [
      {
        title: 'Bands of content',
        description:
          'One table, one cell — padding on the cell, because Outlook drops padding on a `<div>`. A `background` makes it a full-bleed band.',
        frame: 'bare',
        el: h(
          Container,
          null,
          h(
            Section,
            { padding: 32, background: '#1f2937', align: 'center' },
            h(Heading, { level: 2, align: 'center', style: { color: '#ffffff' } }, 'Acme'),
          ),
          h(
            Section,
            { padding: 24 },
            h(Text, null, 'And an unpainted band below it, with its own padding.'),
          ),
        ),
      },
    ],
  },
  {
    name: 'Row',
    group: 'Layout',
    examples: [
      {
        title: 'Columns side by side',
        description:
          'A `<tr>` that never inspects its children — it emits the row and trusts each `Column` to emit its cell. Flexbox and grid are unsupported in Outlook Windows; this is the layout primitive.',
        el: h(
          Row,
          null,
          h(Column, { width: '50%', padding: 8 }, h(Text, null, 'Ordered')),
          h(Column, { width: '50%', padding: 8, align: 'right' }, h(Text, null, '3 items')),
        ),
      },
    ],
  },
  {
    name: 'Column',
    group: 'Layout',
    examples: [
      {
        title: 'Alignment and stacking',
        description:
          'Set `stack` on each column that should become full-width on a phone — never on the `Row`. A button inside follows its column, so a right-aligned cell puts the button on the right.',
        el: h(
          Row,
          null,
          h(Column, { width: '50%', padding: 8, stack: true }, h(Text, null, 'Stacks below 600px')),
          h(
            Column,
            { width: '50%', padding: 8, align: 'right', stack: true },
            h(Button, { href: 'https://example.com' }, 'Open'),
          ),
        ),
      },
    ],
  },
  {
    name: 'Spacer',
    group: 'Layout',
    examples: [
      {
        title: 'Vertical space that survives Outlook',
        description:
          'A margin would be simpler and is not dependable — Outlook collapses and ignores margins in several positions. This is a row with a stated height and a pinned line box.',
        el: h(
          Section,
          null,
          h(Card, { padding: 16 }, h(Text, null, 'Above')),
          h(Spacer, { height: 24 }),
          h(Card, { padding: 16 }, h(Text, null, 'Below')),
        ),
      },
    ],
  },
  {
    name: 'Hr',
    group: 'Layout',
    examples: [
      {
        title: 'A rule',
        description:
          'Drawn as a bordered cell, not `<hr>` — Outlook gives `<hr>` its own inset 3D border and ignores most styling on it.',
        el: h(
          Section,
          null,
          h(Text, null, 'Order summary'),
          h(Hr, { spacing: 16 }),
          h(Text, { variant: 'muted' }, 'Subtotal, tax and total follow.'),
        ),
      },
    ],
  },
  {
    name: 'Heading',
    group: 'Typography',
    examples: [
      {
        title: 'Levels',
        description:
          'The element follows `level`; `size` overrides the size alone, for the common case of an `<h2>` that has to look like an `<h1>`.',
        el: h(
          Section,
          null,
          h(Heading, { level: 1 }, 'Level one'),
          h(Spacer, { height: 8 }),
          h(Heading, { level: 2 }, 'Level two'),
          h(Spacer, { height: 8 }),
          h(Heading, { level: 3 }, 'Level three'),
        ),
      },
    ],
  },
  {
    name: 'Text',
    group: 'Typography',
    examples: [
      {
        title: 'Body copy',
        description:
          'Never set a size below 14px: iOS Mail inflates smaller text to its own minimum and the layout shifts under it.',
        el: h(
          Section,
          null,
          h(Text, null, 'Default body copy, 16px, at the theme foreground.'),
          h(Spacer, { height: 12 }),
          h(Text, { variant: 'muted' }, 'Muted secondary copy for the supporting line.'),
          h(Spacer, { height: 12 }),
          h(Text, { align: 'center', size: '14px' }, 'Centred, and one step down.'),
        ),
      },
    ],
  },
  {
    name: 'Link',
    group: 'Typography',
    examples: [
      {
        title: 'Inline link',
        description:
          'Reads `--cascivo-color-accent-text` rather than the accent fill — four of the twelve themes pick an accent that fails contrast as type.',
        el: h(
          Section,
          null,
          h(
            Text,
            null,
            'Trouble with the button? ',
            h(Link, { href: 'https://cascivo.com/docs/email' }, 'Open the page directly'),
            '.',
          ),
        ),
      },
    ],
  },
  {
    name: 'List',
    group: 'Typography',
    examples: [
      {
        title: 'Bulleted and numbered',
        description:
          'Both `margin` and `padding` are stated because Outlook mis-indents a `<ul>` without them.',
        el: h(
          Section,
          null,
          h(List, { items: ['Unlimited seats', 'CSV export', 'Audit log'] }),
          h(Spacer, { height: 16 }),
          h(List, { ordered: true, items: ['Open the link', 'Choose a password', 'Sign in'] }),
        ),
      },
    ],
  },
  {
    name: 'Footer',
    group: 'Typography',
    examples: [
      {
        title: 'The closing block',
        description:
          'Smaller, muted and centred, with the padding on a cell. The unsubscribe line belongs here.',
        el: h(
          Footer,
          null,
          h(Text, { size: '14px', variant: 'muted', align: 'center' }, 'Acme, Inc · Berlin'),
          h(
            Text,
            { size: '14px', variant: 'muted', align: 'center' },
            h(Link, { href: 'https://example.com/unsubscribe' }, 'Unsubscribe'),
          ),
        ),
      },
    ],
  },
  {
    name: 'Button',
    group: 'Content',
    examples: [
      {
        title: 'Variants',
        description:
          'An `<a>` painted as a block inside its own table — a `<button>` does nothing in an email and several clients strip it. The corners are square in Outlook Windows, which is the one deliberate degradation.',
        el: h(
          Section,
          null,
          h(Button, { href: 'https://example.com' }, 'Primary'),
          h(Spacer, { height: 12 }),
          h(Button, { href: 'https://example.com', variant: 'secondary' }, 'Secondary'),
          h(Spacer, { height: 12 }),
          h(Button, { href: 'https://example.com', variant: 'destructive' }, 'Destructive'),
        ),
      },
      {
        title: 'Full width, and following its cell',
        description:
          'Omit `align` and the button follows the `align` of the `Column` or `Section` around it. Set it only inside a cell you aligned by hand with `style`.',
        el: h(
          Section,
          null,
          h(Button, { href: 'https://example.com', block: true }, 'Confirm your address'),
          h(Spacer, { height: 12 }),
          h(
            Section,
            { align: 'center' },
            h(Button, { href: 'https://example.com', variant: 'secondary' }, 'Centred by its cell'),
          ),
        ),
      },
    ],
  },
  {
    name: 'Card',
    group: 'Content',
    examples: [
      {
        title: 'A bordered surface',
        description:
          'One table, one cell, border and padding both on the cell — the only arrangement Outlook renders with the border in the right place.',
        el: h(
          Card,
          { padding: 24 },
          h(Heading, { level: 3 }, 'Pro plan'),
          h(Spacer, { height: 8 }),
          h(Text, { variant: 'muted' }, '€29 per seat, per month. Cancel any time.'),
          h(Spacer, { height: 16 }),
          h(Button, { href: 'https://example.com' }, 'Upgrade'),
        ),
      },
    ],
  },
  {
    name: 'Alert',
    group: 'Content',
    examples: [
      {
        title: 'Tones',
        description:
          'The tone is a 4px border plus a tint, never an icon — icons would have to be images, and images are blocked by default in a large share of clients, which would hide the tone exactly where it matters.',
        el: h(
          Section,
          null,
          h(Alert, { tone: 'info', title: 'Heads up' }, 'Your trial ends on Friday.'),
          h(Spacer, { height: 12 }),
          h(Alert, { tone: 'success' }, 'Payment received.'),
          h(Spacer, { height: 12 }),
          h(Alert, { tone: 'warning' }, 'Your card expires next month.'),
          h(Spacer, { height: 12 }),
          h(Alert, { tone: 'destructive' }, 'We could not charge your card.'),
        ),
      },
    ],
  },
  {
    name: 'Badge',
    group: 'Content',
    examples: [
      {
        title: 'Tones',
        description:
          'The one primitive knowingly imperfect in Outlook Windows: a badge has to be inline, and inline padding is only partially supported there. The spaces either side are the fallback.',
        el: h(
          Section,
          null,
          h(
            Text,
            null,
            h(Badge, { tone: 'success' }, 'Paid'),
            ' ',
            h(Badge, { tone: 'warning' }, 'Pending'),
            ' ',
            h(Badge, { tone: 'destructive' }, 'Failed'),
            ' ',
            h(Badge, { tone: 'info' }, 'New'),
            ' ',
            h(Badge, null, 'Draft'),
          ),
        ),
      },
    ],
  },
  {
    name: 'Img',
    group: 'Content',
    examples: [
      {
        title: 'A raster image',
        description:
          '`src` must be an absolute URL — a relative path resolves against the client’s own host. `alt` and `width` are required by the type: images are blocked by default in a large share of clients, and Outlook renders at intrinsic size without the attribute. SVG is not usable.',
        el: h(
          Section,
          { align: 'center' },
          h(Img, { src: SAMPLE_IMAGE, alt: 'cascivo', width: 96, href: 'https://cascivo.com' }),
        ),
      },
    ],
  },
  {
    name: 'Markdown',
    group: 'Content',
    examples: [
      {
        title: 'Prose you do not have at build time',
        description:
          'Every node renders through the primitives above, never through raw HTML — so a CMS string is exactly as conformance-checkable as a hand-composed tree. Anything outside the allowlist stays literal text rather than failing the send.',
        el: h(Markdown, null, MARKDOWN_SOURCE),
      },
    ],
  },
]
