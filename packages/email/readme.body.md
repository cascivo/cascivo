Render cascivo-themed HTML email — table-based, inline-styled, no client JS, and **no runtime
dependencies** (only `react/jsx-runtime` and `react-dom/server`, both peers). Your product UI
and the mail it sends share one design system: the same {{count.themes}} themes and the same
tokens, resolved to literal hex for clients that have never heard of `oklch()`.

> **Docs offline?** The full cascivo reference ships as an npm package — `npx -y @cascivo/docs`, no website needed.

## Install

```sh
pnpm add @cascivo/email react react-dom
```

## The components

Twenty-two primitives, grouped by what they do:

| Group          | Components                                              |
| -------------- | ------------------------------------------------------- |
| **Document**   | `Html`, `Head`, `Body`, `Preview`, `Style`              |
| **Layout**     | `Container`, `Section`, `Row`, `Column`, `Spacer`, `Hr` |
| **Typography** | `Heading`, `Text`, `Link`, `List`, `Footer`             |
| **Content**    | `Button`, `Card`, `Alert`, `Badge`, `Img`, `Markdown`   |

Each one previewed as a real email document, in four themes, with its props and the exact JSX
that produced the frame: [cascivo.com/docs/email/components](https://cascivo.com/docs/email/components).
The same reference as one fetchable file:
[cascivo.com/docs/email-primitives.md](https://cascivo.com/docs/email-primitives.md).

## Send one

```tsx
import { assertSendable, renderEmail, PasswordReset, passwordResetSubject } from '@cascivo/email'

const message = renderEmail(<PasswordReset resetHref={link} />, {
  theme: 'dark',
  subject: passwordResetSubject(),
  tier: 'strict',
})

assertSendable(message) // throws on no subject, no preheader, no text part, or a clipped body
await transport.send({ html: message.html, text: message.text, subject: message.subject })
```

`renderEmail` also returns `stats` — raw bytes, **quoted-printable-encoded** bytes (what Gmail
actually measures when it decides to clip), node count and table depth.

## Prose you do not have at build time

`Markdown` is for copy written by an editor and fetched at send time — a newsletter preamble,
a CMS-driven confirmation letter — where there is nothing to compose into primitives ahead of
time.

```tsx
import { Markdown, Section } from '@cascivo/email'
;<Section padding={24}>
  <Markdown imageWidth={552}>{issue.preamble}</Markdown>
</Section>
```

It parses an allowlisted node set — headings, paragraphs, `**strong**`, `*em*`, `` `code` ``,
fenced blocks, links, images, ordered and unordered lists, blockquotes, rules — and renders
each one **through the primitives, never as HTML**. That is what keeps the conformance lint
meaningful over a subtree whose content nobody reviewed: raw HTML in the source renders as its
own literal text, and `href`/`src` are emitted only for `http:`, `https:` and `mailto:`.
Anything outside the set degrades to text rather than throwing — prose fetched at send time
must never be able to fail a send.

For copy you _do_ know at build time, compose the primitives directly; it is smaller and you
get the types.

## Theming

```tsx
import { PALETTES, renderEmail } from '@cascivo/email'

renderEmail(<Newsletter />, {
  theme: { ...PALETTES.light, '--cascivo-color-accent': '#0057a3' },
})
```

Pass a theme name for one of the {{count.themes}} shipped themes, or a `Palette` object to
override any token.

### Fonts, and the biggest line in your byte budget

Every text primitive restates `font-family` inline. That is deliberate and load-bearing:
Outlook Windows renders through Word, which does not carry an inherited `font-family` into
table content — and since every layout primitive here is a table, an element that states no
face renders in Times New Roman there.

It is also expensive. One reported newsletter spent **15 KB, 20% of the message**, on 162
copies of the default stack. The lever is the _length_ of the stack, not the number of copies:

```tsx
renderEmail(<Newsletter />, {
  theme: { ...PALETTES.light, '--cascivo-email-font-sans': 'Arial, Helvetica, sans-serif' },
})
```

`--cascivo-email-font-sans`, `-serif` and `-mono` are read by `fontStack()` and apply
everywhere. They are keys on the palette object, not CSS custom properties — no email client
supports those, and declaring them in a stylesheet nothing reads would only cost every
adopter bytes. They are also separate from the browser-facing `--cascivo-font-*` on purpose:
those begin `ui-sans-serif, system-ui`, which resolve to nothing in Outlook Windows, and a
stack for an inbox is a different decision from a stack for a page. Set one and the default
is untouched everywhere else.

Run `analyze(message.html)` to see where your own bytes went; `repeatedDeclarations` is
usually the actionable list.

## Conformance lint

`lint()` checks a finished render against the [Can I email](https://www.caniemail.com) support
matrix and reports anything your floor clients cannot handle.

**The matrix is not bundled.** It is ~483 KB of test data that would otherwise sit in every
adopter's `node_modules`, so you supply it:

```ts
import { indexFeatures, lint, CASCIVO_ALLOW, type CanIEmailData } from '@cascivo/email'

// Fetch once and cache it — https://www.caniemail.com/api/data.json (MIT, hteumeuleu/caniemail)
const data = (await (
  await fetch('https://www.caniemail.com/api/data.json')
).json()) as CanIEmailData

const findings = lint(message.html, indexFeatures(data), { allow: CASCIVO_ALLOW })
const blocked = findings.filter((f) => f.level === 'blocked')
```

`blocked` means a floor client genuinely does not support it; `caveat` means partial support
worth knowing about. `CASCIVO_ALLOW` waives the findings the primitives knowingly accept, each
with a written reason. Pin the file in your repo if you want the linter's verdict to change
only in a reviewed diff rather than on the day upstream retests a client.

## Coming from React Email

```ts
import { formatMigration, planMigration } from '@cascivo/email'

console.log(formatMigration(planMigration(['Html', 'Body', 'Button', 'Markdown', 'Tailwind'])))
```

Most of React Email's surface maps one-to-one. `planMigration` names every gap with the reason
it exists, so you can size the port before writing any of it.
