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
import { renderEmail, PasswordReset } from '@cascivo/email'
const { html, text } = renderEmail(<PasswordReset resetHref={link} />, { theme: 'dark' })
```

### 3. Otherwise compose the primitives

Document shell: `Html` → `Head` → `Body` → `Preview` → `Container`.
Layout: `Section`, `Row`, `Column`, `Spacer`, `Hr`.
Content: `Heading`, `Text`, `Link`, `List`, `Button`, `Img`, `Card`, `Badge`, `Alert`, `Footer`.

Always include `Preview` — it is the grey line beside the subject in the inbox, and without
it the client shows the first words of the body instead.

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
pnpm --filter @cascivo/email-preview dev
```

Viewport switcher, twelve themes, per-client simulation, live byte gauge, `.eml` download.
The `.eml` is the cheapest way to see the mail in a real client — download and drag it into
Outlook or Apple Mail.

## Rules the lint will enforce anyway

Knowing them saves a round trip:

- **No flexbox, grid or `gap`.** Unsupported in Outlook Windows. Use `Row`/`Column`.
- **No `rem`.** Write `'16px'`. Lengths are converted at render time; a `rem` you introduce
  in a raw style will be too.
- **No custom properties.** Read tokens through `token()`, which resolves to a literal.
- **Padding on a cell, not a wrapper.** `Section`, `Column` and `Card` take `padding`.
- **`Img` needs `alt` and `width`, and must be PNG or JPEG.** SVG does not render.
- **Absolute URLs everywhere.**
- **No interactivity.** No hover states, no disclosure, no forms.

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

## Migrating from React Email

```tsx
import { formatMigration, planMigration } from '@cascivo/email'
console.log(formatMigration(planMigration(imported)))
```

Most primitives map one to one. `Font`, `Markdown`, `CodeBlock` and `Tailwind` have no
equivalent, each for a stated reason — read them out rather than inventing a substitute.

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
