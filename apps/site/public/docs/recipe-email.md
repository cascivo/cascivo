<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/recipe-email.md
  registry v1.3.0 · generated 2026-09-16
-->

# Recipe: transactional email

Render cascivo-themed email with `@cascivo/email`. Your product UI and the mail it sends
share one design system: the same twelve themes, the same tokens, resolved for clients that
have never heard of `oklch()`.

For what the clients actually support, see [EMAIL-CLIENT-SUPPORT.md](/docs/email-client-support.md)
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
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@cascivo/email'

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

## Prose you do not have at build time

Composing the primitives is right when you know the copy. It is not an option when you do
not — a newsletter preamble an editor writes, a CMS-driven confirmation letter — because
there is nothing to compose at build time. `Markdown` covers that case:

```tsx
import { Markdown, Section } from '@cascivo/email'
;<Section padding={24}>
  <Markdown imageWidth={552}>{issue.preamble}</Markdown>
</Section>
```

| Markdown                     | Renders as                              |
| ---------------------------- | --------------------------------------- |
| `# …` — `###### …`           | `Heading` at that level                 |
| paragraph                    | `Text`                                  |
| `**bold**`, `__bold__`       | `<strong>`                              |
| `*italic*`, `_italic_`       | `<em>`                                  |
| `` `code` ``                 | `<code>` in the mono stack              |
| ` ```fenced``` `             | `<pre>` in a padded cell                |
| `[text](https://…)`, `<url>` | `Link`                                  |
| `![alt](https://…)`          | `Img`, at the `imageWidth` prop's width |
| `- item`, `1. item`          | `List`                                  |
| `> quote`                    | an accented block, nestable             |
| `---`                        | `Hr`                                    |

The allowlist is the point rather than a limitation. The reason there was no Markdown
component for so long is that arbitrary Markdown produces arbitrary HTML, and the conformance
lint cannot vouch for HTML it has no primitive for. This renders every node **through the
primitives and never as HTML**, so the lint covers a Markdown subtree exactly as it covers a
hand-composed one. Three consequences worth knowing before you ship it:

- **Raw HTML in the source stays literal text.** `<b>x</b>` renders as those six visible
  characters. There is no path from source to markup, which is what makes the guarantee hold.
- **Only `http:`, `https:` and `mailto:` URLs are emitted.** Any other scheme keeps its label
  and loses its anchor; an unusable image keeps its alt text. Prose from a CMS is a payload
  you did not produce.
- **Anything outside the table degrades to text rather than throwing.** Tables, footnotes and
  reference links render as themselves. Prose fetched at send time must never be able to fail
  a send.

Images carry no dimensions in Markdown and `Img` requires a width, so `imageWidth` supplies
one — pass the inner width of your container. A fenced block does not wrap, because
`css-white-space` is unsupported in Outlook Windows; keep those lines short.

## It has to survive a phone

A 600px email in a 320px viewport is the most common way a template ships broken, and the
one the conformance lint cannot catch — it reads CSS _feature support_, and this is layout.
`max-width: 100%` looks like it handles it and does not: a table will not lay out below the
min-content width of what is inside it.

Two rules do handle it, and they are not interchangeable.

**`Container` is responsive by default.** It emits a width override below its own width, so
the wrapper goes fluid on a phone. Pass `responsive={false}` if you are supplying your own,
or `breakpoint={620}` when a design spec names a number of its own and you would rather the
markup said the same one.

**Columns have to be told to stack.** A `Row` keeps the min-content width of its columns
however fluid its container is, so a two-column layout still overflows until each column
opts in:

```tsx
<Row>
  <Column width="50%" stack>
    …
  </Column>
  <Column width="50%" stack>
    …
  </Column>
</Row>
```

It is opt-in because not every row should reflow — a logo beside a date is meant to stay on
one line at any width.

Measured at 320px, a two-column newsletter overflowed by 280px with the container override
alone, and by nothing once the columns stacked.

**A fixed-width image still sets a floor.** A 240px image in a 24px-padded section cannot go
below 304px however fluid its ancestors are, because a sized replaced element contributes
its own width to min-content. Size images for the narrowest column they will occupy.

`@media` is `n` in exactly one floor client, Outlook Windows — which is desktop-only and
renders at a width where the fixed layout is already right, so these rules are progressive
enhancement whose absence costs nothing.

### Rules of your own

Media queries and pseudo-classes are the two things an inline style genuinely cannot
express, which is the only reason a `<style>` block exists here at all. `Container`,
`Container`, `Section`, `Row`, `Column`, `Card` and `Text` take a `className` to give a rule
something to select,
and `Style` puts the rule somewhere — wherever you write it, it is hoisted into `<head>`
and merged with every other one:

```tsx
import { Column, Row, Style } from '@cascivo/email'
;<>
  <Style>{`@media only screen and (max-width:600px){.hide-sm{display:none!important}}`}</Style>
  <Row>
    <Column className="hide-sm">…</Column>
  </Row>
</>
```

`Card` and `Text` are on that list because they are the two the common cases need: a panel
whose padding shrinks below the breakpoint, and a hero line that comes down a size. The first
cut gave classes to the layout primitives only, which read as a principled split and left out
both.

Use a class, not the `[style*='--flag']` attribute-selector trick: `css-selector-attribute`
is `n` in Outlook Windows where `css-selector-class` is merely partial in two Gmail apps, so
the workaround is worse supported than the plain thing it stands in for.

## The rules that are not negotiable

These are enforced, not advisory. The conformance lint fails the build on the first, and the
structural invariants in `packages/email/src/render/render.test.tsx` on the rest.

- **Layout is tables.** Flexbox, Grid and `gap` are all unsupported in Outlook Windows. The
  layout primitives (`Section`, `Row`, `Column`, `Container`) are presentational tables and
  there is no non-table alternative.
- **A phone gets a media query, and only a media query.** See above — it is the one thing
  inline styles cannot do, and the only reason this package emits a `<style>` block.
- **Padding goes on a cell.** `padding` on a `<div>` is dropped by Outlook Windows.
- **No `rem`.** Every length is converted to `px` at render time; write `'16px'`.
- **Images need `alt` and `width`, and must be raster.** Both are required by the type.
  Inline SVG does not render in any floor client but Apple Mail.
- **Absolute URLs everywhere.** A relative path resolves against the client's host.
- **No client JavaScript, at all.** There is no interactive primitive and there will not be
  one.

## Preview it

```sh
npx @cascivo/email-preview ./emails
```

Point it at a directory and every `.tsx` or `.jsx` file in it becomes a template: the default
export is rendered, and the optional named exports `subject` (a string) and `previewProps`
(the props to preview with) are used if present. Files matching `.test.`, `.spec.`,
`.stories.` or a leading `_` are skipped. Run it with no directory to browse the templates
that ship with the package.

Your templates go through Vite, so edits hot-reload — the loop is edit, look, edit.

You get a viewport switcher, all twelve themes, per-client simulation, a live encoded-byte
gauge with the clip thresholds drawn on it, and an `.eml` download. That last one is the
cheapest way to see an email in a _real_ client: download it and drag it into Outlook, Apple
Mail, or anything else on any device. No service, no account.

A template can declare the palette it was designed in, beside `subject` and `previewProps`:

```tsx
export const theme = { ...PALETTES.light, '--cascivo-color-accent': '#b4381e' }
```

Do it even with one brand. `renderEmail`'s `theme` takes a `Palette`, which is how you
rebrand — so without this every render in the preview is somebody else's email, and the byte
gauge is wrong by whatever your palette costs. `--theme <file>` adds shared palettes to the
dropdown for a whole directory, and `--allow <file>` lines the conformance panel up with
whatever your CI waives.

For the conformance findings — the same ones CI reports — hand it the Can I email matrix,
which is not bundled because it is ~483 KB of test data:

```sh
curl -o caniemail.json https://www.caniemail.com/api/data.json
npx @cascivo/email-preview ./emails --caniemail caniemail.json
```

Without it everything else still works and the panel says where to get one, rather than
showing a clean bill of health it has not checked.

`--port`, `--host` and `--open` do what you would expect; `--help` lists them.

## Check it against the clients

`lint()` reads a finished render and reports anything a floor client cannot support. It
needs the [Can I email](https://www.caniemail.com) matrix, which is not bundled (~483 KB of
test data), so the CLI does the fetching, caching and wiring for you:

```sh
cascivo email lint dist/emails/*.html
node render.js | cascivo email lint -
```

It exits non-zero on a **blocked** finding — a floor client genuinely cannot do it — and
never on a **caveat**, which is partial support worth knowing about. `--data <file>` uses a
local copy instead of fetching, which is what you want in CI or offline.

The programmatic form is the same check, if you would rather wire it in yourself:

```ts
import { CASCIVO_ALLOW, indexFeatures, lint } from '@cascivo/email'

const findings = lint(html, indexFeatures(matrix), { allow: CASCIVO_ALLOW })
```

### See what a specific client sees

`simulate()` is the other half, and the more interesting one. It takes a render and strips
the declarations a named client does not support, so you get the document _that client_
would lay out — which is how you find a layout that only holds together because of a feature
Outlook lacks:

```ts
import { simulate, SIMULATED_CLIENTS } from '@cascivo/email'

const outlook = SIMULATED_CLIENTS.find((c) => c.label === 'Outlook (Windows)')!
const degraded = simulate(html, indexFeatures(matrix), outlook)
```

`SIMULATED_CLIENTS` is the list you can pass. This is what the preview's client switcher
does, and what the visual baselines screenshot — a template is captured both as written and
as Outlook Windows would reduce it, so a layout that depends on an unsupported feature shows
up as a diff rather than in an inbox.

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

### The font stack is probably your largest repeated cost

Every text primitive restates `font-family` inline. Outlook Windows renders through Word,
which does not carry an inherited `font-family` into table content — and every layout
primitive here is a table, so an element that states no face renders in Times New Roman.
The repetition is load-bearing.

What you can change is the length of the stack. `--cascivo-email-font-sans`, `-serif` and
`-mono` are read by `fontStack()` and apply everywhere:

```tsx
renderEmail(<Invite … />, {
  theme: { ...PALETTES.light, '--cascivo-email-font-sans': 'Arial, Helvetica, sans-serif' },
})
```

On a large newsletter that is the difference between clipping and not — one reported port
spent 15 KB, 20% of the message, on 162 copies of the default stack.

They are keys on the palette object rather than CSS custom properties: no email client
supports those, so a declaration in a stylesheet would be read by nobody and cost every
adopter bytes. They are also separate from the browser-facing `--cascivo-font-*` on purpose —
those begin `ui-sans-serif, system-ui`, which resolve to nothing in Outlook Windows.

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
`EMAIL_FONTS`), no `Tailwind` (cascivo emits resolved tokens directly, so there is no
class-to-inline-style step to perform).

`Markdown` does have an equivalent — see [Prose you do not have at build
time](#prose-you-do-not-have-at-build-time) — though it renders an allowlisted node set
rather than arbitrary Markdown, so check the table there before you assume a port is
one-to-one.

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
