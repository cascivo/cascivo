---
'@cascivo/email': minor
---

Email: a `Markdown` primitive, a themeable font stack, and three render fixes

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
