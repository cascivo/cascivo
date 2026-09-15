---
name: cascivo:email
description: Build or change a transactional email with @cascivo/email — table-based, inline-styled HTML themed from cascivo tokens. Use when the user wants to send email (welcome, password reset, receipt, invite, digest), asks to change an email template, or is migrating from React Email. Not for in-app UI.
---

# cascivo:email

## When to use

The user wants HTML that will be delivered to an inbox: a welcome mail, a password reset, a
receipt, an invite, a digest. Also when they are migrating from React Email.

**Not** for in-app UI. `@cascivo/react` is for that, and none of it works in an email.

## The one thing to internalise first

An email is not a small web page. Layout is tables, styles are inline, there is no
JavaScript, and Outlook Windows renders with Microsoft Word. Reaching for a `<div>` with
flexbox is the single most common way to produce mail that looks broken for a third of
recipients.

`@cascivo/email` makes that mostly unnecessary — the primitives are already tables and the
conformance lint fails the build on anything a floor client cannot render. Compose the
primitives and the rules take care of themselves.

## Procedure

### 1. Check the package is available

```sh
node -e "require.resolve('@cascivo/email')" 2>/dev/null || pnpm add @cascivo/email react react-dom
```

### 2. Start from a template if one fits

`Welcome`, `PasswordReset` and `Receipt` ship with the package. If the user's need is one of
those, import and pass props rather than writing a new file.

```tsx
import { assertSendable, renderEmail, PasswordReset, passwordResetSubject } from '@cascivo/email'

const message = renderEmail(<PasswordReset resetHref={link} />, {
  theme: 'dark',
  subject: passwordResetSubject(),
})
assertSendable(message)
await mailer.send({ to, ...message })
```

`renderEmail` returns the whole message — `subject`, `html`, `text`, `preheader`. Each
template exports its own subject function; use it rather than writing the subject at the call
site, or the two drift.

### 3. Otherwise compose the primitives

Document shell: `Html` → `Head` → `Body` → `Preview` → `Container`.
Layout: `Section`, `Row`, `Column`, `Spacer`, `Hr`.
Content: `Heading`, `Text`, `Link`, `List`, `Button`, `Img`, `Card`, `Badge`, `Alert`, `Footer`.
Runtime prose: `Markdown`.

Compose the primitives whenever you know the copy — it is smaller and it is typed. Reach for
`Markdown` only when the copy is genuinely not available until send time (a newsletter
preamble, a CMS-driven letter). It renders an allowlisted node set through the primitives, so
raw HTML in the source stays literal text and only `http:`/`https:`/`mailto:` URLs are
emitted; pass `imageWidth` because Markdown carries no dimensions and `Img` requires a width.

Always include `Preview` — it is the grey line beside the subject in the inbox, and without
it the client shows the first words of the body instead. `assertSendable` fails on a template
that forgets it.

If you add a template, export a matching `<name>Subject()` beside it.

### 4. Verify before you claim it works

```sh
pnpm --filter @cascivo/email test    # conformance lint, structural invariants, size budgets
```

If the user is adding a template to this repo, also:

```sh
pnpm email:check
```

### 5. Offer the preview

```sh
npx @cascivo/email-preview ./emails          # an adopter's own templates
pnpm --filter @cascivo/email-preview dev     # inside this repo
```

The `--filter` form is a workspace filter and works only inside this monorepo; never give it
to an adopter, which the recipe used to do. Every `.tsx` in the directory is a template: its
default export is rendered, with optional `subject`, `previewProps`, `theme` and `allow`
named exports. Suggest `theme` to anyone with a brand palette — without it the preview
renders their mail in cascivo's colours and the byte gauge is wrong by whatever their palette
costs.

Viewport switcher, twelve themes, per-client simulation, live byte gauge, `.eml` download.
Conformance findings need the matrix: `--caniemail <file>` from
`https://www.caniemail.com/api/data.json`. The `.eml` is the cheapest way to see the mail in
a real client — download and drag it into Outlook or Apple Mail.

## Rules the lint will enforce anyway

Knowing them saves a round trip:

- **No flexbox, grid or `gap`.** Unsupported in Outlook Windows. Use `Row`/`Column`.
- **A `Row` needs `stack` on its columns to survive a phone.** `Container` is responsive by
  default, but a row keeps its columns' min-content width until each one opts in with
  `<Column stack>`. Measured: 280px of sideways scroll at 320px without it. A fixed-width
  image still floors its column, so size images for the narrowest column they occupy.
- **`className` + `Style` for anything else responsive.** `Container`, `Section`, `Row`,
  `Column`, `Card` and `Text` take a `className`; `Style` holds the rule and is hoisted into
  `<head>`. Never reach for the `[style*='--flag']` trick — an attribute selector is `n` in
  Outlook Windows, where a class is not.
- **Alignment goes on the cell, once.** `Column`/`Section`'s `align` prop emits the `align`
  attribute and deliberately no `text-align` twin: the attribute is a legacy hint that also
  moves block-level children, and an explicit `text-align` beside it wins the cascade and
  stops a nested table — every button, card and alert — from following. A `Button` inside an
  aligned `Column` therefore needs no `align` of its own. One given `style={{ textAlign }}`
  by hand does.
- **No `rem`.** Write `'16px'`. Lengths are converted at render time; a `rem` you introduce
  in a raw style will be too.
- **No custom properties.** Read tokens through `token()`, which resolves to a literal.
- **Padding on a cell, not a wrapper.** `Section`, `Column` and `Card` take `padding`.
- **`Img` needs `alt` and `width`, and must be PNG or JPEG.** SVG does not render.
- **Absolute URLs everywhere.**
- **No interactivity.** No hover states, no disclosure, no forms.

## The message, not just the document

- `assertSendable(message)` before sending — catches a missing subject, missing text part,
  missing preheader, and a clipped body.
- `buildMessage(message, { from, to })` produces a `.eml` the user can open in a real client.
- Plain text is derived and structured. Tune with `{ text: { links, width, bullet } }`, or
  pass `plainText` to write it by hand. Mark visual-only content `data-skip-in-text`.

## Size

Gmail clips past ~102 KB, mobile lower, iOS Gmail around 20 KB — measured on the **encoded**
body. Check `stats.encodedBytes`, never `stats.bytes`.

```tsx
const { stats } = renderEmail(<Mail />, { tier: 'strict' })
```

When something is over, do not guess:

```tsx
import { analyze, formatAnalysis } from '@cascivo/email'
console.log(formatAnalysis(analyze(html)))
```

## Theming

`renderEmail(el, { theme })` — resolved at render time to literal hex. There is no runtime
theme switching in an email and there cannot be. Dark mode is client-controlled; the preview
approximates it and labels the approximation.

The font stack is restated inline on every text element because Outlook Windows does not
inherit `font-family` into table content. Do not try to remove the repetition — shorten the
stack instead, with `--cascivo-email-font-{sans,serif,mono}` on the palette. On a long
newsletter it is typically the single largest repeated declaration; `analyze(html)` will say
so.

## Migrating from React Email

```tsx
import { formatMigration, planMigration } from '@cascivo/email'
console.log(formatMigration(planMigration(imported)))
```

Most primitives map one to one. `Font`, `CodeBlock` and `Tailwind` have no equivalent, each
for a stated reason — read them out rather than inventing a substitute. `Markdown` maps to
cascivo's own `Markdown`, but onto an allowlisted node set: check the table in
`docs/RECIPE-EMAIL.md` before promising a one-to-one port.

## Do not

- Do not add a client-side feature "that mostly works". If the lint blocks it, it is blocked.
- Do not widen `CASCIVO_ALLOW` to get a build green. An entry there needs a written reason,
  and the bar is that absence **degrades rather than breaks**.
- Do not promise a client is supported without checking
  [docs/EMAIL-CLIENT-SUPPORT.md](../../docs/EMAIL-CLIENT-SUPPORT.md), which is generated
  from the same data the lint reads.
- Do not claim Outlook Windows has been verified. It cannot be tested offline; the design
  prevents the failure rather than detecting it.

## Reference

- `docs/RECIPE-EMAIL.md` — the adopter guide.
- `docs/EMAIL-CLIENT-SUPPORT.md` — generated support matrix.
- `docs/specs/email-target.md` — why the architecture is what it is, and what it does not cover.
