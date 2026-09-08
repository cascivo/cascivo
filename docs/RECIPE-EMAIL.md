# Recipe: transactional email

Render cascivo-themed email with `@cascivo/email`. Your product UI and the mail it sends
share one design system: the same twelve themes, the same tokens, resolved for clients that
have never heard of `oklch()`.

For what the clients actually support, see [EMAIL-CLIENT-SUPPORT.md](./EMAIL-CLIENT-SUPPORT.md)
— generated from the same data the conformance lint reads, so the two cannot disagree.

## Install

```sh
pnpm add @cascivo/email react react-dom
```

`react-dom` is a peer because the render goes through `renderToStaticMarkup`. Nothing else is
required — the package has no runtime dependencies of its own.

## Send one

```tsx
import { assertSendable, renderEmail, PasswordReset, passwordResetSubject } from '@cascivo/email'

const message = renderEmail(<PasswordReset resetHref={link} />, {
  theme: 'dark',
  subject: passwordResetSubject(),
  tier: 'strict',
})

assertSendable(message)
await mailer.send({ to, ...message })
```

`renderEmail` returns the whole message — `subject`, `html`, `text` and `preheader` — not
just a document. The subject comes from the template rather than the call site on purpose:
the subject, the `<title>` and the preheader are three facets of one message, and splitting
them across two files is how they drift apart.

Always send `text` alongside `html`. Some clients are text-only, some readers prefer it, and
a missing text part is a documented spam-filter signal.

`assertSendable` catches the four things that only reveal themselves once the mail has
arrived: no subject, no text part, no preheader (the client then shows the first words of the
body), and a body over the clip threshold. It is a separate call rather than something
`renderEmail` does, because a preview renders half-finished templates on every keystroke and
must not throw.

### The preheader

`<Preview>` is the grey line beside the subject in the inbox. Without it the client shows the
opening words of your body, which usually reads as the subject said twice.

```tsx
<Preview>{`Reset your password — the link expires in ${minutes} minutes`}</Preview>
```

It is extracted back out of the rendered HTML as `message.preheader`, so you can assert on it
rather than trust it.

### The plain-text part

Derived automatically, and structured rather than tag-stripped: headings are underlined, list
items keep a marker, rules survive as rules, and link destinations are carried inline.

```tsx
renderEmail(<Digest />, { text: { links: 'footnote', width: 72 } })
```

- `links` — `'inline'` (default, `label (url)`), `'footnote'` (`label [1]` plus a numbered
  list at the end, better for link-heavy prose), or `'strip'`.
- `width` — wrap column, default 78. `0` disables wrapping.
- `bullet`, `headings` — list marker and heading underlines.

Mark anything that only makes sense visually with `data-skip-in-text` and it will be left out
of the text part, the same escape hatch React Email offers.

Supply `plainText` instead if you would rather write it by hand.

### Sending it yourself, or opening it in a real client

```tsx
import { buildMessage } from '@cascivo/email'

const eml = buildMessage(message, { from: 'noreply@acme.com', to: recipient })
```

A `multipart/alternative` message: text part first (RFC 2046 orders alternatives least- to
most-faithful, and clients take the last they can render), quoted-printable encoded, non-ASCII
subjects RFC 2047 encoded, and header injection refused rather than silently neutralised.

Write it to a `.eml` file and drag it into Outlook or Apple Mail — the cheapest way to see the
mail in a real client, with no service involved.

## Write one

Templates are ordinary compositions of the primitives:

```tsx
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@cascivo/email'

export function Invite({ href, team }: { href: string; team: string }) {
  return (
    <Html>
      <Head title={`Join ${team}`} />
      <Body>
        <Preview>{`You have been invited to join ${team}`}</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>{`Join ${team}`}</Heading>
            <Text>A teammate invited you. The link below expires in seven days.</Text>
            <Button href={href}>Accept the invitation</Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

## The rules that are not negotiable

These are enforced, not advisory. The conformance lint fails the build on the first, and the
structural invariants in `packages/email/src/render/render.test.tsx` on the rest.

- **Layout is tables.** Flexbox, Grid and `gap` are all unsupported in Outlook Windows. The
  layout primitives (`Section`, `Row`, `Column`, `Container`) are presentational tables and
  there is no non-table alternative.
- **Padding goes on a cell.** `padding` on a `<div>` is dropped by Outlook Windows.
- **No `rem`.** Every length is converted to `px` at render time; write `'16px'`.
- **Images need `alt` and `width`, and must be raster.** Both are required by the type.
  Inline SVG does not render in any floor client but Apple Mail.
- **Absolute URLs everywhere.** A relative path resolves against the client's host.
- **No client JavaScript, at all.** There is no interactive primitive and there will not be
  one.

## Preview it

```sh
pnpm --filter @cascivo/email-preview dev
```

Viewport switcher, all twelve themes, per-client simulation, a live encoded-byte gauge with
the clip thresholds drawn on it, the same conformance findings CI reports, and an `.eml`
download.

That last one is the cheapest way to see an email in a *real* client: download it and drag it
into Outlook, Apple Mail, or anything else on any device. No service, no account.

## Keep it under the clip threshold

Gmail truncates a message past roughly 102 KB and shows "View entire message". Mobile clips
lower — around 75 KB, and around 20 KB on iOS Gmail.

The threshold applies to the **encoded** message body, not the raw string. `stats.encodedBytes`
is the number to watch; `stats.bytes` will under-report by up to a third.

```tsx
const { stats } = renderEmail(<Invite … />, { tier: 'strict' })
if (stats.clipRisk !== 'ok') throw new Error(`email is ${stats.encodedBytes} bytes`)
```

When something is too big, ask where the bytes went:

```tsx
import { analyze, formatAnalysis } from '@cascivo/email'
console.log(formatAnalysis(analyze(html)))
```

It splits the total into inline CSS, markup, text and overhead, ranks tags by cost, and lists
the most repeated declarations — which is usually where the answer is.

## Theming

The theme is a render-time argument, not a runtime one. Custom properties do not work in
Gmail or Outlook Windows, so `data-theme` switching is impossible; the palette is resolved to
literal hex before the email leaves your server.

```tsx
renderEmail(<Invite … />, { theme: 'corporate' })
```

Dark mode in an inbox is client-controlled. Gmail and Outlook.com apply their own inversion
by heuristics nobody outside them has. The preview's "Forced dark" toggle approximates it and
says so; treat it as "roughly this much changes", not as a faithful rendering.

## Coming from React Email

Most of the surface maps one to one.

```tsx
import { formatMigration, planMigration } from '@cascivo/email'
console.log(formatMigration(planMigration(['Html', 'Button', 'Tailwind', 'Font'])))
```

The gaps are deliberate: no `Font` (web fonts do not load in Gmail or Outlook — use
`EMAIL_FONTS`), no `Markdown` (arbitrary Markdown produces HTML the lint cannot vouch for),
no `Tailwind` (cascivo emits resolved tokens directly, so there is no class-to-inline-style
step to perform).

## What you are trading away

No paid rendering service is used, and none is needed for most of the surface: the
conformance lint, the structural invariants, the client simulation and the visual baselines
run offline and deterministically.

The residual is Outlook Windows pixel fidelity — the Word engine is a proprietary Windows
binary with no emulator, so nothing offline can reproduce it. That is bought down by
construction rather than by a test: the primitive set cannot emit what Outlook lacks, and the
lint enforces it. A release-time manual pass on a Windows machine covers the rest.

`docs/specs/email-target.md` §4.2 and §5 carry the full account, including what this does not
cover.
