# @cascivo/email

## 0.6.1

### Patch Changes

- dafb2cc: Contrast fixes from a workbench axe sweep across all twelve themes: 101 findings in 7 themes before, 0 of 3060 checks after. Lightness only; hue and chroma are unchanged.

  - **Text on a fill:** pastel `--cascivo-color-primary-fg`, `--cascivo-color-accent-foreground` and `--cascivo-color-info-content`, midnight `--cascivo-color-accent-foreground` were white on a light fill (2.9–3.2:1); now dark ink. Primary buttons and info Badges in pastel, and Calendar's selected day in midnight, were the visible cases.
  - **Secondary text:** `--cascivo-color-foreground-muted` (and `--cascivo-color-text-subtle`, which points at it) darkened in pastel and minimal, so card, table, alert and form help text clears AA on every surface.
  - **Status ink:** `--cascivo-color-success-foreground` darkened in arcade, brutalist and flat (Badge, Alert titles); `--cascivo-color-destructive` darkened in pastel and lightened in cyberpunk, since 47 component rules use it as text.
  - **Code syntax:** `--cascivo-editor-syntax-keyword` and `-tag`, and CodeSnippet's keyword colour, read `--cascivo-color-accent-text` instead of the raw accent, which in warm, brutalist and pastel is a fill hue (1.4–2.9:1 as text).

  `accent-text-contrast` now holds every one of these token pairs to AA in every theme.

  `@cascivo/email`'s generated palettes follow the theme values.

## 0.6.0

### Minor Changes

- d0f0e97: Dead links block a send, and Resend is a sender.

  - `checkLinks(html)` lists every link and image URL a recipient could not follow, read from
    the rendered HTML with no network: **blocked** for empty, a bare `#`, relative, an
    unreplaced merge tag (`{{url}}`, `*|URL|*`, `${id}`), a `javascript:`/`data:`/`file:`
    scheme, or a reserved placeholder domain (`example.com`, `*.invalid`); **caveat** for
    `localhost`/`*.test`, plain `http:`, an in-message `#anchor` and leftover "lorem ipsum".
    `linkUrls(html)` returns the URLs themselves.
  - **Behaviour change:** `assertSendable` — and so `sendEmail` — now throws on a blocked link.
    The shipped templates default their links to `example.com`, so `<PasswordReset />` without
    `resetHref` is now refused rather than sent with a reset link that goes nowhere. Pass the
    `…Href` props; tests that send a template with its defaults need real-looking URLs.
  - `resendSender(client)` adapts a `resend` SDK client to `EmailSender`: `"Name" <a@b>`
    recipients, base64 attachments with `contentType`, and Resend's `{ error }` thrown rather
    than returned. Typed by shape; no dependency on the SDK.

### Patch Changes

- db3f056: Fixed theme palette resolution so that mixing a colour toward white, black or grey keeps the
  colour's hue. CSS Color 4 treats an achromatic colour's hue as powerless. Before, the resolver
  took the grey's leftover hue and pulled the tint off-hue. A tint of a violet toward white came
  out peach.

## 0.5.0

### Minor Changes

- a5c3efb: `sendEmail(sender, message, envelope)` sends a rendered email through Cloudflare's Email
  Service binding, or any sender whose `send()` takes `{ from, to, subject, html, text }`.

  - It runs `assertSendable` first, so a message with no subject, no preheader, no text part
    or a clipped body never leaves.
  - CR/LF in any address, display name or header is rejected, because it would inject headers.
  - The sender is typed by shape (`EmailSender`), so the package still needs no Cloudflare
    types. The binding's own `SendEmail` type satisfies it.

- a5c3efb: PDF and PNG export through Browser Run.

  - `@cascivo/app/export`:
    - `handleExport(request, { launch })` serves
      `/api/export?page=/reports&format=pdf|png`. It renders a page of the app at its own
      origin, and refuses other origins and `/api/` paths.
    - `exportPage` returns the file directly, for a Cron Trigger or a Workflow.
    - `isExporting()` lets the app drop its shell in the export.
    - `exportUrl()` builds the download link.
    - `@cloudflare/puppeteer`'s `Browser` fits the structural types.
  - `@cascivo/email`: `sendEmail` takes `attachments`. An attachment's filename and type are
    checked for CR/LF like any header.
  - `cascivo create --framework cloudflare --example export` scaffolds a report page with PDF
    and PNG downloads. The MCP tool `create_app` accepts `examples: ['export']`.

## 0.4.1

### Patch Changes

- 65043b8: Email: a preview and a props table for every primitive, not just for the templates

  The email target shipped twenty-two components and documented three templates. React Email
  publishes a preview per component and it is the first place an adopter looks, so "which
  pieces can I use, and what does each one look like" had no answer here short of reading
  `src/components` — and an agent in that position hand-rolls a worse `<table>` rather than
  reaching for `Row`/`Column`.

  - **A primitive reference at `/docs/email/components`**, and the same content as one
    fetchable file at `/docs/email-primitives.md`. Every primitive gets its props, its
    defaults, and at least one worked example rendered as a real email document in four
    themes — the bytes an adopter would send, in an isolated iframe, not a screenshot.

  - **Both surfaces are generated, from one copy of everything.** The props come off the
    TypeScript interfaces, so a prop cannot be added without appearing in the table. The
    snippet under each frame is printed from the very element tree that produced the frame,
    so a documented call cannot describe something the picture above it did not render. A
    gallery of examples and a printer replace the usual two-copies-that-drift arrangement.

  - **`email:primitives:check` closes the gap that let this happen.** Email primitives carry
    no `.meta.ts`, so `meta-coverage` — the guard that stops a registry component shipping
    undocumented — never saw them. The new check is its analogue: a primitive exported from
    the package index and missing from the gallery, the reference or the previews fails the
    build.

  - **The home page's email band gains an "All primitives" frame** — one message built from
    nearly every primitive, in all twelve themes, so the section answers "what is in the box"
    as well as "what does it look like".

  - **Doc fixes found on the way.** `/docs/email` still claimed there is no `Markdown`
    component, which shipped in 0.3. `Heading` and `Style` had no summary at all. Four prop
    docstrings told adopters to put a rule in a `StyleBlock`, which is this package's own
    local import alias — the exported name is `Style`.

## 0.4.0

### Minor Changes

- ccab95a: Email: a button really does follow its cell now, and the preview can render your brand

  Two open items from the weeklyfoo newsletter's second report, both measured.

  - **`Column` and `Section` were defeating their own `align` attribute.** They stated
    alignment twice — as the `align` attribute and again as `text-align` in the style — and
    the two do different things. `align` on a cell is a legacy presentational hint that also
    moves _block-level_ children, which is what every button, card and alert here is; a plain
    `text-align` does not, and being the explicit declaration it won. So
    `<Column align="right">` full of a `Button` rendered hard left. The attribute is now the
    only statement of it. Measured in Chromium at all three alignments: `center` and `right`
    were both affected.

    `ButtonProps.align` claimed a button with no `align` follows its cell. Removing the old
    `'left'` default was only half of that, and the docstring shipped a release ahead of the
    behaviour — an adopter deleted their explicit props on the strength of it and their
    feedback row splayed again. It is true now, and the docstring says exactly when it is not
    (a cell aligned by hand with `style={{ textAlign }}`).

  - **The preview can render a brand palette.** `renderEmail`'s `theme` takes
    `EmailTheme | Palette` and the token docs call a `Palette` the way to rebrand, but the
    preview's dropdown only listed the shipped twelve — so the package's own answer to "how
    do I use my brand" was the one thing its preview could not express, and the byte gauge
    was wrong by whatever the palette costs (a measured 10% on a newsletter whose font stack
    is repeated 124 times).

    A template can now `export const theme`, beside `subject` and `previewProps`. It is the
    selected entry by default and resets on every template change, so a directory of
    differently-branded templates each renders right without anyone matching a global dropdown
    to a per-template design. `--theme <file>` adds shared palettes for a whole directory.

  - **`--allow <file>` and a template-level `export const allow`** merge into the conformance
    panel's allowlist, so a project that waives a slug in CI stops seeing a finding its own
    lint does not report.

  - **`className` on `Card` and `Text`**, the two elements the common responsive cases need a
    hook on — a panel that changes padding, a hero that changes size. The first cut gave
    classes to the layout primitives only.

  - **`Container` takes a `breakpoint`**, defaulting to its own width, so a design spec that
    names 620px and the markup can say the same number.

## 0.3.0

### Minor Changes

- fc01c42: Email: a publishable preview, responsive layout primitives, and `cascivo email lint`

  Reported by the weeklyfoo newsletter after migrating four templates.

  - **`@cascivo/email-preview` is published, with a bin.** `npx @cascivo/email-preview ./emails`
    serves a directory of templates — default export rendered, optional `subject` and
    `previewProps` named exports, hot reload through Vite. The recipe used to document
    `pnpm --filter @cascivo/email-preview dev`, which is a workspace filter and worked only
    inside this monorepo; everyone else got "No projects matched the filters" and wrote their
    own preview server. The package moves from `apps/` to `packages/` so it reaches the drift
    feed and the packaging gates like every other published package.
  - **`Container` is responsive by default** and **`Column` takes `stack`.** A 600px table
    will not lay out below its contents' min-content width, so `max-width: 100%` never
    prevented the sideways scroll every mobile reader was getting. Measured at 320px: 280px of
    overflow before, none after. Both halves are needed — a fluid container does nothing for a
    `Row` until its columns stack, which is why `stack` exists rather than being implied.
  - **`className` on the layout primitives, and a `Style` primitive.** A media query needs
    something to select and somewhere to live; `Style` blocks are hoisted into `<head>` and
    deduplicated. This replaces the `[style*='--flag']` attribute-selector workaround an
    adopter had to invent, which is worse supported than a plain class.
  - **`Button` no longer defaults `align` to `'left'`.** A button is its own table carrying its
    own `align`, so that default beat the `align` of any `Column` around it and
    `<Column align="right"><Button/></Column>` rendered hard left. With no attribute emitted it
    follows the cell, verified in a browser.
  - **`cascivo email lint <file...>`** runs the conformance check on rendered HTML, fetching
    and caching the Can I email matrix so every adopter stops writing the same twelve lines.
    Reads stdin with `-`, takes a local matrix with `--data`, exits non-zero only on a blocked
    finding.
  - A Playwright suite now asserts no shipped template scrolls sideways at 320/360/390/414,
    with a negative control proving the rule is what prevents it. Nothing caught this class of
    bug before: the conformance lint reads CSS feature support, not layout.
  - `@cascivo/docs` and `@cascivo/docspack` carry the rewritten email recipe — the preview
    command that now works outside this repo, the responsive rules, and `simulate()`, which
    was exported and useful but documented nowhere outside the `.d.ts`.

## 0.2.0

### Minor Changes

- 55d0fa8: Email: a `Markdown` primitive, a themeable font stack, and three render fixes

  Reported by a newsletter publisher porting from React Email, whose prose is fetched at
  send time and so had nothing to compose into at build time.

  - **New `Markdown` component.** Parses an allowlisted subset — headings, paragraphs,
    strong, em, inline code, fenced code, links, images, lists, blockquotes, rules —
    straight to the primitives, never to HTML, so the conformance lint still covers the
    subtree. Raw HTML in the source renders as its own literal text, and `href`/`src` are
    accepted only for `http:`, `https:` and `mailto:`. `planMigration()` now maps React
    Email's `Markdown` instead of reporting it as a gap.
  - **`fontStack()` reads `--cascivo-email-font-{sans,serif,mono}` from the palette.** The
    stack is repeated on every text element because Outlook Windows does not inherit
    `font-family` into table content; the lever for the bytes that costs is the length of
    the stack, which was previously hard-coded. Set the token on a palette to rebrand or to
    shrink. Defaults are unchanged.
  - **`Img` no longer emits a CSS `height` or `outline: none`.** Both are blocked in floor
    clients (`css-height` in Yahoo, `css-outline` in Outlook Windows) and neither changed
    what any client rendered — the height attribute already carried the number, and
    `border: 0` already removed the link border.
  - **`renderEmail()` strips React 19's auto-emitted resource hints.** `react-dom/server`
    hoists a `<link rel="preload" as="image">` per `<img>`; `html-link` is blocked in Gmail,
    Yahoo, Outlook.com and Outlook mobile.
  - **Apostrophes are no longer escaped to `&#x27;`.** Attribute values are double-quoted,
    so a quoted font name cost 12 bytes where 2 would do — around 1.9 KB on a large
    newsletter.
  - **`Link` and `Button` accept `ping`.** A click beacon used to disappear silently.
